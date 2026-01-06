// Constantes de configuración de la aplicación VestlA

// URL Base de la API de Catálogo de Productos (DummyJSON)
export const DUMMY_JSON_URL = "https://dummyjson.com/products";

// URL Base de la API de Google Gemini (Para el Chatbot con IA)
export const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

// Clave API de Gemini (NOTA: Exponer la clave en el frontend es por fines académicos)
export const GEMINI_API_KEY = "AIzaSyDgoJcI-5Fv3_SomYW4wli89ULPu-TA_os"; 

// Cantidad de productos requerida por página (Mínimo 9 productos por página)
export const PRODUCTS_PER_PAGE = 20;