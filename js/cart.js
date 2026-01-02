const CART_STORAGE_KEY = 'vestla_shopping_cart';

// Función para obtener el carrito del localStorage
export const getCart = () => {
    try {
        const cartData = localStorage.getItem(CART_STORAGE_KEY);
        return cartData ? JSON.parse(cartData) : [];
    } catch (e) {
        console.error("Error cargando el carrito de localStorage:", e);
        return [];
    }
};

// Función para guardar el carrito en el localStorage
const saveCart = (cart) => {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        updateCartDisplay(); 
    } catch (e) {
        console.error("Error guardando el carrito en localStorage:", e);
    }
};

// Agrega o incrementa la cantidad de un producto
export const addToCart = (product, quantity = 1) => {
    const cart = getCart();
    const existingItemIndex = cart.findIndex(item => item.id === product.id);

    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            thumbnail: product.thumbnail,
            quantity: quantity,
        });
    }

    saveCart(cart);
};

// --- NUEVA FUNCIÓN: Actualizar cantidad (Incrementar/Decrementar) ---
export const updateItemQuantity = (productId, change) => {
    let cart = getCart();
    const itemIndex = cart.findIndex(item => item.id === productId);

    if (itemIndex > -1) {
        cart[itemIndex].quantity += change;

        // Si la cantidad llega a 0 o menos, eliminamos el producto
        if (cart[itemIndex].quantity <= 0) {
            cart = cart.filter(item => item.id !== productId);
        }
        
        saveCart(cart);
    }
};

// Función para eliminar un producto del carrito
export const removeFromCart = (productId) => {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
};

// Función para calcular el total
export const calculateTotal = (cart) => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// --- MODIFICADO: updateCartDisplay con botones de cantidad ---
export const updateCartDisplay = () => {
    const cart = getCart();
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalElement = document.getElementById('cart-total');
    const cartCountElement = document.getElementById('cart-count');
    
    if (!cartItemsContainer || !cartTotalElement) return;

    if (cartCountElement) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.textContent = totalItems;
    }
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-center">Tu carrito de compras está vacío.</p>';
        cartTotalElement.textContent = '$0.00';
        return;
    }
    
    let htmlContent = '';
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        htmlContent += `
            <div class="d-flex justify-content-between align-items-center border-bottom py-3" data-product-id="${item.id}">
                <div class="d-flex align-items-center">
                    <img src="${item.thumbnail}" alt="${item.title}" style="width: 50px;" class="me-3 rounded">
                    <div>
                        <h6 class="mb-0">${item.title}</h6>
                        <small class="text-muted">$${item.price.toFixed(2)} c/u</small>
                    </div>
                </div>
                <div class="text-end">
                    <div class="input-group input-group-sm mb-1" style="width: 100px;">
                        <button class="btn btn-outline-secondary decrease-qty-btn" data-id="${item.id}">-</button>
                        <span class="form-control text-center">${item.quantity}</span>
                        <button class="btn btn-outline-secondary increase-qty-btn" data-id="${item.id}">+</button>
                    </div>
                    <p class="fw-bold mb-0">$${itemTotal.toFixed(2)}</p>
                    <button class="btn btn-link text-danger p-0 small remove-from-cart-btn" data-id="${item.id}">
                        Eliminar
                    </button>
                </div>
            </div>
        `;
    });

    cartItemsContainer.innerHTML = htmlContent;
    cartTotalElement.textContent = `$${calculateTotal(cart).toFixed(2)}`;
};

// --- MODIFICADO: setupCartListeners para manejar +/- ---
export const setupCartListeners = () => {
    const container = document.getElementById('cart-items-container');
    
    if (!container) return;

    container.addEventListener('click', (event) => {
        const target = event.target;
        const productId = parseInt(target.closest('[data-id]')?.dataset.id);
        
        if (isNaN(productId)) return;

        // Lógica para el botón Incrementar (+)
        if (target.classList.contains('increase-qty-btn')) {
            updateItemQuantity(productId, 1);
        }

        // Lógica para el botón Decrementar (-)
        if (target.classList.contains('decrease-qty-btn')) {
            updateItemQuantity(productId, -1);
        }

        // Lógica para el botón Eliminar
        if (target.classList.contains('remove-from-cart-btn') || target.closest('.remove-from-cart-btn')) {
            removeFromCart(productId);
        }
    });
};