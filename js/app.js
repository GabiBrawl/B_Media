let allItems = [];
let currentFilters = {
    search: '',
    category: 'all',
    price: 'all',
    picksOnly: false
};
let main; // Main content element

// Wishlist Management
let wishlist = [];
const WISHLIST_KEY = 'bmedia_wishlist';

// Load wishlist from localStorage
function loadWishlist() {
    try {
        const saved = localStorage.getItem(WISHLIST_KEY);
        if (saved) {
            wishlist = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error loading wishlist:', e);
        wishlist = [];
    }
    updateWishlistCount();
}

// Save wishlist to localStorage
function saveWishlist() {
    try {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
        updateWishlistCount();
    } catch (e) {
        console.error('Error saving wishlist:', e);
    }
}

// Toggle item in wishlist
function toggleWishlist(itemName) {
    const index = wishlist.indexOf(itemName);
    if (index === -1) {
        wishlist.push(itemName);
    } else {
        wishlist.splice(index, 1);
    }
    saveWishlist();
}

// Check if item is in wishlist
function isInWishlist(itemName) {
    return wishlist.includes(itemName);
}

// Update wishlist count display
function updateWishlistCount() {
    const countElement = document.getElementById('wishlist-count');
    if (countElement) {
        countElement.textContent = wishlist.length;
    }
    
    // Update share button state
    const shareBtn = document.getElementById('share-wishlist-btn');
    if (shareBtn) {
        shareBtn.disabled = wishlist.length === 0;
    }

    // Update wishlist button text if not currently viewing wishlist
    const wishlistBtn = document.getElementById('show-wishlist-btn');
    if (wishlistBtn) {
        const currentView = main.querySelector('.wishlist-banner');
        const wishlistBtnText = wishlistBtn.querySelector('span');
        if (wishlistBtnText && !currentView) {
            wishlistBtnText.textContent = `View Wishlist (${wishlist.length})`;
        }
    }
}

// Load wishlist from URL parameter if present
function loadWishlistFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedWishlist = urlParams.get('wishlist');
    
    if (sharedWishlist) {
        try {
            // Decode the base64 encoded wishlist
            const decoded = atob(sharedWishlist);
            const items = JSON.parse(decoded);
            
            if (Array.isArray(items) && items.length > 0) {
                // Show the shared wishlist (don't save to localStorage automatically)
                return items;
            }
        } catch (e) {
            console.error('Error loading shared wishlist:', e);
        }
    }
    return null;
}

// Function to populate category filter dynamically
function populateCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    
    // Clear existing options except "All Categories"
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    
    // Add options for each category in gearData
    // Category names in gearData are now display names from Python
    for (const categoryName of Object.keys(gearData)) {
        const option = document.createElement('option');
        option.value = categoryName;
        option.textContent = categoryName;
        categoryFilter.appendChild(option);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded fired');
    console.log('typeof gearData:', typeof gearData);
    console.log('gearData exists:', typeof gearData !== 'undefined');
    
    if (typeof gearData === 'undefined') {
        console.error('gearData is not defined! Check if data.js is loaded.');
        return;
    }
    // Array of random quotes
    const quotes = [
        {
            text: "In Pursuit of Audio Perfection",
            author: "sam!, Discord Server Admin"
        },
        {
            text: "i wish to eat my oats",
            author: "hazumi, MW Venus Fan"
        },
        {
            text: "pianos should just explode",
            author: "hazumi, MW Venus Fan"
        },
        {
            text: "What the nerds up 2?",
            author: "AudioMan"
        },
        {
            text: "yall did auntie forget to take her special candy today?",
            author: "Aspenumi"
        },
        {
            text: "When will you all realize that I am perfect and not capable of mistakes. If I typed 'fro' it will be in the dictionary by tomorrow.",
            author: "Axel Bostrom"
        },
        {
            text: "We listen & We judge!",
            author: "sam!, Discord Server Admin"
        },
    ];

    // Function to set random quote
    function setRandomQuote() {
        const randomIndex = Math.floor(Math.random() * quotes.length);
        const randomQuote = quotes[randomIndex];

        const quoteTextElement = document.querySelector('.quote-text');
        const quoteAuthorElement = document.querySelector('.quote-author');

        if (quoteTextElement && quoteAuthorElement) {
            quoteTextElement.textContent = `"${randomQuote.text}"`;
            quoteAuthorElement.textContent = `- ${randomQuote.author}`;
        }
    }

    // Set random quote on page load
    setRandomQuote();

    // Set last updated date
    if (typeof lastUpdated !== 'undefined') {
        document.getElementById('last-updated-date').textContent = lastUpdated;
    } else {
        document.getElementById('last-updated-date').textContent = 'Unknown';
    }

    main = document.getElementById('main-content');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    const picksOnlyCheckbox = document.getElementById('show-picks-only');
    const resetButton = document.getElementById('reset-filters');
    const modal = document.getElementById('pick-info-modal');
    const modalClose = modal.querySelector('.modal-close');

    const extraModal = document.getElementById('extra-data-modal');
    const extraModalClose = extraModal.querySelector('.modal-close');

    const shareModal = document.getElementById('share-modal');
    const shareModalClose = shareModal.querySelectorAll('.modal-close');
    const showWishlistBtn = document.getElementById('show-wishlist-btn');
    const shareWishlistBtn = document.getElementById('share-wishlist-btn');
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const shareLinkInput = document.getElementById('share-link-input');

    const sharedWishlistModal = document.getElementById('shared-wishlist-modal');
    const sharedWishlistModalClose = sharedWishlistModal.querySelectorAll('.modal-close');
    const addSharedToWishlistBtn = document.getElementById('add-shared-to-wishlist-btn');
    const viewSharedProductsBtn = document.getElementById('view-shared-products-btn');
    const sharedWishlistContent = document.getElementById('shared-wishlist-content');

    // Mobile filter controls
    const mobileFilterBtn = document.getElementById('mobile-filter-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarClose = document.getElementById('sidebar-close');

    // Initialize wishlist
    loadWishlist();

    // Mobile filter handlers
    if (mobileFilterBtn) {
        mobileFilterBtn.addEventListener('click', function() {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    function closeSidebar() {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Modal handlers
    modalClose.addEventListener('click', function() {
        modal.classList.remove('show');
    });

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });

    // Extra modal handlers
    extraModalClose.addEventListener('click', function() {
        extraModal.classList.remove('show');
    });

    extraModal.addEventListener('click', function(e) {
        if (e.target === extraModal) {
            extraModal.classList.remove('show');
        }
    });

    // Share modal handlers
    shareModalClose.forEach(btn => {
        btn.addEventListener('click', function() {
            shareModal.classList.remove('show');
        });
    });

    shareModal.addEventListener('click', function(e) {
        if (e.target === shareModal) {
            shareModal.classList.remove('show');
        }
    });

    // Shared wishlist modal handlers
    sharedWishlistModalClose.forEach(btn => {
        btn.addEventListener('click', function() {
            sharedWishlistModal.classList.remove('show');
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        });
    });

    sharedWishlistModal.addEventListener('click', function(e) {
        if (e.target === sharedWishlistModal) {
            sharedWishlistModal.classList.remove('show');
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    });

    // Wishlist button handlers
    if (showWishlistBtn) {
        showWishlistBtn.addEventListener('click', function() {
            toggleWishlistView();
        });
    }

    if (shareWishlistBtn) {
        shareWishlistBtn.addEventListener('click', function() {
            generateShareLink();
        });
    }

    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', function() {
            shareLinkInput.select();
            navigator.clipboard.writeText(shareLinkInput.value).then(() => {
                copyLinkBtn.textContent = 'Copied!';
                copyLinkBtn.classList.add('copied');
                setTimeout(() => {
                    copyLinkBtn.textContent = 'Copy';
                    copyLinkBtn.classList.remove('copied');
                }, 2000);
            });
        });
    }

    // Shared wishlist modal button handlers
    if (addSharedToWishlistBtn) {
        addSharedToWishlistBtn.addEventListener('click', function() {
            const sharedItems = sharedWishlistModal.dataset.sharedItems;
            if (sharedItems) {
                const items = JSON.parse(sharedItems);
                items.forEach(itemName => {
                    if (!wishlist.includes(itemName)) {
                        wishlist.push(itemName);
                    }
                });
                saveWishlist();
                alert('Shared items have been added to your wishlist!');
                sharedWishlistModal.classList.remove('show');
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        });
    }

    if (viewSharedProductsBtn) {
        viewSharedProductsBtn.addEventListener('click', function() {
            const sharedItems = sharedWishlistModal.dataset.sharedItems;
            if (sharedItems) {
                const items = JSON.parse(sharedItems);
                viewSharedWishlist(items);
                sharedWishlistModal.classList.remove('show');
            }
        });
    }

    // Delegate click event for pick badges
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('pick-badge')) {
            e.preventDefault();
            modal.classList.add('show');
        }
    });

    // Delegate click event for extra data buttons
    document.addEventListener('click', function(e) {
        const extraBtn = e.target.closest('.extra-data-btn');
        if (extraBtn) {
            e.preventDefault();
            const itemName = extraBtn.getAttribute('data-item-name');
            showExtraData(itemName);
        }
    });

    // Delegate click event for favorite buttons
    document.addEventListener('click', function(e) {
        const favoriteBtn = e.target.closest('.favorite-btn');
        if (favoriteBtn) {
            e.preventDefault();
            const itemName = favoriteBtn.getAttribute('data-item-name');
            toggleWishlist(itemName);
            favoriteBtn.classList.toggle('active');
        }
    });

    // Initialize all items
    console.log('Initializing all items...');
    console.log('gearData keys:', Object.keys(gearData));
    for (const [categoryKey, items] of Object.entries(gearData)) {
        console.log(`Processing category ${categoryKey} with ${items.length} items`);
        items.forEach(item => {
            item.category = categoryKey;
            allItems.push(item);
        });
    }
    console.log('Total allItems:', allItems.length);

    // Populate category filter dynamically
    populateCategoryFilter();

    // Render all categories initially
    console.log('Calling renderAllCategories...');
    renderAllCategories();

    // Check for shared wishlist in URL (after allItems is populated)
    const sharedWishlist = loadWishlistFromURL();
    if (sharedWishlist) {
        // Show the shared wishlist modal
        showSharedWishlistModal(sharedWishlist);
    }
    searchInput.addEventListener('input', function() {
        currentFilters.search = this.value.toLowerCase();
        applyFilters();
    });

    categoryFilter.addEventListener('change', function() {
        currentFilters.category = this.value;
        applyFilters();
    });

    priceFilter.addEventListener('change', function() {
        currentFilters.price = this.value;
        applyFilters();
    });

    picksOnlyCheckbox.addEventListener('change', function() {
        currentFilters.picksOnly = this.checked;
        applyFilters();
    });

    resetButton.addEventListener('click', function() {
        currentFilters = {
            search: '',
            category: 'all',
            price: 'all',
            picksOnly: false
        };
        searchInput.value = '';
        categoryFilter.value = 'all';
        priceFilter.value = 'all';
        picksOnlyCheckbox.checked = false;
        renderAllCategories();
    });

    function renderAllCategories() {
        console.log('renderAllCategories called');
        console.log('gearData:', gearData);
        console.log('allItems length:', allItems.length);
        
        // Preserve the quote banner
        const quoteBanner = main.querySelector('.quote-banner');
        main.innerHTML = '';
        if (quoteBanner) {
            main.appendChild(quoteBanner);
        }

        // Reset wishlist button text
        const wishlistBtn = document.getElementById('show-wishlist-btn');
        if (wishlistBtn) {
            const wishlistBtnText = wishlistBtn.querySelector('span');
            if (wishlistBtnText) {
                wishlistBtnText.textContent = `View Wishlist (${wishlist.length})`;
            }
        }

        for (const [categoryName, items] of Object.entries(gearData)) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category';
            categoryDiv.id = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

            // Category name is already a display name from data.js
            categoryDiv.innerHTML = `<h2>${categoryName}</h2>`;

            const itemsDiv = document.createElement('div');
            itemsDiv.className = 'items';

            items.forEach(item => {
                const itemDiv = createItemElement(item);
                itemsDiv.appendChild(itemDiv);
            });

            categoryDiv.appendChild(itemsDiv);
            main.appendChild(categoryDiv);
        }
    }

    function applyFilters() {
        const filteredItems = allItems.filter(item => {
            // Search filter
            if (currentFilters.search && !item.name.toLowerCase().includes(currentFilters.search)) {
                return false;
            }

            // Category filter
            if (currentFilters.category !== 'all' && item.category !== currentFilters.category) {
                return false;
            }

            // Price filter
            if (currentFilters.price !== 'all') {
                const price = item.price;
                if (!price) return false;

                const [min, max] = currentFilters.price.split('-').map(p => p === '+' ? Infinity : parseInt(p));
                if (price < min || (max !== Infinity && price > max)) {
                    return false;
                }
            }

            // Picks only filter
            if (currentFilters.picksOnly && !item.pick) {
                return false;
            }

            return true;
        });

        // Group filtered items by category
        const groupedItems = {};
        filteredItems.forEach(item => {
            if (!groupedItems[item.category]) {
                groupedItems[item.category] = [];
            }
            groupedItems[item.category].push(item);
        });

        // Render filtered results
        renderFilteredCategories(groupedItems);
    }

    function renderFilteredCategories(groupedItems) {
        // Preserve the quote banner
        const quoteBanner = main.querySelector('.quote-banner');
        main.innerHTML = '';
        if (quoteBanner) {
            main.appendChild(quoteBanner);
        }

        if (Object.keys(groupedItems).length === 0) {
            const noResults = document.createElement('div');
            noResults.style.cssText = 'text-align: center; padding: 3rem; color: #bbb;';
            noResults.innerHTML = '<h2>No products match your filters</h2><p>Try adjusting your search criteria</p>';
            main.appendChild(noResults);
            return;
        }

        for (const [categoryKey, items] of Object.entries(groupedItems)) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category';
            categoryDiv.id = categoryKey;

            const categoryTitle = categoryKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            categoryDiv.innerHTML = `<h2>${categoryTitle} (${items.length})</h2>`;

            const itemsDiv = document.createElement('div');
            itemsDiv.className = 'items';

            items.forEach(item => {
                const itemDiv = createItemElement(item);
                itemsDiv.appendChild(itemDiv);
            });

            categoryDiv.appendChild(itemsDiv);
            main.appendChild(categoryDiv);
        }
    }

    function showExtraData(itemName) {
        const data = extraData[itemName];
        if (!data) return;

        const title = document.getElementById('extra-data-title');
        const content = document.getElementById('extra-data-content');

        title.textContent = `More about ${itemName}`;

        let html = '';

        if (data.images && data.images.length > 0) {
            html += '<div class="extra-images">';
            data.images.forEach(img => {
                html += `<img src="${img}" alt="Extra image" class="extra-image">`;
            });
            html += '</div>';
        }

        if (data.tiktoks && data.tiktoks.length > 0) {
            html += '<div class="extra-tiktoks">';
            html += `<a href="${data.tiktoks[0]}" target="_blank" class="tiktok-link">B_Media Video on TikTok</a>`;
            html += '</div>';
        }

        // Add other stuff
        const otherKeys = Object.keys(data).filter(key => key !== 'images' && key !== 'tiktoks');
        if (otherKeys.length > 0) {
            html += '<div class="extra-notes">';
            otherKeys.forEach(key => {
                html += `<h4>${key.charAt(0).toUpperCase() + key.slice(1)}</h4><p>${data[key]}</p>`;
            });
            html += '</div>';
        }

        content.innerHTML = html;
        extraModal.classList.add('show');
    }

    function createItemElement(item) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item';

        const pickBadge = item.pick ? '<span class="pick-badge">B_Media Pick</span>' : '';
        const priceText = item.price ? `$${item.price}` : 'Check Price';

        // Check if extra data exists
        const hasExtraData = extraData.hasOwnProperty(item.name);
        const extraButton = hasExtraData ? `<a href="#" class="extra-data-btn" data-item-name="${item.name}" title="Extra Data">i</a>` : '';

        // Check if item is in wishlist
        const inWishlist = isInWishlist(item.name);
        const favoriteClass = inWishlist ? 'active' : '';

        // Create a div with a better visual placeholder for broken images
        const placeholderStyle = 'background: linear-gradient(135deg, #1a1a24, #252535); display: flex; align-items: center; justify-content: center; font-size: 3rem; opacity: 0.3; width: 100%; height: 180px; border-radius: 12px; margin-bottom: 1rem;';
        
        itemDiv.innerHTML = `
            ${pickBadge}
            <img src="${item.image}" 
                 alt="${item.name}" 
                 class="item-image" 
                 onerror="this.classList.add('broken'); this.alt='🎵';">
            <div class="item-header">
                <h3>${item.name}</h3>
            </div>
            <p>${priceText}</p>
            <div class="item-buttons">
                <a href="${item.url}" target="_blank">View Product</a>
                <button class="favorite-btn ${favoriteClass}" data-item-name="${item.name}" title="Add to Wishlist">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
                ${extraButton}
            </div>
        `;

        return itemDiv;
    }

    function toggleWishlistView() {
        const currentView = main.querySelector('.wishlist-banner');
        const wishlistBtn = document.getElementById('show-wishlist-btn');
        const wishlistBtnText = wishlistBtn.querySelector('span');
        
        if (currentView) {
            // Currently showing wishlist, go back to all products
            renderAllCategories();
            wishlistBtnText.textContent = `View Wishlist (${wishlist.length})`;
        } else {
            // Show wishlist view
            showWishlistView();
            wishlistBtnText.textContent = 'Back to All Products';
        }
    }

    function showWishlistView() {
        if (wishlist.length === 0) {
            alert('Your wishlist is empty! Click the heart icon on products to add them to your wishlist.');
            return;
        }

        const wishlistItems = allItems.filter(item => isInWishlist(item.name));
        const groupedItems = {};
        wishlistItems.forEach(item => {
            if (!groupedItems[item.category]) {
                groupedItems[item.category] = [];
            }
            groupedItems[item.category].push(item);
        });

        const quoteBanner = main.querySelector('.quote-banner');
        main.innerHTML = '';
        if (quoteBanner) {
            main.appendChild(quoteBanner);
        }

        const wishlistBanner = document.createElement('div');
        wishlistBanner.className = 'wishlist-banner';
        wishlistBanner.innerHTML = `
            <h2>❤️ Your Wishlist (${wishlist.length} items)</h2>
            <p>Here are all your saved favorite products</p>
            <div class="wishlist-actions">
                <button id="clear-wishlist-btn">Clear Wishlist</button>
                <button id="exit-wishlist-btn">Back to All Products</button>
            </div>
        `;
        main.appendChild(wishlistBanner);

        document.getElementById('clear-wishlist-btn').addEventListener('click', function() {
            if (confirm('Are you sure you want to clear your entire wishlist?')) {
                wishlist = [];
                saveWishlist();
                renderAllCategories();
            }
        });

        document.getElementById('exit-wishlist-btn').addEventListener('click', function() {
            renderAllCategories();
        });

        for (const [categoryKey, items] of Object.entries(groupedItems)) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category';
            categoryDiv.id = categoryKey;

            const categoryTitle = categoryKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            categoryDiv.innerHTML = `<h2>${categoryTitle} (${items.length})</h2>`;

            const itemsDiv = document.createElement('div');
            itemsDiv.className = 'items';

            items.forEach(item => {
                const itemDiv = createItemElement(item);
                itemsDiv.appendChild(itemDiv);
            });

            categoryDiv.appendChild(itemsDiv);
            main.appendChild(categoryDiv);
        }
    }

    function generateShareLink() {
        if (wishlist.length === 0) {
            alert('Your wishlist is empty! Add some items first.');
            return;
        }

        const encoded = btoa(JSON.stringify(wishlist));
        const shareUrl = `${window.location.origin}${window.location.pathname}?wishlist=${encoded}`;
        
        shareLinkInput.value = shareUrl;
        shareModal.classList.add('show');
    }

    function showSharedWishlistModal(sharedItems) {
        const sharedItemsData = allItems.filter(item => sharedItems.includes(item.name));
        
        sharedWishlistContent.innerHTML = '';
        sharedItemsData.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'shared-item';
            itemDiv.innerHTML = `
                <img src="${item.image}" alt="${item.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMzAiIGZpbGw9IiMxZTFhMjIiLz4KPHBhdGggZD0iTTMwIDIwQzI2LjUgMjAgMjQgMjIuNSAyNCAyNkMyNCAyOS41IDI2LjUgMzIgMzAgMzJDMTMuNSAzMiAxMCAyOS41IDEwIDI2QzEwIDIyLjUgMTMuNSAyMCAzMCAyMFoiIGZpbGw9IiM4ODg4OTkiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4ODg4OTkiIHN0cm9rZS13aWR0aD0iMiI+CjxwYXRoIGQ9Ik0xMiAxMk0xMiAxMkwxMiAxMloiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4KPC9zdmc+Cg=='">
                <div class="shared-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.price ? `$${item.price}` : 'Price not available'}</p>
                </div>
            `;
            sharedWishlistContent.appendChild(itemDiv);
        });
        
        // Store the shared items for the buttons
        sharedWishlistModal.dataset.sharedItems = JSON.stringify(sharedItems);
        sharedWishlistModal.classList.add('show');
    }

    function viewSharedWishlist(sharedItems) {
        const sharedItemsData = allItems.filter(item => sharedItems.includes(item.name));
        
        const groupedItems = {};
        sharedItemsData.forEach(item => {
            if (!groupedItems[item.category]) {
                groupedItems[item.category] = [];
            }
            groupedItems[item.category].push(item);
        });

        const quoteBanner = main.querySelector('.quote-banner');
        main.innerHTML = '';
        if (quoteBanner) {
            main.appendChild(quoteBanner);
        }

        const wishlistBanner = document.createElement('div');
        wishlistBanner.className = 'wishlist-banner';
        wishlistBanner.innerHTML = `
            <h2>Shared Wishlist (${sharedItems.length} items)</h2>
            <p>Viewing someone else's wishlist</p>
            <div class="wishlist-actions">
                <button id="add-all-shared-btn">Add All to My Wishlist</button>
                <button id="exit-shared-btn">Back to All Products</button>
            </div>
        `;
        main.appendChild(wishlistBanner);

        document.getElementById('exit-shared-btn').addEventListener('click', function() {
            renderAllCategories();
        });

        document.getElementById('add-all-shared-btn').addEventListener('click', function() {
            // Add all shared items to wishlist
            sharedItems.forEach(itemName => {
                if (!isInWishlist(itemName)) {
                    toggleWishlist(itemName);
                }
            });
            alert(`Added ${sharedItems.length} items to your wishlist!`);
            updateWishlistCount();
        });

        for (const [categoryKey, items] of Object.entries(groupedItems)) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category';
            categoryDiv.id = categoryKey;

            const categoryTitle = categoryKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            categoryDiv.innerHTML = `<h2>${categoryTitle} (${items.length})</h2>`;

            const itemsDiv = document.createElement('div');
            itemsDiv.className = 'items';

            items.forEach(item => {
                const itemDiv = createItemElement(item);
                itemsDiv.appendChild(itemDiv);
            });

            categoryDiv.appendChild(itemsDiv);
            main.appendChild(categoryDiv);
        }
    }
});