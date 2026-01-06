import { GEMINI_API_KEY, GEMINI_API_URL } from './config.js';
import { applyFilterFromChat } from './filters.js';

export const setupImageSearch = () => {
    // 1. OBTENER ELEMENTOS CON LOS IDs CORRECTOS (Del HTML del paso 1)
    const uploadBtn = document.getElementById('image-search-btn');      // El botón de la cámara
    const fileInput = document.getElementById('image-upload-input');    // El input oculto

    // 2. CONECTAR EL BOTÓN AL INPUT
    // Cuando hacen clic en la camarita, simulamos un clic en el input de archivo
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
    } else {
        console.error("No se encontraron los elementos del buscador por imagen en el HTML.");
        return; 
    }

    // --- LÓGICA DE PROCESAMIENTO ---

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Feedback visual inmediato
        const originalIcon = uploadBtn.innerHTML;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; // Icono de carga
        uploadBtn.disabled = true;

        try {
            const base64Image = await fileToBase64(file);
            const finalUrl = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;

            // Prompt simple para clasificar
            const prompt = `
                Identifica la prenda principal en esta imagen.
                Responde SOLAMENTE con uno de estos códigos exactos:
                womens-dresses, tops, pants, womens-shoes, mens-shirts, mens-shoes, womens-bags, sunglasses.
                Si no es ropa clara, responde: OTROS.
            `;

            const response = await fetch(finalUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            { inline_data: { mime_type: file.type, data: base64Image } }
                        ]
                    }],
                    generationConfig: { maxOutputTokens: 20 }
                })
            });

            const data = await response.json();
            
            // Recuperar botón
            uploadBtn.innerHTML = originalIcon;
            uploadBtn.disabled = false;

            if (data.error) {
                console.error("Error API:", data.error);
                alert("Error al analizar la imagen.");
                return;
            }

            const category = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            console.log("Categoría detectada:", category);

            if (category && category !== "OTROS") {
                // ÉXITO: Aplicar filtro
                applyFilterFromChat(category);
                
                // (Opcional) Abrir el panel de filtros para mostrar resultados
                const filtersOffcanvas = document.getElementById('filtersOffcanvas');
                if (filtersOffcanvas) {
                    const bsOffcanvas = new bootstrap.Offcanvas(filtersOffcanvas);
                    bsOffcanvas.show();
                }
            } else {
                alert("No pude identificar qué prenda es. Intenta con una foto más clara. 📸");
            }

        } catch (error) {
            console.error(error);
            uploadBtn.innerHTML = originalIcon;
            uploadBtn.disabled = false;
            alert("Error de conexión.");
        } finally {
            fileInput.value = ''; // Limpiar para permitir subir la misma foto otra vez
        }
    };

    // 3. ESCUCHAR EL CAMBIO EN EL INPUT
    if (fileInput) {
        fileInput.addEventListener('change', handleImageUpload);
    }
};