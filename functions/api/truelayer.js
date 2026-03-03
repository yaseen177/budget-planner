// FILE: functions/api/truelayer.js

export async function onRequestPost(context) {
    // context.env holds the secrets you set in the Cloudflare Dashboard!
    const { request, env } = context;
  
    try {
      const body = await request.json();
      const { code, redirectUri, clientId } = body;
  
      // We do the secret handshake here on the server, hidden from the browser
      const response = await fetch('https://auth.truelayer-sandbox.com/connect/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: env.TL_CLIENT_ID,
          client_secret: env.TL_CLIENT_SECRET, // Pulls securely from Cloudflare
          redirect_uri: redirectUri,
          code: code,
        }),
      });
  
      const tokenData = await response.json();
  
      return new Response(JSON.stringify(tokenData), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
  
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }