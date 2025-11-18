import json
import re
import os

def sanitize_name(name):
    # Sanitize the name for filename: lowercase, replace spaces and special chars with _
    return re.sub(r'[^a-zA-Z0-9_]', '_', name.lower().replace(' ', '_'))

def load_js_object(filepath, var_name):
    with open(filepath, 'r') as f:
        content = f.read()
    # Remove the const var_name = and trailing ;
    content = content.replace(f'const {var_name} = ', '').rstrip(';')
    # Remove comment lines
    content = re.sub(r'^\s*//.*$', '', content, flags=re.MULTILINE)
    # Replace unquoted keys with quoted
    keys_to_quote = ['name', 'price', 'url', 'pick', 'image', 'images', 'tiktoks', 'otherStuff']
    for key in keys_to_quote:
        content = content.replace(f'{key}: ', f'"{key}": ')
    content = content.strip()
    # Extract the JSON object
    start = content.find('{')
    end = content.rfind('}') + 1
    if start != -1 and end != -1:
        content = content[start:end]
    return json.loads(content)

def main():
    # Load data
    gear_data = load_js_object('js/data.js', 'gearData')
    extra_data = load_js_object('js/extraData.js', 'extraData')

    # Get all product names from gearData
    all_products = []
    for category, items in gear_data.items():
        for item in items:
            all_products.append(item['name'])

    # Products not in extraData, in the order they appear in data.js
    missing_products = [p for p in all_products if p not in extra_data]

    if not missing_products:
        print("All products already have extra data.")
        return

    # Show only first 5
    products_to_show = missing_products[:5]

    # List options
    print("Products missing extra data (showing first 5):")
    for i, product in enumerate(products_to_show, 1):
        print(f"{i}. {product}")

    # Get user choice
    while True:
        try:
            choice = int(input("Enter the number of the product to add extra data: "))
            if 1 <= choice <= len(products_to_show):
                selected_product = products_to_show[choice - 1]
                break
            else:
                print("Invalid choice. Try again.")
        except ValueError:
            print("Please enter a number.")

    # Ask for TikTok links
    tiktoks_input = input("Enter TikTok links separated by commas (or press enter for none): ")
    tiktoks = [link.strip() for link in tiktoks_input.split(',') if link.strip()]

    # Generate image location logically
    sanitized = sanitize_name(selected_product)
    image_path = f"images/extraData/{sanitized}_graph.png"
    images = [image_path]

    # Placeholder for otherStuff
    other_stuff = f"Here could go some additional information about the {selected_product}. This is a temporary placeholder."

    # Add to extraData
    extra_data[selected_product] = {
        "images": images,
        "tiktoks": tiktoks,
        "otherStuff": other_stuff
    }

    # Save back
    comment = """// Extra data for products, manually added by user
// Example structure:
// "IEM Name": {
//     images: ["path/to/image1.jpg", "path/to/image2.jpg"],
//     tiktoks: ["https://tiktok.com/video1", "https://tiktok.com/video2"],
//     otherStuff: "additional info"
// }
"""

    with open('js/extraData.js', 'w') as f:
        f.write(comment)
        f.write('const extraData = ')
        json.dump(extra_data, f, indent=4)
        f.write(';\n')

    print(f"Added extra data for {selected_product}.")

if __name__ == "__main__":
    main()