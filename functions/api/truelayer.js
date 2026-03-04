export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { code, redirectUri, clientId } = body;

    // Safety check: ensure the app sent the connection details
    if (!code || !redirectUri || !clientId) {
        return new Response(JSON.stringify({ error: "Missing connection details from the app." }), { status: 400 });
    }

    const tokenResponse = await fetch('https://auth.truelayer.com/connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: env.TL_CLIENT_SECRET, 
        redirect_uri: redirectUri,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
        // This will print the exact reason TrueLayer rejected the connection
        return new Response(JSON.stringify({ error: `Token Exchange Failed: ${JSON.stringify(tokenData)}` }), { status: 400 });
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token; 

    // 1. Fetch Standard Accounts (Safely)
    let accountsResults = [];
    try {
        const accRes = await fetch('https://api.truelayer.com/data/v1/accounts', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (accRes.ok) {
            const accData = await accRes.json();
            accountsResults = accData.results || [];
        }
    } catch (e) {
        console.error("Failed to fetch accounts endpoint");
    }

    // 2. Fetch Cards (Safely - won't crash if Barclays rejects it!)
    let cardsResults = [];
    try {
        const cardRes = await fetch('https://api.truelayer.com/data/v1/cards', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (cardRes.ok) {
            const cardData = await cardRes.json();
            cardsResults = cardData.results || [];
        }
    } catch (e) {
        console.error("Failed to fetch cards endpoint");
    }

    // 3. Merge them together
    const allAccounts = [
        ...accountsResults.map(a => ({ ...a, endpoint_type: 'accounts' })),
        ...cardsResults.map(c => ({ ...c, endpoint_type: 'cards' }))
    ];

    const spendingAccounts = allAccounts.filter(
        acc => !['MORTGAGE', 'LOAN'].includes((acc.account_type || '').toUpperCase())
    );

    if (spendingAccounts.length === 0) {
        return new Response(JSON.stringify({ error: "No eligible spending accounts found." }), { status: 404 });
    }

    return new Response(JSON.stringify({
        success: true,
        refresh_token: refreshToken,
        accounts: spendingAccounts.map(acc => ({
            account_id: acc.account_id,
            name: acc.display_name || acc.provider?.display_name || "Bank Account",
            type: acc.account_type || 'CARD',
            currency: acc.currency,
            provider_logo: acc.provider?.logo_uri || null,
            provider_id: acc.provider?.provider_id || "unknown",
            endpoint_type: acc.endpoint_type 
        }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}