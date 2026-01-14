import { GEMINI_API_KEY, GEMINI_VISION_URL } from './config.js'; // Usamos la URL de Visión
import { searchFromImage } from './filters.js';

let lastDetectedKeywords = null;
let sidebarInstance = null;
let sessionTotalTokens = 0; // Contador de tokens para imágenes

export const setupImageSearch = () => {
    const uploadBtn = document.getElementById('image-search-btn');
    const fileInput = document.getElementById('image-upload-input');
    
    const sidebarEl = document.getElementById('imageAnalysisSidebar');
    const previewImg = document.getElementById('analysis-image-preview');
    const loadingSpinner = document.getElementById('analysis-loading');
    const resultText = document.getElementById('analysis-result-text');
    const searchBtn = document.getElementById('search-similar-btn');

    if (!uploadBtn || !fileInput || !sidebarEl) return;

    sidebarInstance = new bootstrap.Offcanvas(sidebarEl);

    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        sidebarInstance.show();
        previewImg.src = URL.createObjectURL(file);
        previewImg.classList.remove('d-none');
        loadingSpinner.classList.remove('d-none');
        resultText.innerHTML = "Analizando tendencias...";
        searchBtn.classList.add('d-none');
        
        try {
            const base64Image = await fileToBase64(file);
            await analyzeImage(base64Image, file.type);
        } catch (error) {
            console.error("Error procesando imagen:", error);
            resultText.innerHTML = '<span class="text-danger">Ocurrió un error al procesar la imagen.</span>';
            loadingSpinner.classList.add('d-none');
        } finally {
            fileInput.value = ''; 
        }
    });

    searchBtn.addEventListener('click', () => {
        if (lastDetectedKeywords) {
            searchFromImage(lastDetectedKeywords);
            sidebarInstance.hide();
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: '¡Look encontrado!',
                    text: `Buscando: "${lastDetectedKeywords}"`,
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        }
    });
};

// --- FUNCIÓN PRINCIPAL: HABLAR CON GEMINI VISION ---
const analyzeImage = async (base64Data, mimeType) => {
    const loadingSpinner = document.getElementById('analysis-loading');
    const resultText = document.getElementById('analysis-result-text');
    const searchBtn = document.getElementById('search-similar-btn');

    // Prompt (Igual que antes)
    const PROMPT = `
        Actúa como un sistema de etiquetado para un e-commerce de moda.
        Analiza la imagen adjunta.
        Tu tarea es generar un objeto JSON con dos campos:
        1. "description": Una frase corta y elegante en español describiendo la prenda.
        2. "searchQuery": Un término de búsqueda en INGLÉS optimizado (GÉNERO + COLOR + CATEGORÍA).
        
        Ejemplos: "womens red dress", "mens blue shirt", "black handbag".
        NO seas específico. Responde ÚNICAMENTE con el JSON.
    `;

    try {
        const response = await fetch(`${GEMINI_VISION_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: PROMPT },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Data
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 150,
                    response_mime_type: "application/json"
                }
            })
        });

        // --- CORRECCIÓN DEL ERROR 429 ---
        if (response.status === 429) {
            loadingSpinner.classList.add('d-none');
            resultText.innerHTML = `
                <div class="alert alert-warning border-0 small">
                    <i class="fas fa-battery-empty me-2"></i>
                    <strong>IA Agotada:</strong> Has alcanzado el límite de análisis de imágenes por minuto.
                    <br>Espera unos segundos e intenta de nuevo.
                </div>
            `;
            return; // Detenemos aquí para que no lance error en consola
        }
        // -------------------------------

        const data = await response.json();
        
        if (data.error) throw new Error(data.error.message);

        // Reporte de tokens (Igual que antes)
        if (data.usageMetadata) {
            const usage = data.usageMetadata;
            sessionTotalTokens += usage.totalTokenCount;
            console.group("📷 Consumo de Tokens (Gemini Vision)");
            console.log(`📥 Input: ${usage.promptTokenCount}`);
            console.log(`📤 Output: ${usage.candidatesTokenCount}`);
            console.log(`💰 Total: ${usage.totalTokenCount}`);
            console.log(`📈 ACUMULADO: ${sessionTotalTokens}`);
            console.groupEnd();
        }

        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const analysis = JSON.parse(responseText);

        loadingSpinner.classList.add('d-none');
        
        if (analysis.searchQuery) {
            resultText.innerHTML = `
                <p class="fw-bold mb-1">Prenda detectada ✨</p>
                <p class="small text-muted">${analysis.description}</p>
                <p class="small text-primary fst-italic">Buscando: "${analysis.searchQuery}"</p>
            `;
            
            lastDetectedKeywords = analysis.searchQuery;
            searchBtn.classList.remove('d-none');
            searchBtn.innerHTML = `<i class="fas fa-search me-2"></i>Ver Productos`;
        } else {
            resultText.innerHTML = "No pude identificar moda clara en la imagen.";
        }

    } catch (error) {
        console.error("Error API Gemini Vision:", error);
        loadingSpinner.classList.add('d-none');
        resultText.innerHTML = "No pude analizar la imagen. Intenta otra vez.";
    }
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]); 
    reader.onerror = error => reject(error);
});