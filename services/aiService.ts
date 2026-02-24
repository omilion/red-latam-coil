const WP_URL = import.meta.env.VITE_WP_URL || 'https://redlatamcoil.com/backend';
const AI_PROXY_URL = `${WP_URL}/wp-json/rlc/v1/ai/generate`;
const GEMINI_MODEL = 'gemini-3-flash-preview';

console.log(`RLC AI Service: Proxy mode via WordPress backend, Model: ${GEMINI_MODEL}`);

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const callGeminiProxy = async (prompt: string, maxRetries = 3): Promise<any> => {
    const token = localStorage.getItem('rlc_token');
    let lastError: any;

    for (let i = 0; i <= maxRetries; i++) {
        try {
            const response = await fetch(AI_PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-WP-Nonce': localStorage.getItem('rlc_nonce') || ''
                },
                body: JSON.stringify({ prompt, model: GEMINI_MODEL })
            });

            if (response.status === 429) {
                const waitTime = Math.pow(2, i) * 1000;
                console.warn(`AI Proxy 429: Rate limited. Retrying in ${waitTime}ms... (Attempt ${i + 1}/${maxRetries + 1})`);
                await delay(waitTime);
                continue;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Error AI Proxy: ${response.status} - ${errorData.message || 'Unknown error'}`);
            }

            return await response.json();
        } catch (error) {
            lastError = error;
            if (i === maxRetries) break;
            const waitTime = Math.pow(2, i) * 1000;
            console.warn(`AI Service Retry: ${error}. Retrying in ${waitTime}ms...`);
            await delay(waitTime);
        }
    }
    throw lastError;
};

export const aiService = {
    /**
     * Formatea un texto plano a un JSON de Programa de Evento.
     */
    async formatEventProgram(text: string): Promise<string> {
        const prompt = `
        Eres un asistente experto en organización de eventos profesionales.
        Tu tarea es convertir el siguiente texto desordenado en un programa estructurado en formato JSON.
        
        REGLAS CRÍTICAS:
        1. Devuelve ÚNICAMENTE el código JSON, sin bloques de código, sin explicaciones, sin texto adicional. Debe ser un array de objetos.
        2. El formato de cada objeto debe ser: {"time": "HH:MM", "activity": "📝 Descripción con Emojis"}.
        3. Si el texto no tiene horas, asume intervalos lógicos empezando a las 09:00.
        4. Mejora las descripciones para que suenen profesionales y atractivas.
        5. Usa emojis relevantes para cada actividad.
        
        TEXTO A PROCESAR:
        ${text}
        
        SALIDA ESPERADA (Array JSON):
        `;

        try {
            const data = await callGeminiProxy(prompt);
            let result = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

            const jsonMatch = result.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                result = jsonMatch[0];
            } else {
                result = '[]';
            }

            return result;
        } catch (error) {
            console.error("AI Service Error (formatProgram):", error);
            throw error;
        }
    },

    /**
     * Formatea un texto plano a un JSON de Objetivos de Evento.
     */
    async formatEventObjectives(text: string): Promise<string> {
        const prompt = `
        Eres un asistente experto en educación y eventos académicos.
        Tu tarea es convertir el siguiente texto en una lista de objetivos profesionales en formato JSON.
        
        REGLAS CRÍTICAS:
        1. Devuelve ÚNICAMENTE el código JSON. Debe ser un array de strings.
        2. Formato: ["🎯 Objetivo 1", "🚀 Objetivo 2", ...].
        3. Usa emojis relevantes al inicio de cada objetivo.
        4. No incluyas explicaciones ni bloques de código markdown si es posible, o asegúrate de que el JSON sea válido.
        
        TEXTO A PROCESAR:
        ${text}
        
        SALIDA ESPERADA:
        Un array JSON de strings.
        `;

        try {
            const data = await callGeminiProxy(prompt);
            let result = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

            const jsonMatch = result.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                result = jsonMatch[0];
            } else {
                result = '[]';
            }

            return result;
        } catch (error) {
            console.error("AI Service Error (formatObjectives):", error);
            throw error;
        }
    },

    /**
     * Mejora el formato y estructura de un texto para el cuerpo de un contenido.
     */
    async formatContent(text: string): Promise<string> {
        const prompt = `
        Eres un experto en redactar beneficios concisos para membresías de una red académica (Red LatAm COIL).
        Tu tarea es extraer los beneficios clave del texto y entregarlos en una LISTA HTML REFINADA.

        REGLAS CRÍTICAS:
        1. Devuelve ÚNICAMENTE el código HTML de una lista <ul> con sus <li>.
        2. NO incluyas <h2>, <h3> ni párrafos <p> de introducción o conclusión.
        3. NO uses emojis ni emoticonos.
        4. Cada punto de la lista debe ser breve y directo (máximo 15 palabras por punto).
        5. Mantén la información original, solo mejora la redacción para que sea profesional.
        6. No incluyas bloques de código markdown (\`\`\`html), solo el texto HTML final.
        
        TEXTO A PROCESAR:
        ${text}
        
        CONTENIDO FORMATEADO (SOLO <ul>):
        `;

        try {
            const data = await callGeminiProxy(prompt);
            let result = data.candidates?.[0]?.content?.parts?.[0]?.text || text;
            result = result.replace(/```html/g, '').replace(/```/g, '').trim();

            return result;
        } catch (error) {
            console.error("AI Service Error (formatContent):", error);
            throw error;
        }
    },

    /**
     * Traduce un texto de español a inglés (o viceversa usando Gemini).
     */
    async translateText(text: string, targetLang: 'en' | 'es'): Promise<string> {
        if (!text || text.trim() === '') return '';

        const prompt = `
        Eres un traductor profesional experto en temas académicos e internacionalización.
        Traduce el siguiente texto al ${targetLang === 'en' ? 'inglés' : 'español'}.
        
        REGLAS:
        1. Mantén un tono profesional y académico.
        2. NO añadas explicaciones ni comentarios. Solo devuelve la traducción.
        3. SI el texto tiene etiquetas HTML, MANTÉN las etiquetas intactas en su posición original.
        4. No inventes información.
        
        TEXTO A TRADUCIR:
        ${text}
        
        TRADUCCIÓN:
        `;

        try {
            const data = await callGeminiProxy(prompt);
            return data.candidates?.[0]?.content?.parts?.[0]?.text || text;
        } catch (error) {
            console.error("AI Service Error (translateText):", error);
            return text;
        }
    }
};
