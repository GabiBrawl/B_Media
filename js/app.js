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
const DEFAULT_FILTERS = Object.freeze({
    search: '',
    category: 'all',
    price: 'all',
    picksOnly: false
});
let currentFilters = { ...DEFAULT_FILTERS };
let main; // Main content element
let currentViewMode = 'category';
let activeCategoryPage = null;

function hasOwnItemEntry(dataSource, itemName) {
    return !!dataSource && Object.prototype.hasOwnProperty.call(dataSource, itemName);
}

function normalizeExtraDetailsRows(detailsRows) {
    return Array.isArray(detailsRows) ? detailsRows : [];
}

function normalizeExtraDetailsTemplate(templateRows) {
    if (!Array.isArray(templateRows)) {
        return [];
    }

    return templateRows.filter(row => {
        return !!row
            && typeof row === 'object'
            && typeof row.key === 'string'
            && row.key.trim() !== ''
            && typeof row.property === 'string'
            && row.property.trim() !== '';
    });
}

function formatExtraDetailKey(key) {
    return String(key)
        .replace(/[_-]+/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, char => char.toUpperCase());
}

function getExtraDetailRows(itemName, categoryName) {
    if (typeof extraDetails === 'undefined' || !extraDetails) {
        return [];
    }

    // Backward compatibility: old flat shape by product name
    if (Array.isArray(extraDetails[itemName])) {
        return normalizeExtraDetailsRows(extraDetails[itemName]);
    }

    const byItemEntry = extraDetails.byItem?.[itemName];

    if (Array.isArray(byItemEntry)) {
        return normalizeExtraDetailsRows(byItemEntry);
    }

    if (!byItemEntry || typeof byItemEntry !== 'object') {
        return [];
    }

    const template = normalizeExtraDetailsTemplate(extraDetails.propertiesByCategory?.[categoryName]);
    const rows = [];
    const usedKeys = new Set();

    template.forEach(row => {
        const key = row.key;
        const value = byItemEntry[key];
        usedKeys.add(key);
        rows.push({ property: row.property, value });
    });

    // Any additional custom keys still render, auto-formatted.
    Object.entries(byItemEntry).forEach(([key, value]) => {
        if (usedKeys.has(key)) {
            return;
        }

        rows.push({ property: formatExtraDetailKey(key), value });
    });

    return rows;
}

function hasAnyExtraInfo(itemName, categoryName) {
    const hasLegacyExtraData = hasOwnItemEntry(extraData, itemName);
    const hasExtendedExtraDetails = getExtraDetailRows(itemName, categoryName).length > 0;
    return hasLegacyExtraData || hasExtendedExtraDetails;
}

function escapeExtraDetailHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatExtraDetailValue(value) {
    if (Array.isArray(value)) {
        return value
            .filter(entry => entry !== null && entry !== undefined && String(entry).trim() !== '')
            .map(entry => `<div class="extra-details-line">${escapeExtraDetailHtml(entry)}</div>`)
            .join('');
    }

    if (value && typeof value === 'object') {
        return Object.entries(value)
            .filter(([, nestedValue]) => nestedValue !== null && nestedValue !== undefined && String(nestedValue).trim() !== '')
            .map(([nestedKey, nestedValue]) => `<div class="extra-details-line"><strong>${escapeExtraDetailHtml(formatExtraDetailKey(nestedKey))}:</strong> ${escapeExtraDetailHtml(nestedValue)}</div>`)
            .join('');
    }

    return escapeExtraDetailHtml(value);
}

function buildExtraDetailsHtml(itemName, categoryName) {
    const detailsRows = getExtraDetailRows(itemName, categoryName);
    if (!Array.isArray(detailsRows) || detailsRows.length === 0) {
        return '';
    }

    const rows = detailsRows.filter(row => {
        if (!row || typeof row !== 'object') return false;
        if (typeof row.property !== 'string' || row.property.trim() === '') return false;
        const value = row.value;
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim() !== '';
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'object') return Object.keys(value).length > 0;
        return true;
    });

    if (rows.length === 0) {
        return '';
    }

    let html = '<div class="extra-details-table-wrap"><table class="extra-details-table"><tbody>';
    rows.forEach(row => {
        html += `<tr><th scope="row">${escapeExtraDetailHtml(row.property)}</th><td>${formatExtraDetailValue(row.value)}</td></tr>`;
    });
    html += '</tbody></table></div>';
    return html;
}

// [SHARED] Image loading observer
let imageObserver;
const MOBILE_FILTER_HINT_SEEN_KEY = 'bmedia_mobile_filter_hint_seen_v1';

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

function populateMobileCategoryChips() {
    const chipsContainer = document.getElementById('mobile-category-chips');
    if (!chipsContainer) {
        return;
    }

    const fragment = document.createDocumentFragment();
    for (const categoryName of Object.keys(gearData)) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'mobile-category-chip';
        chip.textContent = categoryName;
        chip.setAttribute('data-category', categoryName);
        chip.setAttribute('aria-pressed', 'false');
        fragment.appendChild(chip);
    }

    chipsContainer.replaceChildren(fragment);
}

function getRecommendedProductsCount() {
    let totalRecommendedProducts = 0;

    for (const items of Object.values(gearData)) {
        if (!Array.isArray(items)) {
            continue;
        }

        totalRecommendedProducts += items.length;
    }

    return totalRecommendedProducts;
}

function createRecommendedCountElement() {
    const recommendedCount = getRecommendedProductsCount();

    const banner = document.createElement('div');
    banner.className = 'recommended-count-banner';
    banner.innerHTML = `As of date, B_Media recommends <span class="recommended-count-number">${recommendedCount}</span> products!`;
    return banner;
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
        },
        {
            text: "hopes and dreams are illusions just like free will",
            author: "Aspen"
        },
        {
            text: "I'm gonna win because I'm hopes n dreams",
            author: "hopes and dramiku"
        },
        {
            text: "I am still the ultimate soda glazer",
            author: "Katumi, #1 Tanchjim Soda Fan"
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
    const mobileCategoryChipsContainer = document.getElementById('mobile-category-chips');
    const priceFilter = document.getElementById('price-filter');
    const picksOnlyCheckbox = document.getElementById('show-picks-only');
    const resetButton = document.getElementById('reset-filters');
    const resetButtonMobile = document.getElementById('reset-filters-mobile');
    const picksOnlyToggleBtn = document.getElementById('picks-only-toggle-btn');
    const mobilePriceRangeControl = document.getElementById('mobile-price-range-control');
    const mobilePriceRangeSlider = document.getElementById('mobile-price-range-slider');
    const mobilePriceRangeFill = document.getElementById('mobile-price-range-fill');
    const mobilePriceMinHandle = document.getElementById('mobile-price-min-handle');
    const mobilePriceMaxHandle = document.getElementById('mobile-price-max-handle');
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
    let mobileInfoContainer = null;
    let mobileSharedWishlistItems = null;
    let mobileInfoPayload = null;
    let bottomBarProgressSvg = null;
    let bottomBarProgressTrackPath = null;
    let bottomBarProgressFillPath = null;
    let bottomBarProgressPathLength = 0;
    let availableMinPrice = 0;
    let availableMaxPrice = 0;
    let priceDistribution = [];
    let priceBoundsLoaded = false;
    let selectedMinPrice = 0;
    let selectedMaxPrice = 0;
    let selectedMobileCategories = new Set();
    let savedFiltersState = null;
    let filtersTemporarilyCleared = false;
    let applyFiltersDebounceTimeout = null;
    let bottomBarHintElement = null;
    let bottomBarHintDelayTimeout = null;

    function cloneFilters(filters) {
        return {
            search: filters.search || '',
            category: filters.category || 'all',
            price: filters.price || 'all',
            picksOnly: !!filters.picksOnly,
            mobileCategories: Array.from(selectedMobileCategories)
        };
    }

    function syncMobileCategoryChipsState() {
        if (!mobileCategoryChipsContainer) {
            return;
        }

        const chips = mobileCategoryChipsContainer.querySelectorAll('.mobile-category-chip');
        chips.forEach((chip) => {
            const categoryName = chip.getAttribute('data-category');
            const isActive = !!categoryName && selectedMobileCategories.has(categoryName);
            chip.classList.toggle('active', isActive);
            chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    }

    function syncSavedFiltersState() {
        if (hasActiveFilters()) {
            savedFiltersState = cloneFilters(currentFilters);
        } else {
            savedFiltersState = null;
        }
    }

    function updateResetButtonsState() {
        if (resetButton) {
            resetButton.classList.toggle('has-active-filters', hasActiveFilters());
        }

        if (resetButtonMobile) {
            resetButtonMobile.classList.toggle('has-active-filters', hasActiveFilters());
        }
    }

    function setFiltersState(nextFilters, shouldRender = false) {
        currentFilters = cloneFilters(nextFilters);
        selectedMobileCategories = new Set(nextFilters.mobileCategories || []);

        searchInput.value = currentFilters.search;
        categoryFilter.value = currentFilters.category;
        priceFilter.value = currentFilters.price;
        picksOnlyCheckbox.checked = currentFilters.picksOnly;
        syncPicksOnlyToggle();
        syncMobileCategoryChipsState();

        const { min, max } = parsePriceBounds(currentFilters.price);
        if (Number.isFinite(min) && Number.isFinite(max)) {
            setPriceFilterBounds(min, max, false);
        }

        if (shouldRender) {
            if (hasActiveFilters()) {
                applyFilters();
            } else {
                renderAllCategories();
            }
        }
    }

    function formatPriceLabel(value) {
        return `$${Math.round(value)}`;
    }

    function initializePriceBounds() {
        if (priceBoundsLoaded) {
            return true;
        }

        const allPrices = allItems
            .map(item => item.price)
            .filter(price => Number.isFinite(price) && price > 0);

        if (allPrices.length === 0) {
            return false;
        }

        priceDistribution = allPrices.slice().sort((a, b) => a - b);

        availableMinPrice = Math.floor(Math.min(...allPrices));
        availableMaxPrice = Math.ceil(Math.max(...allPrices));
        priceBoundsLoaded = true;
        return true;
    }

    function parsePriceBounds(priceValue) {
        if (!priceBoundsLoaded && !initializePriceBounds()) {
            return { min: 0, max: 0 };
        }

        if (!priceValue || priceValue === 'all') {
            return {
                min: availableMinPrice,
                max: availableMaxPrice
            };
        }

        const [minRaw, maxRaw] = priceValue.split('-');
        let min = Number.parseInt(minRaw, 10);
        let max = maxRaw ? Number.parseInt(maxRaw, 10) : availableMaxPrice;

        if (!Number.isFinite(min)) {
            min = availableMinPrice;
        }
        if (!Number.isFinite(max)) {
            max = availableMaxPrice;
        }

        min = Math.max(availableMinPrice, Math.min(min, availableMaxPrice));
        max = Math.max(availableMinPrice, Math.min(max, availableMaxPrice));
        if (min > max) {
            [min, max] = [max, min];
        }

        return { min, max };
    }

    function setPriceFilterBounds(min, max, shouldApply = true) {
        if (!priceBoundsLoaded && !initializePriceBounds()) {
            currentFilters.price = 'all';
            return;
        }

        if (!Number.isFinite(min) || !Number.isFinite(max)) {
            return;
        }

        let normalizedMin = Math.max(availableMinPrice, Math.min(min, availableMaxPrice));
        let normalizedMax = Math.max(availableMinPrice, Math.min(max, availableMaxPrice));
        if (normalizedMin > normalizedMax) {
            [normalizedMin, normalizedMax] = [normalizedMax, normalizedMin];
        }

        const isAllRange = normalizedMin <= availableMinPrice && normalizedMax >= availableMaxPrice;
        currentFilters.price = isAllRange ? 'all' : `${normalizedMin}-${normalizedMax}`;
        selectedMinPrice = normalizedMin;
        selectedMaxPrice = normalizedMax;

        updateMobilePriceSliderUI();

        if (currentFilters.price === 'all') {
            priceFilter.value = 'all';
        }

        if (shouldApply) {
            queueApplyFilters();
        }
    }

    function queueApplyFilters(delay = 180) {
        if (applyFiltersDebounceTimeout) {
            clearTimeout(applyFiltersDebounceTimeout);
        }

        applyFiltersDebounceTimeout = setTimeout(() => {
            applyFiltersDebounceTimeout = null;
            applyFilters();
        }, delay);
    }

    function cancelQueuedApplyFilters() {
        if (!applyFiltersDebounceTimeout) {
            return;
        }

        clearTimeout(applyFiltersDebounceTimeout);
        applyFiltersDebounceTimeout = null;
    }

    function priceToPercent(value) {
        if (!priceDistribution.length) {
            return 0;
        }

        if (priceDistribution.length === 1) {
            return 0;
        }

        const lastIndex = priceDistribution.length - 1;
        if (value <= priceDistribution[0]) {
            return 0;
        }

        if (value >= priceDistribution[lastIndex]) {
            return 100;
        }

        let low = 0;
        let high = priceDistribution.length;
        while (low < high) {
            const mid = Math.floor((low + high) / 2);
            if (priceDistribution[mid] <= value) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }

        const upperIndex = Math.min(lastIndex, Math.max(1, low));
        const lowerIndex = upperIndex - 1;
        const lowerValue = priceDistribution[lowerIndex];
        const upperValue = priceDistribution[upperIndex];

        if (upperValue <= lowerValue) {
            return (upperIndex / lastIndex) * 100;
        }

        const segmentRatio = (value - lowerValue) / (upperValue - lowerValue);
        const distributionRatio = (lowerIndex + segmentRatio) / lastIndex;
        return Math.max(0, Math.min(100, distributionRatio * 100));
    }

    function percentileToPrice(percentileRatio) {
        if (!priceDistribution.length) {
            return 0;
        }

        if (priceDistribution.length === 1) {
            return priceDistribution[0];
        }

        const clampedRatio = Math.min(1, Math.max(0, percentileRatio));
        const lastIndex = priceDistribution.length - 1;
        const exactIndex = clampedRatio * lastIndex;
        const lowerIndex = Math.floor(exactIndex);
        const upperIndex = Math.ceil(exactIndex);

        if (lowerIndex === upperIndex) {
            return priceDistribution[lowerIndex];
        }

        const lowerValue = priceDistribution[lowerIndex];
        const upperValue = priceDistribution[upperIndex];
        const interpolation = exactIndex - lowerIndex;
        return Math.round(lowerValue + ((upperValue - lowerValue) * interpolation));
    }

    function pointerToPrice(clientX) {
        if (!mobilePriceRangeSlider) {
            return availableMinPrice;
        }

        const rect = mobilePriceRangeSlider.getBoundingClientRect();
        const ratio = rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
        const clampedRatio = Math.min(1, Math.max(0, ratio));
        return percentileToPrice(clampedRatio);
    }

    function updateMobilePriceSliderUI() {
        if (!mobilePriceRangeSlider || !mobilePriceMinHandle || !mobilePriceMaxHandle || !mobilePriceRangeFill) {
            return;
        }

        mobilePriceMinHandle.textContent = formatPriceLabel(selectedMinPrice);
        mobilePriceMaxHandle.textContent = formatPriceLabel(selectedMaxPrice);

        const minPercent = priceToPercent(selectedMinPrice);
        const maxPercent = priceToPercent(selectedMaxPrice);
        const minRatio = Math.min(1, Math.max(0, minPercent / 100));
        const maxRatio = Math.min(1, Math.max(0, maxPercent / 100));

        mobilePriceMinHandle.style.setProperty('--position', `${minRatio}`);
        mobilePriceMaxHandle.style.setProperty('--position', `${maxRatio}`);
        mobilePriceRangeFill.style.left = `calc((100% - var(--price-handle-width)) * ${minRatio} + (var(--price-handle-width) / 2))`;
        mobilePriceRangeFill.style.width = `calc((100% - var(--price-handle-width)) * ${Math.max(0, maxRatio - minRatio)})`;
    }

    function refreshMobilePriceSliderUI() {
        updateMobilePriceSliderUI();
    }

    function updatePriceFromPointer(clientX, handleType) {
        const nextValue = pointerToPrice(clientX);

        if (handleType === 'min') {
            setPriceFilterBounds(Math.min(nextValue, selectedMaxPrice), selectedMaxPrice);
        } else {
            setPriceFilterBounds(selectedMinPrice, Math.max(nextValue, selectedMinPrice));
        }
    }

    function bindPriceHandleDrag(handleElement, handleType) {
        if (!handleElement) {
            return;
        }

        handleElement.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            const activePointerId = event.pointerId;

            try {
                handleElement.setPointerCapture(activePointerId);
            } catch (error) {
                // Ignore pointer capture failures and fall back to normal events
            }

            const onPointerMove = (moveEvent) => {
                if (moveEvent.pointerId !== activePointerId) {
                    return;
                }
                moveEvent.preventDefault();
                updatePriceFromPointer(moveEvent.clientX, handleType);
            };

            const onPointerUp = (upEvent) => {
                if (upEvent.pointerId !== activePointerId) {
                    return;
                }

                handleElement.removeEventListener('pointermove', onPointerMove);
                handleElement.removeEventListener('pointerup', onPointerUp);
                handleElement.removeEventListener('pointercancel', onPointerUp);

                try {
                    handleElement.releasePointerCapture(activePointerId);
                } catch (error) {
                    // Ignore pointer release failures
                }
            };

            handleElement.addEventListener('pointermove', onPointerMove);
            handleElement.addEventListener('pointerup', onPointerUp);
            handleElement.addEventListener('pointercancel', onPointerUp);
            updatePriceFromPointer(event.clientX, handleType);
        });

        handleElement.addEventListener('keydown', (event) => {
            const step = event.shiftKey ? 10 : 1;
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
                return;
            }

            event.preventDefault();
            const delta = event.key === 'ArrowLeft' ? -step : step;
            if (handleType === 'min') {
                setPriceFilterBounds(selectedMinPrice + delta, selectedMaxPrice);
            } else {
                setPriceFilterBounds(selectedMinPrice, selectedMaxPrice + delta);
            }
        });
    }

    function syncPicksOnlyToggle() {
        if (!picksOnlyToggleBtn) {
            return;
        }

        picksOnlyToggleBtn.classList.toggle('active', picksOnlyCheckbox.checked);
        picksOnlyToggleBtn.setAttribute('aria-pressed', picksOnlyCheckbox.checked ? 'true' : 'false');
    }

    function resetAllFilters() {
        cancelQueuedApplyFilters();
        setFiltersState(DEFAULT_FILTERS, false);
        activeCategoryPage = null;
        savedFiltersState = null;
        filtersTemporarilyCleared = false;

        updateResetButtonsState();
        updateFilterVisibility();
        renderAllCategories();
    }

    function initMobilePriceRangeFromData() {
        if (!mobilePriceRangeControl || !mobilePriceRangeSlider || !mobilePriceMinHandle || !mobilePriceMaxHandle) {
            return;
        }

        if (!initializePriceBounds()) {
            mobilePriceRangeControl.style.display = 'none';
            currentFilters.price = 'all';
            return;
        }

        setPriceFilterBounds(availableMinPrice, availableMaxPrice, false);

        bindPriceHandleDrag(mobilePriceMinHandle, 'min');
        bindPriceHandleDrag(mobilePriceMaxHandle, 'max');

        mobilePriceRangeSlider.addEventListener('pointerdown', (event) => {
            if (event.target === mobilePriceMinHandle || event.target === mobilePriceMaxHandle) {
                return;
            }

            const clickedPrice = pointerToPrice(event.clientX);
            const distanceToMin = Math.abs(clickedPrice - selectedMinPrice);
            const distanceToMax = Math.abs(clickedPrice - selectedMaxPrice);
            const targetHandle = distanceToMin <= distanceToMax ? 'min' : 'max';
            updatePriceFromPointer(event.clientX, targetHandle);
        });
    }

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

    function hasSeenMobileFilterHint() {
        try {
            return localStorage.getItem(MOBILE_FILTER_HINT_SEEN_KEY) === '1';
        } catch (error) {
            return false;
        }
    }

    function markMobileFilterHintSeen() {
        try {
            localStorage.setItem(MOBILE_FILTER_HINT_SEEN_KEY, '1');
        } catch (error) {
            // Ignore localStorage write failures
        }
    }

    function clearBottomBarHintTimers() {
        if (bottomBarHintDelayTimeout) {
            clearTimeout(bottomBarHintDelayTimeout);
            bottomBarHintDelayTimeout = null;
        }
    }

    function removeBottomBarHint(markAsSeen = false) {
        clearBottomBarHintTimers();

        if (markAsSeen) {
            markMobileFilterHintSeen();
        }

        if (!bottomBarHintElement) {
            return;
        }

        const hintToRemove = bottomBarHintElement;
        bottomBarHintElement = null;
        hintToRemove.classList.remove('show');

        setTimeout(() => {
            hintToRemove.remove();
        }, 180);
    }

    function showBottomBarHint() {
        if (!isMobileViewport() || !bottomBar || hasSeenMobileFilterHint() || bottomBarHintElement) {
            return;
        }

        const hint = document.createElement('button');
        hint.type = 'button';
        hint.className = 'bottom-bar-hint';
        hint.setAttribute('aria-label', 'Open filters');
        hint.innerHTML = '<span>Filters are here</span><span class="bottom-bar-hint-arrow" aria-hidden="true">↓</span>';

        hint.addEventListener('click', () => {
            removeBottomBarHint(true);
            openFiltersModal('filters');
        });

        document.body.appendChild(hint);
        bottomBarHintElement = hint;

        requestAnimationFrame(() => {
            if (bottomBarHintElement === hint) {
                hint.classList.add('show');
            }
        });
    }

    function scheduleBottomBarHint() {
        if (!isMobileViewport() || hasSeenMobileFilterHint() || bottomBarHintElement || bottomBarHintDelayTimeout) {
            return;
        }

        bottomBarHintDelayTimeout = setTimeout(() => {
            bottomBarHintDelayTimeout = null;

            if (!shouldShowBottomBarAttentionCue() || hasSeenMobileFilterHint()) {
                return;
            }

            showBottomBarHint();
        }, 850);
    }

    function shouldShowBottomBarAttentionCue() {
        if (!isMobileViewport() || filtersOpen || bottomBarMode !== 'filters') {
            return false;
        }

        if (currentViewMode === 'category' && !!activeCategoryPage) {
            return false;
        }

        if (currentViewMode === 'category' && !isCategorySelectionScreen()) {
            return false;
        }

        if (!filtersTemporarilyCleared && hasActiveFilters()) {
            return false;
        }

        return true;
    }

    function updateBottomBarAttentionState() {
        if (!bottomBar) {
            return;
        }

        const shouldShowAttentionCue = shouldShowBottomBarAttentionCue();
        bottomBar.classList.toggle('needs-attention', shouldShowAttentionCue);

        if (shouldShowAttentionCue) {
            scheduleBottomBarHint();
        } else {
            removeBottomBarHint();
        }
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

        if (!mobileInfoContainer) {
            mobileInfoContainer = document.createElement('div');
            mobileInfoContainer.className = 'mobile-bottom-info';
            bottomBarPanel.appendChild(mobileInfoContainer);
        }

        const sidebarContent = sidebar.querySelectorAll('.sidebar-section, .sidebar-footer');
        sidebarContent.forEach((node) => {
            if (node.classList.contains('sidebar-section') && (node.querySelector('#show-wishlist-btn') || node.querySelector('#share-wishlist-btn'))) {
                return;
            }
            mobileFiltersContainer.appendChild(node);
        });

        ensureMobileViewModeToggleElement();

        bottomBarPanel.dataset.initialized = 'true';
    }

    function renderMobileInfoContent() {
        if (!mobileInfoContainer || !mobileInfoPayload) {
            return;
        }

        if (bottomBarText && filtersOpen && bottomBarMode === 'info') {
            setBottomBarActionText('Tap to close info');
        }

        const panel = document.createElement('div');
        panel.className = 'mobile-info-panel';

        const title = document.createElement('h3');
        title.className = 'mobile-info-title';
        if (mobileInfoPayload.titleHtml) {
            title.innerHTML = mobileInfoPayload.titleHtml;
        } else {
            title.textContent = mobileInfoPayload.title;
        }

        const content = document.createElement('div');
        content.className = 'mobile-info-content';
        content.innerHTML = mobileInfoPayload.bodyHtml;

        panel.appendChild(title);
        panel.appendChild(content);
        mobileInfoContainer.replaceChildren(panel);
    }

    function openMobileInfoPanel(title, bodyHtml, titleHtml = '') {
        if (!isMobileViewport()) {
            return false;
        }

        setupMobileBottomBarContent();
        mobileInfoPayload = { title, bodyHtml, titleHtml };

        if (filtersOpen) {
            setMobileBottomBarMode('info');
        } else {
            openFiltersModal('info');
        }

        return true;
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
            if (mobileInfoContainer) {
                mobileInfoContainer.style.display = 'none';
            }
            if (bottomBar) {
                bottomBar.classList.add('wishlist-mode');
            }
        } else if (mode === 'info') {
            renderMobileInfoContent();
            if (mobileFiltersContainer) {
                mobileFiltersContainer.style.display = 'none';
            }
            if (mobileWishlistContainer) {
                mobileWishlistContainer.style.display = 'none';
            }
            if (mobileInfoContainer) {
                mobileInfoContainer.style.display = 'block';
            }
            if (bottomBar) {
                bottomBar.classList.remove('wishlist-mode');
            }
        } else {
            mobileSharedWishlistItems = null;
            if (mobileFiltersContainer) {
                mobileFiltersContainer.style.display = 'block';
            }
            if (mobileWishlistContainer) {
                mobileWishlistContainer.style.display = 'none';
            }
            if (mobileInfoContainer) {
                mobileInfoContainer.style.display = 'none';
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
            removeBottomBarHint(mode === 'filters');
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

        if (isMobileViewport() && bottomBarMode === 'filters') {
            filtersTemporarilyCleared = false;
            syncSavedFiltersState();
        }

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

            if (isMobileViewport() && currentViewMode === 'category' && activeCategoryPage && !filtersOpen) {
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

            if (isMobileViewport() && bottomBarMode === 'filters' && !filtersOpen) {
                if (filtersTemporarilyCleared && savedFiltersState) {
                    cancelQueuedApplyFilters();
                    setFiltersState(savedFiltersState, true);
                    filtersTemporarilyCleared = false;
                    openFiltersModal('filters');
                    return;
                }

                if (!filtersTemporarilyCleared && hasActiveFilters()) {
                    cancelQueuedApplyFilters();
                    savedFiltersState = cloneFilters(currentFilters);
                    setFiltersState(DEFAULT_FILTERS, true);
                    filtersTemporarilyCleared = true;
                    updateFilterVisibility();
                    return;
                }
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
    updateBottomBarAttentionState();
    window.addEventListener('scroll', updateBottomBarScrollProgress, { passive: true });
    window.addEventListener('resize', () => {
        updateBottomBarProgressPath();
        updateBottomBarScrollProgress();
        updateBottomBarAttentionState();
        refreshMobilePriceSliderUI();
    });

    if (bottomBar) {
        bottomBar.addEventListener('transitionend', (event) => {
            if (event.target !== bottomBar) {
                return;
            }
            updateBottomBarProgressPath();
            updateBottomBarScrollProgress();
            refreshMobilePriceSliderUI();
        });
    }

    // Placeholder function for filter visibility management
    function updateFilterVisibility() {
        updateResetButtonsState();
        ensureMobileViewModeToggleElement();

        if (!bottomBarText) {
            return;
        }

        updateBottomBarProgressVisibility();
        updateBottomBarAttentionState();

        if (bottomBarMode === 'wishlist-shared' && filtersOpen) {
            setBottomBarActionText('Someone shared their wishlist!');
            return;
        }

        if (bottomBarMode === 'wishlist' && filtersOpen) {
            setBottomBarActionText(`Tap to close wishlist - ${wishlist.length} item(s)`);
            return;
        }

        if (bottomBarMode === 'info' && filtersOpen) {
            setBottomBarActionText('Tap to close');
            return;
        }

        if (currentViewMode === 'category' && !!activeCategoryPage) {
            setBottomBarActionText('Tap to go back to categories');
            return;
        }

        if (isMobileViewport() && !filtersOpen && bottomBarMode === 'filters') {
            if (filtersTemporarilyCleared && savedFiltersState) {
                setBottomBarActionText('Tap to open filters and restore');
                return;
            }

            if (hasActiveFilters()) {
                setBottomBarActionText('Tap to clear filters');
                return;
            }
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

    initializePriceBounds();

    initMobilePriceRangeFromData();
    syncPicksOnlyToggle();

    // Populate category filter dynamically
    populateCategoryFilter();
    populateMobileCategoryChips();
    syncMobileCategoryChipsState();

    if (mobileCategoryChipsContainer) {
        mobileCategoryChipsContainer.addEventListener('click', function(event) {
            const chip = event.target.closest('.mobile-category-chip');
            if (!chip) {
                return;
            }

            const categoryName = chip.getAttribute('data-category');
            if (!categoryName) {
                return;
            }

            if (selectedMobileCategories.has(categoryName)) {
                selectedMobileCategories.delete(categoryName);
            } else {
                selectedMobileCategories.add(categoryName);
            }

            filtersTemporarilyCleared = false;
            syncSavedFiltersState();
            syncMobileCategoryChipsState();
            updateFilterVisibility();
            queueApplyFilters();
        });
    }

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
        const socialRedirectBtn = e.target.closest('.mobile-social-redirect-btn');
        if (socialRedirectBtn) {
            e.preventDefault();
            const href = socialRedirectBtn.getAttribute('data-href');
            if (!href) {
                return;
            }

            if (href.startsWith('mailto:')) {
                window.location.href = href;
                return;
            }

            window.open(href, '_blank', 'noopener,noreferrer');
            return;
        }

        const socialLink = e.target.closest('.social-links a');
        if (socialLink && isMobileViewport()) {
            e.preventDefault();

            const href = socialLink.getAttribute('href');
            if (!href) {
                return;
            }

            const platformName = socialLink.getAttribute('aria-label') || socialLink.getAttribute('title') || 'Social Link';
            const customInfo = socialLink.getAttribute('data-social-info');
            const isEmailLink = href.startsWith('mailto:');
            const popupTitle = isEmailLink ? 'Business Inquiries' : `Official B_Media ${platformName}`;
            const fallbackInfo = isEmailLink
                ? 'Business Inquiries: this will open your default email app so you can contact B_Media directly.'
                : `You are about to open the official B_Media ${platformName} page.`;

            const actionLabel = isEmailLink ? 'Open Email App' : `Open Official ${platformName}`;
            const detailsHtml = `
                <div class="mobile-social-info">
                    <div class="mobile-info-card">
                        <h4>${escapeHtml(popupTitle)}</h4>
                        <p>${escapeHtml(customInfo || fallbackInfo)}</p>
                    </div>
                    <div class="mobile-social-actions">
                        <button type="button" class="action-btn primary mobile-social-redirect-btn" data-href="${escapeHtml(href)}">
                            ${escapeHtml(actionLabel)}
                        </button>
                    </div>
                </div>
            `;

            openMobileInfoPanel(popupTitle, detailsHtml);
            return;
        }

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
            const aboutPicksHtml = `
                <div class="mobile-picks-info">
                    <p class="mobile-picks-lead">These are products that <strong>Axel</strong> would personally choose based on his experience and preferences.</p>
                    <div class="mobile-info-card">
                        <h4>Important</h4>
                        <p>Audio is subjective. A B_Media pick does not mean a product is objectively better for everyone.</p>
                    </div>
                    <div class="mobile-info-card">
                        <h4>Before you decide</h4>
                        <ul class="mobile-info-list">
                            <li>Match the product to your preferred sound signature</li>
                            <li>Consider your real-world use case</li>
                            <li>Set a budget that makes sense for you</li>
                        </ul>
                    </div>
                </div>
            `;

            const aboutPicksTitleHtml = 'About <span class="pick-badge pick-badge-inline">B_Media Pick</span>';
            if (!openMobileInfoPanel('About B_Media Pick', aboutPicksHtml, aboutPicksTitleHtml)) {
                modal.classList.add('show');
            }
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
            const itemCategory = extraBtn.getAttribute('data-item-category');
            showExtraData(itemName, itemCategory);
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
        filtersTemporarilyCleared = false;
        syncSavedFiltersState();
        searchTimeout = setTimeout(() => queueApplyFilters(200), 250);
    });

    categoryFilter.addEventListener('change', function() {
        currentFilters.category = this.value;
        if (!isMobileViewport()) {
            selectedMobileCategories.clear();
            syncMobileCategoryChipsState();
        }
        filtersTemporarilyCleared = false;
        syncSavedFiltersState();
        updateFilterVisibility();
        queueApplyFilters();
    });

    priceFilter.addEventListener('change', function() {
        currentFilters.price = this.value;
        const { min, max } = parsePriceBounds(this.value);
        if (Number.isFinite(min) && Number.isFinite(max)) {
            setPriceFilterBounds(min, max, false);
        }
        filtersTemporarilyCleared = false;
        syncSavedFiltersState();
        queueApplyFilters();
    });

    picksOnlyCheckbox.addEventListener('change', function() {
        currentFilters.picksOnly = this.checked;
        filtersTemporarilyCleared = false;
        syncSavedFiltersState();
        syncPicksOnlyToggle();
        queueApplyFilters();
    });

    if (picksOnlyToggleBtn) {
        picksOnlyToggleBtn.addEventListener('click', function() {
            picksOnlyCheckbox.checked = !picksOnlyCheckbox.checked;
            picksOnlyCheckbox.dispatchEvent(new Event('change'));
        });
    }

    if (resetButton) {
        resetButton.addEventListener('click', resetAllFilters);
    }

    if (resetButtonMobile) {
        resetButtonMobile.addEventListener('click', resetAllFilters);
    }

    function renderAllCategories() {
        updateResetButtonsState();

        if (currentViewMode === 'category') {
            renderCategoryOnlyCategories(gearData);
            return;
        }

        // Preserve the quote banner
        const quoteBanner = main.querySelector('.quote-banner');
        const children = [];
        const viewModeToggle = createViewModeToggleElement();
        if (quoteBanner) {
            children.push(quoteBanner.cloneNode(true));
        }
        if (!isMobileViewport()) {
            children.push(viewModeToggle);
        }

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

        if (isMobileViewport()) {
            children.push(viewModeToggle);
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
        updateResetButtonsState();

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
            if (isMobileViewport()) {
                if (selectedMobileCategories.size > 0 && !selectedMobileCategories.has(item.category)) {
                    return false;
                }
            } else {
                if (currentFilters.category !== 'all' && item.category !== currentFilters.category) {
                    return false;
                }
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
        const viewModeToggle = createViewModeToggleElement();
        if (quoteBanner) {
            children.push(quoteBanner.cloneNode(true));
        }
        if (!isMobileViewport()) {
            children.push(viewModeToggle);
        }
        resetWishlistButtonText();

        if (Object.keys(groupedItems).length === 0) {
            const noResults = createEmptyState('No products match your filters', 'Try adjusting your search criteria');
            children.push(noResults);
            if (isMobileViewport()) {
                children.push(viewModeToggle);
            }
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

        if (isMobileViewport()) {
            children.push(viewModeToggle);
        }

        main.replaceChildren(...children);
        updateBottomBarScrollProgress();
        
    }

    function hasActiveFilters() {
        return (
            currentFilters.search ||
            (isMobileViewport() ? selectedMobileCategories.size > 0 : currentFilters.category !== 'all') ||
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
        const buttonText = getViewModeToggleButtonText();

        viewBar.innerHTML = `<button id="view-mode-toggle" class="view-mode-toggle-btn">${buttonText}</button>`;
        updateFilterVisibility();
        return viewBar;
    }

    function getViewModeToggleButtonText() {
        return currentViewMode === 'category'
            ? 'Switch to Classic View'
            : 'Switch to Category View';
    }

    function ensureMobileViewModeToggleElement() {
        if (!isMobileViewport() || !mobileFiltersContainer) {
            return;
        }

        let mobileToggleItem = mobileFiltersContainer.querySelector('.mobile-view-mode-toggle-item');
        if (!mobileToggleItem) {
            const categoryFilterItem = mobileFiltersContainer.querySelector('.category-filter-item');
            const filterControls = categoryFilterItem ? categoryFilterItem.closest('.filter-controls') : null;
            if (!categoryFilterItem || !filterControls) {
                return;
            }

            mobileToggleItem = document.createElement('div');
            mobileToggleItem.className = 'filter-item mobile-view-mode-toggle-item';
            mobileToggleItem.innerHTML = `<button id="view-mode-toggle-mobile" class="view-mode-toggle-btn">${getViewModeToggleButtonText()}</button>`;

            const categoryChips = categoryFilterItem.querySelector('#mobile-category-chips');
            if (categoryChips) {
                categoryChips.insertAdjacentElement('afterend', mobileToggleItem);
            } else {
                categoryFilterItem.insertAdjacentElement('afterend', mobileToggleItem);
            }
        }

        const mobileToggleButton = mobileToggleItem.querySelector('#view-mode-toggle-mobile');
        if (mobileToggleButton) {
            mobileToggleButton.textContent = getViewModeToggleButtonText();
        }
    }

    function createMobileSocialLinksElement() {
        if (!isMobileViewport()) {
            return null;
        }

        const sidebarSocialLinks = document.querySelector('.sidebar-section.social-section .social-links');
        if (!sidebarSocialLinks) {
            return null;
        }

        const pageSocialSection = document.createElement('div');
        pageSocialSection.className = 'page-social-section';
        pageSocialSection.appendChild(sidebarSocialLinks.cloneNode(true));
        return pageSocialSection;
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
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
            return '<svg viewBox="0 0 310 147" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path fill="white" d="M50 0c5 0 9 4 9 9v16.5a45 45 0 0 1 18.3 10l.7.5a39 39 0 0 1 57.8 51.7 35 35 0 0 1-24.4 59.3H35a35 35 0 0 1-35-35V56.3Q0 54 .3 52H0V9a9 9 0 0 1 8.5-9H50m250.5 0h.5a9 9 0 0 1 8.5 9v43h-.3q.3 2 .3 4.3V112a35 35 0 0 1-35 35h-76.4a35 35 0 0 1-24.4-59.3A39 39 0 0 1 231.5 36l.7-.6a45 45 0 0 1 18.3-9.9V9c0-5 4-9 9-9zM32.3 39C22.7 39 15 46.7 15 56.3V112c0 11 9 20 20 20h75.6A20 20 0 0 0 124 97L67.3 46.7a30 30 0 0 0-20-7.6zM262 39a30 30 0 0 0-20 7.6l-56.5 50.5a20 20 0 0 0 13.3 34.9h75.6c11 0 20-9 20-20V56.3c0-9.6-7.7-17.3-17.2-17.3zm-158 2q-7.9.2-14 4.5l35 31.2q3-5.3 3-11.7a24 24 0 0 0-24-24m101.3 0a24 24 0 0 0-21 35.7l35-31.2q-6.1-4.3-14-4.5M12 31.2A32 32 0 0 1 32.3 24H47V12H12zM262.1 24h-.9zm-208 .6-.4-.1zm201.7-.1h-.4zm3.6-.4h-.2zM48.2 24l-.8-.1zm229-.1c7.7 0 14.8 2.7 20.3 7.2V12h-35v12zM260 24"/></svg>';
        }
        if (normalized.includes('iem-v2-legacy')) {
            return '<svg viewBox="0 0 310 147" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d="M50 0C54.9706 0 59 4.02944 59 9V25.5342C65.735 27.3387 72.0127 30.6965 77.2979 35.4072L77.9893 36.0234C84.9014 29.7928 94.0542 26 104.093 26C125.632 26 143.093 43.4609 143.093 65C143.093 73.4634 140.396 81.296 135.815 87.6875C156.903 109.262 142.143 146.398 111.38 146.993L110.63 147H35C15.67 147 0 131.33 0 112V56.25C0 54.8092 0.0961986 53.3908 0.279297 52H0V9C1.24831e-07 4.18468 3.78166 0.252643 8.53711 0.0117188L9 0H50ZM300.5 0L300.963 0.0117188C305.718 0.252643 309.5 4.18468 309.5 9V52H309.221C309.404 53.3908 309.5 54.8092 309.5 56.25V112C309.5 131.33 293.83 147 274.5 147H198.87L198.12 146.993C167.358 146.398 152.596 109.262 173.684 87.6875C169.103 81.2961 166.407 73.4632 166.407 65C166.407 43.4609 183.868 26 205.407 26C215.446 26 224.597 29.7938 231.509 36.0244L232.202 35.4072C237.487 30.6965 243.765 27.3387 250.5 25.5342V9C250.5 4.02944 254.529 0 259.5 0H300.5ZM32.25 39C22.7231 39 15 46.7231 15 56.25V112C15 123.046 23.9543 132 35 132H110.63C129.007 132 137.655 109.297 123.937 97.0693L67.3174 46.6045C61.8221 41.7065 54.7177 39 47.3564 39H32.25ZM262.144 39C254.782 39 247.678 41.7065 242.183 46.6045L185.563 97.0693C171.845 109.297 180.493 132 198.87 132H274.5C285.546 132 294.5 123.046 294.5 112V56.25C294.5 46.7231 286.777 39 277.25 39H262.144ZM104.093 41C98.8627 41 94.0142 42.6707 90.0625 45.5215L125.049 76.7051C126.99 73.2385 128.093 69.2475 128.093 65C128.093 51.7452 117.348 41 104.093 41ZM205.407 41C192.152 41 181.407 51.7452 181.407 65C181.407 69.2475 182.51 73.2385 184.451 76.7051L219.437 45.5215C215.485 42.6707 210.637 41 205.407 41ZM303.274 37.2031C303.254 37.1759 303.235 37.1483 303.215 37.1211C303.235 37.1483 303.254 37.1759 303.274 37.2031ZM302.824 36.6035C302.801 36.5735 302.778 36.5436 302.755 36.5137C302.778 36.5436 302.801 36.5735 302.824 36.6035ZM12 31.1514C11.9937 31.1564 11.9877 31.1619 11.9814 31.167C17.52 26.6859 24.5708 24 32.25 24H47V12H12V31.1514ZM262.144 24C261.834 24 261.524 24.0034 261.215 24.0098L262.144 24ZM54.876 24.6348C54.7839 24.6191 54.6918 24.6039 54.5996 24.5889C54.6918 24.6039 54.7839 24.6192 54.876 24.6348ZM254.899 24.5889C254.807 24.6039 254.715 24.6191 254.623 24.6348C254.715 24.6192 254.807 24.6039 254.899 24.5889ZM54.0928 24.5088C53.9741 24.4908 53.8552 24.4741 53.7363 24.457C53.8552 24.4741 53.9741 24.4908 54.0928 24.5088ZM255.763 24.457C255.644 24.4741 255.525 24.4908 255.406 24.5088C255.525 24.4908 255.644 24.4741 255.763 24.457ZM53.1172 24.3721C52.8977 24.3437 52.6781 24.3162 52.458 24.291C52.6781 24.3161 52.8977 24.3437 53.1172 24.3721ZM257.041 24.291C256.821 24.3162 256.602 24.3437 256.383 24.3721C256.602 24.3438 256.821 24.3161 257.041 24.291ZM52.0869 24.251C51.9357 24.2349 51.7843 24.2196 51.6328 24.2051C51.7843 24.2195 51.9357 24.235 52.0869 24.251ZM257.866 24.2051C257.715 24.2196 257.563 24.2349 257.412 24.251C257.563 24.235 257.715 24.2195 257.866 24.2051ZM258.848 24.1221C258.669 24.1352 258.49 24.1488 258.312 24.1641C258.49 24.1488 258.669 24.1352 258.848 24.1221ZM51.1875 24.1641C51.009 24.1488 50.8302 24.1352 50.6514 24.1221C50.8302 24.1352 51.009 24.1488 51.1875 24.1641ZM259.351 24.0869C259.293 24.0905 259.235 24.0938 259.178 24.0977C259.235 24.0939 259.293 24.0905 259.351 24.0869ZM260.951 24.0166C260.721 24.0227 260.492 24.0304 260.263 24.04C260.492 24.0305 260.721 24.0227 260.951 24.0166ZM49.2363 24.04C49.007 24.0304 48.7776 24.0227 48.5479 24.0166C48.7776 24.0227 49.007 24.0305 49.2363 24.04ZM48.2842 24.0098C47.9753 24.0034 47.666 24 47.3564 24L48.2842 24.0098ZM277.25 24C284.929 24 291.98 26.6859 297.519 31.167C297.512 31.1619 297.506 31.1564 297.5 31.1514V12H262.5V24H277.25ZM260.041 24.0488C259.811 24.0596 259.58 24.0726 259.351 24.0869C259.58 24.0726 259.811 24.0596 260.041 24.0488Z" fill="none" stroke-width="6"/></svg>';
        }
        if (normalized.includes('iem-legacy')) {
            return '<svg viewBox="0 0 320 147" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d="M50 0C54.9706 0 59 4.02944 59 9V25.5342C65.735 27.3387 72.0127 30.6965 77.2979 35.4072L77.9561 35.9941C85.0533 28.6017 95.0356 24 106.093 24C127.632 24 145.093 41.4609 145.093 63C145.093 72.4892 141.702 81.1852 136.068 87.9463C156.786 109.557 142.019 146.4 111.38 146.993L110.63 147H35C15.67 147 0 131.33 0 112V56.25C0 54.8092 0.0961986 53.3908 0.279297 52H0V9C1.24831e-07 4.18468 3.78166 0.252643 8.53711 0.0117188L9 0H50ZM310.5 0L310.963 0.0117188C315.718 0.252643 319.5 4.18468 319.5 9V52H319.221C319.404 53.3908 319.5 54.8092 319.5 56.25V112C319.5 131.33 303.83 147 284.5 147H208.87L208.12 146.993C177.481 146.4 162.714 109.557 183.431 87.9463C177.797 81.1853 174.407 72.489 174.407 63C174.407 41.4609 191.868 24 213.407 24C224.464 24 234.446 28.602 241.543 35.9941L242.202 35.4072C247.487 30.6965 253.765 27.3387 260.5 25.5342V9C260.5 4.02944 264.529 0 269.5 0H310.5ZM32.25 37C21.6185 37 13 45.6185 13 56.25V112C13 124.15 22.8497 134 35 134H110.63C130.844 134 140.358 109.027 125.268 95.5771L68.6484 45.1113C62.7868 39.8868 55.2085 37 47.3564 37H32.25ZM272.144 37C264.291 37 256.713 39.8868 250.852 45.1113L194.232 95.5771C179.142 109.027 188.656 134 208.87 134H284.5C296.65 134 306.5 124.15 306.5 112V56.25C306.5 45.6185 297.881 37 287.25 37H272.144ZM106.093 37C99.5404 37 93.5454 39.4237 88.9639 43.4385L127.486 77.7744C130.395 73.5735 132.093 68.4846 132.093 63C132.093 48.6406 120.452 37 106.093 37ZM213.407 37C199.048 37 187.407 48.6406 187.407 63C187.407 68.4846 189.105 73.5735 192.014 77.7744L230.536 43.4385C225.955 39.4237 219.96 37 213.407 37ZM314.137 38.4385C314.121 38.4144 314.105 38.3902 314.089 38.3662C314.105 38.3902 314.121 38.4144 314.137 38.4385ZM313.254 37.1748C313.239 37.154 313.223 37.1331 313.208 37.1123C313.223 37.1331 313.239 37.154 313.254 37.1748ZM312.824 36.6035C312.801 36.5735 312.778 36.5436 312.755 36.5137C312.778 36.5436 312.801 36.5735 312.824 36.6035ZM272.144 24C271.834 24 271.524 24.0034 271.215 24.0098L272.144 24ZM12 31.1504C17.5356 26.6787 24.5797 24 32.25 24H47V12H12V31.1504ZM54.876 24.6348C54.7839 24.6191 54.6918 24.6039 54.5996 24.5889C54.6918 24.6039 54.7839 24.6192 54.876 24.6348ZM264.899 24.5889C264.807 24.6039 264.715 24.6191 264.623 24.6348C264.715 24.6192 264.807 24.6039 264.899 24.5889ZM54.0928 24.5088C53.9741 24.4908 53.8552 24.4741 53.7363 24.457C53.8552 24.4741 53.9741 24.4908 54.0928 24.5088ZM265.763 24.457C265.644 24.4741 265.525 24.4908 265.406 24.5088C265.525 24.4908 265.644 24.4741 265.763 24.457ZM53.1172 24.3721C52.8977 24.3437 52.6781 24.3162 52.458 24.291C52.6781 24.3161 52.8977 24.3437 53.1172 24.3721ZM267.041 24.291C266.821 24.3162 266.602 24.3437 266.383 24.3721C266.602 24.3438 266.821 24.3161 267.041 24.291ZM52.0869 24.251C51.9357 24.2349 51.7843 24.2196 51.6328 24.2051C51.7843 24.2195 51.9357 24.235 52.0869 24.251ZM267.866 24.2051C267.715 24.2196 267.563 24.2349 267.412 24.251C267.563 24.235 267.715 24.2195 267.866 24.2051ZM268.848 24.1221C268.669 24.1352 268.49 24.1488 268.312 24.1641C268.49 24.1488 268.669 24.1352 268.848 24.1221ZM51.1875 24.1641C51.009 24.1488 50.8302 24.1352 50.6514 24.1221C50.8302 24.1352 51.009 24.1488 51.1875 24.1641ZM269.351 24.0869C269.293 24.0905 269.235 24.0938 269.178 24.0977C269.235 24.0939 269.293 24.0905 269.351 24.0869ZM270.951 24.0166C270.721 24.0227 270.492 24.0304 270.263 24.04C270.492 24.0305 270.721 24.0227 270.951 24.0166ZM49.2363 24.04C49.007 24.0304 48.7776 24.0227 48.5479 24.0166C48.7776 24.0227 49.007 24.0305 49.2363 24.04ZM48.2842 24.0098C47.9753 24.0034 47.666 24 47.3564 24L48.2842 24.0098ZM287.25 24C294.931 24 301.983 26.687 307.522 31.1699C307.515 31.1638 307.508 31.1575 307.5 31.1514V12H272.5V24H287.25ZM270.041 24.0488C269.811 24.0596 269.58 24.0726 269.351 24.0869C269.58 24.0726 269.811 24.0596 270.041 24.0488Z" /></svg>';
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
        const viewModeToggle = createViewModeToggleElement();
        if (quoteBanner) {
            children.push(quoteBanner.cloneNode(true));
        }
        if (!isMobileViewport()) {
            children.push(viewModeToggle);
        }
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
            renderFocusedCategoryPage(activeCategoryPage, groupedItems[activeCategoryPage], children, viewModeToggle);
            return;
        }

        if (hasActiveFilters()) {
            renderCategoryFilteredItems(groupedItems, children, viewModeToggle);
            return;
        }

        const showCounts = true;
        const optionsGrid = document.createElement('div');
        optionsGrid.className = 'category-options-grid';

        for (const [categoryName, items] of categoryEntries) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category category-collapsible';
            categoryDiv.id = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

            const countLabel = `${items.length} items`;
            const categoryIcon = getCategoryIconSvg(categoryName);

            categoryDiv.innerHTML = `
                <button class="category-toggle-btn" data-category="${categoryName}">
                    <span class="category-toggle-content">
                        <span class="category-toggle-svg">${categoryIcon}</span>
                        <span class="category-toggle-text">
                            <span class="category-toggle-label">${categoryName}</span>
                            ${showCounts ? `<span class="category-toggle-count">${countLabel}</span>` : ''}
                        </span>
                    </span>
                </button>
            `;

            optionsGrid.appendChild(categoryDiv);
        }

        children.push(optionsGrid);
        children.push(createRecommendedCountElement());
        if (isMobileViewport()) {
            const mobileSocialLinks = createMobileSocialLinksElement();
            if (mobileSocialLinks) {
                children.push(mobileSocialLinks);
            }
        }
        main.replaceChildren(...children);
        updateBottomBarScrollProgress();
    }

    function renderCategoryFilteredItems(groupedItems, children, viewModeToggle = null) {
        const categoryEntries = Object.entries(groupedItems);
        if (categoryEntries.length === 0) {
            const noResults = createEmptyState('No products match your filters', 'Try adjusting your search criteria');
            children.push(noResults);
            if (!isMobileViewport() && viewModeToggle) {
                children.push(viewModeToggle);
            }
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

        if (!isMobileViewport() && viewModeToggle) {
            children.push(viewModeToggle);
        }

        main.replaceChildren(...children);
        updateBottomBarScrollProgress();
    }

    function renderFocusedCategoryPage(categoryName, categoryItems, children, viewModeToggle = null) {
        const itemCount = categoryItems ? categoryItems.length : 0;
        updateFilterVisibility();

        if (!categoryItems || categoryItems.length === 0) {
            const empty = createEmptyState('No products match your filters in this category', 'Go back or adjust your filters.', true);
            children.push(empty);
            if (!isMobileViewport() && viewModeToggle) {
                children.push(viewModeToggle);
            }
            main.replaceChildren(...children);
            updateBottomBarScrollProgress();
            return;
        }

        // Remove the view-mode-bar since we'll include the toggle in the category header
        const filteredChildren = children.filter(child => !child.classList || !child.classList.contains('view-mode-bar'));

        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-page-header';
        const headerToggleHtml = isMobileViewport()
            ? ''
            : '<button id="view-mode-toggle-in-header" class="view-mode-toggle-btn">Switch to Classic View</button>';
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
                ${headerToggleHtml}
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
        if (!isMobileViewport() && viewModeToggle) {
            filteredChildren.push(viewModeToggle);
        }
        main.replaceChildren(...filteredChildren);
        updateBottomBarScrollProgress();
    }

    function showExtraData(itemName, categoryName) {
        const data = extraData[itemName];
        const detailsHtml = buildExtraDetailsHtml(itemName, categoryName);

        if (!data && !detailsHtml) return;

        const title = document.getElementById('extra-data-title');
        const content = document.getElementById('extra-data-content');

        title.textContent = `More about ${itemName}`;

        let html = '';

        if (data && data.images && data.images.length > 0) {
            html += '<div class="extra-images">';
            data.images.forEach(img => {
                html += `<img src="${img}" alt="Extra image" class="extra-image">`;
            });
            html += '</div>';
        }

        html += detailsHtml;

        if (data && data.tiktoks && data.tiktoks.length > 0) {
            html += '<div class="extra-tiktoks">';
            html += `<a href="${data.tiktoks[0]}" target="_blank" class="tiktok-link">Watch TikTok Video</a>`;
            html += '</div>';
        }

        // Add other stuff
        const otherKeys = data ? Object.keys(data).filter(key => key !== 'images' && key !== 'tiktoks') : [];
        if (otherKeys.length > 0) {
            html += '<div class="extra-notes">';
            otherKeys.forEach(key => {
                html += `<h4>${key.charAt(0).toUpperCase() + key.slice(1)}</h4><p>${data[key]}</p>`;
            });
            html += '</div>';
        }

        if (!html.trim()) return;

        if (openMobileInfoPanel(`More about ${itemName}`, html)) {
            return;
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
        const hasExtraData = hasAnyExtraInfo(item.name, item.category);
        const extraButton = hasExtraData ? `<a href="#" class="extra-data-btn" data-item-name="${item.name}" data-item-category="${item.category}" title="Extra Data" aria-label="Extra Data"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><line x1="12" y1="11" x2="12" y2="16"></line><circle cx="12" cy="8" r="1.2" fill="currentColor" stroke="none"></circle></svg></a>` : '';

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
                    <a class="item-buttons-product" href="${item.url}" target="_blank">View Product</a>
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