import { 
    fetchProducts, 
    renderProducts, 
    setupAddToCartListeners, 
    renderPaginationControls 
} from './products.js'; // Asegura la importación de renderPaginationControls
import { setupFilterListeners, setupPriceRangeListener } from './filters.js';
import { updateCartDisplay, setupCartListeners } from './cart.js';

const initializeApp = async () => {
    console.log("Aplicación VestlA iniciada.");

    // 1. Configurar los Listeners de Filtros y Paginación
    setupPriceRangeListener();
    setupFilterListeners();
    
    // 2. Configurar el Carrito de Compras
    setupAddToCartListeners(); 
    setupCartListeners();      
    updateCartDisplay();       
    
    // 3. Cargar y renderizar la primera página de productos
    const productData = await fetchProducts(1); 
    
    // Usa solo el array de productos para renderizar
    renderProducts(productData.products); 
    
    // Inicializa la paginación usando el total que devuelve la API
    renderPaginationControls(productData.total, 1); 
};

document.addEventListener('DOMContentLoaded', initializeApp);