import { fetchProducts, renderProducts, renderPaginationControls, fetchCategoryList } from './products.js';

// Estado global de los filtros
let currentFilters = {
    category: '',
    maxPrice: 1000,
    searchQuery: '',
    currentPage: 1
};

// Mapeo de grupos de categorías (TUS CATEGORÍAS ORIGINALES)
const CATEGORY_GROUPS = {
    "Ropa y Moda": [
        "tops", 
        "womens-dresses", 
        "mens-shirts"
    ],
    "Calzado": [
        "mens-shoes", 
        "womens-shoes", 
        "sports-accessories" 
    ],
    "Tecnología": [
        "smartphones", 
        "laptops", 
        "tablets", 
        "mobile-accessories"
    ],
    "Accesorios y Joyas": [
        "womens-jewellery", 
        "mens-watches", 
        "womens-watches", 
        "sunglasses", 
        "womens-bags"
    ],
    "Cuidado Personal": [
        "beauty", 
        "fragrances", 
        "skin-care"
    ],
    "Hogar y Otros": [
        "furniture", 
        "home-decoration", 
        "groceries", 
        "kitchen-accessories",
    ]
};

// --- FUNCIÓN PRINCIPAL DE FILTRADO ---
const applyFilters = async () => {
    let data;
    
    // 1. Prioridad: Búsqueda por texto
    if (currentFilters.searchQuery) {
        data = await fetchProducts(currentFilters.currentPage, 20, currentFilters.searchQuery);
    } 
    // 2. Prioridad: Búsqueda por Categoría
    else if (currentFilters.category) {
        const { fetchProductsByCategory } = await import('./products.js'); 
        data = await fetchProductsByCategory(currentFilters.category, currentFilters.currentPage);
    } 
    // 3. Defecto: Traer todo
    else {
        data = await fetchProducts(currentFilters.currentPage);
    }

    // 4. Filtrado de Precio (Manual en el cliente)
    if (data && data.products) {
        // Filtramos lo que llegó de la API según el precio máximo
        let filteredProducts = data.products.filter(p => p.price <= currentFilters.maxPrice);
        
        renderProducts(filteredProducts);
        renderPaginationControls(data.total, currentFilters.currentPage);
    }
};

// --- HELPER PARA FORMATEAR NOMBRES ---
const formatName = (slug) => {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// --- CONFIGURACIÓN DEL SELECT DE CATEGORÍAS ---
export const setupCategoryFilter = async () => {
    // CORRECCIÓN 1: Usamos el ID real de tu HTML 'category-filter'
    const categorySelect = document.getElementById('category-filter'); 
    if (!categorySelect) return;

    const availableCategories = await fetchCategoryList(); 

    categorySelect.innerHTML = '<option value="" selected>Todas las Categorías</option>';

    for (const [groupName, slugs] of Object.entries(CATEGORY_GROUPS)) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = groupName;

        slugs.forEach(slug => {
            const exists = availableCategories.some(c => c === slug || c.slug === slug);
            if (exists) {
                const option = document.createElement('option');
                option.value = slug; 
                option.textContent = formatName(slug);
                optgroup.appendChild(option);
            }
        });

        if (optgroup.children.length > 0) {
            categorySelect.appendChild(optgroup);
        }
    }
};

// --- CONFIGURACIÓN DEL SLIDER DE PRECIO ---
export const setupPriceRangeListener = () => {
    // CORRECCIÓN 2: Usamos tus IDs 'price-range-filter' y 'price-input-manual'
    const rangeInput = document.getElementById('price-range-filter');
    const numberInput = document.getElementById('price-input-manual');

    if (rangeInput && numberInput) {
        // Sincronizar Slider -> Input Número
        rangeInput.addEventListener('input', (e) => {
            numberInput.value = e.target.value;
        });

        // Sincronizar Input Número -> Slider
        numberInput.addEventListener('input', (e) => {
            rangeInput.value = e.target.value;
        });
    }
};

// --- LISTENERS PRINCIPALES ---
export const setupFilterListeners = () => {
    // Referencias con los IDs CORRECTOS de tu HTML
    const categorySelect = document.getElementById('category-filter');
    const priceRange = document.getElementById('price-range-filter');
    const priceInput = document.getElementById('price-input-manual');
    
    const applyBtn = document.getElementById('apply-filters-button'); // Tu ID real
    const clearBtn = document.getElementById('reset-filters-button'); // Tu ID real

    // 1. BOTÓN APLICAR FILTROS
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            // Leer valores
            const selectedCat = categorySelect ? categorySelect.value : '';
            const selectedPrice = priceRange ? priceRange.value : 1000;

            // Actualizar estado
            currentFilters.category = selectedCat;
            currentFilters.maxPrice = selectedPrice;
            currentFilters.currentPage = 1;

            // Si filtran por categoría, borramos la búsqueda de texto
            if (selectedCat) {
                currentFilters.searchQuery = '';
                const searchInput = document.getElementById('search-input');
                if (searchInput) searchInput.value = '';
            }

            applyFilters();
            closeSidebar();
        });
    }

    // 2. BOTÓN LIMPIAR TODO
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            // Reset estado
            currentFilters = {
                category: '',
                maxPrice: 1000,
                searchQuery: '',
                currentPage: 1
            };

            // Reset UI visual
            if (categorySelect) categorySelect.value = '';
            if (priceRange) priceRange.value = 1000;
            if (priceInput) priceInput.value = 1000;
            
            const searchInput = document.getElementById('search-input');
            if (searchInput) searchInput.value = '';

            applyFilters();
            closeSidebar();
        });
    }

    // 3. BUSCADOR (Header)
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-button'); // Tu ID real
    
    const handleSearch = () => {
        const query = searchInput.value.trim();
        currentFilters.searchQuery = query;
        currentFilters.category = ''; 
        if (categorySelect) categorySelect.value = '';
        currentFilters.currentPage = 1;
        applyFilters();
    };

    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
    }

    // 4. PAGINACIÓN
    const paginationContainer = document.getElementById('pagination-controls');
    if (paginationContainer) {
        paginationContainer.addEventListener('click', (e) => {
            e.preventDefault();
            const link = e.target.closest('.page-link');
            if (link && !link.parentElement.classList.contains('disabled')) {
                const page = parseInt(link.dataset.page);
                if (page) {
                    currentFilters.currentPage = page;
                    applyFilters();
                    document.getElementById('product-catalog')?.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }
};

// --- EXPORTABLES PARA IA (Imágenes y Chat) ---

export const searchFromImage = (keywords) => {
    currentFilters.category = ''; 
    const catSelect = document.getElementById('category-filter');
    if(catSelect) catSelect.value = '';
    
    currentFilters.searchQuery = keywords;
    const searchInput = document.getElementById('search-input');
    if(searchInput) searchInput.value = keywords; 
    
    currentFilters.currentPage = 1;
    applyFilters();
};

export const applyFilterFromChat = (category) => {
    currentFilters.searchQuery = ''; 
    const searchInput = document.getElementById('search-input');
    if(searchInput) searchInput.value = '';
    
    currentFilters.category = category;
    const catSelect = document.getElementById('category-filter');
    if (catSelect) catSelect.value = category;

    currentFilters.currentPage = 1;
    applyFilters();
};

// Helper cerrar sidebar
const closeSidebar = () => {
    const sidebarEl = document.getElementById('filtersOffcanvas'); // Tu ID real del sidebar
    if (sidebarEl && window.bootstrap) {
        const instance = bootstrap.Offcanvas.getInstance(sidebarEl);
        if (instance) instance.hide();
    }
};