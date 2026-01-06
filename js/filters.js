import { fetchProducts, renderProducts, fetchProductsByCategory, renderPaginationControls } from './products.js';

// Estado global de filtros
let currentFilters = {
    category: '',
    maxPrice: 1000,
    searchQuery: '',
    currentPage: 1
};

// 1. Manejo del Rango de Precio (Sincronizado Barra <-> Input Manual)
export const setupPriceRangeListener = () => {
    const rangeInput = document.getElementById('price-range-filter');     // La barra
    const numberInput = document.getElementById('price-input-manual');    // El cuadro de texto
    
    if (rangeInput && numberInput) {
        
        // A. Si mueves la barra -> Actualiza el cuadro de texto
        rangeInput.addEventListener('input', (event) => {
            const val = event.target.value;
            numberInput.value = val; // Pone el valor en el input
            currentFilters.maxPrice = parseFloat(val);
        });

        // B. Si escribes en el cuadro -> Mueve la barra
        numberInput.addEventListener('input', (event) => {
            let val = parseFloat(event.target.value);
            
            // Validaciones para que no pongan negativos o más de 1000
            if (isNaN(val)) val = 0;
            if (val > 1000) val = 1000;
            if (val < 0) val = 0;

            rangeInput.value = val; // Mueve la barra visualmente
            currentFilters.maxPrice = val;
        });
    }
};

// 2. Función principal para aplicar los filtros
export const applyFilters = async () => {
    const categoryFilter = document.getElementById('category-filter');
    const searchInput = document.getElementById('search-input'); // PC
    const searchInputMobile = document.getElementById('search-input-mobile'); // Móvil
    
    // Obtenemos el precio del input manual (que ya está sincronizado con la barra)
    const priceInput = document.getElementById('price-input-manual');

    // 1. Actualizar estado
    currentFilters.category = categoryFilter ? categoryFilter.value : '';
    
    // Detectar qué buscador se usó
    let query = '';
    if (searchInput && searchInput.value.trim() !== '') query = searchInput.value.trim();
    else if (searchInputMobile && searchInputMobile.value.trim() !== '') query = searchInputMobile.value.trim();
    currentFilters.searchQuery = query;

    currentFilters.maxPrice = priceInput ? parseFloat(priceInput.value) : 1000;

    // 2. Obtener datos
    let data;
    if (currentFilters.category) {
        data = await fetchProductsByCategory(currentFilters.category, currentFilters.currentPage);
    } else {
        data = await fetchProducts(currentFilters.currentPage, 9, currentFilters.searchQuery); // 9 es el limit
    }

    // 3. Filtrado local por precio 
    // (Nota: DummyJSON no filtra por precio en el servidor, así que lo hacemos aquí visualmente)
    let filteredProducts = data.products;
    
    if (currentFilters.maxPrice < 1000) {
        filteredProducts = filteredProducts.filter(p => p.price <= currentFilters.maxPrice);
    }

    // 4. Renderizar
    renderProducts(filteredProducts);
    
    // Ocultar paginación si filtramos localmente mucho (opcional, pero mejora UX)
    const pagination = document.getElementById('pagination-controls');
    if (pagination) {
        // Si filtramos por precio localmente, la paginación de la API puede confundir, 
        // pero por simplicidad la dejamos o la ocultamos si no hay resultados.
        if (filteredProducts.length === 0) pagination.innerHTML = '';
        else renderPaginationControls(data.total, currentFilters.currentPage);
    }
};

// 3. Configurar Listeners de Botones
export const setupFilterListeners = () => {
    
    document.getElementById('apply-filters-button')?.addEventListener('click', () => {
        currentFilters.currentPage = 1; 
        
        // Cerrar el Offcanvas (menú lateral) automáticamente al aplicar
        const offcanvasEl = document.getElementById('filtersOffcanvas');
        if (offcanvasEl) {
            const offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvasEl);
            if (offcanvasInstance) offcanvasInstance.hide();
        }

        applyFilters();
    });
    
    // Buscador PC
    document.getElementById('search-button')?.addEventListener('click', () => {
        currentFilters.currentPage = 1; 
        applyFilters();
    });
    // Enter en buscador PC
    document.getElementById('search-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentFilters.currentPage = 1; 
            applyFilters();
        }
    });

    // Resetear Filtros
    document.getElementById('reset-filters-button')?.addEventListener('click', () => {
        // Reiniciar DOM
        if(document.getElementById('category-filter')) document.getElementById('category-filter').value = '';
        if(document.getElementById('search-input')) document.getElementById('search-input').value = '';
        
        // Reiniciar Precio
        const range = document.getElementById('price-range-filter');
        const number = document.getElementById('price-input-manual');
        if(range) range.value = 1000;
        if(number) number.value = 1000;
        
        // Aplicar
        currentFilters.maxPrice = 1000;
        currentFilters.currentPage = 1;
        applyFilters(); 
    });
    
    // Paginación
    document.getElementById('pagination-controls')?.addEventListener('click', (event) => {
        const target = event.target.closest('.page-link');
        if (target && !target.parentElement.classList.contains('disabled') && target.dataset.page) {
            event.preventDefault(); 
            const newPage = parseInt(target.dataset.page);
            if (!isNaN(newPage)) {
                currentFilters.currentPage = newPage;
                applyFilters();
            }
        }
    });
};

export const applyFilterFromChat = (category) => {
    const categorySelect = document.getElementById('category-filter');
    const offcanvasEl = document.getElementById('filtersOffcanvas');
    
    // 1. Cambiar el valor del select visualmente
    if (categorySelect) {
        categorySelect.value = category;
        // Si la categoría no existe en el select (ej. error de IA), lo resetea
        if (categorySelect.value !== category) categorySelect.value = '';
    }

    // 2. Abrir el menú de filtros (opcional, para que vea que cambió)
    // O simplemente aplicar el filtro directamente:
    currentFilters.category = category;
    currentFilters.currentPage = 1;
    applyFilters();

    // 3. Cerrar el menú lateral si estaba abierto
    if (offcanvasEl) {
        const offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvasEl);
        if (offcanvasInstance) offcanvasInstance.hide();
    }
    
    // 4. Scroll suave hacia los productos
    document.getElementById('product-catalog')?.scrollIntoView({ behavior: 'smooth' });
};