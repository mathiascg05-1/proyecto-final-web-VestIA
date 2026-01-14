import { DUMMY_JSON_URL, PRODUCTS_PER_PAGE } from './config.js';
import { addToCart } from './cart.js';
import { getUserDefaultSize } from './profile.js'; // <--- NUEVO: Importamos el perfil

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

// --- FUNCIONES AUXILIARES DE ESTADO VISUAL (NUEVO) ---

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
                <i class="fas fa-wifi fa-2x text-muted mb-3"></i>
                <p class="text-muted">No pudimos cargar los productos.</p>
                <button class="btn btn-sm btn-outline-dark" onclick="window.location.reload()">Reintentar</button>
            </div>`;
    }
};

// 1. Fetch de Productos
export const fetchProducts = async (page = 1, limit = PRODUCTS_PER_PAGE, query = '') => {
    showLoading(); // <--- Mostrar spinner antes de buscar

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
        renderErrorState(); // <--- Mostrar error visual
        return { products: [], total: 0 }; 
    }
};

export const fetchProductsByCategory = async (category, page = 1, limit = PRODUCTS_PER_PAGE) => {
    showLoading(); // <--- Mostrar spinner antes de buscar

    const skip = (page - 1) * limit;
    const url = `${DUMMY_JSON_URL}/category/${category}?limit=${limit}&skip=${skip}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error:", error);
        renderErrorState(); // <--- Mostrar error visual
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

// Obtener lista de categorías
export const fetchCategoryList = async () => {
    try {
        // Usamos el endpoint que devuelve una lista simple de strings
        const response = await fetch('https://dummyjson.com/products/category-list');
        if (!response.ok) {
             throw new Error('Error al cargar categorías');
        }
        return await response.json(); 
    } catch (error) {
        console.error("Error obteniendo lista de categorías:", error);
        return [];
    }
};

// 2. Renderizar Productos
export const renderProducts = (products) => {
    const productContainer = document.getElementById('product-catalog');
    if (!productContainer) return;

    productContainer.innerHTML = '';

    if (!products || products.length === 0) {
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
                <div class="position-relative" style="height: 250px; overflow: hidden;">
                     <img src="${product.thumbnail}" class="card-img-top w-100 h-100" alt="${product.title}" style="object-fit: cover;">
                </div>
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
export const openProductModal = async (productId) => {
    const product = await fetchProductById(productId);
    if (!product) return;

    currentProductInModal = product;
    
    // --- LÓGICA INTELIGENTE DE TALLAS ---
    const category = product.category || '';
    const sizesContainer = document.getElementById('modal-sizes-container');
    const sizeWrapper = sizesContainer.parentElement; // El div que envuelve botones y título
    
    sizesContainer.innerHTML = ''; 
    document.getElementById('size-error-msg').classList.add('d-none');

    let sizes = [];
    selectedSize = null; // Resetear selección al abrir

    // CASO A: ROPA
    if (['tops', 'womens-dresses', 'mens-shirts', 'womens-clothing', 'mens-clothing', 'dresses', 'shirts'].includes(category)) {
        sizes = ['XS', 'S', 'M', 'L', 'XL'];
        sizeWrapper.classList.remove('d-none'); // Mostrar contenedor
    } 
    // CASO B: ZAPATOS
    else if (['womens-shoes', 'mens-shoes', 'shoes'].includes(category)) {
        sizes = ['36', '37', '38', '39', '40', '41', '42'];
        sizeWrapper.classList.remove('d-none');
    } 
    // CASO C: ACCESORIOS / OTROS (Sin talla)
    else {
        sizes = []; 
        selectedSize = 'Única'; 
        sizeWrapper.classList.add('d-none'); // Ocultar contenedor
    }

    // Generar botones si hay tallas
    if (sizes.length > 0) {
        sizes.forEach(size => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-outline-dark btn-sm size-selector';
            btn.style.minWidth = '40px';
            btn.textContent = size;
            
            btn.onclick = () => {
                // Visualmente marcar activo
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

        // --- NUEVO: AUTOSELECCIÓN DE PERFIL ---
        const userDefaultSize = getUserDefaultSize(); // Obtener talla guardada (ej. "M")
        
        if (userDefaultSize && sizes.includes(userDefaultSize)) {
            // Buscamos el botón correspondiente y le hacemos click automáticamente
            setTimeout(() => {
                const buttons = sizesContainer.querySelectorAll('button');
                buttons.forEach(b => {
                    if (b.textContent === userDefaultSize) b.click();
                });
            }, 50); // Pequeño delay para asegurar renderizado
        }
    }

    // Llenar resto de datos del modal
    document.getElementById('modal-product-img').src = product.thumbnail;
    document.getElementById('modal-product-title').textContent = product.title;
    document.getElementById('modal-product-desc').textContent = product.description;
    document.getElementById('modal-product-price').textContent = `$${product.price}`;
    
    // Etiqueta de categoría (opcional)
    const catLabel = document.getElementById('modal-product-category');
    if (catLabel) catLabel.textContent = product.category;
    
    document.getElementById('modal-quantity').value = 1;

    // Abrir Modal con Bootstrap
    if (window.bootstrap) {
        const modalEl = document.getElementById('productDetailsModal'); // Asegúrate que tu HTML tiene este ID
        // Si usas otro ID como 'productModal', cambia la línea de arriba.
        // En tu index.html previo parecía ser 'productDetailsModal' o 'productModal'.
        // Voy a asumir 'productModal' basado en conversaciones previas, 
        // PERO tu código de ejemplo usaba 'productDetailsModal'. Usaré ese.
        if (modalEl) {
            modalInstance = new window.bootstrap.Modal(modalEl);
            modalInstance.show();
        } else {
            // Fallback por si el ID es diferente
            const fallbackModal = document.getElementById('productModal');
            if (fallbackModal) {
                modalInstance = new window.bootstrap.Modal(fallbackModal);
                modalInstance.show();
            }
        }
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

    // B. Detectar clic en "Agregar a la Bolsa" (Dentro del Modal)
    const modalAddBtn = document.getElementById('modal-add-to-cart-btn'); // ID del botón agregar en tu modal
    // NOTA: Si en tu HTML el botón se llama 'modal-add-btn', cambia la línea de arriba.
    
    if (modalAddBtn) {
        // Clonamos para eliminar listeners viejos (evita agregar doble)
        const newBtn = modalAddBtn.cloneNode(true);
        modalAddBtn.parentNode.replaceChild(newBtn, modalAddBtn);
        
        newBtn.addEventListener('click', () => {
            // Validación de talla
            if (!selectedSize) {
                const errorMsg = document.getElementById('size-error-msg');
                if (errorMsg) errorMsg.classList.remove('d-none');
                return;
            }

            const qtyInput = document.getElementById('modal-quantity');
            const qty = parseInt(qtyInput?.value) || 1;
            
            // Agregar al carrito (función importada)
            addToCart(currentProductInModal, qty, selectedSize);
            
            // Cerrar modal
            if (modalInstance) modalInstance.hide();
            
            // Notificación
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