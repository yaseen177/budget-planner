// functions/api/clean-merchants.js

export async function onRequestPost({ request, env }) {
    try {
        // 1. Parse the JSON payload sent from Transactions.jsx
        const { prompt, data } = await request.json();
        
        // 2. Grab the secret key safely from Cloudflare's env bindings
        const GEMINI_API_KEY = env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            console.error("Missing Gemini API Key in Cloudflare Secrets.");
            return new Response(JSON.stringify({ error: 'Server configuration error' }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 3. Construct the exact prompt for Gemini
        const fullPrompt = `
        You are a precise UK banking data extraction API. You MUST return ONLY a valid JSON object mapping the messy strings to the clean strings. No markdown formatting, no conversational text.
        
        ${prompt}
        
        Here is the array of messy names to clean:
        ${JSON.stringify(data)}
        `;

        // 4. Securely call the Gemini API
        const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: fullPrompt }]
                }],
                generationConfig: {
                    temperature: 0.1, // Low temperature keeps it strictly factual
                    responseMimeType: "application/json" // Forces guaranteed, parseable JSON
                }
            })
        });

        const result = await apiResponse.json();
        
        if (result.error) {
            throw new Error(result.error.message);
        }

        // 5. Extract the clean JSON string provided by Gemini
        const cleanJsonString = result.candidates[0].content.parts[0].text;
        
        // 6. Return the modern Cloudflare Response object back to the frontend
        return new Response(cleanJsonString, {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("AI API Error:", error);
        return new Response(JSON.stringify({ error: 'Failed to process AI request' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}