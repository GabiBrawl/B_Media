#!/bin/bash

# Installation script for update_data.py dependencies on Linux
# This script installs all required packages for the Linktree data sync tool

echo "================================================"
echo "Installing dependencies for update_data.py"
echo "================================================"
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

echo "✓ Python 3 found: $(python3 --version)"
echo ""

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "Installing pip..."
    sudo apt-get update
    sudo apt-get install -y python3-pip
fi

echo "✓ pip found: $(pip3 --version)"
echo ""

# Install Python packages
echo "Installing Python packages..."
echo "------------------------------"

pip3 install --user requests beautifulsoup4 selenium

echo ""
echo "Installing Chromium and ChromeDriver..."
echo "----------------------------------------"

# Install Chromium browser
sudo apt-get update
sudo apt-get install -y chromium-browser chromium-chromedriver

# Alternative if chromium-browser is not available
if ! command -v chromium-browser &> /dev/null; then
    echo "Trying alternative Chromium package..."
    sudo apt-get install -y chromium chromium-driver
fi

echo ""
echo "================================================"
echo "Installation Complete!"
echo "================================================"
echo ""
echo "Installed packages:"
echo "  • requests - HTTP library for downloading images"
echo "  • beautifulsoup4 - HTML parsing"
echo "  • selenium - Browser automation for Linktree scraping"
echo "  • chromium - Headless browser"
echo "  • chromium-chromedriver - WebDriver for Chromium"
echo ""
echo "You can now run: python3 update_data.py"
echo "================================================"
