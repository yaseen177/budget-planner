export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { code, redirectUri, clientId } = body;

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
    if (!tokenData.access_token) throw new Error("Failed to authenticate with bank.");

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token; 

    // 1. Fetch Standard Accounts
    const accountsResponse = await fetch('https://api.truelayer.com/data/v1/accounts', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const accountsData = await accountsResponse.json();

    // 2. Fetch Cards (This is where AMEX lives!)
    const cardsResponse = await fetch('https://api.truelayer.com/data/v1/cards', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const cardsData = await cardsResponse.json();

    // 3. Merge them and tag where they came from
    const allAccounts = [
        ...(accountsData.results || []).map(a => ({ ...a, endpoint_type: 'accounts' })),
        ...(cardsData.results || []).map(c => ({ ...c, endpoint_type: 'cards' }))
    ];

    const spendingAccounts = allAccounts.filter(
        acc => !['MORTGAGE', 'LOAN'].includes((acc.account_type || '').toUpperCase())
    );

    if (spendingAccounts.length === 0) {
        return new Response(JSON.stringify({ error: "No spending accounts found" }), { status: 404 });
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
            endpoint_type: acc.endpoint_type // NEW: Tells the frontend if this is an account or a card
        }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}