export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { code, redirectUri, clientId } = body;

    // 1. Exchange the code for the Access Token AND the Refresh Token
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
        throw new Error("Failed to authenticate with bank.");
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token; // <-- THE GOLDEN KEY

    // 2. Fetch all accounts the user just authorised
    const accountsResponse = await fetch('https://api.truelayer.com/data/v1/accounts', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const accountsData = await accountsResponse.json();

    // 3. Filter for spending accounts (Current Accounts, Credit Cards, Savings)
    const spendingAccounts = accountsData.results?.filter(
        acc => ['TRANSACTION', 'CREDIT', 'SAVINGS'].includes(acc.account_type.toUpperCase())
    ) || [];

    if (spendingAccounts.length === 0) {
        return new Response(JSON.stringify({ error: "No spending accounts found" }), { status: 404 });
    }

    // 4. Send the Refresh Token and the list of accounts back to React
    return new Response(JSON.stringify({
        success: true,
        refresh_token: refreshToken,
        accounts: spendingAccounts.map(acc => ({
            account_id: acc.account_id,
            name: acc.display_name || acc.provider?.display_name || "Bank Account",
            type: acc.account_type,
            currency: acc.currency,
            provider_logo: acc.provider?.logo_uri || null
        }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}