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
    'cookie-preferences'
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
                if category_name and not category_name.startswith('#'):
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
    Uses a higher threshold to avoid false matches like "HiBy R1" vs "HiBy R4".
    """
    # Normalize names for comparison
    n1 = name1.lower().strip()
    n2 = name2.lower().strip()
    
    # Exact match
    if n1 == n2:
        return True
    
    # Remove common variations
    n1 = re.sub(r'\s+', ' ', n1)
    n2 = re.sub(r'\s+', ' ', n2)
    
    # Check similarity ratio
    ratio = SequenceMatcher(None, n1, n2).ratio()
    
    return ratio >= threshold

def find_matching_item(name, items_dict, threshold=0.90):
    """
    Find a matching item in the dictionary using fuzzy matching.
    Returns the key of the matching item or None.
    """
    for key in items_dict:
        if fuzzy_match_name(name, key, threshold):
            return key
    return None

def parse_linktree(url):
    """Parse the Linktree page and extract product data organized by category."""
    # Scrape the page to get categories and links with images
    scraped_categories = scrape_linktree_with_selenium(url)
    
    categories = {}
    
    print(f"\nParsing products from Linktree...")
    
    for category_name, links in scraped_categories.items():
        if category_name in BLACKLISTED_CATEGORIES:
            print(f"\n--- Category: {category_name} --- (SKIPPED - Blacklisted)")
            continue
            
        print(f"\n--- Category: {category_name} ---")
        products = []
        
        for link in links:
            # Parse the product text to extract price, name, pick
            product = parse_product_text(link['text'], link['url'])
            if product:
                # Check if this item is blacklisted for this category
                category_blacklist = BLACKLISTED_ITEMS.get(category_name, [])
                if product['name'] in category_blacklist:
                    print(f"  ✗ Skipped (Blacklisted): {product['name']}")
                    continue
                    
                # Add image URL from scraping
                product['image_url'] = link.get('image_url')
                products.append(product)
                print(f"  ✓ Parsed: {product['name']} (${product['price']}) - Pick: {product['pick']}")
            else:
                print(f"  ✗ Skipped: {link['text']}")
        
        if products:
            categories[category_name] = products
            print(f"  Total products in {category_name}: {len(products)}")
    
    # Print summary
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
    # Remove markdown image syntax
    text = re.sub(r'\[Image:.*?\]', '', text).strip()
    
    # Skip non-product links
    if not text or 'previous' in text.lower() or 'next' in text.lower():
        return None
    
    # Extract price
    price_match = re.match(r'\$(\d+)', text)
    price = int(price_match.group(1)) if price_match else None
    
    # Check if it's a B_Media pick
    pick = '*B_Media Pick*' in text or 'B_Media Pick' in text
    
    # Extract product name (remove price and pick indicator and other tags)
    name = re.sub(r'^\$\d+(?:-ish)?\s*', '', text)  # Remove price
    name = re.sub(r'\$\d+(?:\.\d+)?\s*', '', name)  # Remove price variations
    name = re.sub(r'\*B_Media Pick\*', '', name)  # Remove pick indicator
    name = re.sub(r'\*[^*]+\*', '', name)  # Remove other tags like *Gaming*, *Basshead*, etc.
    name = name.strip()
    
    # Skip empty names or category headers
    if not name or 'Recommendation' in name or 'Players' in name:
        return None
    
    return {
        'name': name,
        'price': price,
        'url': url,
        'pick': pick,
        'image_url': None  # Images will be handled separately
    }

def parse_existing_data_js(file_path):
    """Parse the existing data.js file and extract the gearData object."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract each category array - handle both quoted and unquoted keys
    categories = {}
    
    # Find all category arrays - match category names with optional quotes and hyphens
    pattern = r'(?:")?([a-z]+(?:-[a-z]+)*)(?:")?\s*:\s*\[(.*?)\](?=\s*,?\s*(?:(?:")?[a-z]+(?:-[a-z]+)*(?:")?\s*:|};))'
    matches = re.finditer(pattern, content, re.DOTALL)
    
    for match in matches:
        category = match.group(1)
        items_str = match.group(2)
        
        # Parse individual items
        items = []
        item_pattern = r'\{\s*name:\s*"([^"]+)",\s*price:\s*(null|\d+),\s*url:\s*"([^"]+)",\s*pick:\s*(true|false),\s*image:\s*"([^"]+)"\s*\}'
        
        for item_match in re.finditer(item_pattern, items_str):
            items.append({
                'name': item_match.group(1),
                'price': int(item_match.group(2)) if item_match.group(2) != 'null' else None,
                'url': item_match.group(3),
                'pick': item_match.group(4) == 'true',
                'image': item_match.group(5)
            })
        
        categories[category] = items
    
    return categories

def write_data_js(file_path, categories):
    """Write the updated data back to the data.js file."""
    lines = ['const gearData = {']
    
    # Use categories in the order they appear
    ordered_categories = list(categories.keys())
    
    for cat_idx, category in enumerate(ordered_categories):
        items = categories[category]
        
        # Use quotes for category names with hyphens or spaces
        if '-' in category or ' ' in category:
            lines.append(f'    "{category}": [')
        else:
            lines.append(f'    {category}: [')
        
        for idx, item in enumerate(items):
            price_val = item['price'] if item['price'] is not None else 'null'
            pick_val = 'true' if item['pick'] else 'false'
            
            item_line = f'        {{ name: "{item["name"]}", price: {price_val}, url: "{item["url"]}", pick: {pick_val}, image: "{item["image"]}" }}'
            
            if idx < len(items) - 1:
                item_line += ','
            
            lines.append(item_line)
        
        if cat_idx < len(ordered_categories) - 1:
            lines.append('    ],')
        else:
            lines.append('    ]')
    
    lines.append('};')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

def update_data_js(linktree_data, data_file_path, images_dir):
    """Compare Linktree data with existing data.js and update as needed using fuzzy matching."""
    print(f"\n{'='*60}")
    print("Comparing Linktree data with existing data.js (using fuzzy matching)...")
    print(f"{'='*60}")
    
    # Parse existing data
    try:
        existing_data = parse_existing_data_js(data_file_path)
    except:
        print("Warning: Could not parse existing data.js, will recreate from Linktree")
        existing_data = {}
    
    updated_categories = {}
    changes_made = False
    
    # Process all categories from Linktree (Linktree is the source of truth)
    for category in linktree_data.keys():
        print(f"\n--- Category: {category} ---")
        
        existing_items = {item['name']: item for item in existing_data.get(category, [])}
        linktree_items = {item['name']: item for item in linktree_data.get(category, [])}
        
        updated_items = []
        matched_existing = set()
        
        # Check each item from Linktree using fuzzy matching
        for lt_name, lt_item in linktree_items.items():
            # Try to find a matching item in existing data
            matched_name = find_matching_item(lt_name, existing_items, threshold=0.90) if existing_items else None
            
            if matched_name:
                matched_existing.add(matched_name)
                ex_item = existing_items[matched_name]
                
                # Check for differences
                price_changed = ex_item['price'] != lt_item['price']
                url_changed = ex_item['url'] != lt_item['url']
                pick_changed = ex_item['pick'] != lt_item['pick']
                name_changed = matched_name != lt_name
                
                # Check if image file exists
                image_path = ex_item['image']
                image_exists = os.path.exists(image_path)
                
                if price_changed or url_changed or pick_changed or name_changed or not image_exists:
                    changes_made = True
                    print(f"  ⟳ Updating: {matched_name}")
                    if name_changed:
                        print(f"    Name: {matched_name} → {lt_name}")
                    if price_changed:
                        print(f"    Price: {ex_item['price']} → {lt_item['price']}")
                    if url_changed:
                        print(f"    URL changed")
                    if pick_changed:
                        print(f"    Pick: {ex_item['pick']} → {lt_item['pick']}")
                    
                    # Handle missing image
                    if not image_exists and lt_item.get('image_url'):
                        print(f"    Image missing, downloading...")
                        # Generate new image filename based on name
                        safe_name = re.sub(r'[^\w\s-]', '', lt_name).strip().replace(' ', '_')
                        img_url = lt_item['image_url']
                        ext = '.jpg'  # default
                        if '.png' in img_url.lower():
                            ext = '.png'
                        elif '.webp' in img_url.lower():
                            ext = '.webp'
                        elif '.gif' in img_url.lower():
                            ext = '.gif'
                        
                        image_filename = f"{safe_name}{ext}"
                        image_path = f"images/{image_filename}"
                        full_image_path = os.path.join(images_dir, image_filename)
                        
                        if download_image(img_url, full_image_path):
                            print(f"    Image saved: {image_path}")
                        else:
                            print(f"    Image download failed")
                    
                    updated_items.append({
                        'name': lt_name,  # Use Linktree name as canonical
                        'price': lt_item['price'],
                        'url': lt_item['url'],
                        'pick': lt_item['pick'],
                        'image': image_path
                    })
                else:
                    print(f"  ✓ No changes: {lt_name}")
                    updated_items.append({
                        'name': lt_name,  # Normalize to Linktree name
                        'price': ex_item['price'],
                        'url': ex_item['url'],
                        'pick': ex_item['pick'],
                        'image': ex_item['image']
                    })
            else:
                # New item from Linktree (not in data.js)
                changes_made = True
                print(f"  + New item: {lt_name}")
                
                # Generate image filename based on name
                safe_name = re.sub(r'[^\w\s-]', '', lt_name).strip().replace(' ', '_')
                
                # Try to download the image if URL is available
                image_path = None
                if lt_item.get('image_url'):
                    # Determine file extension from URL
                    img_url = lt_item['image_url']
                    ext = '.jpg'  # default
                    if '.png' in img_url.lower():
                        ext = '.png'
                    elif '.webp' in img_url.lower():
                        ext = '.webp'
                    elif '.gif' in img_url.lower():
                        ext = '.gif'
                    
                    image_filename = f"{safe_name}{ext}"
                    image_path = f"images/{image_filename}"
                    full_image_path = os.path.join(images_dir, image_filename)
                    
                    # Download the image
                    if download_image(img_url, full_image_path):
                        print(f"    Image saved: {image_path}")
                    else:
                        print(f"    Image download failed, using placeholder: {image_path}")
                else:
                    # No image URL available
                    image_filename = f"{safe_name}.jpg"
                    image_path = f"images/{image_filename}"
                    print(f"    No image URL available: {image_path} (needs manual download)")
                
                updated_items.append({
                    'name': lt_name,
                    'price': lt_item['price'],
                    'url': lt_item['url'],
                    'pick': lt_item['pick'],
                    'image': image_path
                })
        
        # Check for items that exist in data.js but not in Linktree
        # Keep them instead of removing
        for ex_name in existing_items:
            if ex_name not in matched_existing:
                # Try fuzzy match to see if it's in Linktree with different name
                matched_lt = find_matching_item(ex_name, linktree_items, threshold=0.90)
                if not matched_lt:
                    print(f"  ⚠ Item in data.js but not on Linktree: {ex_name} (keeping)")
                    updated_items.append(existing_items[ex_name])
        
        updated_categories[category] = updated_items
    
    # Check if there are categories in existing data that are not in Linktree
    for category in existing_data.keys():
        if category not in updated_categories:
            print(f"\n--- Category: {category} ---")
            print(f"  ⚠ Category exists in data.js but not on Linktree (keeping all items)")
            updated_categories[category] = existing_data[category]
    
    if changes_made or not existing_data:
        print(f"\n{'='*60}")
        print("Writing updates to data.js...")
        write_data_js(data_file_path, updated_categories)
        print("✓ Update complete!")
    else:
        print(f"\n{'='*60}")
        print("✓ No changes needed - all entries match!")
    
    print(f"{'='*60}\n")


if __name__ == "__main__":
    url = "https://linktr.ee/BostromMediaStrategies"
    data_file = "/media/gabi/Data/GitHub/B_Media/js/data.js"
    images_dir = "/media/gabi/Data/GitHub/B_Media/images"
    os.makedirs(images_dir, exist_ok=True)
    
    # Fetch and parse Linktree data
    linktree_data = parse_linktree(url)
    
    # Update the data.js file
    update_data_js(linktree_data, data_file, images_dir)
