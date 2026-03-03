// FILE: functions/api/truelayer.js

export async function onRequestPost(context) {
    const { request, env } = context;
  
    try {
      const body = await request.json();
      const { code, redirectUri, clientId } = body;
  
      // We do the secret handshake here on the server
      const response = await fetch('https://auth.truelayer-sandbox.com/connect/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId, // Comes from React
          client_secret: env.TL_CLIENT_SECRET, // <--- Pulls securely from Cloudflare Dashboard!
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