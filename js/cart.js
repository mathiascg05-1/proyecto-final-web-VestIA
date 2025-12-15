const CART_STORAGE_KEY = 'vestla_shopping_cart';

// Función para obtener el carrito del localStorage (Persistencia de datos)
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

// Agrega o incrementa la cantidad de un producto (Requisito 4.1)
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

// Función para eliminar un producto del carrito (Requisito 4.3)
export const removeFromCart = (productId) => {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
};

// Función para calcular el total de la compra (Requisito 4.4)
export const calculateTotal = (cart) => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// Función para mostrar el resumen del carrito en el Modal (Requisito 4.2)
export const updateCartDisplay = () => {
    const cart = getCart();
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalElement = document.getElementById('cart-total');
    const cartCountElement = document.getElementById('cart-count'); // Contador en el Navbar
    
    if (!cartItemsContainer || !cartTotalElement) return;

    // Actualiza el contador de ítems en el navbar
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
            <div class="d-flex justify-content-between align-items-center border-bottom py-2" data-product-id="${item.id}">
                <div>
                    <img src="${item.thumbnail}" alt="${item.title}" style="width: 50px;" class="me-3 rounded">
                    <span>${item.title}</span>
                </div>
                <div class="text-end">
                    <p class="mb-0 small text-muted">$${item.price.toFixed(2)} x ${item.quantity}</p>
                    <p class="fw-bold mb-0">$${itemTotal.toFixed(2)}</p>
                    <button class="btn btn-sm btn-outline-danger mt-1 remove-from-cart-btn" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    cartItemsContainer.innerHTML = htmlContent;
    cartTotalElement.textContent = `$${calculateTotal(cart).toFixed(2)}`;
};

// Inicializa los listeners para los botones de eliminar en el carrito
export const setupCartListeners = () => {
    // Escucha clics en el botón de eliminar del carrito (delegación de eventos)
    document.getElementById('cart-items-container')?.addEventListener('click', (event) => {
        const target = event.target.closest('.remove-from-cart-btn');
        if (target) {
            const productId = parseInt(target.dataset.id);
            if (!isNaN(productId)) {
                removeFromCart(productId);
            }
        }
    });
};