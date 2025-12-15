import { DUMMY_JSON_URL, PRODUCTS_PER_PAGE } from './config.js';
import { addToCart } from './cart.js';

// 1. Obtención de Productos (Listado Base y Búsqueda por Texto)
export const fetchProducts = async (page = 1, limit = PRODUCTS_PER_PAGE, query = '') => {
    const skip = (page - 1) * limit;
    let url = `${DUMMY_JSON_URL}`;

    if (query) {
        url = `${DUMMY_JSON_URL}/search?q=${query}&limit=${limit}&skip=${skip}`; 
    } else {
        // Solicitud explícita de 9 productos (limit=${limit})
        url = `${url}?limit=${limit}&skip=${skip}`; 
    }
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json(); 
    } catch (error) {
        console.error("Error al obtener los productos de DummyJSON:", error);
        return { products: [], total: 0, skip: 0, limit: limit }; 
    }
};

// 2. Obtención de Productos por Categoría
export const fetchProductsByCategory = async (category, page = 1, limit = PRODUCTS_PER_PAGE) => {
    const skip = (page - 1) * limit;
    const url = `${DUMMY_JSON_URL}/category/${category}?limit=${limit}&skip=${skip}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
             throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json(); 
    } catch (error) {
        console.error(`Error al obtener productos de la categoría ${category}:`, error);
        return { products: [], total: 0, skip: 0, limit: limit };
    }
};

// 3. Obtención de Producto por ID
export const fetchProductById = async (id) => {
    const url = `${DUMMY_JSON_URL}/${id}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
             throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error al obtener el producto con ID ${id}:`, error);
        return null;
    }
};

// 4. Renderizado de Productos
export const renderProducts = (products) => {
    const catalogContainer = document.getElementById('product-catalog');
    // ... (rest of the renderProducts function is the same)
    if (!catalogContainer) return; 

    catalogContainer.innerHTML = ''; 
    
    if (products.length === 0) {
        catalogContainer.innerHTML = `
            <div class="alert alert-warning text-center" role="alert">
                No se encontraron productos con los filtros seleccionados.
            </div>
        `;
        return;
    }

    const row = document.createElement('div');
    row.className = 'row g-4'; 

    products.forEach(product => {
        const productCard = `
            <div class="col-12 col-sm-6 col-md-4 col-lg-4"> 
                <div class="card h-100 shadow-sm">
                    <img src="${product.thumbnail}" class="card-img-top" alt="${product.title}">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${product.title}</h5>
                        <p class="card-text text-muted small">${product.description.substring(0, 50)}...</p>
                        <p class="fs-4 text-success mt-auto">
                            $${product.price ? product.price.toFixed(2) : 'N/A'}
                        </p>
                        <p class="card-text small">Tallas disponibles: S, M, L</p> 
                        <button class="btn btn-primary" data-product-id="${product.id}">
                            <i class="fas fa-cart-plus"></i> Agregar al Carrito
                        </button>
                    </div>
                </div>
            </div>
        `;
        row.innerHTML += productCard;
    });

    catalogContainer.appendChild(row);
};

// 5. Renderizado de Paginación
export const renderPaginationControls = (totalProducts, currentPage) => {
    const paginationContainer = document.getElementById('pagination-controls');
    // ... (rest of the renderPaginationControls function is the same)
    if (!paginationContainer) return;
    
    const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

    if (totalPages <= 1) {
        paginationContainer.innerHTML = ''; 
        return;
    }

    let paginationHtml = `<nav aria-label="Navegación de productos">
        <ul class="pagination">`;

    // Botón "Anterior"
    paginationHtml += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}">Anterior</a>
        </li>`;

    // Generar enlaces de página (rango visible)
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>`;
    }

    // Botón "Siguiente"
    paginationHtml += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}">Siguiente</a>
        </li>`;

    paginationHtml += `</ul></nav>`;

    paginationContainer.innerHTML = paginationHtml;
};


// 6. Listener para agregar al carrito
export const setupAddToCartListeners = () => {
    document.getElementById('product-catalog')?.addEventListener('click', async (event) => {
        const target = event.target.closest('.btn-primary[data-product-id]');
        if (target) {
            const productId = parseInt(target.dataset.productId);
            
            const product = await fetchProductById(productId);

            if (product) {
                addToCart(product);
            }
        }
    });
};