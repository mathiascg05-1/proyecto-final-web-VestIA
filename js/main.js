import { 
    fetchProducts, 
    renderProducts, 
    setupAddToCartListeners, 
    renderPaginationControls 
} from './products.js';
import { setupFilterListeners, setupPriceRangeListener } from './filters.js';
import { updateCartDisplay, setupCartListeners } from './cart.js';
import { setupChatbot } from './chatbot.js';
import { setupImageSearch } from './imageSearch.js';
import { setupProfileListeners } from './profile.js';

const initializeApp = async () => {
    console.log("Aplicación VestlA iniciada.");

    // 1. Configurar Listeners
    setupPriceRangeListener();
    setupFilterListeners();
    setupAddToCartListeners();
    setupCartListeners();      
    updateCartDisplay();    
    setupChatbot();   
    setupImageSearch();
    setupProfileListeners();
    
    // 2. Cargar productos iniciales (Página 1)
    const productData = await fetchProducts(1); 
    renderProducts(productData.products); 
    renderPaginationControls(productData.total, 1); 
};

document.addEventListener('DOMContentLoaded', initializeApp);