import { GEMINI_API_KEY, GEMINI_API_URL } from './config.js';
import { applyFilterFromChat } from './filters.js';

export const setupChatbot = () => {
    const toggler = document.getElementById('chatbot-toggler');
    const window = document.getElementById('chatbot-window');
    const closeBtn = document.getElementById('chatbot-close');
    const sendBtn = document.getElementById('chat-send-btn');
    const input = document.getElementById('chat-input');
    const messagesContainer = document.getElementById('chat-messages');

    let isLoading = false;
    
    // NUEVO: Contador para llevar la cuenta de la sesión
    let sessionTotalTokens = 0; 

    // --- 1. MEMORIA Y PERSONALIDAD ---
    const VALID_CATEGORIES = [
        "womens-dresses", "tops", "womens-shoes", "mens-shirts", 
        "mens-shoes", "mens-watches", "womens-watches", "womens-bags", 
        "womens-jewellery", "sunglasses", "automotive", "motorcycle", "lighting"
    ];

    // Instrucción Maestra (System Prompt)
    const SYSTEM_PROMPT = `
        Eres "Vesta", la estilista experta de la boutique VestlA. Responde de forma breve y amigable.
        Tu tono es chic, profesional, empático y usas emojis de moda.
        
        OBJETIVO: Ayudar al usuario a encontrar productos basándote en sus gustos.
        
        REGLA DE ORO (IMPORTANTE):
        Cuando recomiendes un tipo de producto específico, DEBES incluir un comando oculto al final de tu frase para generar un botón.
        El formato es: {{FILTER|categoria_exacta|Texto del Botón}}
        
        Las categorías válidas son: ${VALID_CATEGORIES.join(", ")}.
        
        Ejemplos:
        - Si piden vestidos: "¡Tengo unos vestidos divinos para esa noche! {{FILTER|womens-dresses|Ver Vestidos}}"
        - Si piden relojes: "Un buen reloj eleva cualquier outfit. {{FILTER|mens-watches|Ver Relojes}}"
        
        Si no hay una categoría exacta para lo que piden, solo da consejos de estilo sin el comando.

        IMPORTANTE: Tus respuestas deben ser MUY BREVES (máximo 40 palabras). Ahorra palabras.
    `;

    // Historial de la conversación
    let chatHistory = [
        {
            role: "user",
            parts: [{ text: SYSTEM_PROMPT }]
        },
        {
            role: "model",
            parts: [{ text: "¡Entendido! Soy Vesta, lista para ayudar con estilo. ✨" }]
        }
    ];

    // --- FUNCIONES VISUALES ---
    const toggleChat = () => {
        window.classList.toggle('d-none');
        if (!window.classList.contains('d-none')) input.focus();
    };

    if (toggler) toggler.addEventListener('click', toggleChat);
    if (closeBtn) closeBtn.addEventListener('click', toggleChat);

    const addMessage = (text, sender) => {
        const div = document.createElement('div');
        div.className = sender === 'user' ? 'chat-message-user' : 'chat-message-bot';
        
        let cleanText = text.replace(/\*\*/g, '').replace(/\*/g, ''); 
        const regex = /\{\{FILTER\|(.*?)\|(.*?)\}\}/;
        const match = cleanText.match(regex);

        if (match && sender === 'bot') {
            const messageText = cleanText.replace(match[0], '').trim();
            const categoryToFilter = match[1];
            const buttonLabel = match[2];

            div.innerHTML = messageText.replace(/\n/g, '<br>');
            
            const actionBtn = document.createElement('button');
            actionBtn.className = 'btn btn-sm btn-dark mt-2 w-100 rounded-pill';
            actionBtn.innerHTML = `<i class="fas fa-search"></i> ${buttonLabel}`;
            actionBtn.onclick = () => {
                applyFilterFromChat(categoryToFilter); 
            };
            div.appendChild(actionBtn);

        } else {
            div.innerHTML = cleanText.replace(/\n/g, '<br>');
        }
        
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    const showTypingIndicator = () => {
        const div = document.createElement('div');
        div.id = 'typing-indicator';
        div.className = 'chat-message-bot text-muted fst-italic';
        div.innerHTML = '<small><i class="fas fa-circle-notch fa-spin"></i> Vesta está escribiendo...</small>';
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    const removeTypingIndicator = () => {
        document.getElementById('typing-indicator')?.remove();
    };

    // --- LÓGICA DE ENVÍO ---
    const handleSend = async () => {
        const userText = input.value.trim();
        if (!userText || isLoading) return;

        addMessage(userText, 'user');
        input.value = '';
        isLoading = true;
        showTypingIndicator();

        chatHistory.push({
            role: "user",
            parts: [{ text: userText }]
        });

        const finalUrl = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;

        try {
            // Lógica de ahorro (Historial Recortado)
            let historyToSend = chatHistory;
            if (chatHistory.length > 7) {
                historyToSend = [
                    chatHistory[0], 
                    ...chatHistory.slice(-6) 
                ];
            }

            const response = await fetch(finalUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: historyToSend,
                    generationConfig: {
                        maxOutputTokens: 100,
                        temperature: 0.7
                    }
                })
            });


            if (response.status === 429) {
                addMessage("¡Ups! He hablado demasiado por hoy y me quedé sin energía. 🔋 Intenta más tarde.", 'bot');
                removeTypingIndicator();
                return; 
            }

            const data = await response.json();
            removeTypingIndicator();

            if (data.error) {
                console.error("Error API:", data.error);
                addMessage("Lo siento, tuve un pequeño mareo fashionista. 😵‍💫 ¿Me repites?", 'bot');
            } else {
                const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no entendí.";
                
                // --- REPORTE DE TOKENS EN CONSOLA ---
                if (data.usageMetadata) {
                    const usage = data.usageMetadata;
                    sessionTotalTokens += usage.totalTokenCount;

                    console.group("--- Consumo de Tokens (Gemini) ---");
                    console.log(`Input (Historial + Prompt): ${usage.promptTokenCount}`);
                    console.log(`Output (Respuesta): ${usage.candidatesTokenCount}`);
                    console.log(`Total esta interacción: ${usage.totalTokenCount}`);
                    console.log(`--------------------------------`);
                    console.log(`ACUMULADO SESIÓN: ${sessionTotalTokens}`);
                    console.groupEnd();
                }
                // -------------------------------------

                chatHistory.push({
                    role: "model",
                    parts: [{ text: botReply }]
                });

                addMessage(botReply, 'bot');
            }

        } catch (error) {
            console.error(error);
            removeTypingIndicator();
            addMessage("Error de conexión. Revisa tu internet.", 'bot');
        } finally {
            isLoading = false;
        }
    };

    if (sendBtn) sendBtn.addEventListener('click', handleSend);
    if (input) input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
};