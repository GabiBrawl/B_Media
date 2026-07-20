import requests
from bs4 import BeautifulSoup
import json
import os
import re
from urllib.parse import urljoin
from urllib.request import urlretrieve
from difflib import SequenceMatcher
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Categories to blacklist from being added to data.js
BLACKLISTED_CATEGORIES = [
    'bostrommediastrategies@gmail.com',
    'cookie-preferences',
    'explore-related-linktrees',
    'explore-other-linktrees',
    'more-from-linktree'
]

# Items to blacklist within specific categories
BLACKLISTED_ITEMS = {
    'headphone-cables-and-interconnects-by-hart-audio': [
        'Report',
        'Privacy', 
        'Learn more about Linktree',
        'Cookie Notice.',
        'Sign up free'
    ]
}

# Global blacklist for items that should never be added
GLOBAL_BLACKLIST = [
    'Report',
    'Check Price',
    'View Product',
    '🎵',
    'Privacy',
    'Learn more about Linktree',
    'Sign up free'
]

# Category display name overrides
# Maps category keys to custom display names
CATEGORY_DISPLAY_NAMES = {
    'my-audio-collection-/-collabs': 'My Audio Collection / Collabs',
    'iem-recommendations': 'IEMs',
    'headphone-recommendations': 'Headphones',
    'portable-dac/amp-recommendations': 'Portable DAC/AMP',
    'desktop-dac/amp-recommendations': 'Desktop DAC/AMP',
    'digital-audio-players': 'Digital Audio Players',
    'wireless-earbuds': 'Wireless Earbuds',
    'wireless-headphones': 'Wireless Headphones',
    'iem-cables/eartips': 'IEM Cables & Eartips',
    'headphone-cables-and-interconnects-by-hart-audio': 'Cables & Interconnects by Hart Audio'
}

DISPLAY_NAME_TO_CATEGORY_KEY = {display: key for key, display in CATEGORY_DISPLAY_NAMES.items()}

def normalize_display_name_to_category_key(display_name):
    """Convert a display category name from data.js into a category key used by Linktree parsing."""
    if display_name in DISPLAY_NAME_TO_CATEGORY_KEY:
        return DISPLAY_NAME_TO_CATEGORY_KEY[display_name]

    normalized = display_name.strip().lower()
    normalized = re.sub(r'\s*/\s*', '/', normalized)
    normalized = re.sub(r'\s+', '-', normalized)
    normalized = re.sub(r'[^a-z0-9\-/]', '', normalized)
    normalized = re.sub(r'-{2,}', '-', normalized).strip('-')
    return normalized

def generate_item_id(name):
    """Generate a clean, uniform lowercase kebab-case ID string from a product name."""
    normalized = name.strip().lower()
    # Strip everything except alpha-numerics, whitespace, and hyphens
    normalized = re.sub(r'[^a-z0-9\s-]', '', normalized)
    # Compress spaces or multiple hyphens into single hyphens
    normalized = re.sub(r'[\s-]+', '-', normalized)
    return normalized.strip('-')

def download_image(image_url, filename):
    """Download an image from a URL to a local file."""
    try:
        # Add headers to mimic browser request
        headers = {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(image_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        with open(filename, 'wb') as f:
            f.write(response.content)
        print(f"  ✓ Downloaded: {os.path.basename(filename)}")
        return True
    except Exception as e:
        print(f"  ✗ Failed to download {image_url}: {e}")
        return False

def scrape_linktree_with_selenium(url):
    """Use Selenium to scrape Linktree page and get product data organized by categories."""
    print(f"\nFetching data from {url} using Selenium...")
    
    # Setup Chrome options for headless mode
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
    
    try:
        # Initialize the driver
        driver = webdriver.Chrome(options=chrome_options)
        driver.get(url)
        
        # Wait for content to load
        print("Waiting for page to load...")
        time.sleep(5)  # Give extra time for JavaScript to render
        
        # Scroll to load all images
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)
        driver.execute_script("window.scrollTo(0, 0);")
        time.sleep(2)
        
        # Get page source and parse with BeautifulSoup
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        
        # Find all potential category headers (h1, h2, h3) and links
        categories = {}
        current_category = None
        
        # Get all elements in order
        elements = soup.find_all(['h1', 'h2', 'h3', 'a'])
        
        for elem in elements:
            if elem.name in ['h1', 'h2', 'h3']:
                # This is a potential category header
                category_name = elem.get_text(strip=True).lower().replace(' ', '-')
                # Skip empty, single-character, or hash-only categories
                if category_name and len(category_name) > 1 and not category_name.startswith('#'):
                    current_category = category_name
                    categories[current_category] = []
                    print(f"Found category: {current_category}")
            elif elem.name == 'a' and current_category:
                # This is a link under the current category
                text = elem.get_text(strip=True)
                href = elem.get('href')
                
                # Try to find associated image
                img = elem.find('img')
                img_url = None
                if img and img.get('src'):
                    img_url = img['src']
                
                if text and href and not href.startswith('#'):
                    categories[current_category].append({
                        'text': text,
                        'url': href,
                        'image_url': img_url
                    })
        
        driver.quit()
        return categories
        
    except Exception as e:
        print(f"Error scraping with Selenium: {e}")
        if 'driver' in locals():
            driver.quit()
        return {}

def fuzzy_match_name(name1, name2, threshold=0.90):
    """
    Compare two product names using fuzzy matching.
    Returns True if they're similar enough to be considered the same product.
    """
    n1 = name1.lower().strip()
    n2 = name2.lower().strip()
    
    if n1 == n2:
        return True
    
    n1 = re.sub(r'\s+', ' ', n1)
    n2 = re.sub(r'\s+', ' ', n2)
    
    ratio = SequenceMatcher(None, n1, n2).ratio()
    return ratio >= threshold

def find_matching_item(name, items_dict, threshold=0.90):
    """
    Find a matching item in the dictionary using fuzzy matching.
    Returns the key of the matching item or None.
    """
    if not items_dict:
        return None

    if name in items_dict:
        return name

    normalized_name = name.lower().strip()
    for key in items_dict:
        if key.lower().strip() == normalized_name:
            return key

    best_match = None
    best_score = 0.0
    for key in items_dict:
        score = SequenceMatcher(None, normalized_name, key.lower().strip()).ratio()
        if score >= threshold and score > best_score:
            best_score = score
            best_match = key

    return best_match

def parse_linktree(url):
    """Parse the Linktree page and extract product data organized by category."""
    scraped_categories = scrape_linktree_with_selenium(url)
    categories = {}
    
    print(f"\nParsing products from Linktree...")
    
    for category_name, links in scraped_categories.items():
        if category_name in BLACKLISTED_CATEGORIES:
            print(f"\n--- Category: {category_name} --- (SKIPPED - Blacklisted)")
            continue
        
        if len(category_name) == 1:
            print(f"\n--- Category: {category_name} --- (SKIPPED - Single letter)")
            continue
            
        print(f"\n--- Category: {category_name} ---")
        products = []
        
        for link in links:
            product = parse_product_text(link['text'], link['url'])
            if product:
                category_blacklist = BLACKLISTED_ITEMS.get(category_name, [])
                if product['name'] in category_blacklist:
                    print(f"  ✗ Skipped (Blacklisted): {product['name']}")
                    continue
                    
                product['image_url'] = link.get('image_url')
                products.append(product)
                print(f"  ✓ Parsed: {product['name']} (${product['price']}) - Pick: {product['pick']}")
            else:
                print(f"  ✗ Skipped: {link['text']}")
        
        if products:
            categories[category_name] = products
            print(f"  Total products in {category_name}: {len(products)}")
    
    print("\nParsed products by category:")
    total_products = 0
    for cat, items in categories.items():
        images_count = sum(1 for item in items if item.get('image_url'))
        print(f"  {cat}: {len(items)} items ({images_count} with images)")
        total_products += len(items)
    
    print(f"\nTotal products parsed: {total_products}")
    return categories

def parse_product_text(text, url):
    """Parse a product text like '$20 Truthear Gate' or '$50 *B_Media Pick* Kefine Klean'"""
    text = re.sub(r'\[Image:.*?\]', '', text).strip()
    
    if not text or 'previous' in text.lower() or 'next' in text.lower():
        return None
    
    leading_price_pattern = r'^\$(\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?(?:-ish)?\s*'
    price_match = re.match(leading_price_pattern, text)
    price = int(price_match.group(1).replace(',', '')) if price_match else None
    
    pick = '*B_Media Pick*' in text or 'B_Media Pick' in text
    
    name = re.sub(leading_price_pattern, '', text)
    name = re.sub(r'\*B_Media Pick\*', '', name)
    name = re.sub(r'\*[^*]+\*', '', name)
    name = name.strip()
    
    if not name or 'Recommendation' in name or 'Players' in name:
        return None
    
    if name in GLOBAL_BLACKLIST:
        return None
    
    return {
        'name': name,
        'price': price,
        'url': url,
        'pick': pick,
        'image_url': None
    }

def parse_existing_data_js(file_path):
    """Parse the existing data.js file, extracting the master book and layout relations."""
    if not os.path.exists(file_path):
        return {}, {}

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    catalog = {}
    relations = {}
    
    # 1. Parse itemsCatalog block
    catalog_match = re.search(r'const itemsCatalog = \{(.*?)\};', content, re.DOTALL)
    if catalog_match:
        catalog_block = catalog_match.group(1)
        item_pattern = r'"([^"]+)"\s*:\s*\{\s*name:\s*"([^"]+)",\s*price:\s*(null|\d+),\s*url:\s*"([^"]+)",\s*pick:\s*(true|false),\s*image:\s*"([^"]+)"\s*\}'
        for match in re.finditer(item_pattern, catalog_block):
            item_id = match.group(1)
            catalog[item_id] = {
                'name': match.group(2),
                'price': int(match.group(3)) if match.group(3) != 'null' else None,
                'url': match.group(4),
                'pick': match.group(5) == 'true',
                'image': match.group(6)
            }
            
    # 2. Parse gearData relations block
    geardata_match = re.search(r'const gearData = \{(.*?)\};', content, re.DOTALL)
    if geardata_match:
        geardata_block = geardata_match.group(1)
        cat_pattern = r'"([^"]+)"\s*:\s*\[(.*?)\]'
        for match in re.finditer(cat_pattern, geardata_block, re.DOTALL):
            display_name = match.group(1).strip()
            cat_key = normalize_display_name_to_category_key(display_name)
            ids_str = match.group(2)
            item_ids = [id_str.strip().strip('"') for id_str in ids_str.split(',') if id_str.strip()]
            relations[cat_key] = item_ids
            
    return catalog, relations

def write_normalized_data_js(file_path, catalog, relations):
    """Write the updated item book and category listings cleanly back to data.js."""
    lines = ['// Master registry of unique items (The "Book of Items")', 'const itemsCatalog = {']
    
    sorted_catalog_keys = sorted(list(catalog.keys()))
    for idx, item_id in enumerate(sorted_catalog_keys):
        item = catalog[item_id]
        price_val = item['price'] if item['price'] is not None else 'null'
        pick_val = 'true' if item['pick'] else 'false'
        
        item_line = f'    "{item_id}": {{ name: "{item["name"]}", price: {price_val}, url: "{item["url"]}", pick: {pick_val}, image: "{item["image"]}" }}'
        if idx < len(sorted_catalog_keys) - 1:
            item_line += ','
        lines.append(item_line)
        
    lines.append('};\n')
    lines.append('// Layout mapping arrays fetching from catalog book rows to minimize page duplication footprint')
    lines.append('const gearData = {')
    
    ordered_categories = list(relations.keys())
    for cat_idx, cat_key in enumerate(ordered_categories):
        display_name = CATEGORY_DISPLAY_NAMES.get(cat_key, cat_key.replace('-', ' ').title())
        lines.append(f'    "{display_name}": [')
        
        ids = relations[cat_key]
        # Chunk identifiers across readable subrows
        chunk_size = 4
        for i in range(0, len(ids), chunk_size):
            chunk = ids[i:i+chunk_size]
            formatted_chunk = ', '.join([f'"{id_str}"' for id_str in chunk])
            if i + chunk_size < len(ids):
                formatted_chunk += ','
            lines.append(f'        {formatted_chunk}')
            
        end_bracket = '    ],' if cat_idx < len(ordered_categories) - 1 else '    ]'
        lines.append(end_bracket)
        
    lines.append('};')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

def update_data_js(linktree_data, data_file_path, images_dir):
    """Compare Linktree arrays with book state records and regenerate structural data.js file."""
    print(f"\n{'='*60}")
    print("Comparing Linktree tracking data within relational catalog layouts...")
    print(f"{'='*60}")
    
    try:
        existing_catalog, _ = parse_existing_data_js(data_file_path)
    except:
        print("Warning: Could not read existing normalized database structure. Building from scratch.")
        existing_catalog = {}
        
    updated_catalog = dict(existing_catalog)
    updated_relations = {}
    changes_made = False
    
    # Maintain a clear string-to-id cross-reference check map
    catalog_by_name = {item['name']: item_id for item_id, item in updated_catalog.items()}
    
    for category in linktree_data.keys():
        print(f"\n--- Category: {category} ---")
        category_item_ids = []
        
        for lt_item in linktree_data[category]:
            lt_name = lt_item['name']
            matched_name = find_matching_item(lt_name, catalog_by_name, threshold=0.90)
            
            if matched_name:
                item_id = catalog_by_name[matched_name]
                ex_item = updated_catalog[item_id]
                
                # Check metrics adjustments
                price_changed = ex_item['price'] != lt_item['price']
                url_changed = ex_item['url'] != lt_item['url']
                pick_changed = ex_item['pick'] != lt_item['pick']
                name_changed = matched_name != lt_name
                
                image_path = ex_item['image']
                image_exists = os.path.exists(os.path.join(os.path.dirname(data_file_path), '..', image_path) if '/' in image_path else image_path)
                
                if price_changed or url_changed or pick_changed or name_changed or not image_exists:
                    changes_made = True
                    print(f"  ⟳ Updating Book Registry: [{item_id}] {matched_name}")
                    if name_changed:
                        print(f"    Name: {matched_name} → {lt_name}")
                    
                    if not image_exists and lt_item.get('image_url'):
                        print(f"    Image missing, downloading...")
                        safe_name = re.sub(r'[^\w\s-]', '', lt_name).strip().replace(' ', '_')
                        img_url = lt_item['image_url']
                        ext = '.png' if '.png' in img_url.lower() else '.jpg'
                        image_filename = f"{safe_name}{ext}"
                        image_path = f"images/{image_filename}"
                        download_image(img_url, os.path.join(images_dir, image_filename))
                        
                    updated_catalog[item_id] = {
                        'name': lt_name,
                        'price': lt_item['price'],
                        'url': lt_item['url'],
                        'pick': lt_item['pick'],
                        'image': image_path
                    }
                    if name_changed:
                        del catalog_by_name[matched_name]
                        catalog_by_name[lt_name] = item_id
                else:
                    print(f"  ✓ Validated book item matching exact metrics: {lt_name}")
            else:
                # Insert unique record configuration to the itemsCatalog registry
                changes_made = True
                print(f"  + Writing New Book Registration: {lt_name}")
                
                item_id = generate_item_id(lt_name)
                # Avoid collision variants
                counter = 1
                base_id = item_id
                while item_id in updated_catalog:
                    item_id = f"{base_id}-{counter}"
                    counter += 1
                    
                safe_name = re.sub(r'[^\w\s-]', '', lt_name).strip().replace(' ', '_')
                image_path = f"images/{safe_name}.jpg"
                
                if lt_item.get('image_url'):
                    img_url = lt_item['image_url']
                    ext = '.png' if '.png' in img_url.lower() else '.jpg'
                    image_filename = f"{safe_name}{ext}"
                    image_path = f"images/{image_filename}"
                    download_image(img_url, os.path.join(images_dir, image_filename))
                    
                updated_catalog[item_id] = {
                    'name': lt_name,
                    'price': lt_item['price'],
                    'url': lt_item['url'],
                    'pick': lt_item['pick'],
                    'image': image_path
                }
                catalog_by_name[lt_name] = item_id
                
            category_item_ids.append(item_id)
            
        updated_relations[category] = category_item_ids
        
    if changes_made or not existing_catalog:
        print(f"\n{'='*60}\nWriting records to normalized data.js topology structures...")
        write_normalized_data_js(data_file_path, updated_catalog, updated_relations)
        
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
        with open(os.path.join(os.path.dirname(data_file_path), 'last_updated.js'), 'w') as f:
            f.write(f'const lastUpdated = "{timestamp}";\n')
            
        print("✓ Synchronization complete!")
    else:
        print(f"\n{'='*60}\n✓ Catalog definitions match Linktree distributions exactly. No rewrites forced.")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    url = "https://linktr.ee/BostromMediaStrategies"
    repo_root = os.path.dirname(os.path.abspath(__file__))
    data_file = os.path.join(repo_root, "js", "data.js")
    images_dir = os.path.join(repo_root, "images")
    os.makedirs(images_dir, exist_ok=True)
    
    # Fetch and parse Linktree data
    linktree_data = parse_linktree(url)
    
    # Update the data.js file using normalized layout mechanisms
    update_data_js(linktree_data, data_file, images_dir)