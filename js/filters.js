import { fetchProducts, renderProducts, fetchProductsByCategory, renderPaginationControls } from './products.js';

// Estado global para almacenar los filtros activos (incluyendo la página)
let currentFilters = {
    category: '',
    maxPrice: 1000,
    searchQuery: '',
    currentPage: 1,
    // Estructura para filtros futuros requeridos
    color: '', 
    size: '',
    occasion: ''
};

// 1. Manejo del valor del Rango de Precio
export const setupPriceRangeListener = () => {
    const priceRangeInput = document.getElementById('price-range-filter');
    const priceValueDisplay = document.getElementById('price-value');
    
    if (priceRangeInput && priceValueDisplay) {
        priceRangeInput.addEventListener('input', (event) => {
            priceValueDisplay.textContent = `$${event.target.value}`;
            currentFilters.maxPrice = parseFloat(event.target.value);
        });
    }
};

// 2. Función principal para aplicar los filtros
export const applyFilters = async () => {
    const categoryFilter = document.getElementById('category-filter');
    const searchInput = document.getElementById('search-input');
    const priceRangeInput = document.getElementById('price-range-filter');

    // Actualizar el estado con los valores del DOM
    currentFilters.category = categoryFilter ? categoryFilter.value : '';
    currentFilters.searchQuery = searchInput ? searchInput.value.trim() : '';
    currentFilters.maxPrice = priceRangeInput ? parseFloat(priceRangeInput.value) : 1000;
    
    const page = currentFilters.currentPage; 

    let data;
    let totalProductsFetched = 0; 

    // 1. Llamada a la API (Prioridad: Búsqueda > Categoría > Listado General)
    if (currentFilters.searchQuery) {
        data = await fetchProducts(page, 9, currentFilters.searchQuery);
    }
    else if (currentFilters.category) {
        data = await fetchProductsByCategory(currentFilters.category, page);
    }
    else {
        data = await fetchProducts(page);
    }
    
    totalProductsFetched = data.total;
    
    // 2. Filtrado por precio en el frontend (Mejorado para mayor robustez)
    const filteredByPrice = data.products.filter(product => {
        // CRÍTICO: Asegura que el producto tenga un precio numérico válido ANTES de filtrarlo.
        const priceIsValid = typeof product.price === 'number' && product.price > 0;
        
        return priceIsValid && product.price <= currentFilters.maxPrice;
    });

    // 3. Renderizar productos filtrados por precio
    renderProducts(filteredByPrice);
    
    // 4. Renderizar paginación
    renderPaginationControls(totalProductsFetched, page); 
};


// 3. Función para cambiar la página (llamada desde el listener de paginación)
export const changePage = (newPage) => {
    currentFilters.currentPage = newPage;
    applyFilters(); 
    window.scrollTo(0, 0); 
}

// 4. Configurar Event Listeners (Se mantiene igual, solo se limpia)
export const setupFilterListeners = () => {
    
    document.getElementById('apply-filters-button')?.addEventListener('click', () => {
        currentFilters.currentPage = 1; 
        applyFilters();
    });
    
    // Aplica filtros al cambiar la categoría
    document.getElementById('category-filter')?.addEventListener('change', () => {
        currentFilters.currentPage = 1; 
        applyFilters();
    });
    
    document.getElementById('search-button')?.addEventListener('click', () => {
        currentFilters.currentPage = 1; 
        applyFilters();
    });
    
    document.getElementById('reset-filters-button')?.addEventListener('click', () => {
        // Reiniciar valores del DOM
        document.getElementById('category-filter').value = '';
        document.getElementById('search-input').value = '';
        document.getElementById('price-range-filter').value = 1000;
        document.getElementById('price-value').textContent = '$1000';
        
        // Reiniciar estado y aplicar
        currentFilters.currentPage = 1;
        applyFilters(); 
    });
    
    // Listener para los controles de paginación
    document.getElementById('pagination-controls')?.addEventListener('click', (event) => {
        const target = event.target.closest('.page-link');
        if (target && !target.parentElement.classList.contains('disabled') && target.dataset.page) {
            event.preventDefault(); 
            const newPage = parseInt(target.dataset.page);
            if (!isNaN(newPage)) {
                changePage(newPage);
            }
        }
    });
};