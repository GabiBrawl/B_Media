"""Scrape product pages, extract structured extra details with a local LLM, validate them,
and upsert the result into js/extraDetails.js.

Default model backend:
    LM Studio OpenAI-compatible API at http://127.0.0.1:1234/v1/chat/completions

Example:
    python3 generate_extra_details.py \
        --url https://www.linsoul.com/products/kiwi-ears-belle \
        --name "Kiwi Ears Belle" \
        --category IEMs \
    --model google/gemma-4-e4b

If no URLs are provided, the script will automatically crawl all product URLs
found in js/data.js.
"""

from __future__ import annotations

import argparse
import json
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests
from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parent
DEFAULT_JS_FILE = ROOT / "js" / "extraDetails.js"
DEFAULT_DATA_FILE = ROOT / "js" / "data.js"
DEFAULT_OLLAMA_URL = "http://localhost:11434/api/generate"
DEFAULT_OPENAI_BASE_URL = "http://127.0.0.1:1234/v1"
DEFAULT_ANTHROPIC_BASE_URL = "http://127.0.0.1:1234/v1"


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write_text(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")


def normalize_ws(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def compact_for_match(text: str) -> str:
    return re.sub(r"\s+", "", text).lower()


def extract_visible_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()
    return soup.get_text(separator="\n", strip=True)


def compact_source_excerpt(text: str, max_lines: int = 120) -> str:
    """Keep the most useful visible lines for extraction, while staying within model limits."""
    lines = [normalize_ws(line) for line in text.splitlines()]
    lines = [line for line in lines if line]

    if len(lines) <= max_lines:
        return "\n".join(lines)

    keyword_patterns = [
        r"driver", r"impedance", r"sensitivity", r"frequency", r"connector", r"plug",
        r"cable", r"shell", r"diaphragm", r"material", r"weight", r"battery",
        r"bluetooth", r"codec", r"anc", r"input", r"output", r"gain", r"power",
        r"os", r"storage", r"wifi", r"thd", r"response"
    ]
    keyword_re = re.compile("|".join(keyword_patterns), re.IGNORECASE)

    keep: set[int] = set()
    for i, line in enumerate(lines):
        if i < 30 or i >= len(lines) - 20:
            keep.add(i)
            continue
        if keyword_re.search(line):
            for j in range(max(0, i - 1), min(len(lines), i + 2)):
                keep.add(j)

    ordered = [lines[i] for i in sorted(keep)]
    if len(ordered) > max_lines:
        ordered = ordered[:max_lines]
    return "\n".join(ordered)


def focused_source_excerpt(text: str, item_name: str, max_lines: int = 120) -> str:
    """Prefer source lines around the target product name to reduce cross-product leakage."""
    lines = [normalize_ws(line) for line in text.splitlines()]
    lines = [line for line in lines if line]
    if not lines:
        return ""

    tokens = [token.lower() for token in re.findall(r"[A-Za-z0-9]+", item_name) if len(token) >= 3]
    if not tokens:
        return compact_source_excerpt(text, max_lines=max_lines)

    def line_hits_target(line: str) -> bool:
        lower = line.lower()
        hit_count = sum(1 for token in tokens if token in lower)
        return hit_count >= min(2, len(tokens))

    hit_indexes = [i for i, line in enumerate(lines) if line_hits_target(line)]
    if not hit_indexes:
        return compact_source_excerpt(text, max_lines=max_lines)

    keep: set[int] = set()
    for index in hit_indexes[:2]:
        for i in range(max(0, index - 70), min(len(lines), index + 90)):
            keep.add(i)

    focused = "\n".join(lines[i] for i in sorted(keep))
    return compact_source_excerpt(focused, max_lines=max_lines)


def parse_data_js_targets(data_js_text: str) -> List[Tuple[str, str, str]]:
    """Extract (category, item_name, url) tuples from js/data.js."""
    targets: List[Tuple[str, str, str]] = []
    category: Optional[str] = None

    category_re = re.compile(r'^\s*"([^"]+)": \[$')
    item_re = re.compile(
        r'^\s*\{\s*name:\s*"((?:\\.|[^"])*)".*?url:\s*"((?:\\.|[^"])*)"',
    )

    def unescape_js_string(value: str) -> str:
        return json.loads(f'"{value}"')

    for raw_line in data_js_text.splitlines():
        line = raw_line.strip()
        category_match = category_re.match(raw_line)
        if category_match:
            category = category_match.group(1)
            continue

        item_match = item_re.match(raw_line)
        if item_match and category:
            item_name = unescape_js_string(item_match.group(1))
            url = unescape_js_string(item_match.group(2))
            if url:
                targets.append((category, item_name, url))

    return targets


def collect_targets(args: argparse.Namespace) -> List[Tuple[Optional[str], Optional[str], str]]:
    """Return (category, item_name, url) tuples from CLI input or js/data.js."""
    targets: List[Tuple[Optional[str], Optional[str], str]] = []

    if args.url:
        for url in args.url:
            targets.append((args.category, args.name, url))
        return targets

    if args.urls_file:
        for line in Path(args.urls_file).read_text(encoding="utf-8").splitlines():
            url = line.strip()
            if url and not url.startswith("#"):
                targets.append((args.category, args.name, url))
        return targets

    data_file = Path(args.data_file)
    if not data_file.exists():
        raise FileNotFoundError(f"Could not find data file: {data_file}")

    for category, item_name, url in parse_data_js_targets(read_text(data_file)):
        targets.append((category, item_name, url))

    return targets


def fetch_page(url: str, timeout: int = 30) -> Tuple[str, str]:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        )
    }
    response = requests.get(url, headers=headers, timeout=timeout)
    response.raise_for_status()
    html = response.text
    visible_text = extract_visible_text(html)
    return html, visible_text


def parse_properties_by_category(js_text: str) -> Dict[str, List[str]]:
    """Parse the category -> allowed key list from extraDetails.js."""
    start = js_text.find("propertiesByCategory: {")
    end = js_text.find("},\n    byItem: {")
    if start == -1 or end == -1:
        raise ValueError("Could not locate propertiesByCategory in extraDetails.js")

    block = js_text[start:end]
    category: Optional[str] = None
    result: Dict[str, List[str]] = {}
    for raw_line in block.splitlines():
        line = raw_line.strip()
        category_match = re.match(r'^"([^"]+)": \[$', line)
        if category_match:
            category = category_match.group(1)
            result[category] = []
            continue
        key_match = re.search(r'key:\s*"([^"]+)"', line)
        if category and key_match:
            result[category].append(key_match.group(1))
        if line == "],":
            category = None
    return result


def build_prompt(page_text: str, item_name: str, category: str, allowed_fields: List[str]) -> str:
        field_list = ", ".join(allowed_fields)
        return f"""Extract technical product details from SOURCE TEXT.

Target product:
- item_name: {item_name}
- category: {category}

Allowed field keys (use only these): {field_list}

Return ONLY valid JSON with this shape:
{{
    "fields": {{
        "field_key": {{
            "value": "string or array of strings",
            "evidence": ["exact source quote"]
        }}
    }}
}}

Rules:
- Do not include item_name/category in output.
- Include only supported fields.
- Prefer concise technical values from specs/tables.
- Evidence must be exact quotes from SOURCE TEXT.
- Do not paraphrase evidence.
- Do not invent values.

SOURCE TEXT:
""" + page_text + """
"""


def call_ollama(model: str, prompt: str, api_url: str = DEFAULT_OLLAMA_URL, timeout: int = 245) -> str:
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0,
        },
    }
    response = requests.post(api_url, json=payload, timeout=timeout)
    response.raise_for_status()
    data = response.json()
    if "response" not in data:
        raise ValueError(f"Unexpected Ollama response: {data}")
    return data["response"]


def call_openai_compatible(model: str, prompt: str, api_base: str = DEFAULT_OPENAI_BASE_URL, timeout: int = 245) -> str:
    endpoint = api_base.rstrip("/") + "/chat/completions"
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "Return only valid JSON."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0,
    }
    response = requests.post(endpoint, json=payload, timeout=timeout)
    response.raise_for_status()
    data = response.json()
    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise ValueError(f"Unexpected OpenAI-compatible response: {data}") from exc


def call_anthropic_compatible(model: str, prompt: str, api_base: str = DEFAULT_ANTHROPIC_BASE_URL, timeout: int = 245) -> str:
    endpoint = api_base.rstrip("/") + "/messages"
    payload = {
        "model": model,
        "max_tokens": 4096,
        "temperature": 0,
        "system": "Return only valid JSON.",
        "messages": [
            {"role": "user", "content": prompt},
        ],
    }
    response = requests.post(endpoint, json=payload, timeout=timeout)
    response.raise_for_status()
    data = response.json()

    content = data.get("content")
    if isinstance(content, list):
        parts = []
        for part in content:
            if isinstance(part, dict) and part.get("type") == "text" and isinstance(part.get("text"), str):
                parts.append(part["text"])
        if parts:
            return "".join(parts)

    if isinstance(content, str):
        return content

    raise ValueError(f"Unexpected Anthropic-compatible response: {data}")


def call_model(provider: str, model: str, prompt: str, api_url: str, timeout: int = 245) -> str:
    provider = provider.lower().strip()
    if provider == "ollama":
        return call_ollama(model=model, prompt=prompt, api_url=api_url, timeout=timeout)
    if provider == "openai":
        return call_openai_compatible(model=model, prompt=prompt, api_base=api_url, timeout=timeout)
    if provider == "anthropic":
        return call_anthropic_compatible(model=model, prompt=prompt, api_base=api_url, timeout=timeout)
    raise ValueError(f"Unsupported provider '{provider}'. Use ollama, openai, or anthropic.")


def parse_model_json(raw: str) -> Dict[str, Any]:
    raw = raw.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if not match:
            raise
        return json.loads(match.group(0))


def field_supported(value: Any, source_text: str) -> bool:
    """A conservative sanity check to reject hallucinated values."""
    source_compact = compact_for_match(source_text)

    def string_supported(s: str) -> bool:
        candidate = compact_for_match(s)
        if candidate and candidate in source_compact:
            return True

        # Handle values like "3.5mm / Type-C" that may appear as separate source fragments.
        parts = [part.strip() for part in re.split(r"[/+|,;]", s) if part.strip()]
        if len(parts) > 1:
            return all(compact_for_match(part) in source_compact for part in parts)
        return False

    if isinstance(value, str):
        return string_supported(value)
    if isinstance(value, list):
        return all(isinstance(item, str) and string_supported(item) for item in value)
    return False


def validate_and_filter(result: Dict[str, Any], source_text: str, allowed_fields: List[str]) -> Dict[str, Any]:
    fields = result.get("fields", {})
    clean: Dict[str, Any] = {}

    for key in allowed_fields:
        item = fields.get(key)
        if not isinstance(item, dict):
            continue

        value = item.get("value")
        evidence = item.get("evidence")
        if isinstance(evidence, str):
            evidence = [evidence]
        if not isinstance(evidence, list) or not evidence:
            continue

        # Evidence must be present verbatim in the source.
        evidence_ok = all(
            normalize_ws(e).lower() in normalize_ws(source_text).lower()
            for e in evidence
            if isinstance(e, str) and e.strip()
        )
        if not evidence_ok:
            continue

        if not field_supported(value, source_text):
            # Still accept if the exact value is one of the evidence quotes.
            if isinstance(value, str):
                if not any(normalize_ws(value).lower() == normalize_ws(e).lower() for e in evidence if isinstance(e, str)):
                    continue
            elif isinstance(value, list):
                if not all(
                    any(normalize_ws(v).lower() == normalize_ws(e).lower() for e in evidence if isinstance(e, str))
                    for v in value
                ):
                    continue
            else:
                continue

        clean[key] = value

    return clean


def find_matching_brace(text: str, open_index: int) -> int:
    if open_index < 0 or open_index >= len(text) or text[open_index] != "{":
        raise ValueError("find_matching_brace requires an index pointing to '{'.")

    depth = 0
    in_string = False
    escape = False

    for index in range(open_index, len(text)):
        ch = text[index]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
            continue

        if ch == '"':
            in_string = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return index

    raise ValueError("Could not find matching closing brace.")


def find_by_item_bounds(js_text: str) -> Tuple[int, int]:
    marker = "byItem: {"
    marker_index = js_text.find(marker)
    if marker_index == -1:
        raise ValueError("Could not locate byItem block in extraDetails.js")

    open_index = js_text.find("{", marker_index)
    if open_index == -1:
        raise ValueError("Could not locate opening brace for byItem block.")
    close_index = find_matching_brace(js_text, open_index)
    return open_index, close_index


def find_item_block_range(js_text: str, item_name: str) -> Optional[Tuple[int, int, int]]:
    by_item_open, by_item_close = find_by_item_bounds(js_text)
    quoted = json.dumps(item_name, ensure_ascii=False)
    pattern = re.compile(rf'(?m)^\s{{8}}{re.escape(quoted)}:\s*\{{')

    search_region = js_text[by_item_open:by_item_close]
    match = pattern.search(search_region)
    if not match:
        return None

    line_start = by_item_open + match.start()
    object_open = by_item_open + match.group(0).rfind("{")
    object_close = find_matching_brace(js_text, object_open)
    return line_start, object_open, object_close


def extract_existing_fields(item_block: str, allowed_fields: List[str]) -> Dict[str, Any]:
    clean: Dict[str, Any] = {}
    for key in allowed_fields:
        single_match = re.search(rf'(?m)^\s{{12}}{re.escape(key)}:\s*("(?:\\.|[^"])*")\s*,?\s*$', item_block)
        if single_match:
            clean[key] = json.loads(single_match.group(1))
            continue

        array_match = re.search(
            rf'(?ms)^\s{{12}}{re.escape(key)}:\s*\[(.*?)\]\s*,?\s*$',
            item_block,
        )
        if array_match:
            values = re.findall(r'"((?:\\.|[^"])*)"', array_match.group(1))
            clean[key] = [json.loads(f'"{v}"') for v in values]
    return clean


def score_value_quality(value: Any) -> int:
    if isinstance(value, str):
        score = min(len(value), 120)
        if re.search(r"\d", value):
            score += 20
        if re.search(r"Hz|kHz|Ω|ohm|dB|mm|mW|Vrms|Type-C|USB|XLR|BA|Dynamic", value, re.IGNORECASE):
            score += 20
        return score

    if isinstance(value, list):
        normalized = [v.strip() for v in value if isinstance(v, str) and v.strip()]
        if not normalized:
            return 0
        base = 10 * len(set(normalized))
        details = sum(score_value_quality(v) for v in normalized)
        return base + details

    return 0


def merge_with_existing(
    js_text: str,
    item_name: str,
    allowed_fields: List[str],
    incoming_fields: Dict[str, Any],
) -> Dict[str, Any]:
    item_range = find_item_block_range(js_text, item_name)
    if not item_range:
        return incoming_fields

    _, object_open, object_close = item_range
    item_block = js_text[js_text.rfind("\n", 0, object_open) + 1:object_close + 1]
    existing_fields = extract_existing_fields(item_block, allowed_fields)

    merged: Dict[str, Any] = {}
    for key in allowed_fields:
        existing = existing_fields.get(key)
        incoming = incoming_fields.get(key)

        if existing is None and incoming is None:
            continue
        if existing is None:
            merged[key] = incoming
            continue
        if incoming is None:
            merged[key] = existing
            continue

        merged[key] = incoming if score_value_quality(incoming) >= score_value_quality(existing) else existing

    return merged


def format_js_value(value: Any, indent: int = 0) -> str:
    pad = " " * indent
    if isinstance(value, str):
        return json.dumps(value, ensure_ascii=False)
    if isinstance(value, list):
        items = ",\n".join(f"{pad}    {format_js_value(v, indent + 4)}" for v in value)
        return f"[\n{items}\n{pad}]"
    return json.dumps(value, ensure_ascii=False)


def build_entry_block(item_name: str, fields: Dict[str, Any]) -> str:
    lines = [f'        {json.dumps(item_name, ensure_ascii=False)}: {{']
    keys = list(fields.keys())
    for index, key in enumerate(keys):
        value = fields[key]
        comma = "," if index < len(keys) - 1 else ""
        formatted = format_js_value(value, indent=12)
        if "\n" in formatted:
            lines.append(f'            {key}: {formatted}{comma}')
        else:
            lines.append(f'            {key}: {formatted}{comma}')
    lines.append("        }")
    return "\n".join(lines)


def upsert_extra_details(js_text: str, item_name: str, entry_block: str) -> str:
    by_item_open, by_item_close = find_by_item_bounds(js_text)
    item_range = find_item_block_range(js_text, item_name)

    if item_range:
        line_start, _, object_close = item_range
        replace_start = line_start
        replace_end = object_close + 1

        while replace_end < len(js_text) and js_text[replace_end] in " \t":
            replace_end += 1
        if replace_end < len(js_text) and js_text[replace_end] == ",":
            replace_end += 1
        if replace_end < len(js_text) and js_text[replace_end] == "\n":
            replace_end += 1

        tail_region = js_text[replace_end:by_item_close]
        has_next_item = re.search(r'(?m)^\s{8}"[^"]+":\s*\{', tail_region) is not None
        replacement = entry_block + (",\n" if has_next_item else "\n")
        return js_text[:replace_start] + replacement + js_text[replace_end:]

    between = js_text[by_item_open + 1:by_item_close]
    has_existing_items = bool(between.strip())

    prefix = js_text[:by_item_close]
    if has_existing_items:
        last_non_ws = by_item_close - 1
        while last_non_ws > by_item_open and js_text[last_non_ws].isspace():
            last_non_ws -= 1
        if js_text[last_non_ws] != ",":
            prefix += ","
        insertion = "\n" + entry_block + "\n"
    else:
        insertion = "\n" + entry_block + "\n"

    return prefix + insertion + js_text[by_item_close:]


def infer_title(visible_text: str) -> Optional[str]:
    for line in visible_text.splitlines():
        line = normalize_ws(line)
        if len(line) > 3 and len(line) < 120:
            # Good enough for a title hint; the model can refine it.
            return line
    return None


def process_url(
    url: str,
    model: str,
    provider: str,
    js_path: Path,
    api_url: str,
    explicit_name: Optional[str] = None,
    explicit_category: Optional[str] = None,
    dry_run: bool = False,
) -> bool:
    if not explicit_name:
        raise ValueError("Item name is required for deterministic insertion.")
    if not explicit_category:
        raise ValueError("Category is required for deterministic schema filtering.")

    html, visible_text = fetch_page(url)
    source_text = focused_source_excerpt(visible_text, explicit_name)
    js_text = read_text(js_path)
    categories = parse_properties_by_category(js_text)

    if explicit_category not in categories:
        raise ValueError(f"Unsupported category '{explicit_category}'. Allowed categories: {', '.join(categories)}")
    allowed_fields = categories[explicit_category]

    prompt = build_prompt(
        source_text,
        item_name=explicit_name,
        category=explicit_category,
        allowed_fields=allowed_fields,
    )
    raw = call_model(provider=provider, model=model, prompt=prompt, api_url=api_url)
    model_result = parse_model_json(raw)

    validated_fields = validate_and_filter(model_result, visible_text, allowed_fields)

    item_name = explicit_name

    if not validated_fields:
        print(f"Skipped {item_name}: no fields survived validation.")
        return False

    merged_fields = merge_with_existing(
        js_text=js_text,
        item_name=item_name,
        allowed_fields=allowed_fields,
        incoming_fields=validated_fields,
    )

    entry_block = build_entry_block(item_name, merged_fields)
    updated = upsert_extra_details(js_text, item_name, entry_block)

    if dry_run:
        print(entry_block)
        return True

    write_text(js_path, updated)
    print(f"Updated {js_path} with {item_name} ({explicit_category}).")
    return True


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate and insert extra details for product pages using a local LLM.")
    parser.add_argument("--url", action="append", help="Product page URL. Can be supplied multiple times.")
    parser.add_argument("--urls-file", help="Text file with one product URL per line.")
    parser.add_argument("--data-file", default=str(DEFAULT_DATA_FILE), help="Path to js/data.js for automatic crawling.")
    parser.add_argument("--name", help="Exact item name to use as the key in extraDetails.js.")
    parser.add_argument("--category", help="Override the category chosen by the model.")
    parser.add_argument("--provider", choices=["openai", "anthropic", "ollama"], default=os.environ.get("LLM_PROVIDER", "openai"), help="Model API style to use.")
    parser.add_argument("--model", default=os.environ.get("LLM_MODEL", "google/gemma-4-e4b"), help="Local model name.")
    parser.add_argument("--api-url", default=os.environ.get("LLM_API_URL", DEFAULT_OPENAI_BASE_URL), help="API base URL or Ollama generate endpoint URL.")
    parser.add_argument("--ollama-url", dest="api_url", help="Deprecated alias for --api-url.")
    parser.add_argument("--file", default=str(DEFAULT_JS_FILE), help="Path to js/extraDetails.js.")
    parser.add_argument("--dry-run", action="store_true", help="Print the generated entry without writing it.")
    return parser


def main() -> int:
    parser = build_arg_parser()
    args = parser.parse_args()

    targets = collect_targets(args)
    if not targets:
        parser.error("No product URLs were found in the provided input.")

    js_path = Path(args.file)
    if not js_path.exists():
        raise FileNotFoundError(f"Could not find target file: {js_path}")

    updated_count = 0
    skipped_count = 0
    failed_count = 0

    for category, item_name, url in targets:
        try:
            changed = process_url(
                url=url,
                model=args.model,
                provider=args.provider,
                js_path=js_path,
                api_url=args.api_url,
                explicit_name=args.name or item_name,
                explicit_category=args.category or category,
                dry_run=args.dry_run,
            )
            if changed:
                updated_count += 1
            else:
                skipped_count += 1
        except Exception as exc:
            failed_count += 1
            print(f"Failed {item_name or url}: {exc}")

    print(f"Done. updated={updated_count}, skipped={skipped_count}, failed={failed_count}")
    return 0 if updated_count > 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())