"""Scrape product pages, extract structured extra details deterministically 
using metadata payload tracking, normalize them, and upsert the result into js/extraDetails.js.

No local or external LLM dependencies are required.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent
DEFAULT_JS_FILE = ROOT / "js" / "extraDetails.js"
DEFAULT_DATA_FILE = ROOT / "js" / "data.js"

# Global mapping dictionary to normalize raw text keys into exact JS schema keys
SPEC_MAPPING = {
    "driver": "drivers",
    "drivers": "drivers",
    "driver configuration": "driverConfig",
    "driver config": "driverConfig",
    "interface": "connector",
    "connector": "connector",
    "2-pin": "connector",
    "plug type": "cableTermination",
    "termination": "cableTermination",
    "plug": "cableTermination",
    "impedance": "impedance",
    "sensitivity": "sensitivity",
    "frequency range": "frequencyResponse",
    "frequency response": "frequencyResponse",
    "material": "shellMaterial",
    "shell material": "shellMaterial",
    "diaphragm": "diaphragmMaterial",
    "diaphragm material": "diaphragmMaterial",
    "driver type": "driverType",
    "driver size": "driverSize",
    "open/closed": "backType",
    "weight": "weight"
}

def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write_text(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")


def normalize_ws(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def parse_data_js_targets(data_js_text: str) -> List[Tuple[str, str, str]]:
    targets: List[Tuple[str, str, str]] = []
    category = None

    category_re = re.compile(r'^\s*"([^"]+)": \[$')
    item_re = re.compile(r'^\s*\{\s*name:\s*"((?:\\.|[^"])*)".*?url:\s*"((?:\\.|[^"])*)"')

    def unescape_js_string(value: str) -> str:
        return json.loads(f'"{value}"')

    for raw_line in data_js_text.splitlines():
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


def fetch_page(url: str, timeout: int = 15) -> str:
    if "sca_ref" in url or "?" in url:
        url = url.split("?")[0]
        
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
    }
    response = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
    response.raise_for_status()
    return response.text


def parse_properties_by_category(js_text: str) -> Dict[str, List[str]]:
    start = js_text.find("propertiesByCategory: {")
    end = js_text.find("},\n    byItem: {")
    if start == -1 or end == -1:
        raise ValueError("Could not locate propertiesByCategory in extraDetails.js")

    block = js_text[start:end]
    category = None
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


def extract_specs_deterministically(html_content: str) -> Dict[str, str]:
    soup = BeautifulSoup(html_content, 'html.parser')
    extracted_data = {}

    def match_and_add(raw_key: str, raw_val: str):
        cleaned_key = normalize_ws(raw_key).lower()
        for spec_key, schema_key in SPEC_MAPPING.items():
            if spec_key in cleaned_key:
                if schema_key not in extracted_data:
                    extracted_data[schema_key] = normalize_ws(raw_val)
                    break

    # 1. Meta-payload extraction
    meta_json = soup.find('script', type='application/ld+json')
    if meta_json:
        try:
            meta_data = json.loads(meta_json.string)
            desc = meta_data.get('description', '')
            if desc:
                clean_desc = BeautifulSoup(desc, 'html.parser').get_text('\n')
                for line in clean_desc.splitlines():
                    if ':' in line and len(line) < 150:
                        k, v = line.split(':', 1)
                        match_and_add(k, v)
        except Exception:
            pass

    # 2. Conventional HTML Data Tables
    for table in soup.find_all('table'):
        for row in table.find_all('tr'):
            cells = row.find_all(['td', 'th'])
            if len(cells) >= 2:
                match_and_add(cells[0].get_text(), cells[1].get_text())

    # 3. Definition lists (<dt>/<dd>)
    for dl in soup.find_all('dl'):
        dts = dl.find_all('dt')
        dds = dl.find_all('dd')
        for dt, dd in zip(dts, dds):
            match_and_add(dt.get_text(), dd.get_text())

    # 4. Deep fallback structural text tracking (stripping internal inline tags like <span> or <strong>)
    for element in soup.find_all(['li', 'p', 'div']):
        # Ignore deep blocks to prevent data bloat clashing
        if element.name == 'div' and len(element.find_all('div')) > 0:
            continue
            
        text = element.get_text('\n', strip=True)
        for line in text.splitlines():
            if ':' in line and len(line) < 200:
                parts = line.split(':', 1)
                match_and_add(parts[0], parts[-1])

    return extracted_data


def clean_and_normalize_value(schema_key: str, value: str) -> str:
    if not value:
        return value
    if schema_key == "impedance":
        value = re.sub(r'\s*(ohms?|ohm|Ω)\b', 'Ω', value, flags=re.IGNORECASE)
    elif schema_key == "sensitivity":
        value = re.sub(r'\s*(decibels?|db)\b', 'dB', value, flags=re.IGNORECASE)
    return value


def find_matching_brace(text: str, open_index: int) -> int:
    if open_index < 0 or open_index >= len(text) or text[open_index] != "{":
        return -1

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
    return -1


def merge_with_existing(
    js_text: str,
    item_name: str,
    allowed_fields: List[str],
    incoming_fields: Dict[str, Any],
) -> Dict[str, Any]:
    quoted_key = f'"{item_name}":'
    if quoted_key not in js_text:
        return incoming_fields

    try:
        item_start = js_text.find(quoted_key)
        open_brace = js_text.find("{", item_start)
        close_brace = find_matching_brace(js_text, open_brace)
        if open_brace == -1 or close_brace == -1:
            return incoming_fields

        item_block = js_text[open_brace:close_brace+1]
        
        json_friendly = re.sub(r'([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'"\1":', item_block)
        json_friendly = re.sub(r',\s*([\]}])', r'\1', json_friendly)
        existing_fields = json.loads(json_friendly)
    except Exception:
        existing_fields = {}

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

        merged[key] = incoming if len(str(incoming)) >= len(str(existing)) else existing

    return merged


def build_entry_block(item_name: str, fields: Dict[str, Any]) -> str:
    lines = [f'        "{item_name}": {{']
    keys = list(fields.keys())
    for index, key in enumerate(keys):
        value = fields[key]
        comma = "," if index < len(keys) - 1 else ""
        if isinstance(value, list):
            formatted = "[\n" + ",\n".join(f'                {json.dumps(v, ensure_ascii=False)}' for v in value) + "\n            ]"
        else:
            formatted = json.dumps(value, ensure_ascii=False)
        lines.append(f'            {key}: {formatted}{comma}')
    lines.append("        }")
    return "\n".join(lines)


def upsert_extra_details(js_text: str, item_name: str, entry_block: str) -> str:
    marker = "byItem: {"
    marker_pos = js_text.find(marker)
    if marker_pos == -1:
        return js_text

    open_brace = js_text.find("{", marker_pos)
    close_brace = find_matching_brace(js_text, open_brace)
    if open_brace == -1 or close_brace == -1:
        return js_text

    by_item_content = js_text[open_brace+1:close_brace]
    quoted_key = f'"{item_name}":'
    
    if quoted_key in by_item_content:
        item_idx = by_item_content.find(quoted_key)
        next_open = by_item_content.find("{", item_idx)
        next_close = find_matching_brace(by_item_content, next_open)
        
        block_to_replace = by_item_content[item_idx:next_close+1]
        updated_content = by_item_content.replace(block_to_replace, entry_block.strip())
    else:
        sep = ",\n" if by_item_content.strip() else "\n"
        updated_content = by_item_content.rstrip() + sep + entry_block + "\n    "

    return js_text[:open_brace+1] + updated_content + js_text[close_brace:]


def process_url(
    url: str,
    js_path: Path,
    explicit_name: Optional[str] = None,
    explicit_category: Optional[str] = None,
    dry_run: bool = False,
) -> bool:
    if not explicit_name:
        raise ValueError("Item name is required for deterministic insertion.")
    if not explicit_category:
        raise ValueError("Category is required for deterministic schema filtering.")

    if any(domain in url for domain in ["amzn.to", "amzlink.to", "reddit.com", "kickstarter.com", "patreon.com", "mailto:"]):
        print(f"Skipped {explicit_name}: Reference domain handles social/external storefront channels.")
        return False

    try:
        html = fetch_page(url)
    except Exception as err:
        print(f"Failed {explicit_name}: Remote connection drops or blocks pipeline context ({err}).")
        return False

    raw_specs = extract_specs_deterministically(html)
    
    js_text = read_text(js_path)
    categories = parse_properties_by_category(js_text)

    if explicit_category not in categories:
        raise ValueError(f"Unsupported category '{explicit_category}'. Allowed categories: {', '.join(categories)}")
    allowed_fields = categories[explicit_category]

    validated_fields = {}
    for key, val in raw_specs.items():
        if key in allowed_fields:
            validated_fields[key] = clean_and_normalize_value(key, val)

    if not validated_fields:
        print(f"Skipped {explicit_name}: No data markers parsed out from text streams.")
        return False

    merged_fields = merge_with_existing(
        js_text=js_text,
        item_name=explicit_name,
        allowed_fields=allowed_fields,
        incoming_fields=validated_fields,
    )

    entry_block = build_entry_block(explicit_name, merged_fields)
    updated = upsert_extra_details(js_text, explicit_name, entry_block)

    if dry_run:
        print(entry_block)
        return True

    write_text(js_path, updated)
    print(f"Updated {js_path} with {explicit_name} ({explicit_category}).")
    return True


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate and insert extra details for product pages deterministically.")
    parser.add_argument("--url", action="append", help="Product page URL. Can be supplied multiple times.")
    parser.add_argument("--urls-file", help="Text file with one product URL per line.")
    parser.add_argument("--data-file", default=str(DEFAULT_DATA_FILE), help="Path to js/data.js for automatic crawling.")
    parser.add_argument("--name", help="Exact item name to use as the key in extraDetails.js.")
    parser.add_argument("--category", help="Override the category schema context.")
    parser.add_argument("--file", default=str(DEFAULT_JS_FILE), help="Path to js/extraDetails.js.")
    parser.add_argument("--dry-run", action="store_true", help="Print the generated entry without writing it.")
    return parser


def main() -> int:
    parser = build_arg_parser()
    args = parser.parse_args()

    try:
        targets = collect_targets(args)
    except Exception as e:
        parser.error(str(e))

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
                js_path=js_path,
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
            print(f"Failed {item_name}: Unexpected process drop ({exc})")

    print(f"\nExecution summary: updated={updated_count}, skipped={skipped_count}, failed={failed_count}")
    return 0 if updated_count > 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())