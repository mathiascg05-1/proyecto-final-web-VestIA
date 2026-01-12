const CART_STORAGE_KEY = 'vestla_shopping_cart';

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

// IMPORTANTE: Ahora recibimos 'size'
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
           cart[itemIndex].quantity = 1; 
        } else {
            saveCart(cart);
        }
    }
};

export const removeFromCart = (productId, size) => {
    let cart = getCart();
    // Filtramos para quitar SOLO ese ID con ESA talla
    cart = cart.filter(item => !(item.id === productId && item.size === size));
    saveCart(cart);
};

const calculateTotal = (cart) => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
};

export const updateCartDisplay = () => {
    const cart = getCart();
    const cartCountElement = document.getElementById('cart-count');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalElement = document.getElementById('cart-total');

    // Actualizar contador del header
    if (cartCountElement) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.textContent = totalItems;
        cartCountElement.style.display = totalItems === 0 ? 'none' : 'block';
    }

    if (cartItemsContainer && cartTotalElement) {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="text-center py-5"><p class="text-muted">Tu bolsa está vacía.</p></div>';
            cartTotalElement.textContent = '$0.00';
            return;
        }

        let htmlContent = '<ul class="list-group list-group-flush">';
        
        cart.forEach(item => {
            // 1. Calcular el subtotal de este item (Precio x Cantidad)
            const itemSubtotal = item.price * item.quantity;

            htmlContent += `
                <li class="list-group-item d-flex align-items-center py-3">
                    <img src="${item.thumbnail}" alt="${item.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" class="me-3">
                    
                    <div class="flex-grow-1">
                        <h6 class="mb-0 text-truncate" style="max-width: 180px;">${item.title}</h6>
                        <small class="text-muted d-block">Talla: <strong>${item.size}</strong></small>
                        
                        <div class="text-muted small mt-1">
                            $${item.price} x ${item.quantity}
                        </div>

                        <div class="fw-bold text-dark mt-1">
                            Total: $${itemSubtotal.toFixed(2)}
                        </div>
                    </div>

                    <div class="d-flex align-items-center gap-2">
                        <button class="btn btn-outline-secondary d-flex align-items-center justify-content-center decrease-qty-btn" 
                                style="width: 35px; height: 35px; padding: 0;" 
                                data-id="${item.id}" data-size="${item.size}">
                            <i class="fas fa-minus fa-xs"></i>
                        </button>

                        <button class="btn btn-outline-secondary d-flex align-items-center justify-content-center increase-qty-btn" 
                                style="width: 35px; height: 35px; padding: 0;" 
                                data-id="${item.id}" data-size="${item.size}">
                            <i class="fas fa-plus fa-xs"></i>
                        </button>

                        <button class="btn btn-outline-danger d-flex align-items-center justify-content-center remove-from-cart-btn ms-2" 
                                style="width: 35px; height: 35px; padding: 0;" 
                                data-id="${item.id}" data-size="${item.size}">
                            <i class="fas fa-trash-alt fa-xs"></i>
                        </button>
                    </div>
                </li>`;
        });

        htmlContent += '</ul>';
        cartItemsContainer.innerHTML = htmlContent;
        
        // Calcular total general
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