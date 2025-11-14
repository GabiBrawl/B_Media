let allItems = [];
let currentFilters = {
    search: '',
    category: 'all',
    price: 'all',
    picksOnly: false
};

// Mapping of category keys to display names
const categoryDisplayNames = {
    'iem-recommendations': 'IEMs',
    'headphone-recommendations': 'Headphones',
    'portable-dac/amp-recommendations': 'Portable DAC/AMP',
    'desktop-dac/amp-recommendations': 'Desktop DAC/AMP',
    'digital-audio-players': 'Digital Audio Players',
    'wireless-earbuds': 'Wireless Earbuds',
    'wireless-headphones': 'Wireless Headphones',
    'iem-cables/eartips': 'IEM Cables & Eartips',
    'headphone-cables-and-interconnects-by-hart-audio': 'Headphone Cables & Interconnects'
};

// Function to populate category filter dynamically
function populateCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    
    // Clear existing options except "All Categories"
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    
    // Add options for each category in gearData
    for (const categoryKey of Object.keys(gearData)) {
        const displayName = categoryDisplayNames[categoryKey] || categoryKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const option = document.createElement('option');
        option.value = categoryKey;
        option.textContent = displayName;
        categoryFilter.appendChild(option);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const main = document.getElementById('main-content');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    const picksOnlyCheckbox = document.getElementById('show-picks-only');
    const resetButton = document.getElementById('reset-filters');
    const modal = document.getElementById('pick-info-modal');
    const modalClose = modal.querySelector('.modal-close');

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

    // Delegate click event for pick badges
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('pick-badge')) {
            e.preventDefault();
            modal.classList.add('show');
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
        main.innerHTML = '';

        for (const [categoryKey, items] of Object.entries(gearData)) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category';
            categoryDiv.id = categoryKey;

            const categoryTitle = categoryKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            categoryDiv.innerHTML = `<h2>${categoryTitle}</h2>`;

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
        main.innerHTML = '';

        if (Object.keys(groupedItems).length === 0) {
            main.innerHTML = '<div style="text-align: center; padding: 3rem; color: #bbb;"><h2>No products match your filters</h2><p>Try adjusting your search criteria</p></div>';
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

    function createItemElement(item) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item';

        const pickBadge = item.pick ? '<span class="pick-badge">B_Media Pick</span>' : '';
        const priceText = item.price ? `$${item.price}` : 'Check Price';

        // Create a div with a better visual placeholder for broken images
        const placeholderStyle = 'background: linear-gradient(135deg, #1a1a24, #252535); display: flex; align-items: center; justify-content: center; font-size: 3rem; opacity: 0.3; width: 100%; height: 180px; border-radius: 12px; margin-bottom: 1rem;';
        
        itemDiv.innerHTML = `
            <img src="${item.image}" 
                 alt="${item.name}" 
                 class="item-image" 
                 onerror="this.classList.add('broken'); this.alt='🎵';">
            <div class="item-header">
                <h3>${item.name}</h3>
                ${pickBadge}
            </div>
            <p>${priceText}</p>
            <a href="${item.url}" target="_blank">View Product</a>
        `;

        return itemDiv;
    }
});