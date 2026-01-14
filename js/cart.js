// js/cart.js

const CART_STORAGE_KEY = 'vestla_shopping_cart';

// --- NUEVA FUNCIÓN CRÍTICA PARA EL STOCK ---
// Devuelve cuántas unidades de este producto (ID) tiene el usuario en total en su carrito
export const getQuantityOfProduct = (productId) => {
    const cart = getCart();
    // Sumamos la cantidad de todas las variantes de ese producto
    return cart
        .filter(item => item.id === productId)
        .reduce((total, item) => total + item.quantity, 0);
};

export const getCart = () => {
    try {
        const cartData = localStorage.getItem(CART_STORAGE_KEY);
        return cartData ? JSON.parse(cartData) : [];
    } catch (e) {
        return [];
    }
};

const saveCart = (cart) => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartDisplay(); 
};

export const addToCart = (product, quantity = 1, size = 'Única') => {
    const cart = getCart();
    
    // Identificar producto por ID y TALLA
    const existingItemIndex = cart.findIndex(item => item.id === product.id && item.size === size);

    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            thumbnail: product.thumbnail,
            quantity: quantity,
            size: size
        });
    }
    saveCart(cart);
};

export const updateItemQuantity = (productId, size, change) => {
    let cart = getCart();
    const itemIndex = cart.findIndex(item => item.id === productId && item.size === size);

    if (itemIndex > -1) {
        cart[itemIndex].quantity += change;
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1); // Borrar si llega a 0
        }
        saveCart(cart);
    }
};

export const removeFromCart = (productId, size) => {
    let cart = getCart();
    cart = cart.filter(item => !(item.id === productId && item.size === size));
    saveCart(cart);
};

export const updateCartDisplay = () => {
    const cart = getCart();
    const cartCountElement = document.getElementById('cart-count');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalElement = document.getElementById('cart-total');

    // Actualizar burbuja
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
        cartCountElement.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }

    // Renderizar lista
    if (cartItemsContainer && cartTotalElement) {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="text-center text-muted my-5">Tu carrito está vacío.</p>';
            cartTotalElement.textContent = '$0.00';
            return;
        }

        let htmlContent = '<ul class="list-group list-group-flush">';
        
        cart.forEach(item => {
            htmlContent += `
                <li class="list-group-item d-flex justify-content-between align-items-center py-3">
                    <div class="d-flex align-items-center">
                        <img src="${item.thumbnail}" alt="${item.title}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;" class="me-3">
                        <div>
                            <h6 class="mb-0 text-truncate" style="max-width: 150px;">${item.title}</h6>
                            <small class="text-muted">Talla: ${item.size}</small><br>
                            <small class="fw-bold text-primary">$${item.price}</small>
                        </div>
                    </div>
                    <div class="d-flex align-items-center">
                        <button class="btn btn-sm btn-outline-secondary decrease-qty-btn" data-id="${item.id}" data-size="${item.size}">-</button>
                        <span class="mx-2 small">${item.quantity}</span>
                        <button class="btn btn-sm btn-outline-secondary increase-qty-btn" data-id="${item.id}" data-size="${item.size}">+</button>
                        <button class="btn btn-sm text-danger ms-2 remove-from-cart-btn" data-id="${item.id}" data-size="${item.size}"><i class="fas fa-trash"></i></button>
                    </div>
                </li>
            `;
        });

        htmlContent += '</ul>';
        cartItemsContainer.innerHTML = htmlContent;
        
        const total = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        cartTotalElement.textContent = `$${total.toFixed(2)}`;
    }
};

export const setupCartListeners = () => {
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    container.addEventListener('click', (event) => {
        const target = event.target;
        const btn = target.closest('button');
        if (!btn) return;

        const productId = parseInt(btn.dataset.id);
        const size = btn.dataset.size;
        
        if (isNaN(productId)) return;

        if (btn.classList.contains('increase-qty-btn')) updateItemQuantity(productId, size, 1);
        if (btn.classList.contains('decrease-qty-btn')) updateItemQuantity(productId, size, -1);
        if (btn.classList.contains('remove-from-cart-btn')) {
             if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: '¿Eliminar?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Sí',
                    confirmButtonColor: '#2c2c2c'
                }).then((res) => {
                    if (res.isConfirmed) removeFromCart(productId, size);
                });
            } else {
                removeFromCart(productId, size);
            }
        }
    });
};