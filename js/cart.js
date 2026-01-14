// js/cart.js

const CART_STORAGE_KEY = 'vestla_shopping_cart';

// --- NUEVA FUNCIÓN CRÍTICA PARA EL STOCK ---
// Devuelve cuántas unidades de este producto (ID) hay en total sumando TODAS las tallas
export const getQuantityOfProduct = (productId) => {
    const cart = getCart();
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

// --- AGREGAR (Ahora guardamos el maxStock) ---
export const addToCart = (product, quantity = 1, size = 'Única') => {
    const cart = getCart();
    
    // Validar Stock GLOBAL antes de agregar (Suma de tallas)
    const currentTotalInCart = getQuantityOfProduct(product.id);
    
    // Si lo que ya tengo + lo que quiero agregar supera el stock real
    if (currentTotalInCart + quantity > product.stock) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Stock Insuficiente',
                text: `Solo quedan ${product.stock} unidades en total (tienes ${currentTotalInCart} en el carrito).`,
                confirmButtonColor: '#2c2c2c'
            });
        }
        return; // STOP
    }

    const existingItemIndex = cart.findIndex(item => item.id === product.id && item.size === size);

    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += quantity;
        // Actualizamos el stock máximo por si cambió en la base de datos
        cart[existingItemIndex].maxStock = product.stock; 
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            thumbnail: product.thumbnail,
            quantity: quantity,
            size: size,
            maxStock: product.stock // <--- IMPORTANTE: Guardamos el límite aquí
        });
    }
    saveCart(cart);
};

// --- MODIFICAR CANTIDAD (+/-) EN EL CARRITO ---
export const updateItemQuantity = (productId, size, change) => {
    let cart = getCart();
    const itemIndex = cart.findIndex(item => item.id === productId && item.size === size);

    if (itemIndex === -1) return;

    const item = cart[itemIndex];

    // SI ESTAMOS SUMANDO (+1)
    if (change > 0) {
        // 1. Calculamos cuántos de estos zapatos (en cualquier talla) tiene el usuario YA
        const currentTotalGlobal = getQuantityOfProduct(productId);
        
        // 2. Verificamos contra el límite guardado (item.maxStock)
        if (currentTotalGlobal >= item.maxStock) {
            if (typeof Swal !== 'undefined') {
                const Toast = Swal.mixin({
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 2000
                });
                Toast.fire({
                    icon: "error",
                    title: "¡Stock máximo alcanzado!"
                });
            } else {
                alert("No hay más stock disponible.");
            }
            return; // STOP: No dejamos subir el número
        }
    }

    // Si pasamos la validación, aplicamos el cambio
    cart[itemIndex].quantity += change;

    // Si baja a 0, borrar
    if (cart[itemIndex].quantity <= 0) {
        cart.splice(itemIndex, 1); 
    }
    
    saveCart(cart);
};

export const removeFromCart = (productId, size) => {
    let cart = getCart();
    cart = cart.filter(item => !(item.id === productId && item.size === size));
    saveCart(cart);
};

// --- VACIAR CARRITO (Para el Checkout) ---
export const clearCart = () => {
    localStorage.removeItem(CART_STORAGE_KEY);
    updateCartDisplay();
};

// --- SIMULACIÓN DE CHECKOUT (PAGAR) ---
export const processCheckout = () => {
    const cart = getCart();
    if (cart.length === 0) return;

    const total = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Finalizar Compra',
            html: `
                <div class="text-start">
                    <p class="mb-2">Total a pagar: <strong>$${total.toFixed(2)}</strong></p>
                    <hr>
                    <label class="small text-muted">Dirección de Envío</label>
                    <input type="text" id="checkout-address" class="form-control mb-2" placeholder="Calle, Ciudad...">
                    <label class="small text-muted">Número de Tarjeta (Simulado)</label>
                    <input type="text" class="form-control" placeholder="**** **** **** 1234" disabled value="4242 4242 4242 4242">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Pagar ahora',
            confirmButtonColor: '#2c2c2c',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const address = document.getElementById('checkout-address').value;
                if (!address) {
                    Swal.showValidationMessage('Por favor ingresa una dirección');
                }
                return address;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // Simulación de carga
                let timerInterval;
                Swal.fire({
                    title: 'Procesando pago...',
                    html: 'Conectando con el banco.',
                    timer: 2000,
                    timerProgressBar: true,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                }).then(() => {
                    // Éxito
                    clearCart();
                    Swal.fire({
                        icon: 'success',
                        title: '¡Compra Exitosa!',
                        text: `Tu pedido llegará pronto a: ${result.value}`,
                        confirmButtonColor: '#2c2c2c'
                    });
                    
                    // Cerrar modal del carrito si está abierto
                    const cartModalEl = document.getElementById('cartModal');
                    if (cartModalEl && window.bootstrap) {
                        const modal = bootstrap.Modal.getInstance(cartModalEl);
                        if (modal) modal.hide();
                    }
                });
            }
        });
    }
};

// --- UI DEL CARRITO ---
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
            // Deshabilitar botón de pagar si existe
            const payBtn = document.getElementById('checkout-btn');
            if(payBtn) payBtn.disabled = true;
            return;
        }

        let htmlContent = '<ul class="list-group list-group-flush">';
        
        cart.forEach(item => {
            // Checkeo visual extra: Si maxStock no existe (carritos viejos), asumimos 999
            const limit = item.maxStock || 999; 
            
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
                        <span class="mx-2 small fw-bold">${item.quantity}</span>
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
        
        // Habilitar botón de pagar
        const payBtn = document.getElementById('checkout-btn');
        if(payBtn) payBtn.disabled = false;
    }
};

export const setupCartListeners = () => {
    const container = document.getElementById('cart-items-container');
    const checkoutBtn = document.getElementById('checkout-btn'); // Asegúrate que tu botón en index.html tenga este ID

    // Listener para el botón "Ir a Pagar"
    if (checkoutBtn) {
        // Clonamos para evitar listeners duplicados
        const newBtn = checkoutBtn.cloneNode(true);
        checkoutBtn.parentNode.replaceChild(newBtn, checkoutBtn);
        newBtn.addEventListener('click', processCheckout);
    }

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
             removeFromCart(productId, size);
        }
    });
};