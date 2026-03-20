/*
  Main Application Logic
  
  STRUCTURE:
  ─────────
  This file contains the main application logic that works for both desktop and mobile.
  Device-specific code is marked with comments:
  - [DESKTOP ONLY]: Code that only runs on desktop/PC (768px+)
  - [MOBILE ONLY]: Code that only runs on mobile (max 768px)
  - [SHARED]: Code that runs on all devices
  
  STYLING:
  CSS is organized into:
  - css/style-common.css: Base styles and shared components
  - css/style-desktop.css: Desktop/PC specific layouts [DESKTOP ONLY]
  - css/style-mobile.css: Mobile/tablet overrides [@media queries]
*/


// [SHARED] Global app state
let allItems = [];
let currentFilters = {
    search: '',
    category: 'all',
    price: 'all',
    picksOnly: false
};
let main; // Main content element
let currentViewMode = 'category';
let activeCategoryPage = null;

// [SHARED] Image loading observer
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
            }
        });
    }, {
        rootMargin: '100px' // Load 100px before entering viewport for smoother scrolling
    });
}

// [SHARED] Wishlist Management
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
        const wishlistBtnText = wishlistBtn.querySelector('span');
        if (wishlistBtnText) {
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
    const fragment = document.createDocumentFragment();
    for (const categoryName of Object.keys(gearData)) {
        const option = document.createElement('option');
        option.value = categoryName;
        option.textContent = categoryName;
        fragment.appendChild(option);
    }
    categoryFilter.appendChild(fragment);
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
        {
            text: "Will you add garlic to it?",
            author: "Punnyumi, A Luxury High Tech Washing Machine"
        },
        {
            text: "I have never gooned for a cable before",
            author: "Axel Bostrom"
        }
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

    // [MOBILE ONLY] Mobile filter controls
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarClose = document.getElementById('sidebar-close');
    const bottomBar = document.getElementById('bottom-bar');
    const bottomBarHead = document.getElementById('bottom-bar-head');
    const bottomBarPanel = document.getElementById('bottom-bar-panel');
    const bottomBarText = document.getElementById('bottom-bar-text');
    const wishlistBtn = document.getElementById('wishlist-btn');

    // [SHARED] Modal state
    let filtersOpen = false;
    let bottomBarMode = 'filters';
    let mobileFiltersContainer = null;
    let mobileWishlistContainer = null;
    let mobileSharedWishlistItems = null;
    let bottomBarProgressSvg = null;
    let bottomBarProgressTrackPath = null;
    let bottomBarProgressFillPath = null;
    let bottomBarProgressPathLength = 0;

    // [SHARED] Viewport helpers
    function isMobileViewport() {
        return window.matchMedia('(max-width: 768px)').matches;
    }

    function isCategorySelectionScreen() {
        return currentViewMode === 'category' && !activeCategoryPage;
    }

    function ensureBottomBarProgressLine() {
        if (!bottomBar || bottomBarProgressSvg) {
            return;
        }

        const svgNs = 'http://www.w3.org/2000/svg';
        bottomBarProgressSvg = document.createElementNS(svgNs, 'svg');
        bottomBarProgressSvg.classList.add('bottom-bar-progress-svg');
        bottomBarProgressSvg.setAttribute('aria-hidden', 'true');
        bottomBarProgressSvg.setAttribute('focusable', 'false');

        bottomBarProgressTrackPath = document.createElementNS(svgNs, 'path');
        bottomBarProgressTrackPath.classList.add('bottom-bar-progress-track');

        bottomBarProgressFillPath = document.createElementNS(svgNs, 'path');
        bottomBarProgressFillPath.classList.add('bottom-bar-progress-fill');

        bottomBarProgressSvg.appendChild(bottomBarProgressTrackPath);
        bottomBarProgressSvg.appendChild(bottomBarProgressFillPath);
        bottomBar.prepend(bottomBarProgressSvg);
    }

    function shouldShowBottomBarProgressLine() {
        return isMobileViewport() && !filtersOpen && !isCategorySelectionScreen();
    }

    function updateBottomBarProgressVisibility() {
        if (!bottomBarProgressSvg) {
            return;
        }

        bottomBarProgressSvg.style.display = shouldShowBottomBarProgressLine() ? 'block' : 'none';
    }

    function updateBottomBarProgressPath() {
        if (!bottomBar || !isMobileViewport()) {
            return;
        }

        ensureBottomBarProgressLine();
        updateBottomBarProgressVisibility();

        if (!shouldShowBottomBarProgressLine()) {
            return;
        }

        if (!bottomBarProgressSvg || !bottomBarProgressTrackPath || !bottomBarProgressFillPath) {
            return;
        }

        const rect = bottomBar.getBoundingClientRect();
        const height = rect.height;
        if (!height) {
            return;
        }

        const styles = window.getComputedStyle(bottomBar);
        const borderTopLeftRadius = parseFloat(styles.borderTopLeftRadius) || 0;
        const borderBottomLeftRadius = parseFloat(styles.borderBottomLeftRadius) || 0;

        const strokeWidth = 3;
        const inset = strokeWidth / 2;
        const topRadius = Math.max(0, Math.min((height / 2) - inset, borderTopLeftRadius - inset));
        const bottomRadius = Math.max(0, Math.min((height / 2) - inset, borderBottomLeftRadius - inset));

        const svgWidth = Math.max(40, Math.ceil(Math.max(topRadius, bottomRadius) + inset + 10));

        bottomBarProgressSvg.setAttribute('viewBox', `0 0 ${svgWidth} ${height}`);
        bottomBarProgressSvg.setAttribute('width', `${svgWidth}`);
        bottomBarProgressSvg.setAttribute('height', `${height}`);

        const startX = inset + topRadius;
        const startY = inset;
        const leftX = inset;
        const verticalEndY = height - inset - bottomRadius;
        const endY = height - inset;
        const endX = inset + bottomRadius;

        let pathData = `M ${startX} ${startY}`;
        if (topRadius > 0) {
            pathData += ` A ${topRadius} ${topRadius} 0 0 0 ${leftX} ${inset + topRadius}`;
        } else {
            pathData += ` L ${leftX} ${inset}`;
        }

        pathData += ` L ${leftX} ${verticalEndY}`;

        if (bottomRadius > 0) {
            pathData += ` A ${bottomRadius} ${bottomRadius} 0 0 0 ${endX} ${endY}`;
        }

        bottomBarProgressTrackPath.setAttribute('d', pathData);
        bottomBarProgressFillPath.setAttribute('d', pathData);

        bottomBarProgressPathLength = bottomBarProgressFillPath.getTotalLength();
        bottomBarProgressFillPath.style.strokeDasharray = `0 ${bottomBarProgressPathLength}`;
    }

    function updateBottomBarScrollProgress() {
        if (!bottomBar || !isMobileViewport()) {
            return;
        }

        ensureBottomBarProgressLine();
        updateBottomBarProgressVisibility();

        if (!shouldShowBottomBarProgressLine()) {
            return;
        }

        updateBottomBarProgressPath();

        const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progressPercent = maxScroll > 0 ? Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100)) : 0;

        if (!bottomBarProgressFillPath || !bottomBarProgressPathLength) {
            return;
        }

        const drawnLength = (bottomBarProgressPathLength * progressPercent) / 100;
        bottomBarProgressFillPath.style.strokeDasharray = `${drawnLength} ${bottomBarProgressPathLength}`;
    }

    function setBottomBarActionText(nextText) {
        if (!bottomBarText) {
            return;
        }

        const changed = bottomBarText.textContent !== nextText;
        bottomBarText.textContent = nextText;

        if (!changed || !bottomBarHead) {
            return;
        }

        bottomBarHead.classList.remove('action-change-flash');
        void bottomBarHead.offsetWidth;
        bottomBarHead.classList.add('action-change-flash');
    }

    // [MOBILE ONLY] Bottom bar content composition
    function setupMobileBottomBarContent() {
        if (!isMobileViewport() || !sidebar || !bottomBarPanel || bottomBarPanel.dataset.initialized === 'true') {
            return;
        }

        if (!mobileFiltersContainer) {
            mobileFiltersContainer = document.createElement('div');
            mobileFiltersContainer.className = 'mobile-bottom-filters';
            bottomBarPanel.appendChild(mobileFiltersContainer);
        }

        if (!mobileWishlistContainer) {
            mobileWishlistContainer = document.createElement('div');
            mobileWishlistContainer.className = 'mobile-bottom-wishlist wishlist-modal-content';
            bottomBarPanel.appendChild(mobileWishlistContainer);
        }

        const sidebarContent = sidebar.querySelectorAll('.sidebar-section, .sidebar-footer');
        sidebarContent.forEach((node) => {
            if (node.classList.contains('sidebar-section') && (node.querySelector('#show-wishlist-btn') || node.querySelector('#share-wishlist-btn'))) {
                return;
            }
            mobileFiltersContainer.appendChild(node);
        });

        bottomBarPanel.dataset.initialized = 'true';
    }

    // [MOBILE ONLY] Mobile wishlist rendering/actions
    function renderMobileWishlistContent() {
        if (!mobileWishlistContainer) {
            return;
        }

        const isSharedWishlistMode = bottomBarMode === 'wishlist-shared' && Array.isArray(mobileSharedWishlistItems);
        const itemsForDisplay = isSharedWishlistMode ? mobileSharedWishlistItems : wishlist;

        if (bottomBarText && (bottomBarMode === 'wishlist' || bottomBarMode === 'wishlist-shared') && filtersOpen) {
            if (isSharedWishlistMode) {
                setBottomBarActionText('Someone shared their wishlist!');
            } else {
                setBottomBarActionText(`Tap to close wishlist - ${itemsForDisplay.length} item(s)`);
            }
        }

        const children = [];

        if (itemsForDisplay.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'mobile-wishlist-empty';
            empty.textContent = isSharedWishlistMode
                ? 'This shared wishlist is empty.'
                : 'Your wishlist is empty. Tap hearts on products to add items.';
            children.push(empty);
        } else {
            const wishlistItems = allItems.filter(item => itemsForDisplay.includes(item.name));
            const groupedItems = {};
            wishlistItems.forEach(item => {
                if (!groupedItems[item.category]) {
                    groupedItems[item.category] = [];
                }
                groupedItems[item.category].push(item);
            });

            for (const [categoryKey, items] of Object.entries(groupedItems)) {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'mobile-wishlist-category';

                const categoryTitle = document.createElement('h4');
                categoryTitle.textContent = categoryKey;
                categoryDiv.appendChild(categoryTitle);

                const itemsDiv = document.createElement('div');
                itemsDiv.className = 'mobile-wishlist-items';

                items.forEach(item => {
                    itemsDiv.appendChild(createItemElement(item, isSharedWishlistMode, { hideShareButton: true }));
                });

                categoryDiv.appendChild(itemsDiv);
                children.push(categoryDiv);
            }
        }

        const actions = document.createElement('div');
        actions.className = 'mobile-wishlist-actions';
        actions.innerHTML = isSharedWishlistMode
            ? `
                <div class="wishlist-actions-primary">
                    <button id="mobile-import-shared-wishlist-btn" class="action-btn primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7,10 12,15 17,10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Import
                    </button>
                    <button id="mobile-copy-markdown-btn" class="action-btn secondary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                        </svg>
                        Markdown
                    </button>
                </div>
            `
            : `
                <div class="wishlist-actions-primary">
                    <button id="mobile-share-wishlist-btn" class="action-btn primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                        Share Wishlist
                    </button>
                    <button id="mobile-copy-markdown-btn" class="action-btn secondary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                        </svg>
                        Markdown
                    </button>
                </div>
                <div class="wishlist-actions-secondary">
                    <button id="mobile-clear-wishlist-btn" class="action-btn danger mobile-clear-icon-btn" aria-label="Clear wishlist" title="Clear wishlist">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            `;
        children.push(actions);

        mobileWishlistContainer.replaceChildren(...children);

        const mobileShareBtn = mobileWishlistContainer.querySelector('#mobile-share-wishlist-btn');
        if (mobileShareBtn) {
            mobileShareBtn.addEventListener('click', function() {
                generateShareLink();
            });
        }

        const mobileCopyBtn = mobileWishlistContainer.querySelector('#mobile-copy-markdown-btn');
        if (mobileCopyBtn) {
            mobileCopyBtn.addEventListener('click', function() {
                copyMarkdownToClipboard(this, isSharedWishlistMode ? itemsForDisplay : null);
            });
        }

        const importSharedBtn = mobileWishlistContainer.querySelector('#mobile-import-shared-wishlist-btn');
        if (importSharedBtn) {
            importSharedBtn.addEventListener('click', function() {
                itemsForDisplay.forEach(itemName => {
                    if (!wishlist.includes(itemName)) {
                        wishlist.push(itemName);
                    }
                });
                saveWishlist();
                setMobileBottomBarMode('wishlist');
                renderMobileWishlistContent();
            });
        }

        const mobileClearBtn = mobileWishlistContainer.querySelector('#mobile-clear-wishlist-btn');
        if (mobileClearBtn) {
            mobileClearBtn.addEventListener('click', function() {
                if (!confirm('Are you sure you want to clear your entire wishlist?')) {
                    return;
                }

                wishlist = [];
                saveWishlist();
                renderMobileWishlistContent();

                if (hasActiveFilters()) {
                    applyFilters();
                } else {
                    renderAllCategories();
                }
            });
        }
    }

    // [MOBILE ONLY] Mobile bottom bar mode switching
    function setMobileBottomBarMode(mode) {
        if (!isMobileViewport()) {
            return;
        }

        setupMobileBottomBarContent();
        bottomBarMode = mode;

        if (mode === 'wishlist' || mode === 'wishlist-shared') {
            renderMobileWishlistContent();
            if (mobileFiltersContainer) {
                mobileFiltersContainer.style.display = 'none';
            }
            if (mobileWishlistContainer) {
                mobileWishlistContainer.style.display = 'block';
            }
            if (bottomBar) {
                bottomBar.classList.add('wishlist-mode');
            }
        } else {
            mobileSharedWishlistItems = null;
            if (mobileFiltersContainer) {
                mobileFiltersContainer.style.display = 'block';
            }
            if (mobileWishlistContainer) {
                mobileWishlistContainer.style.display = 'none';
            }
            if (bottomBar) {
                bottomBar.classList.remove('wishlist-mode');
            }
        }

        updateFilterVisibility();
    }

    // [SHARED] Toggle filters modal
    function toggleFiltersModal(mode = 'filters') {
        if (filtersOpen) {
            closeFiltersModal();
        } else {
            openFiltersModal(mode);
        }
    }

    function openFiltersModal(mode = 'filters') {
        filtersOpen = true;

        if (isMobileViewport()) {
            setMobileBottomBarMode(mode);
            bottomBar.classList.add('active');
        } else {
            sidebar.classList.add('active');
        }
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        updateBottomBarScrollProgress();
    }

    function closeFiltersModal() {
        filtersOpen = false;

        if (bottomBar) {
            bottomBar.classList.remove('active');
        }
        if (isMobileViewport()) {
            setMobileBottomBarMode('filters');
        } else if (bottomBarText) {
            setBottomBarActionText('Tap to open filters');
        }
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
        updateFilterVisibility();
        updateBottomBarScrollProgress();
    }

    // Initialize filters
    loadWishlist();

    // [MOBILE ONLY] Bottom bar click opens filters
    if (bottomBarHead) {
        bottomBarHead.addEventListener('click', (e) => {
            if (e.target.closest('.bottom-bar-wishlist')) {
                return;
            }

            if (isMobileViewport() && currentViewMode === 'category' && activeCategoryPage) {
                if (filtersOpen) {
                    closeFiltersModal();
                }

                activeCategoryPage = null;
                updateFilterVisibility();

                if (hasActiveFilters()) {
                    applyFilters();
                } else {
                    renderAllCategories();
                }
                return;
            }

            if (isMobileViewport() && currentViewMode === 'category' && bottomBarMode === 'filters' && !isCategorySelectionScreen()) {
                return;
            }

            toggleFiltersModal(bottomBarMode);
        });
    }

    // [SHARED] Wishlist button click (mobile bottom bar / desktop modal)
    if (wishlistBtn) {
        wishlistBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isMobileViewport()) {
                if (filtersOpen && bottomBarMode === 'wishlist') {
                    closeFiltersModal();
                } else if (filtersOpen) {
                    setMobileBottomBarMode('wishlist');
                } else {
                    openFiltersModal('wishlist');
                }
            } else {
                // [DESKTOP ONLY] Use wishlist modal on desktop
                showWishlistModal();
            }
        });
    }

    // Sidebar close button
    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeFiltersModal);
    }

    // Overlay click closes modal
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeFiltersModal);
    }

    setupMobileBottomBarContent();
    ensureBottomBarProgressLine();
    updateBottomBarProgressPath();
    updateBottomBarScrollProgress();
    window.addEventListener('scroll', updateBottomBarScrollProgress, { passive: true });
    window.addEventListener('resize', () => {
        updateBottomBarProgressPath();
        updateBottomBarScrollProgress();
    });

    if (bottomBar) {
        bottomBar.addEventListener('transitionend', (event) => {
            if (event.target !== bottomBar) {
                return;
            }
            updateBottomBarProgressPath();
            updateBottomBarScrollProgress();
        });
    }

    // Placeholder function for filter visibility management
    function updateFilterVisibility() {
        if (!bottomBarText) {
            return;
        }

        updateBottomBarProgressVisibility();

        if (bottomBarMode === 'wishlist-shared' && filtersOpen) {
            setBottomBarActionText('Someone shared their wishlist!');
            return;
        }

        if (bottomBarMode === 'wishlist' && filtersOpen) {
            setBottomBarActionText(`Tap to close wishlist - ${wishlist.length} item(s)`);
            return;
        }

        if (currentViewMode === 'category' && !!activeCategoryPage) {
            setBottomBarActionText('Tap to go back to categories');
            return;
        }

        if (filtersOpen) {
            setBottomBarActionText('Tap to close filters');
            return;
        }

        setBottomBarActionText('Tap to open filters');
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
    
    // [DESKTOP ONLY] Setup wishlist modal container
    const wishlistModal = document.getElementById('wishlist-modal');
    // Note: URL cleaning is handled in the modal close buttons for shared wishlists

    // Wishlist button handlers
    if (showWishlistBtn) {
        showWishlistBtn.addEventListener('click', function() {
            if (isMobileViewport()) {
                openFiltersModal('wishlist');
            } else {
                showWishlistModal();
            }
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
        if (isMobileViewport()) {
            mobileSharedWishlistItems = sharedWishlist;
            openFiltersModal('wishlist-shared');
        } else {
            showWishlistModal(sharedWishlist, true);
        }
    }

    // Delegate click event for pick badges
    document.addEventListener('click', function(e) {
        const viewToggleBtn = e.target.closest('[id^="view-mode-toggle"]');
        if (viewToggleBtn) {
            e.preventDefault();
            currentViewMode = currentViewMode === 'category' ? 'classic' : 'category';
            if (currentViewMode === 'classic') {
                activeCategoryPage = null;
            }
            updateFilterVisibility();
            if (hasActiveFilters()) {
                applyFilters();
            } else {
                renderAllCategories();
            }
            return;
        }

        const categoryToggleBtn = e.target.closest('.category-toggle-btn');
        if (categoryToggleBtn) {
            e.preventDefault();
            const categoryName = categoryToggleBtn.getAttribute('data-category');
            if (!categoryName) {
                return;
            }

            activeCategoryPage = categoryName;
            updateFilterVisibility();

            if (hasActiveFilters()) {
                applyFilters();
            } else {
                renderAllCategories();
            }
            return;
        }

        const categoryBackBtn = e.target.closest('.category-page-back');
        if (categoryBackBtn) {
            e.preventDefault();
            activeCategoryPage = null;
            updateFilterVisibility();

            if (hasActiveFilters()) {
                applyFilters();
            } else {
                renderAllCategories();
            }
            return;
        }

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

            if (isMobileViewport() && filtersOpen && bottomBarMode === 'wishlist') {
                renderMobileWishlistContent();
            }
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
        updateFilterVisibility();
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
        activeCategoryPage = null;
        searchInput.value = '';
        categoryFilter.value = 'all';
        priceFilter.value = 'all';
        picksOnlyCheckbox.checked = false;
        updateFilterVisibility();
        renderAllCategories();
    });

    function renderAllCategories() {
        if (currentViewMode === 'category') {
            renderCategoryOnlyCategories(gearData);
            return;
        }

        // Preserve the quote banner
        const quoteBanner = main.querySelector('.quote-banner');
        const children = [];
        if (quoteBanner) {
            children.push(quoteBanner.cloneNode(true));
        }
        children.push(createViewModeToggleElement());

        resetWishlistButtonText();

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
        updateBottomBarScrollProgress();
        
    }

    function createEmptyState(message, description = '', compact = false) {
        const emptyState = document.createElement('div');
        emptyState.className = compact ? 'empty-state compact' : 'empty-state';
        emptyState.innerHTML = `<h2>${message}</h2>${description ? `<p>${description}</p>` : ''}`;
        return emptyState;
    }

    function applyFilters() {
        let minPrice = -Infinity;
        let maxPrice = Infinity;
        if (currentFilters.price !== 'all') {
            const [minRaw, maxRaw] = currentFilters.price.split('-');
            minPrice = Number.parseInt(minRaw, 10);
            maxPrice = maxRaw ? Number.parseInt(maxRaw, 10) : Infinity;
            if (!Number.isFinite(minPrice)) {
                minPrice = -Infinity;
            }
            if (!Number.isFinite(maxPrice)) {
                maxPrice = Infinity;
            }
        }

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

                if (price < minPrice || price > maxPrice) {
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
        if (currentViewMode === 'category') {
            renderCategoryOnlyCategories(groupedItems);
            return;
        }

        renderFilteredCategories(groupedItems);
    }

    function renderFilteredCategories(groupedItems) {
        // Preserve the quote banner
        const quoteBanner = main.querySelector('.quote-banner');
        const children = [];
        if (quoteBanner) {
            children.push(quoteBanner.cloneNode(true));
        }
        children.push(createViewModeToggleElement());
        resetWishlistButtonText();

        if (Object.keys(groupedItems).length === 0) {
            const noResults = createEmptyState('No products match your filters', 'Try adjusting your search criteria');
            children.push(noResults);
            main.replaceChildren(...children);
            updateBottomBarScrollProgress();
            
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
        updateBottomBarScrollProgress();
        
    }

    function hasActiveFilters() {
        return (
            currentFilters.search ||
            currentFilters.category !== 'all' ||
            currentFilters.price !== 'all' ||
            currentFilters.picksOnly
        );
    }

    function resetWishlistButtonText() {
        const wishlistBtn = document.getElementById('show-wishlist-btn');
        if (wishlistBtn) {
            const wishlistBtnText = wishlistBtn.querySelector('span');
            if (wishlistBtnText) {
                wishlistBtnText.textContent = `View Wishlist (${wishlist.length})`;
            }
        }
    }

    function createViewModeToggleElement() {
        const viewBar = document.createElement('div');
        viewBar.className = 'view-mode-bar';
        const buttonText = currentViewMode === 'category'
            ? 'Switch to Classic View'
            : 'Switch to Category View';

        viewBar.innerHTML = `<button id="view-mode-toggle" class="view-mode-toggle-btn">${buttonText}</button>`;
        updateFilterVisibility();
        return viewBar;
    }

    function getCategoryIconSvg(categoryName) {
        const normalized = categoryName.toLowerCase();

        const icon = (paths) => `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                ${paths}
            </svg>
        `;

        if (normalized.includes('business')) {
            return icon('<rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><path d="M3 12h18"></path>');
        }
        if (normalized.includes('gmail') || normalized.includes('email')) {
            return icon('<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m3 7 9 6 9-6"></path>');
        }
        if (normalized.includes('iem')) {
            return icon('<path d="M7 11a3 3 0 1 1 0 6"></path><path d="M17 11a3 3 0 1 0 0 6"></path><path d="M10 13h4"></path><path d="M7 14v4"></path><path d="M17 14v4"></path>');
        }
        if (normalized.includes('headphone')) {
            return icon('<path d="M4 13a8 8 0 0 1 16 0"></path><rect x="3" y="13" width="4" height="7" rx="2"></rect><rect x="17" y="13" width="4" height="7" rx="2"></rect>');
        }
        if (normalized.includes('portable-dac') || normalized.includes('portable dac')) {
            return icon('<rect x="6" y="3" width="12" height="18" rx="2"></rect><circle cx="12" cy="16" r="1"></circle><path d="M9 7h6"></path><path d="M9 10h6"></path>');
        }
        if (normalized.includes('desktop-dac') || normalized.includes('desktop dac')) {
            return icon('<rect x="3" y="4" width="18" height="12" rx="2"></rect><path d="M8 20h8"></path><path d="M12 16v4"></path><circle cx="8" cy="10" r="1"></circle><circle cx="12" cy="10" r="1"></circle><circle cx="16" cy="10" r="1"></circle>');
        }
        if (normalized.includes('digital-audio-player') || normalized.includes('digital audio player')) {
            return icon('<rect x="5" y="2" width="14" height="20" rx="2"></rect><rect x="8" y="5" width="8" height="6" rx="1"></rect><circle cx="12" cy="16" r="2"></circle>');
        }
        if (normalized.includes('wireless-earbuds') || normalized.includes('wireless earbuds')) {
            return icon('<path d="M8 6a2 2 0 0 0-2 2v4a2 2 0 0 0 4 0V8a2 2 0 0 0-2-2z"></path><path d="M16 6a2 2 0 0 0-2 2v4a2 2 0 0 0 4 0V8a2 2 0 0 0-2-2z"></path><path d="M8 16v3"></path><path d="M16 16v3"></path>');
        }
        if (normalized.includes('wireless-headphones') || normalized.includes('wireless headphones')) {
            return icon('<path d="M4 12a8 8 0 0 1 16 0"></path><rect x="3" y="12" width="4" height="8" rx="2"></rect><rect x="17" y="12" width="4" height="8" rx="2"></rect><path d="M12 6v-2"></path><path d="M9.5 4.5 8 3"></path><path d="M14.5 4.5 16 3"></path>');
        }
        if (normalized.includes('cable') || normalized.includes('eartip') || normalized.includes('interconnect')) {
            return icon('<path d="M7 6v7a3 3 0 0 0 3 3h1"></path><path d="M17 6v7a3 3 0 0 1-3 3h-1"></path><rect x="5" y="3" width="4" height="3" rx="1"></rect><rect x="15" y="3" width="4" height="3" rx="1"></rect>');
        }
        if (normalized.includes('tech-i-use') || normalized.includes('tech i use')) {
            return icon('<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2h.2a1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9h.2a1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1v.2a1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6z"></path>');
        }
        if (normalized.includes('explore-other-linktrees') || normalized.includes('other linktrees')) {
            return icon('<path d="M12 22V12"></path><path d="M8 12h8"></path><path d="M6 7a4 4 0 1 1 8 0"></path><path d="M10 4a4 4 0 1 1 8 0"></path><path d="M4 10a4 4 0 1 1 8 0"></path>');
        }
        if (normalized.includes('about-this-account') || normalized.includes('about this account')) {
            return icon('<circle cx="12" cy="8" r="4"></circle><path d="M4 20a8 8 0 0 1 16 0"></path>');
        }

        return icon('<path d="M9 18V6l10-2v12"></path><circle cx="6" cy="18" r="3"></circle><circle cx="16" cy="16" r="3"></circle>');
    }

    function renderCategoryOnlyCategories(groupedItems) {
        const quoteBanner = main.querySelector('.quote-banner');
        const children = [];
        if (quoteBanner) {
            children.push(quoteBanner.cloneNode(true));
        }
        children.push(createViewModeToggleElement());
        resetWishlistButtonText();

        const categoryEntries = Object.entries(groupedItems);
        if (categoryEntries.length === 0) {
            const noResults = createEmptyState('No products match your filters', 'Try adjusting your search criteria');
            children.push(noResults);
            main.replaceChildren(...children);
            updateBottomBarScrollProgress();
            return;
        }

        if (activeCategoryPage) {
            renderFocusedCategoryPage(activeCategoryPage, groupedItems[activeCategoryPage], children);
            return;
        }

        if (hasActiveFilters()) {
            renderCategoryFilteredItems(groupedItems, children);
            return;
        }

        const showCounts = true;
        const optionsGrid = document.createElement('div');
        optionsGrid.className = 'category-options-grid';

        for (const [categoryName, items] of categoryEntries) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category category-collapsible';
            categoryDiv.id = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

            const countSuffix = showCounts ? ` (${items.length})` : '';
            const categoryIcon = getCategoryIconSvg(categoryName);

            categoryDiv.innerHTML = `
                <button class="category-toggle-btn" data-category="${categoryName}">
                    <span class="category-toggle-content">
                        <span class="category-toggle-svg">${categoryIcon}</span>
                        <span class="category-toggle-label">${categoryName}${countSuffix}</span>
                    </span>
                </button>
            `;

            optionsGrid.appendChild(categoryDiv);
        }

        children.push(optionsGrid);
        main.replaceChildren(...children);
        updateBottomBarScrollProgress();
    }

    function renderCategoryFilteredItems(groupedItems, children) {
        const categoryEntries = Object.entries(groupedItems);
        if (categoryEntries.length === 0) {
            const noResults = createEmptyState('No products match your filters', 'Try adjusting your search criteria');
            children.push(noResults);
            main.replaceChildren(...children);
            updateBottomBarScrollProgress();
            return;
        }

        for (const [categoryName, items] of categoryEntries) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category';
            categoryDiv.id = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            categoryDiv.innerHTML = `<h2>${categoryName} (${items.length})</h2>`;

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
        updateBottomBarScrollProgress();
    }

    function renderFocusedCategoryPage(categoryName, categoryItems, children) {
        const itemCount = categoryItems ? categoryItems.length : 0;
        updateFilterVisibility();

        if (!categoryItems || categoryItems.length === 0) {
            const empty = createEmptyState('No products match your filters in this category', 'Go back or adjust your filters.', true);
            children.push(empty);
            main.replaceChildren(...children);
            updateBottomBarScrollProgress();
            return;
        }

        // Remove the view-mode-bar since we'll include the toggle in the category header
        const filteredChildren = children.filter(child => !child.classList || !child.classList.contains('view-mode-bar'));

        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-page-header';
        categoryHeader.innerHTML = `
            <div class="category-header-left">
                <button class="category-page-back" type="button">← Back to Categories</button>
            </div>
            <div class="category-header-middle">
                <h2 class="category-page-title">
                    <span class="category-page-title-icon">${getCategoryIconSvg(categoryName)}</span>
                    ${categoryName}
                </h2>
            </div>
            <div class="category-header-right">
                <button id="view-mode-toggle-in-header" class="view-mode-toggle-btn">Switch to Classic View</button>
            </div>
        `;
        filteredChildren.push(categoryHeader);

        const itemsDiv = document.createElement('div');
        itemsDiv.className = 'items category-page-items';

        categoryItems.forEach(item => {
            const itemDiv = createItemElement(item, false);
            itemsDiv.appendChild(itemDiv);
        });

        filteredChildren.push(itemsDiv);
        main.replaceChildren(...filteredChildren);
        updateBottomBarScrollProgress();
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

    function createItemElement(item, isShared = false, options = {}) {
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
        const shareButton = (isShared || options.hideShareButton) ? '' : `
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
        const imageSection = (isShared || options.hideShareButton) ? `
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

    // [DESKTOP ONLY] Wishlist modal renderer (mobile uses bottom-bar wishlist UI)
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
            desc.className = 'shared-wishlist-note';
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