import { GEMINI_API_KEY, GEMINI_API_URL } from './config.js';
import { searchFromImage } from './filters.js';

let lastDetectedKeywords = null;
let sidebarInstance = null;

export const setupImageSearch = () => {
    const uploadBtn = document.getElementById('image-search-btn');
    const fileInput = document.getElementById('image-upload-input');
    
    // Elementos de la barra lateral
    const sidebarEl = document.getElementById('imageAnalysisSidebar');
    const previewImg = document.getElementById('analysis-image-preview');
    const loadingSpinner = document.getElementById('analysis-loading');
    const resultText = document.getElementById('analysis-result-text');
    const searchBtn = document.getElementById('search-similar-btn');

    if (!uploadBtn || !fileInput || !sidebarEl) return;

    sidebarInstance = new bootstrap.Offcanvas(sidebarEl);

    // Click en botón -> Click en input file
    uploadBtn.addEventListener('click', () => fileInput.click());

    // Click en "Ver productos similares"
    searchBtn.addEventListener('click', () => {
        if (lastDetectedKeywords) {
            // Usamos la NUEVA función de búsqueda general
            searchFromImage(lastDetectedKeywords);
            sidebarInstance.hide();
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'Buscando...',
                    text: `Resultados para: "${lastDetectedKeywords}"`,
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        }
    });

    // Al seleccionar archivo
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset UI
        sidebarInstance.show();
        previewImg.style.display = 'none';
        loadingSpinner.classList.remove('d-none');
        resultText.innerHTML = '<i class="fas fa-magic me-2"></i>Analizando visualmente...';
        searchBtn.disabled = true;
        lastDetectedKeywords = null;

        try {
            const base64Image = await fileToBase64(file);
            
            previewImg.src = `data:${file.type};base64,${base64Image}`;
            previewImg.style.display = 'block';

            // --- PROMPT MEJORADO PARA BÚSQUEDA FLEXIBLE ---
            // Le pedimos a Gemini que actúe como motor de búsqueda
            const prompt = `
                Actúa como un experto en e-commerce. Analiza la imagen y genera un JSON con 2 campos:
                1. "description": Breve descripción en ESPAÑOL de lo que ves (color, tipo, estilo).
                2. "searchQuery": 2 o 3 palabras clave en INGLÉS para buscar este producto en una base de datos global. 
                   Ejemplos: "red lipstick", "denim jacket", "leather handbag", "running shoes".
                   Si no estás seguro, usa términos generales.
            `;

            const requestBody = {
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: file.type, data: base64Image } }
                    ]
                }],
                generationConfig: { response_mime_type: "application/json" }
            };

            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            let analysis = { description: "No pude identificar el objeto.", searchQuery: "" };
            try {
                analysis = JSON.parse(responseText);
            } catch (jsonError) {
                console.error("Error JSON:", jsonError);
            }

            // Mostrar resultado
            resultText.innerHTML = analysis.description;
            
            if (analysis.searchQuery) {
                lastDetectedKeywords = analysis.searchQuery;
                searchBtn.disabled = false;
                searchBtn.innerHTML = `<i class="fas fa-search me-2"></i>Buscar "${analysis.searchQuery}"`;
            } else {
                resultText.innerHTML += "<br><br>No encontré términos de búsqueda claros.";
            }

        } catch (error) {
            console.error("Error análisis:", error);
            resultText.innerHTML = '<span class="text-danger">Error de conexión.</span>';
        } finally {
            loadingSpinner.classList.add('d-none');
            fileInput.value = ''; 
        }
    });
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]); 
    reader.onerror = error => reject(error);
});