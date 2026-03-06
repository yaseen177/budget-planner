// functions/api/clean-merchants.js

export async function onRequestPost({ request, env }) {
    try {
        // 1. Parse the JSON payload sent from Transactions.jsx
        const { prompt, data } = await request.json();
        
        // 2. Grab the secret key
        const GEMINI_API_KEY = env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            console.error("Missing Gemini API Key in Cloudflare Secrets.");
            return new Response(JSON.stringify({ error: 'Server configuration error' }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // --- CLOUDFLARE MAGIC: SILENT GEOLOCATION ---
        // Cloudflare automatically geolocates the user's IP address for free
        const city = request.cf?.city || "";
        const region = request.cf?.region || "";
        
        let locationContext = "The user is based in the United Kingdom.";
        if (city || region) {
            locationContext = `The user is based in or around ${city}, ${region}, United Kingdom. Use this geographical context to decode local acronyms (e.g., local councils, hospitals, transport).`;
        }
        // --------------------------------------------

        // 3. Construct the exact prompt for Gemini
        const fullPrompt = `
        You are an elite UK financial data sanitisation AI. Your exact job is to clean messy, 18-character truncated BACS/Faster Payments strings into official, highly recognisable consumer brand names.

        THE USER CONTEXT:
        ${locationContext}

        CRITICAL RULES:
        1. STRIP PAYMENT PROCESSORS: Remove all prefixes/suffixes like "CRV*" (Curve), "PP*" or "PayPal *", "SumUp *", "ZTL", "iZettle *", "IZ *", "Stripe", "Gpay", "Apple Pay", or "APL*".
        2. STRIP LOCATIONS BUT KEEP SUB-BRANDS: Remove city names, street names, and store numbers (e.g., "TESCO STORES 3241 LONDON" -> "Tesco", "Boots nottingham" -> "Boots"). HOWEVER, you MUST preserve distinct operational sub-brands (e.g., keep "Boots Opticians", "Tesco Express", "Sainsbury's Local", "Tesco Petrol", "Asda Fuel").
        3. DECODE UK GOVERNMENT & UTILITIES: Expand heavily abbreviated council and government payments (e.g., "DVLA", "HMRC", "TV LICENCE"). Convert "Ctax" or "C.Tax" to "Council Tax" appended to the local council name.
        4. STRIP LEGAL & BANKING JUNK: Remove "Ltd", "Limited", "Plc", "LLP", "Direct Debit", "DD", "BACS", "VIS", "POS", "STDO", and random 16-digit reference numbers.
        5. CLEAN UK TRANSPORT: "TFL GOV UK" or "TFL ROAD CHARGE" -> "Transport for London". "LUL" -> "London Underground". "MFG" -> "Motor Fuel Group".
        6. BRAND FORMATTING: Use official brand capitalisation and punctuation (e.g., "McDonald's", "Nando's", "EE", "H&M", "B&Q", "IKEA").
        7. UNIDENTIFIABLE: If it is clearly a private individual's name (e.g., "Mr J Smith") or completely unidentifiable, return the original string neatly formatted in Title Case without guessing.
        8. STRICT OUTPUT: You MUST return ONLY a valid JSON object mapping the messy strings to the clean strings. No markdown formatting, no conversational text.
        
        ${prompt}
        
        Here is the array of messy names to clean:
        ${JSON.stringify(data)}
        `;

        // 4. Securely call the Gemini API
        const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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
        // Log it to your terminal
        console.error("AI API Error Details:", error.message || error);
        
        // Send the EXACT error to the frontend so we can see it!
        return new Response(JSON.stringify({ 
            error: 'Failed to process AI request',
            details: error.message || String(error)
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}