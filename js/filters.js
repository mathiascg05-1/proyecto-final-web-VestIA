import { fetchProducts, renderProducts, renderPaginationControls, fetchCategoryList } from './products.js';

// Estado global de los filtros
let currentFilters = {
    category: '',
    maxPrice: 1000,
    searchQuery: '',
    currentPage: 1
};

// Mapeo de grupos de categorías para el filtro avanzado
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
    // 1. Decidir qué función de fetch usar
    let data;
    
    // Si hay búsqueda por texto (escrito o por imagen), tiene prioridad sobre la categoría
    if (currentFilters.searchQuery) {
        data = await fetchProducts(currentFilters.currentPage, 20, currentFilters.searchQuery);
    } 
    // Si hay categoría seleccionada
    else if (currentFilters.category) {
        // Nota: fetchProductsByCategory no soporta filtrado nativo de precio en DummyJSON, 
        // pero lo simularemos visualmente si es necesario o traemos paginado.
        // Para simplificar, usaremos el endpoint de categoría estándar.
        // Importamos dinámicamente o usamos la función expuesta en products.js si fuera distinta
        // Pero aquí asumimos que fetchProducts maneja la lógica interna o usamos la específica:
        const { fetchProductsByCategory } = await import('./products.js'); 
        data = await fetchProductsByCategory(currentFilters.category, currentFilters.currentPage);
    } 
    // Si no hay nada, traer todos
    else {
        data = await fetchProducts(currentFilters.currentPage);
    }

    // 2. Filtrado de Precio (Manual en el cliente porque DummyJSON search no combina filtros)
    // Filtramos los resultados recibidos para respetar el precio máximo
    let filteredProducts = data.products.filter(p => p.price <= currentFilters.maxPrice);

    // 3. Renderizar
    renderProducts(filteredProducts);
    renderPaginationControls(data.total, currentFilters.currentPage);
};

// --- EXPORTABLES PARA OTROS MÓDULOS ---

// AGREGAR esta nueva función para renderizar las opciones
const formatName = (slug) => {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const setupCategoryFilter = async () => {
    const categorySelect = document.getElementById('category-filter');
    if (!categorySelect) return;

    const availableCategories = await fetchCategoryList(); 

    categorySelect.innerHTML = '<option value="" selected>Todas las categorías</option>';

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

// NUEVA: Usada por el buscador de imágenes
export const searchFromImage = (keywords) => {
    // Reseteamos categoría para que no interfiera
    currentFilters.category = ''; 
    document.getElementById('category-filter').value = '';
    
    // Establecemos la búsqueda
    currentFilters.searchQuery = keywords;
    document.getElementById('search-input').value = keywords; // Visualmente ponerlo en la barra
    
    currentFilters.currentPage = 1;
    applyFilters();
    
    // Scroll a los resultados
    document.getElementById('product-catalog')?.scrollIntoView({ behavior: 'smooth' });
};

// Usada por el Chatbot (Mantiene lógica de categorías)
export const applyFilterFromChat = (category) => {
    currentFilters.searchQuery = ''; // Limpiar búsqueda texto
    document.getElementById('search-input').value = '';
    
    currentFilters.category = category;
    const catSelect = document.getElementById('category-filter');
    if (catSelect) catSelect.value = category;

    currentFilters.currentPage = 1;
    applyFilters();
    document.getElementById('product-catalog')?.scrollIntoView({ behavior: 'smooth' });
};

// --- LISTENERS (Eventos del DOM) ---

export const setupPriceRangeListener = () => {
    const rangeInput = document.getElementById('price-range-filter');
    const numberInput = document.getElementById('price-input-manual');
    const applyBtn = document.getElementById('apply-price-btn'); // Si existe botón aplicar

    const updatePrice = (val) => {
        currentFilters.maxPrice = parseFloat(val);
        // Opcional: applyFilters() aquí si quieres tiempo real, 
        // o dejarlo solo al soltar/botón para no saturar.
    };

    if (rangeInput && numberInput) {
        rangeInput.addEventListener('input', (e) => {
            numberInput.value = e.target.value;
            updatePrice(e.target.value);
        });
        
        // Al soltar el slider, aplicamos el filtro
        rangeInput.addEventListener('change', () => applyFilters());

        numberInput.addEventListener('change', (e) => {
            let val = parseFloat(e.target.value);
            if (val > 1000) val = 1000;
            if (val < 0) val = 0;
            rangeInput.value = val;
            updatePrice(val);
            applyFilters();
        });
    }
};

export const setupFilterListeners = () => {
    // 1. Selector de Categoría
    const categorySelect = document.getElementById('category-filter');
    if (categorySelect) {
        categorySelect.addEventListener('change', (e) => {
            currentFilters.category = e.target.value;
            currentFilters.searchQuery = ''; // La categoría mata la búsqueda de texto
            document.getElementById('search-input').value = ''; 
            currentFilters.currentPage = 1;
            applyFilters();
        });
    }

    // 2. Barra de Búsqueda de Texto (Header)
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    const handleSearch = () => {
        const query = searchInput.value.trim();
        if (query) {
            currentFilters.searchQuery = query;
            currentFilters.category = ''; // La búsqueda mata la categoría
            if (categorySelect) categorySelect.value = '';
            currentFilters.currentPage = 1;
            applyFilters();
        }
    };

    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
        // Opcional: Búsqueda en tiempo real al borrar
        searchInput.addEventListener('input', (e) => {
            if (e.target.value === '') {
                currentFilters.searchQuery = '';
                applyFilters();
            }
        });
    }

    // 3. Paginación (Delegación de eventos)
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