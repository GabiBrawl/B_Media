let allItems = [];
let currentFilters = {
    search: '',
    category: 'all',
    price: 'all',
    picksOnly: false
};
let main; // Main content element

// Image loading observer
let imageObserver;

// Initialize lazy image loading
function initImageObserver() {
    imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const img = entry.target;
            // Only process if visibility state actually changed
            if (entry.isIntersecting && img.dataset.src) {
                // Load image
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                // Stop observing after loading to reduce observer overhead
                imageObserver.unobserve(img);
            } else if (!entry.isIntersecting && img.src && !img.src.includes('data:image')) {
                // Unload image - only if it has a real image loaded
                img.dataset.src = img.src;
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3C/svg%3E';
            }
        });
    }, {
        rootMargin: '100px' // Load 100px before entering viewport for smoother scrolling
    });
}

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
    
    if (typeof gearData === 'undefined') {
        console.error('gearData is not defined! Check if data.js is loaded.');
        return;
    }

    // Initialize image observer for lazy loading
    initImageObserver();

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
        {
            text: "Derp Durp",
            author: "Bellumi 🥭🍒🥥🍊🍍🍎🫐🍋 🥝🍌🍇"
        },
        {
            text: "legit my fav tiktoker",
            author: "Aiden, aka A_Media"
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

    // Add drag-to-close functionality for mobile sidebar
    let touchStartY = 0;
    if (sidebar) {
        sidebar.addEventListener('touchstart', function(e) {
            touchStartY = e.touches[0].clientY;
        });

        sidebar.addEventListener('touchmove', function(e) {
            // Only allow drag-to-close if at the absolute top of the sidebar
            if (sidebar.scrollTop > 0) {
                return;
            }

            const touchCurrentY = e.touches[0].clientY;
            const diff = touchCurrentY - touchStartY;
            
            // If dragging down more than 50px from top, close the sidebar
            if (diff > 111) {
                closeSidebar();
            }
        });
    }

    function closeSidebar() {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Modal handlers
    // Consolidated modal close handler function
    function closeModal(modal, cleanUrl = false) {
        modal.classList.remove('show');
        if (cleanUrl) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    // Generic modal close handler - handles both single elements and NodeLists
    function setupModalHandler(modal, closeButtons, cleanUrl = false) {
        // Convert single element to array, keep NodeList as is
        const buttons = closeButtons.forEach ? closeButtons : [closeButtons];
        buttons.forEach(btn => {
            btn.addEventListener('click', function() {
                closeModal(modal, cleanUrl);
            });
        });
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal(modal, cleanUrl);
            }
        });
    }

    // Setup all modals
    setupModalHandler(modal, modalClose);
    setupModalHandler(extraModal, extraModalClose);
    setupModalHandler(shareModal, shareModalClose);
    
    // Setup wishlist modal
    const wishlistModal = document.getElementById('wishlist-modal');
    const wishlistModalClose = wishlistModal.querySelectorAll('.modal-close');
    // Note: URL cleaning is handled in the modal close buttons for shared wishlists

    // Wishlist button handlers
    if (showWishlistBtn) {
        showWishlistBtn.addEventListener('click', function() {
            showWishlistModal();
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

    // Initialize all items FIRST
    for (const [categoryKey, items] of Object.entries(gearData)) {
        items.forEach(item => {
            item.category = categoryKey;
            allItems.push(item);
        });
    }

    // Populate category filter dynamically
    populateCategoryFilter();

    // Render all categories initially
    renderAllCategories();

    // Check for shared wishlist in URL (AFTER allItems is populated)
    const sharedWishlist = loadWishlistFromURL();
    if (sharedWishlist) {
        // Show the shared wishlist modal
        showWishlistModal(sharedWishlist, true);
    }

    // Delegate click event for pick badges
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('pick-badge')) {
            e.preventDefault();
            modal.classList.add('show');
        }
    });

    // Preload extra data images on hover
    document.addEventListener('mouseenter', function(e) {
        if (!e.target || !e.target.closest) return;
        const extraBtn = e.target.closest('.extra-data-btn');
        if (extraBtn) {
            const itemName = extraBtn.getAttribute('data-item-name');
            preloadExtraImages(itemName);
        }
    }, true);

    // Delegate click event for extra data buttons
    document.addEventListener('click', function(e) {
        const extraBtn = e.target.closest('.extra-data-btn');
        if (extraBtn) {
            e.preventDefault();
            const itemName = extraBtn.getAttribute('data-item-name');
            showExtraData(itemName);
        }
    });

    // Delegate click event for share product buttons
    document.addEventListener('click', function(e) {
        const shareBtn = e.target.closest('.share-product-btn');
        if (shareBtn) {
            e.preventDefault();
            const itemName = shareBtn.getAttribute('data-item-name');
            shareProduct(itemName, shareBtn);
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

    // Debounce search to reduce re-renders
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        currentFilters.search = this.value.toLowerCase();
        searchTimeout = setTimeout(() => applyFilters(), 500);
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
        // Preserve the quote banner
        const quoteBanner = main.querySelector('.quote-banner');
        const children = [];
        if (quoteBanner) {
            children.push(quoteBanner.cloneNode(true));
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
                const itemDiv = createItemElement(item, false);
                itemsDiv.appendChild(itemDiv);
            });

            categoryDiv.appendChild(itemsDiv);
            children.push(categoryDiv);
        }

        main.replaceChildren(...children);
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
        const children = [];
        if (quoteBanner) {
            children.push(quoteBanner.cloneNode(true));
        }

        if (Object.keys(groupedItems).length === 0) {
            const noResults = document.createElement('div');
            noResults.style.cssText = 'text-align: center; padding: 3rem; color: #bbb;';
            noResults.innerHTML = '<h2>No products match your filters</h2><p>Try adjusting your search criteria</p>';
            children.push(noResults);
            main.replaceChildren(...children);
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
                const itemDiv = createItemElement(item, false);
                itemsDiv.appendChild(itemDiv);
            });

            categoryDiv.appendChild(itemsDiv);
            children.push(categoryDiv);
        }

        main.replaceChildren(...children);
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

    // Preload images for extra data when hovering over info button
    function preloadExtraImages(itemName) {
        const data = extraData[itemName];
        if (!data || !data.images) return;
        
        data.images.forEach(imgPath => {
            const img = new Image();
            img.src = imgPath;
        });
    }

    function createItemElement(item, isShared = false) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item';

        const pickBadge = item.pick ? '<span class="pick-badge">B_Media Pick</span>' : '';
        const priceText = item.price ? `$${item.price}` : 'Check Price';

        // Check if extra data exists
        const hasExtraData = extraData.hasOwnProperty(item.name);
        const extraButton = hasExtraData ? `<a href="#" class="extra-data-btn" data-item-name="${item.name}" title="Extra Data">i</a>` : '';

        // Check if item is in wishlist (only for personal wishlist)
        const inWishlist = !isShared && isInWishlist(item.name);
        const favoriteClass = inWishlist ? 'active' : '';
        const favoriteButton = isShared ? '' : `
            <button class="favorite-btn ${favoriteClass}" data-item-name="${item.name}" title="Add to Wishlist">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
            </button>
        `;

        // Share button for individual product (overlay on image) - only on main grid, not wishlist modal
        const shareButton = isShared ? '' : `
            <button class="share-product-btn" data-item-name="${item.name}" title="Share">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
            </button>
        `;

        // Use wrapper only for main grid (for share button overlay)
        const imageSection = isShared ? `
            <img class="item-image" 
                 alt="${item.name}"
                 data-src="${item.image}"
                 onerror="this.classList.add('broken'); this.alt='No image';">
        ` : `
            <div class="item-image-wrapper">
                <img class="item-image" 
                     alt="${item.name}"
                     data-src="${item.image}"
                     onerror="this.classList.add('broken'); this.alt='No image';">
                ${shareButton}
            </div>
        `;

        itemDiv.innerHTML = `
            ${pickBadge}
            <span class="item-price">${priceText}</span>
            ${imageSection}
            <div class="item-info">
                <div class="item-header">
                    <h3>${item.name}</h3>
                </div>
                <div class="item-buttons">
                    <a href="${item.url}" target="_blank">View Product</a>
                    ${favoriteButton}
                    ${extraButton}
                </div>
            </div>
        `;

        // Observe image for lazy loading
        if (imageObserver) {
            const img = itemDiv.querySelector('.item-image');
            imageObserver.observe(img);
        }

        return itemDiv;
    }

    // Generate markdown for a single product (concise format)
    function generateProductMarkdown(item) {
        const pick = item.pick ? ' *(B_Media Pick)*' : '';
        const price = item.price ? ` · $${item.price}` : '';
        
        return `**${item.name}**${pick}${price}\n[View Product](${item.url})`;
    }

    // Copy single product markdown to clipboard
    function shareProduct(itemName, button) {
        const item = allItems.find(i => i.name === itemName);
        if (!item) return;
        
        const markdown = generateProductMarkdown(item);
        
        navigator.clipboard.writeText(markdown).then(() => {
            // Visual feedback
            const svg = button.querySelector('svg');
            const originalHTML = button.innerHTML;
            button.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
            button.classList.add('copied');
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.classList.remove('copied');
            }, 1500);
        }).catch(() => {
            alert('Failed to copy to clipboard');
        });
    }

    // Export wishlist as markdown for Discord/sharing
    function exportWishlistAsMarkdown(itemsToShow = null) {
        const items = itemsToShow || wishlist;
        if (items.length === 0) return '';

        // Get items data and group by category
        const wishlistItems = allItems.filter(item => items.includes(item.name));
        const groupedItems = {};
        wishlistItems.forEach(item => {
            if (!groupedItems[item.category]) {
                groupedItems[item.category] = [];
            }
            groupedItems[item.category].push(item);
        });

        // Generate shareable wishlist link
        const encoded = btoa(JSON.stringify(items));
        const shareUrl = `${window.location.origin}${window.location.pathname}?wishlist=${encoded}`;
        
        // Build clean markdown
        let markdown = `# My Wishlist\n`;
        
        for (const [categoryKey, categoryItems] of Object.entries(groupedItems)) {
            const categoryTitle = categoryKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            markdown += `\n**${categoryTitle}**\n`;
            
            categoryItems.forEach(item => {
                const pick = item.pick ? ' *(Pick)*' : '';
                const price = item.price ? ` · $${item.price}` : '';
                markdown += `[${item.name}](${item.url})${pick}${price}\n`;
            });
        }

        markdown += `\n[View Wishlist →](${shareUrl})\n----\nShared from [B_Media Gear List](${window.location.origin}${window.location.pathname})`;
        
        return markdown;
    }

    // Copy markdown to clipboard with visual feedback
    function copyMarkdownToClipboard(button, itemsToShow = null) {
        const markdown = exportWishlistAsMarkdown(itemsToShow);
        if (!markdown) {
            alert('Your wishlist is empty!');
            return;
        }

        navigator.clipboard.writeText(markdown).then(() => {
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.classList.add('copied');
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('copied');
            }, 2000);
        }).catch(() => {
            alert('Failed to copy to clipboard');
        });
    }

    function showWishlistModal(sharedItems = null, isShared = false) {
        const itemsToShow = isShared ? sharedItems : wishlist;
        
        if (!isShared && itemsToShow.length === 0) {
            alert('Your wishlist is empty! Click the heart icon on products to add them to your wishlist.');
            return;
        }

        // Open the wishlist modal
        const wishlistModal = document.getElementById('wishlist-modal');
        const wishlistContent = document.getElementById('wishlist-modal-content');
        const wishlistItemCount = document.getElementById('wishlist-item-count');
        const wishlistTitle = document.getElementById('wishlist-modal-title');
        const wishlistActions = document.getElementById('wishlist-modal-actions');

        // Set title and count
        if (isShared) {
            wishlistTitle.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.5rem;">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                Shared Wishlist
            `;
            wishlistItemCount.textContent = `${itemsToShow.length} item${itemsToShow.length !== 1 ? 's' : ''}`;
        } else {
            wishlistTitle.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.5rem;">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                Your Wishlist
            `;
            wishlistItemCount.textContent = `${itemsToShow.length} item${itemsToShow.length !== 1 ? 's' : ''}`;
        }

        // Get items data
        const wishlistItems = allItems.filter(item => itemsToShow.includes(item.name));
        const groupedItems = {};
        wishlistItems.forEach(item => {
            if (!groupedItems[item.category]) {
                groupedItems[item.category] = [];
            }
            groupedItems[item.category].push(item);
        });

        // Build the modal content
        const children = [];
        if (isShared) {
            // Add description for shared wishlist
            const desc = document.createElement('p');
            desc.style.cssText = 'color: var(--medium-text); font-size: 0.9rem; margin: 0 0 1rem 0;';
            desc.textContent = 'Someone shared their wishlist with you!';
            children.push(desc);
        }

        for (const [categoryKey, items] of Object.entries(groupedItems)) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'wishlist-category';
            categoryDiv.id = `wishlist-${categoryKey}`;

            const categoryTitle = categoryKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            categoryDiv.innerHTML = `
                <div class="wishlist-category-header">
                    <h3>${categoryTitle}</h3>
                    <span class="wishlist-category-count">${items.length} item${items.length !== 1 ? 's' : ''}</span>
                </div>
            `;

            const itemsDiv = document.createElement('div');
            itemsDiv.className = 'wishlist-items-grid';

            items.forEach(item => {
                const itemDiv = createItemElement(item, true); // Always true in wishlist modal to hide share button
                itemsDiv.appendChild(itemDiv);
            });

            categoryDiv.appendChild(itemsDiv);
            children.push(categoryDiv);
        }

        wishlistContent.replaceChildren(...children);

        // Set up actions
        if (isShared) {
            wishlistActions.innerHTML = `
                <div class="wishlist-actions-primary">
                    <button id="import-shared-wishlist-btn" class="action-btn primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7,10 12,15 17,10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Import All Items
                    </button>
                    <button id="copy-markdown-btn" class="action-btn secondary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                        </svg>
                        Copy as Markdown
                    </button>
                </div>
                <div class="wishlist-actions-secondary">
                    <button id="close-shared-wishlist-btn" class="action-btn tertiary">Close</button>
                </div>
            `;
            // Copy markdown handler (for shared wishlist)
            document.getElementById('copy-markdown-btn').addEventListener('click', function() {
                copyMarkdownToClipboard(this, itemsToShow);
            });
            // Import button handler
            document.getElementById('import-shared-wishlist-btn').addEventListener('click', function() {
                itemsToShow.forEach(itemName => {
                    if (!wishlist.includes(itemName)) {
                        wishlist.push(itemName);
                    }
                });
                saveWishlist();
                updateWishlistCount();
                closeModal(wishlistModal, true);
            });
            // Close button handler
            document.getElementById('close-shared-wishlist-btn').addEventListener('click', function() {
                closeModal(wishlistModal, true);
            });
        } else {
            wishlistActions.innerHTML = `
                <div class="wishlist-actions-primary">
                    <button id="copy-markdown-btn" class="action-btn secondary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                        </svg>
                        Copy as Markdown
                    </button>
                </div>
                <div class="wishlist-actions-secondary">
                    <button id="wishlist-modal-clear" class="action-btn danger">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                        Clear Wishlist
                    </button>
                    <button id="close-wishlist-btn" class="action-btn tertiary">Close</button>
                </div>
            `;
            // Copy markdown handler
            document.getElementById('copy-markdown-btn').addEventListener('click', function() {
                copyMarkdownToClipboard(this);
            });
            // Clear wishlist handler
            document.getElementById('wishlist-modal-clear').onclick = function() {
                if (confirm('Are you sure you want to clear your entire wishlist?')) {
                    wishlist = [];
                    saveWishlist();
                    closeModal(wishlistModal);
                    // Update the wishlist button count
                    const wishlistBtn = document.getElementById('show-wishlist-btn');
                    if (wishlistBtn) {
                        const wishlistBtnText = wishlistBtn.querySelector('span');
                        if (wishlistBtnText) {
                            wishlistBtnText.textContent = `View Wishlist (${wishlist.length})`;
                        }
                    }
                }
            };
            // Close button handler
            document.getElementById('close-wishlist-btn').addEventListener('click', function() {
                closeModal(wishlistModal);
            });
        }

        // Show modal
        wishlistModal.classList.add('show');

        // Add overlay click handler for all modals
        const closeCurrentModal = () => closeModal(wishlistModal, isShared);
        
        // Overlay click
        const overlayHandler = function(e) {
            if (e.target === wishlistModal) {
                closeCurrentModal();
            }
        };
        wishlistModal.addEventListener('click', overlayHandler);

        // ESC key
        const escHandler = function(e) {
            if (e.key === 'Escape') {
                closeCurrentModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    function showWishlistView() {
        // This function is no longer used, but kept for backward compatibility
        showWishlistModal();
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
});