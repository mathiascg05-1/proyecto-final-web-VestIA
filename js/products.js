// js/products.js
import { DUMMY_JSON_URL, PRODUCTS_PER_PAGE } from './config.js';
import { addToCart, getQuantityOfProduct } from './cart.js';
import { getPreferredSize } from './profile.js'; 

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
let maxQuantityAllowed = 1; 

// --- VISUALES ---
const showLoading = () => {
    const container = document.getElementById('product-catalog');
    if (container) {
        container.innerHTML = `
            <div class="col-12 text-center py-5 my-5">
                <div class="spinner-border text-dark" role="status"></div>
                <p class="mt-2 text-muted small">Cargando catálogo...</p>
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

// --- API ---
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

// --- RENDERIZADO DE TARJETAS ---
export const renderProducts = (products) => {
    const container = document.getElementById('product-catalog');
    if (!container) return;
    container.innerHTML = '';

    if (products.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted">No se encontraron productos.</div>';
        return;
    }

    products.forEach(product => {
        // Stock Agotado (Opción B)
        const isOutOfStock = product.stock <= 0;

        const discount = product.discountPercentage || 0;
        const finalPrice = product.price;
        const originalPrice = discount > 0 ? (finalPrice / (1 - (discount / 100))).toFixed(2) : finalPrice;

        const col = document.createElement('div');
        col.className = 'col-6 col-md-4 col-lg-3 mb-4';
        
        col.innerHTML = `
            <div class="card h-100 border-0 shadow-sm product-card ${isOutOfStock ? 'opacity-50' : ''}" 
                 style="cursor: ${isOutOfStock ? 'not-allowed' : 'pointer'}; transition: transform 0.2s;">
                
                <div class="position-relative overflow-hidden">
                    <img src="${product.thumbnail}" class="card-img-top" alt="${product.title}" loading="lazy" style="height: 250px; object-fit: cover; ${isOutOfStock ? 'filter: grayscale(100%);' : ''}">
                    
                    ${discount > 0 && !isOutOfStock ? `<span class="position-absolute top-0 start-0 badge bg-danger m-2">-${Math.round(discount)}% SALE</span>` : ''}
                    ${isOutOfStock ? `<span class="position-absolute top-50 start-50 translate-middle badge bg-dark fs-5">AGOTADO</span>` : ''}
                </div>

                <div class="card-body p-3">
                    <span class="badge bg-light text-dark mb-2 border">${product.brand || product.category}</span>
                    <h6 class="card-title text-truncate">${product.title}</h6>
                    
                    <div class="d-flex justify-content-between align-items-center mt-2">
                        <div>
                            ${discount > 0 ? `<small class="text-decoration-line-through text-muted me-2">$${originalPrice}</small>` : ''}
                            <span class="fw-bold text-dark">$${finalPrice}</span>
                        </div>
                        <small class="text-warning"><i class="fas fa-star"></i> ${product.rating}</small>
                    </div>
                </div>
            </div>
        `;
        
        if (!isOutOfStock) {
            col.querySelector('.product-card').addEventListener('click', () => {
                openProductModal(product);
            });
            // Efecto hover
            const card = col.querySelector('.product-card');
            card.onmouseenter = () => card.style.transform = "translateY(-5px)";
            card.onmouseleave = () => card.style.transform = "translateY(0)";
        }

        container.appendChild(col);
    });
};

// --- MODAL DE PRODUCTO ---
const openProductModal = (product) => {
    currentProductInModal = product;
    
    // 1. Calcular Stock REAL: (Total API) - (Total en mi carrito, sumando tallas)
    const inCart = getQuantityOfProduct(product.id);
    const availableStock = Math.max(0, product.stock - inCart); 

    maxQuantityAllowed = availableStock; 

    // 2. Tallas Inteligentes
    const shoeCats = ['mens-shoes', 'womens-shoes'];
    const clothingCats = ['tops', 'womens-dresses', 'mens-shirts'];
    let sizes = [];
    
    if (shoeCats.includes(product.category)) {
        sizes = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
    } else if (clothingCats.includes(product.category)) {
        sizes = ['XS', 'S', 'M', 'L', 'XL'];
    } else {
        sizes = ['Única'];
    }

    const preferredSize = getPreferredSize(product.category);
    selectedSize = null; 

    const sizesHtml = sizes.map(size => {
        const isMatch = (size === preferredSize);
        if (isMatch) selectedSize = size;
        return `
            <input type="radio" class="btn-check" name="size-options" id="size-${size}" value="${size}" ${isMatch ? 'checked' : ''}>
            <label class="btn btn-outline-dark px-3 m-1" for="size-${size}">${size}</label>
        `;
    }).join('');

    if (sizes.length === 1 && !selectedSize) {
        selectedSize = sizes[0];
        setTimeout(() => { 
            const el = document.getElementById(`size-${sizes[0]}`);
            if(el) el.checked = true; 
        }, 50);
    }

    // 3. Renderizar Texto
    document.getElementById('modal-product-title').textContent = product.title;
    
    const stockColor = availableStock < 5 ? 'text-danger fw-bold' : 'text-success';
    const extraInfo = `
        <div class="mt-3 pt-3 border-top">
            <p class="mb-1 small"><i class="fas fa-tag me-2 text-muted"></i>Marca: <strong>${product.brand || 'Genérico'}</strong></p>
            <p class="mb-1 small"><i class="fas fa-truck me-2 text-muted"></i>Envío: <strong>${product.shippingInformation || 'Envío estándar'}</strong></p>
            <p class="mb-0 small ${stockColor}">
                <i class="fas fa-box me-2"></i>Stock disponible: ${availableStock} unidades
            </p>
        </div>
    `;
    document.getElementById('modal-product-desc').innerHTML = product.description + extraInfo;

    const discount = product.discountPercentage || 0;
    const finalPrice = product.price;
    const originalPrice = discount > 0 ? (finalPrice / (1 - (discount / 100))).toFixed(2) : finalPrice;
    
    const priceHtml = discount > 0 
        ? `<span class="text-decoration-line-through text-muted fs-5 me-2">$${originalPrice}</span> <span class="text-danger fw-bold fs-2">$${finalPrice}</span>`
        : `$${finalPrice}`;
    
    document.getElementById('modal-product-price').innerHTML = priceHtml;
    document.getElementById('modal-product-img').src = product.thumbnail;
    document.getElementById('modal-product-category').textContent = product.category.replace('-', ' ');
    document.getElementById('modal-sizes-container').innerHTML = sizesHtml;

    // Listeners Talla
    const radios = document.querySelectorAll('input[name="size-options"]');
    radios.forEach(r => r.addEventListener('change', (e) => selectedSize = e.target.value));

    // 4. Configurar Botones
    const qtyInput = document.getElementById('modal-quantity');
    const addToCartBtn = document.getElementById('modal-add-to-cart');

    if (availableStock <= 0) {
        qtyInput.value = 0;
        addToCartBtn.disabled = true;
        addToCartBtn.textContent = "Sin Stock (en tu bolsa)";
        addToCartBtn.classList.add('btn-secondary');
        addToCartBtn.classList.remove('btn-primary');
    } else {
        qtyInput.value = 1;
        addToCartBtn.disabled = false;
        addToCartBtn.textContent = "Agregar a la Bolsa";
        addToCartBtn.classList.remove('btn-secondary');
        addToCartBtn.classList.add('btn-primary');
    }

    modalInstance = new bootstrap.Modal(document.getElementById('productModal'));
    modalInstance.show();
};


// --- LISTENERS BOTONES ---
export const setupAddToCartListeners = () => {
    const modalAddBtn = document.getElementById('modal-add-to-cart');
    const qtyInput = document.getElementById('modal-quantity');

    if (modalAddBtn) {
        const newBtn = modalAddBtn.cloneNode(true);
        modalAddBtn.parentNode.replaceChild(newBtn, modalAddBtn);

        newBtn.addEventListener('click', () => {
            if (!currentProductInModal) return;
            if (!selectedSize) {
                if (typeof Swal !== 'undefined') Swal.fire('Falta Talla', 'Por favor selecciona una talla.', 'warning');
                return; 
            }

            const qty = parseInt(qtyInput.value) || 1;
            
            // Validación final
            const inCart = getQuantityOfProduct(currentProductInModal.id);
            if (qty + inCart > currentProductInModal.stock) {
                if (typeof Swal !== 'undefined') Swal.fire('Stock insuficiente', `Solo quedan ${currentProductInModal.stock - inCart} disponibles.`, 'error');
                return;
            }

            addToCart(currentProductInModal, qty, selectedSize);
            if (modalInstance) modalInstance.hide();
            if (Toast) Toast.fire({ icon: "success", title: "Agregado al carrito" });
        });
    }

    const increaseBtn = document.querySelector('.increase-qty');
    const decreaseBtn = document.querySelector('.decrease-qty');

    if (increaseBtn && qtyInput) {
        increaseBtn.onclick = () => {
            const currentVal = parseInt(qtyInput.value);
            if (currentVal < maxQuantityAllowed) {
                qtyInput.value = currentVal + 1;
            } else {
                increaseBtn.classList.add('btn-danger');
                setTimeout(()=>increaseBtn.classList.remove('btn-danger'), 200);
            }
        };
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