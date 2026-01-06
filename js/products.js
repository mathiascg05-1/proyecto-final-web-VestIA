import { DUMMY_JSON_URL, PRODUCTS_PER_PAGE } from './config.js';
import { addToCart } from './cart.js';

// Configuración del Toast de SweetAlert2
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

// Variables globales para el modal
let currentProductInModal = null;
let selectedSize = null;
let modalInstance = null;

// 1. Fetch de Productos
export const fetchProducts = async (page = 1, limit = PRODUCTS_PER_PAGE, query = '') => {
    const skip = (page - 1) * limit;
    let url = `${DUMMY_JSON_URL}`;
    if (query) {
        url = `${DUMMY_JSON_URL}/search?q=${query}&limit=${limit}&skip=${skip}`; 
    } else {
        url = `${url}?limit=${limit}&skip=${skip}`; 
    }
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        return await response.json(); 
    } catch (error) {
        console.error("Error:", error);
        return { products: [], total: 0 }; 
    }
};

export const fetchProductsByCategory = async (category, page = 1, limit = PRODUCTS_PER_PAGE) => {
    const skip = (page - 1) * limit;
    const url = `${DUMMY_JSON_URL}/category/${category}?limit=${limit}&skip=${skip}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        return await response.json();
    } catch (error) {
        return { products: [], total: 0 };
    }
};

export const fetchProductById = async (id) => {
    try {
        const response = await fetch(`${DUMMY_JSON_URL}/${id}`);
        if (!response.ok) throw new Error('Error al obtener producto');
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
};

// 2. Renderizar Productos
export const renderProducts = (products) => {
    const productContainer = document.getElementById('product-catalog');
    if (!productContainer) return;

    productContainer.innerHTML = '';

    if (products.length === 0) {
        productContainer.innerHTML = '<p class="text-center w-100 py-5">No se encontraron productos.</p>';
        return;
    }

    const productGrid = document.createElement('div');
    productGrid.className = 'row g-3'; 

    products.forEach(product => {
        const col = document.createElement('div');
        col.className = 'col-6 col-md-4 col-lg-3'; 
        
        col.innerHTML = `
            <div class="card h-100 shadow-sm border-0 product-card-trigger" data-product-id="${product.id}" style="cursor: pointer; transition: transform 0.2s;">
                <img src="${product.thumbnail}" class="card-img-top" alt="${product.title}" style="height: 250px; object-fit: cover;">
                <div class="card-body d-flex flex-column p-3">
                    <h6 class="card-title text-truncate" style="font-size: 0.95rem;">${product.title}</h6>
                    <div class="mt-auto d-flex justify-content-between align-items-center">
                        <span class="fw-bold text-dark">$${product.price}</span>
                        <small class="text-muted"><i class="fas fa-eye"></i> Ver</small>
                    </div>
                </div>
            </div>
        `;
        productGrid.appendChild(col);
    });

    productContainer.appendChild(productGrid);
};

// 3. Lógica para abrir el Modal y Gestionar Tallas
// CAMBIO IMPORTANTE: Agregamos 'export' para usarla en imageSearch.js
export const openProductModal = async (productId) => {
    const product = await fetchProductById(productId);
    if (!product) return;

    currentProductInModal = product;
    
    // --- LÓGICA INTELIGENTE DE TALLAS ---
    const category = product.category || '';
    const sizesContainer = document.getElementById('modal-sizes-container');
    const sizeWrapper = sizesContainer.parentElement; 
    
    sizesContainer.innerHTML = ''; 
    document.getElementById('size-error-msg').classList.add('d-none');

    let sizes = [];

    // CASO A: ROPA
    if (['tops', 'womens-dresses', 'mens-shirts', 'womens-clothing', 'mens-clothing', 'dresses', 'shirts'].includes(category)) {
        sizes = ['XS', 'S', 'M', 'L', 'XL'];
        selectedSize = null; 
        sizeWrapper.style.display = 'block'; 
    } 
    // CASO B: ZAPATOS
    else if (['womens-shoes', 'mens-shoes', 'shoes'].includes(category)) {
        sizes = ['36', '37', '38', '39', '40', '41', '42'];
        selectedSize = null; 
        sizeWrapper.style.display = 'block'; 
    } 
    // CASO C: ACCESORIOS / OTROS
    else {
        sizes = []; 
        selectedSize = 'Única'; 
        sizeWrapper.style.display = 'none'; 
    }

    if (sizes.length > 0) {
        sizes.forEach(size => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-outline-dark btn-sm size-selector';
            btn.style.minWidth = '40px';
            btn.textContent = size;
            
            btn.onclick = () => {
                document.querySelectorAll('.size-selector').forEach(b => {
                    b.classList.remove('active', 'btn-dark');
                    b.classList.add('btn-outline-dark');
                });
                btn.classList.remove('btn-outline-dark');
                btn.classList.add('btn-dark', 'active');
                selectedSize = size;
                document.getElementById('size-error-msg').classList.add('d-none');
            };
            sizesContainer.appendChild(btn);
        });
    }

    // Llenar resto de datos
    document.getElementById('modal-product-img').src = product.thumbnail;
    document.getElementById('modal-product-title').textContent = product.title;
    document.getElementById('modal-product-desc').textContent = product.description;
    document.getElementById('modal-product-price').textContent = `$${product.price}`;
    document.getElementById('modal-product-category').textContent = product.category;
    document.getElementById('modal-quantity').value = 1;

    // Abrir Modal
    if (window.bootstrap) {
        const modalEl = document.getElementById('productDetailsModal');
        modalInstance = new window.bootstrap.Modal(modalEl);
        modalInstance.show();
    }
};

// 4. Listeners (Clicks)
export const setupAddToCartListeners = () => {
    const catalog = document.getElementById('product-catalog');
    
    // A. Detectar clic en la tarjeta del producto
    if (catalog) {
        catalog.addEventListener('click', (event) => {
            const card = event.target.closest('.product-card-trigger');
            if (card) {
                const id = card.dataset.productId;
                openProductModal(id);
            }
        });
    }

    // B. Detectar clic en "Agregar a la Bolsa"
    const modalAddBtn = document.getElementById('modal-add-to-cart-btn');
    if (modalAddBtn) {
        const newBtn = modalAddBtn.cloneNode(true);
        modalAddBtn.parentNode.replaceChild(newBtn, modalAddBtn);
        
        newBtn.addEventListener('click', () => {
            if (!selectedSize) {
                document.getElementById('size-error-msg').classList.remove('d-none');
                return;
            }

            const qtyInput = document.getElementById('modal-quantity');
            const qty = parseInt(qtyInput.value) || 1;
            
            addToCart(currentProductInModal, qty, selectedSize);
            
            if (modalInstance) modalInstance.hide();
            
            if (Toast) {
                const sizeText = selectedSize === 'Única' ? '' : `(Talla: ${selectedSize})`;
                Toast.fire({ 
                    icon: "success", 
                    title: "¡Agregado a la bolsa!", 
                    text: `${currentProductInModal.title} ${sizeText}` 
                });
            }
        });
    }

    // Botones +/- del modal
    const increaseBtn = document.getElementById('modal-increase-qty');
    const decreaseBtn = document.getElementById('modal-decrease-qty');
    const qtyInput = document.getElementById('modal-quantity');

    if(increaseBtn && qtyInput) {
        const newInc = increaseBtn.cloneNode(true);
        increaseBtn.parentNode.replaceChild(newInc, increaseBtn);
        newInc.addEventListener('click', () => qtyInput.value = parseInt(qtyInput.value) + 1);
    }
    
    if(decreaseBtn && qtyInput) {
        const newDec = decreaseBtn.cloneNode(true);
        decreaseBtn.parentNode.replaceChild(newDec, decreaseBtn);
        newDec.addEventListener('click', () => {
            if (parseInt(qtyInput.value) > 1) qtyInput.value = parseInt(qtyInput.value) - 1;
        });
    }
};

// 5. Paginación
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