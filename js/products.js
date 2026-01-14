// js/products.js
import { DUMMY_JSON_URL, PRODUCTS_PER_PAGE } from './config.js';
import { addToCart } from './cart.js';
import { getPreferredSize } from './profile.js'; 

// Configuración Toast
const Toast = typeof Swal !== 'undefined' ? Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    }
}) : null;

let currentProductInModal = null;
let selectedSize = null; 
let modalInstance = null;

// --- FUNCIONES VISUALES ---
const showLoading = () => {
    const container = document.getElementById('product-catalog');
    if (container) {
        container.innerHTML = `
            <div class="col-12 text-center py-5 my-5">
                <div class="spinner-border text-dark" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2 text-muted small">Buscando prendas...</p>
            </div>`;
    }
};

const renderErrorState = () => {
    const container = document.getElementById('product-catalog');
    if (container) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                <p>No pudimos cargar los productos.</p>
                <button class="btn btn-outline-dark" onclick="location.reload()">Reintentar</button>
            </div>`;
    }
};

// --- FETCH ---
export const fetchProducts = async (page = 1, limit = PRODUCTS_PER_PAGE, query = '') => {
    showLoading();
    try {
        let url = `${DUMMY_JSON_URL}?limit=${limit}&skip=${(page - 1) * limit}`;
        if (query) {
            url = `${DUMMY_JSON_URL}/search?q=${query}&limit=${limit}&skip=${(page - 1) * limit}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Error en la API');
        return await response.json();

    } catch (error) {
        console.error("Error fetching products:", error);
        renderErrorState();
        return { products: [], total: 0 };
    }
};

export const fetchCategoryList = async () => {
    try {
        const response = await fetch(`${DUMMY_JSON_URL}/categories`);
        return await response.json();
    } catch (error) {
        console.error("Error cargando categorías", error);
        return [];
    }
};

export const fetchProductsByCategory = async (category, page = 1) => {
    showLoading();
    try {
        const url = `${DUMMY_JSON_URL}/category/${category}?limit=${PRODUCTS_PER_PAGE}&skip=${(page - 1) * PRODUCTS_PER_PAGE}`;
        const response = await fetch(url);
        const data = await response.json();
        renderProducts(data.products);
        renderPaginationControls(data.total, page);
        return data;
    } catch (error) {
        console.error(error);
        renderErrorState();
    }
};

// --- RENDERIZADO DE PRODUCTOS ---
export const renderProducts = (products) => {
    const container = document.getElementById('product-catalog');
    if (!container) return;
    
    container.innerHTML = '';

    if (products.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted">No se encontraron productos.</div>';
        return;
    }

    products.forEach(product => {
        const col = document.createElement('div');
        col.className = 'col-6 col-md-4 col-lg-3 mb-4';
        
        col.innerHTML = `
            <div class="card h-100 border-0 shadow-sm product-card" style="cursor: pointer; transition: transform 0.2s;">
                <div class="position-relative overflow-hidden">
                    <img src="${product.thumbnail}" class="card-img-top" alt="${product.title}" loading="lazy" style="height: 250px; object-fit: cover;">
                </div>
                <div class="card-body p-3">
                    <span class="badge bg-light text-dark mb-2 border">${product.category}</span>
                    <h6 class="card-title text-truncate">${product.title}</h6>
                    <div class="d-flex justify-content-between align-items-center mt-2">
                        <span class="fw-bold">$${product.price}</span>
                        <small class="text-warning"><i class="fas fa-star"></i> ${product.rating}</small>
                    </div>
                </div>
            </div>
        `;
        
        col.querySelector('.product-card').addEventListener('click', () => {
            openProductModal(product);
        });

        const card = col.querySelector('.product-card');
        card.onmouseenter = () => card.style.transform = "translateY(-5px)";
        card.onmouseleave = () => card.style.transform = "translateY(0)";

        container.appendChild(col);
    });
};

// --- LÓGICA DEL MODAL DE PRODUCTO (CORREGIDA) ---
const openProductModal = (product) => {
    currentProductInModal = product;
    
    // Categorías estrictas
    const shoeCats = ['mens-shoes', 'womens-shoes'];
    const clothingCats = ['tops', 'womens-dresses', 'mens-shirts'];
    
    let sizes = [];
    
    // VALIDACIÓN DE TIPO DE PRODUCTO
    if (shoeCats.includes(product.category)) {
        // ZAPATOS
        sizes = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
    } else if (clothingCats.includes(product.category)) {
        // ROPA
        sizes = ['XS', 'S', 'M', 'L', 'XL'];
    } else {
        // MAQUILLAJE, ACCESORIOS, TECNOLOGÍA, HOGAR
        sizes = ['Única'];
    }

    // Obtener preferencia del usuario (M, 42 o Única)
    const preferredSize = getPreferredSize(product.category);
    selectedSize = null; 

    // Generar botones
    const sizesHtml = sizes.map(size => {
        const isMatch = (size === preferredSize);
        if (isMatch) selectedSize = size;

        return `
            <input type="radio" class="btn-check" name="size-options" id="size-${size}" value="${size}" ${isMatch ? 'checked' : ''}>
            <label class="btn btn-outline-dark px-3 m-1" for="size-${size}">${size}</label>
        `;
    }).join('');

    // ** MEJORA DE UX: Si solo hay una talla (Única), seleccionarla automáticamente **
    if (sizes.length === 1 && !selectedSize) {
        selectedSize = sizes[0];
        // Nota: Visualmente el input necesita estar marcado también, lo hacemos abajo con un pequeño truco
        setTimeout(() => {
            const onlyOption = document.getElementById(`size-${sizes[0]}`);
            if (onlyOption) onlyOption.checked = true;
        }, 50);
    }

    // Inyectar datos
    document.getElementById('modal-product-title').textContent = product.title;
    document.getElementById('modal-product-desc').textContent = product.description;
    document.getElementById('modal-product-price').textContent = `$${product.price}`;
    document.getElementById('modal-product-img').src = product.thumbnail;
    document.getElementById('modal-product-category').textContent = product.category.replace('-', ' ');
    
    const sizesContainer = document.getElementById('modal-sizes-container');
    sizesContainer.innerHTML = sizesHtml;

    // Listeners manuales
    const radios = sizesContainer.querySelectorAll('input[name="size-options"]');
    radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            selectedSize = e.target.value;
        });
    });

    // Reset input cantidad
    const qtyInput = document.getElementById('modal-quantity');
    if(qtyInput) qtyInput.value = 1;

    // Abrir modal
    modalInstance = new bootstrap.Modal(document.getElementById('productModal'));
    modalInstance.show();
};


// --- LISTENERS DEL CARRITO ---
export const setupAddToCartListeners = () => {
    
    const modalAddBtn = document.getElementById('modal-add-to-cart');
    const qtyInput = document.getElementById('modal-quantity');

    if (modalAddBtn) {
        const newBtn = modalAddBtn.cloneNode(true);
        modalAddBtn.parentNode.replaceChild(newBtn, modalAddBtn);

        newBtn.addEventListener('click', () => {
            if (!currentProductInModal) return;

            if (!selectedSize) {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Falta la talla',
                        text: 'Por favor selecciona una opción para continuar.',
                        confirmButtonColor: '#2c2c2c'
                    });
                } else {
                    alert("Por favor selecciona una talla.");
                }
                return; 
            }

            const qty = parseInt(qtyInput.value) || 1;
            addToCart(currentProductInModal, qty, selectedSize);

            if (modalInstance) modalInstance.hide();

            if (Toast) {
                Toast.fire({
                    icon: "success",
                    title: `${currentProductInModal.title} agregado`
                });
            }
        });
    }

    // Controles + / -
    const increaseBtn = document.querySelector('.increase-qty');
    const decreaseBtn = document.querySelector('.decrease-qty');

    if (increaseBtn && qtyInput) {
        increaseBtn.onclick = () => qtyInput.value = parseInt(qtyInput.value) + 1;
    }
    if (decreaseBtn && qtyInput) {
        decreaseBtn.onclick = () => {
            if (parseInt(qtyInput.value) > 1) qtyInput.value = parseInt(qtyInput.value) - 1;
        };
    }
};

export const renderPaginationControls = (totalItems, currentPage) => {
    const paginationContainer = document.getElementById('pagination-controls');
    if (!paginationContainer) return;
    const totalPages = Math.ceil(totalItems / PRODUCTS_PER_PAGE);
    
    if (totalPages <= 1) { paginationContainer.innerHTML = ''; return; }

    let paginationHtml = `<nav><ul class="pagination justify-content-center align-items-center gap-2 mb-0">`;
    paginationHtml += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage - 1}">Anterior</a></li>`;
    
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) startPage = Math.max(1, endPage - maxPagesToShow + 1);
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }
    
    paginationHtml += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage + 1}">Siguiente</a></li>`;
    paginationHtml += `</ul></nav>`;
    
    paginationContainer.innerHTML = paginationHtml;
};