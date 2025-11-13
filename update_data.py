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
    """Use Selenium to scrape Linktree page and get product data with images."""
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
        
        # Find all link buttons
        links = []
        for link_elem in soup.find_all('a', href=True):
            # Get text and URL
            text = link_elem.get_text(strip=True)
            href = link_elem['href']
            
            # Try to find associated image
            img = link_elem.find('img')
            img_url = None
            if img and img.get('src'):
                img_url = img['src']
            
            if text and href and not href.startswith('#'):
                links.append({
                    'text': text,
                    'url': href,
                    'image_url': img_url
                })
        
        driver.quit()
        return links
        
    except Exception as e:
        print(f"Error scraping with Selenium: {e}")
        if 'driver' in locals():
            driver.quit()
        return []

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
    # Try scraping with Selenium first to get images
    scraped_links = scrape_linktree_with_selenium(url)
    
    # Create a mapping of URLs to image URLs
    url_to_image = {}
    for link in scraped_links:
        if link['image_url']:
            url_to_image[link['url']] = link['image_url']
    
    print(f"\nFound {len(url_to_image)} links with images")
    
    # Categorize based on hardcoded data (since we know the structure)
    categories = {
        'iems': [],
        'headphones': [],
        'portable-dac-amp': [],
        'desktop-dac-amp': [],
        'dap': [],
        'wireless-earbuds': [],
        'wireless-headphones': [],
        'cables-eartips': []
    }
    
    # Manually parse from the webpage text since it's JavaScript-loaded
    # Using the data structure from the fetch we know exists
    
    # IEMs
    iems_data = [
        {"name": "Truthear Gate", "price": 20, "url": "https://amzn.to/3UzzHSQ", "pick": False},
        {"name": "7hz x Crinacle Zero 2", "price": 25, "url": "https://www.linsoul.com/products/7hz-x-crinacle-zero-2?sca_ref=8292414.EuVtu9PPWr", "pick": True},
        {"name": "LETSHUOER D02", "price": 30, "url": "https://letshuoer.net/products/letshuoer-d02?sca_ref=9494666.Bbv8z0WcOh", "pick": False},
        {"name": "Kiwi Ears Cadenza", "price": 35, "url": "https://www.linsoul.com/products/kiwi-ears-cadenza?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "Kefine Klean", "price": 50, "url": "https://www.linsoul.com/products/kefine-klean?sca_ref=8292414.EuVtu9PPWr", "pick": True},
        {"name": "INAWAKEN DAWN Ms", "price": 50, "url": "https://www.linsoul.com/products/inawaken-dawn-ms?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "Moondrop LAN II", "price": 60, "url": "https://www.linsoul.com/products/moondrop-lanii?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "Truthear x Crinacle Zero Blue 2", "price": 70, "url": "https://amzn.to/45lfczx", "pick": False},
        {"name": "Kefine Delci", "price": 75, "url": "https://www.linsoul.com/products/kefine-delci?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "Dunu Titan S2", "price": 80, "url": "https://www.linsoul.com/products/dunu-titan-s2?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "SIMGOT EW300", "price": 80, "url": "https://www.linsoul.com/products/simgot-ew300?sca_ref=8292414.EuVtu9PPWr", "pick": True},
        {"name": "MOONDROP RAYS", "price": 100, "url": "https://www.linsoul.com/products/moondrop-rays?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "Moondrop Aria 2", "price": 100, "url": "https://www.linsoul.com/products/moondrop-aria2?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "Fosi Audio IM4", "price": 100, "url": "https://fosiaudioshop.com/products/fosi-audio-im4?sca_ref=9795660.evSmNtMEvd&utm_source=affiliate&utm_medium=referral&utm_campaign=uppromote", "pick": True},
        {"name": "Kiwi Ears Étude", "price": 120, "url": "https://www.linsoul.com/products/kiwi-ears-etude?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "7Hz x Crinacle: Divine", "price": 150, "url": "https://www.linsoul.com/products/7hz-x-crinacle-divine?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "7Hz x Crinacle: Diablo", "price": 150, "url": "https://www.linsoul.com/products/7hz-x-crinacle-diablo?sca_ref=8292414.EuVtu9PPWr", "pick": True},
        {"name": "Crinear Daybreak", "price": 170, "url": "https://www.linsoul.com/products/crinear-daybreak?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "LETSHUOER S12 Ultra", "price": 170, "url": "https://letshuoer.net/products/letshuoer-s12-ultra?sca_ref=9494666.Bbv8z0WcOh", "pick": False},
        {"name": "NICEHCK NX8", "price": 200, "url": "https://nicehck.com/products/nicehck-nx8-in-ear-monitor-with-1dd-6ba-1pzt-8-unit-hybrid-earphone?sca_ref=9185017.bnGYqsxONg", "pick": False},
        {"name": "7HZ Timeless II", "price": 230, "url": "https://www.linsoul.com/products/7hz-timeless-ii?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "ZiiGaat x Hangout.Audio: Odyssey 2", "price": 250, "url": "https://www.linsoul.com/products/ziigaat-x-hangout-audio-odyssey-2?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "NICEHCK NX8 SE", "price": 270, "url": "https://nicehck.com/products/nicehck-nx8-se-nx8-special-edition-iems?sca_ref=9185017.bnGYqsxONg", "pick": True},
        {"name": "Kiwi Ears Septet", "price": 270, "url": "https://www.linsoul.com/products/kiwi-ears-septet?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "Kiwi Ears Astral", "price": 300, "url": "https://www.linsoul.com/products/kiwi-ears-astral?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "Punch Audio Martilo", "price": 330, "url": "https://www.linsoul.com/products/punch-audio-martilo?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "ZiiGaat Horizon", "price": 330, "url": "https://www.linsoul.com/products/ziigaat-horizon?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "XENNS Mangird Tea Pro", "price": 360, "url": "https://www.linsoul.com/products/xenns-mangird-tea-pro?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "THIEAUDIO Hype 4", "price": 400, "url": "https://www.linsoul.com/products/thieaudio-hype-4?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "Kiwi Ears x HBB Punch", "price": 450, "url": "https://www.linsoul.com/products/kiwi-ears-x-hbb-punch?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "XENNS Mangird Top Pro", "price": 500, "url": "https://www.linsoul.com/products/xenns-mangird-top-pro?sca_ref=8292414.EuVtu9PPWr", "pick": True},
        {"name": "THIEAUDIO Oracle MKIII", "price": 590, "url": "https://www.linsoul.com/products/thieaudio-oracle-mkiii?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "LETSHUOER Mystic 8", "price": 990, "url": "https://letshuoer.net/products/letshuoer-mystic-8-wired-iem-hifi-earphones-8-ba-drivers-in-ear-monitor?sca_ref=9494666.Bbv8z0WcOh", "pick": False},
    ]
    
    # Headphones
    headphones_data = [
        {"name": "Kiwi Ears Altruva", "price": 70, "url": "https://www.linsoul.com/products/kiwi-ears-altruva?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "Simgot EP5", "price": 98, "url": "https://www.linsoul.com/products/simgot-ep5?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "FiiO FT1", "price": 160, "url": "https://www.linsoul.com/products/fiio-ft1?sca_ref=8292414.EuVtu9PPWr", "pick": True},
        {"name": "DROP PC38X", "price": 200, "url": "https://amzn.to/3HhZLiJ", "pick": False},
        {"name": "Sennheiser HD599", "price": 200, "url": "https://amzn.to/4nl2vvE", "pick": True},
        {"name": "Sennheiser HD 560 S", "price": 275, "url": "https://r.amzlink.to/?btn_url=https%3A%2F%2Fwww.amazon.com%2Fdp%2FB08J9MVB6W%2Fref%3Dcm_sw_r_as_gl_api_gl_i_GHA0516AARS5E63DD09E%3FlinkCode%3Dml1%26tag%3Dbmedia091-20%26linkId%3Dcb1741c88340e67df6d3d142d6253491&btn_ref=org-433bb393e1b8b503", "pick": False},
        {"name": "Hifiman Sundara", "price": 280, "url": "https://apos.audio/products/hifiman-sundara-planar-magnetic-headphones?sca_ref=9857353.lTWqXMxzNa", "pick": False},
        {"name": "Sennheiser HD620S", "price": 400, "url": "https://amzn.to/4eytz6T", "pick": False},
        {"name": "Meze 105 AER", "price": 400, "url": "https://mezeaudio.com/products/105-aer?_ef_transaction_id=&oid=46&affid=287.", "pick": False},
        {"name": "SIVGA Peng", "price": 500, "url": "https://www.linsoul.com/products/sivga-peng?sca_ref=8292414.EuVtu9PPWr", "pick": True},
        {"name": "Fosi Audio i5", "price": 550, "url": "https://fosiaudioshop.com/products/i5-headphones?sca_ref=9795660.evSmNtMEvd&utm_source=affiliate&utm_medium=referral&utm_campaign=uppromote", "pick": True},
        {"name": "Focal Azurys", "price": 600, "url": "https://amzn.to/4evNOSA", "pick": False},
        {"name": "Focal Hadenys", "price": 750, "url": "https://amzn.to/4oxjjj6", "pick": True},
        {"name": "Meze 109 Pro", "price": 800, "url": "https://apos.audio/products/meze-audio-109-pro?sca_ref=9857353.lTWqXMxzNa", "pick": False},
    ]
    
    # Portable DAC/AMP
    portable_dac_data = [
        {"name": "JCALLY JM12", "price": 10, "url": "https://amzn.to/4eB4gRv", "pick": False},
        {"name": "JCALLY JM6 Pro", "price": 18, "url": "https://amzn.to/3TMeGUZ", "pick": False},
        {"name": "NICEHCK NK1 MAX", "price": 24, "url": "https://nicehck.com/products/nicehck-nki-max-portable-dac-adapter-cable?sca_ref=9185017.bnGYqsxONg", "pick": True},
        {"name": "Kiwi Ears Allegro Mini", "price": 25, "url": "https://www.linsoul.com/products/kiwi-ears-allegro-mini?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "TRN Black Pearl", "price": 37, "url": "https://www.linsoul.com/products/trn-black-pearl?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "HiBy W3 II", "price": 49, "url": "https://www.linsoul.com/products/hiby-w3-ii?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "Kiwi Ears Allegro Pro", "price": 60, "url": "https://www.linsoul.com/products/kiwi-ears-allegro-pro?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "Moondrop Dawn Pro 2", "price": 60, "url": "https://www.linsoul.com/products/moondrop-dawn-pro2?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "FiiO KA13", "price": 80, "url": "https://www.linsoul.com/products/fiio-ka13?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "CrinEar Protocol Max", "price": 90, "url": "https://www.linsoul.com/products/crinear-protocol-max?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "FiiO KA15", "price": 95, "url": "https://www.linsoul.com/products/fiio-ka15?sca_ref=8292414.EuVtu9PPWr", "pick": True},
        {"name": "Questyle M15i", "price": 250, "url": "https://amzn.to/4evROCA", "pick": False},
    ]
    
    # Desktop DAC/AMP
    desktop_dac_data = [
        {"name": "IFI Uno", "price": 79, "url": "https://apos.audio/products/ifi-uno?sca_ref=9857353.lTWqXMxzNa", "pick": False},
        {"name": "Topping DX1 Mini", "price": 99, "url": "https://apos.audio/products/topping-dx1-dac-amp?sca_ref=9857353.lTWqXMxzNa", "pick": True},
        {"name": "xDuoo MH-02", "price": 130, "url": "https://www.linsoul.com/products/xduoo-mh-02?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "Schiit Fulla", "price": 136, "url": "https://amzn.to/403r0nk", "pick": False},
        {"name": "FiiO K11", "price": 140, "url": "https://www.linsoul.com/products/fiio-k11?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "Fosi Audio ZH3", "price": 200, "url": "https://fosiaudioshop.com/products/zh3-dac-headphone-amp-preamp?sca_ref=9795660.evSmNtMEvd&utm_source=affiliate&utm_medium=referral&utm_campaign=uppromote", "pick": True},
        {"name": "Schiit Gunnr Mission-Critical", "price": 259, "url": "https://amzn.to/3TsPAKC", "pick": False},
    ]
    
    # DAP
    dap_data = [
        {"name": "HiBy R1", "price": 85, "url": "https://www.linsoul.com/products/hiby-r1?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "Hidiz x Linsoul AP80 PRO MAX", "price": 190, "url": "https://www.linsoul.com/products/hidizs-x-linsoul-ap80pro-max?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "Shanling M1 Plus", "price": 210, "url": "https://www.linsoul.com/products/shanling-m1-plus?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "HiBy R4", "price": 250, "url": "https://www.linsoul.com/products/hiby-r4?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "FiiO M21", "price": 330, "url": "https://r.amzlink.to/?btn_url=https%3A%2F%2Fwww.amazon.com%2Fdp%2FB0F8HVKTB9%2Fref%3Dcm_sw_r_as_gl_api_gl_i_3AE8XXTMSQ46W1HFYXMR%3FlinkCode%3Dml1%26tag%3Dbmedia091-20%26linkId%3Dabcb6e8f945a52f32b302ca17fd8eb8c&btn_ref=org-433bb393e1b8b503", "pick": False},
        {"name": "Hiby R6 III", "price": 440, "url": "https://www.linsoul.com/products/hiby-r6-iii-2025?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "Shanling M3 Plus", "price": 469, "url": "https://www.linsoul.com/products/shanling-m3-plus?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "FiiO M23", "price": 720, "url": "https://r.amzlink.to/?btn_url=https%3A%2F%2Fwww.amazon.com%2Fdp%2FB0D14PGZV1%2Fref%3Dcm_sw_r_as_gl_api_gl_i_TK9CDFZVGYHMD8H3WVQX%3FlinkCode%3Dml1%26tag%3Dbmedia091-20%26linkId%3D98aa5a3055150f1c4be2bcfc78367188&btn_ref=org-433bb393e1b8b503", "pick": False},
    ]
    
    # Wireless Earbuds
    wireless_earbuds_data = [
        {"name": "Moondrop Space Travel 2", "price": 30, "url": "https://www.linsoul.com/products/moondrop-space-travel-2?sca_ref=8292414.EuVtu9PPWr", "pick": True},
        {"name": "TANCHJIM MINO", "price": 42, "url": "https://www.linsoul.com/products/tanchjim-mino?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "CMF Buds Pro 2", "price": 60, "url": "https://amzn.to/45m8kku", "pick": False},
        {"name": "Moondrop Golden Ages 2", "price": 90, "url": "https://amzn.to/46e5hMZ", "pick": False},
        {"name": "Moondrop Robin", "price": 120, "url": "https://amzn.to/4mslt22", "pick": True},
        {"name": "SoundPEATS H3", "price": 130, "url": "https://r.amzlink.to/?btn_url=https%3A%2F%2Fwww.amazon.com%2Fdp%2FB0FJKYVSMP%2Fref%3Dcm_sw_r_as_gl_api_gl_i_RXTZ92A5JQYJFTP9PNMW%3FlinkCode%3Dml1%26tag%3Dbmedia091-20%26linkId%3D60a065112fb14a8361f5e08f9709b9b2&btn_ref=org-433bb393e1b8b503", "pick": False},
        {"name": "Apple AirPods Pro 2", "price": 250, "url": "https://amzn.to/41otTQ2", "pick": False},
    ]
    
    # Wireless Headphones
    wireless_headphones_data = [
        {"name": "Moondrop Edge", "price": 90, "url": "https://www.linsoul.com/products/moondrop-edge?_pos=10&_sid=2605a58ec&_ss=r&sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "CMF by Nothing Headphone Pro", "price": 100, "url": "https://r.amzlink.to/?btn_url=https%3A%2F%2Fwww.amazon.com%2Fdp%2FB0FKG6TDRR%2Fref%3Dcm_sw_r_as_gl_api_gl_i_10TV6G03W2PC25HEMKE4%3FlinkCode%3Dml1%26tag%3Dbmedia091-20%26linkId%3D8cc5f836f5310ef8f0690b0d272abf92&btn_ref=org-433bb393e1b8b503", "pick": False},
        {"name": "Audeze Maxwell", "price": 330, "url": "https://apos.audio/products/audeze-maxwell-wireless-gaming-headset?sca_ref=9857353.lTWqXMxzNa", "pick": False},
        {"name": "Bose QC Ultra 2", "price": 450, "url": "https://r.amzlink.to/?btn_url=https%3A%2F%2Fwww.amazon.com%2Fdp%2FB0FDKQ2FG6%2Fref%3Dcm_sw_r_as_gl_api_gl_i_KMZZ1JFZZ6GY3C88QWTP%3FlinkCode%3Dml1%26tag%3Dbmedia091-20%26linkId%3D09ba8bbe979351a9c6fb08316894060e&btn_ref=org-433bb393e1b8b503", "pick": False},
        {"name": "Sennheiser HDB 630", "price": 500, "url": "https://r.amzlink.to/?btn_url=https%3A%2F%2Fwww.amazon.com%2Fdp%2FB0FK4K5Z37%2Fref%3Dcm_sw_r_as_gl_api_gl_i_J5QCFF41K3X5F978M3Z1%3FlinkCode%3Dml1%26tag%3Dbmedia091-20%26linkId%3Ddc35d45f37440632ee3611e6c7b1fbdd&btn_ref=org-433bb393e1b8b503", "pick": False},
    ]
    
    # Cables/Eartips
    cables_data = [
        {"name": "NICEHCK C04 Liquid Silicone Eartips", "price": None, "url": "https://nicehck.com/products/nicehck-c04-liquid-silicone-ear-tips?sca_ref=9185017.bnGYqsxONg", "pick": True},
        {"name": "TANGZU Tang Sancai", "price": None, "url": "https://www.linsoul.com/products/tangzu-tang-sancai?sca_ref=8292414.EuVtu9PPWr", "pick": False},
        {"name": "NICEHCK 08 Silicone Ear Tips", "price": None, "url": "https://nicehck.com/products/nicehck-08-silicone-ear-tips-noise-isolating-earbuds-cushion-earphone-accessories-improve-clear-vocal-for-nx7mk4-zero-2-t2-gk20?sca_ref=9185017.bnGYqsxONg", "pick": False},
        {"name": "NICEHCK C16-4 16 Core Silver Plated Cable", "price": None, "url": "https://nicehck.com/products/nicehck-c16-4-16-core-silver-plated-cable?sca_ref=9185017.bnGYqsxONg", "pick": False},
        {"name": "NICEHCK BlackWheat IEM w/mic", "price": None, "url": "https://nicehck.com/products/nicehck-blackwheat-8-core-silver-plated-copper-microphone-cable-mmcx-qdc-0-78-2pin-for-db3-zsn-zst-as10-zs10-edx-c10-ca4-c12?variant=47860952662307&sca_ref=9185017.bnGYqsxONg", "pick": False},
        {"name": "NICEHCK SP4 USB C IEM Cable w/mic", "price": None, "url": "https://nicehck.com/products/nicehck-sp4-usbc-iem-cable-2pin?sca_ref=9185017.bnGYqsxONg", "pick": False},
        {"name": "Kiwi Ears Terras", "price": None, "url": "https://www.linsoul.com/products/kiwi-ears-terras?sca_ref=8292414.EuVtu9PPWr", "pick": True},
        {"name": "NICEHCK DeepSnow Earphone Upgrade", "price": None, "url": "https://nicehck.com/products/nicehck-deepsnow-earphone-upgrade-iem-cable-4-strands-silver-plated-german-copper-hifi-wire-mmcx-2pin-qdc-for-conch-nova-f1-pro?sca_ref=9185017.bnGYqsxONg", "pick": False},
    ]
    
    # Add image URLs to all items
    for category_data in [iems_data, headphones_data, portable_dac_data, desktop_dac_data, 
                          dap_data, wireless_earbuds_data, wireless_headphones_data, cables_data]:
        for item in category_data:
            item['image_url'] = url_to_image.get(item['url'])
    
    categories['iems'] = iems_data
    categories['headphones'] = headphones_data
    categories['portable-dac-amp'] = portable_dac_data
    categories['desktop-dac-amp'] = desktop_dac_data
    categories['dap'] = dap_data
    categories['wireless-earbuds'] = wireless_earbuds_data
    categories['wireless-headphones'] = wireless_headphones_data
    categories['cables-eartips'] = cables_data
    
    # Print summary
    print("\nParsed products by category:")
    for cat, items in categories.items():
        if items:
            images_count = sum(1 for item in items if item.get('image_url'))
            print(f"  {cat}: {len(items)} items ({images_count} with images)")
    
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
    
    # Define category order to match original file
    category_order = ['iems', 'headphones', 'portable-dac-amp', 'desktop-dac-amp', 
                     'dap', 'wireless-earbuds', 'wireless-headphones', 'cables-eartips']
    
    # Use defined order, then add any extra categories
    ordered_categories = []
    for cat in category_order:
        if cat in categories:
            ordered_categories.append(cat)
    for cat in categories:
        if cat not in ordered_categories:
            ordered_categories.append(cat)
    
    for cat_idx, category in enumerate(ordered_categories):
        items = categories[category]
        
        # Use quotes for category names with hyphens
        if '-' in category:
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
