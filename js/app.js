let allItems = [];
let currentFilters = {
    search: '',
    category: 'all',
    price: 'all',
    picksOnly: false
};

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
    // Array of random quotes
    const quotes = [
        {
            text: "In Pursuit of Audio Perfection",
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

    const main = document.getElementById('main-content');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    const picksOnlyCheckbox = document.getElementById('show-picks-only');
    const resetButton = document.getElementById('reset-filters');
    const modal = document.getElementById('pick-info-modal');
    const modalClose = modal.querySelector('.modal-close');

    const extraModal = document.getElementById('extra-data-modal');
    const extraModalClose = extraModal.querySelector('.modal-close');

    // Mobile filter controls
    const mobileFilterBtn = document.getElementById('mobile-filter-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarClose = document.getElementById('sidebar-close');

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

    // Initialize all items
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

    // Event listeners for filters
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
        // Preserve the quote banner
        const quoteBanner = main.querySelector('.quote-banner');
        main.innerHTML = '';
        if (quoteBanner) {
            main.appendChild(quoteBanner);
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
                ${extraButton}
            </div>
        `;

        return itemDiv;
    }
});