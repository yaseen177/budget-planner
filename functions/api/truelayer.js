export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { code, redirectUri, clientId } = body;

    if (!code || !redirectUri || !clientId) {
        return new Response(JSON.stringify({ error: "Missing connection details." }), { status: 400 });
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
    
    // FIX 1: Null check on the token itself
    if (!tokenData || !tokenData.access_token) {
        return new Response(JSON.stringify({ error: `Token Exchange Failed: ${JSON.stringify(tokenData || 'No response')}` }), { status: 400 });
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
            // FIX 2: Ensure results actually exists before mapping
            accountsResults = (accData && accData.results) ? accData.results : [];
        }
    } catch (e) { console.error("Accounts fetch failed"); }

    // 2. Fetch Cards (Safely)
    let cardsResults = [];
    try {
        const cardRes = await fetch('https://api.truelayer.com/data/v1/cards', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (cardRes.ok) {
            const cardData = await cardRes.json();
            // FIX 3: Ensure results actually exists before mapping
            cardsResults = (cardData && cardData.results) ? cardData.results : [];
        }
    } catch (e) { console.error("Cards fetch failed"); }

    // 3. Merge them together (Ensuring we don't map over null)
    const safeAccounts = Array.isArray(accountsResults) ? accountsResults : [];
    const safeCards = Array.isArray(cardsResults) ? cardsResults : [];

    const allAccounts = [
        ...safeAccounts.map(a => ({ ...a, endpoint_type: 'accounts' })),
        ...safeCards.map(c => ({ ...c, endpoint_type: 'cards' }))
    ];

    // FIX 4: Final safety check on account type before filtering
    const spendingAccounts = allAccounts.filter(acc => {
        if (!acc || !acc.account_type) return true; // Keep it if we aren't sure
        return !['MORTGAGE', 'LOAN'].includes(acc.account_type.toUpperCase());
    });

    if (spendingAccounts.length === 0) {
        return new Response(JSON.stringify({ error: "No eligible accounts found." }), { status: 404 });
    }

    return new Response(JSON.stringify({
        success: true,
        refresh_token: refreshToken,
        accounts: spendingAccounts.map(acc => ({
            account_id: acc.account_id || 'unknown',
            name: acc.display_name || acc.provider?.display_name || "Bank Account",
            type: acc.account_type || 'CARD',
            currency: acc.currency || 'GBP',
            provider_logo: acc.provider?.logo_uri || null,
            provider_id: acc.provider?.provider_id || "unknown",
            endpoint_type: acc.endpoint_type || 'accounts'
        }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // If it still crashes, this will catch the line number and message
    return new Response(JSON.stringify({ error: `Final Catch: ${error.message}` }), { status: 500 });
  }
}