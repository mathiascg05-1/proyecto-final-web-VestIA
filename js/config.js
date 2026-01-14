// Constantes de configuración de la aplicación VestlA

// URL Base de la API de Catálogo de Productos (DummyJSON)
export const DUMMY_JSON_URL = "https://dummyjson.com/products";

// URL Base de la API de Google Gemini (Para el Chatbot con IA)
export const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

// Clave API de Gemini (NOTA: Exponer la clave en el frontend es por fines académicos)
export const GEMINI_API_KEY = "AIzaSyDujbIBFRi7RsyZ2El3Gia5D5cu3riU8Rg"; 

// MODELO 2: Para Imágenes (Multimodal potente)
export const GEMINI_VISION_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";

// Cantidad de productos requerida por página (Mínimo 9 productos por página)
export const PRODUCTS_PER_PAGE = 20;

