export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { code, redirectUri, clientId } = body;

    // 1. LIVE Token Endpoint
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

    // 2. LIVE Accounts Endpoint
    const accountsResponse = await fetch('https://api.truelayer.com/data/v1/accounts', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const accountsData = await accountsResponse.json();

    // 3. Find the Mortgage Account
    const targetAccount = accountsData.results?.find(
        acc => acc.account_type === 'mortgage' || acc.account_type === 'loan'
    );

    if (!targetAccount) {
        return new Response(JSON.stringify({ error: "No mortgage accounts found" }), { status: 404 });
    }

    // 4. LIVE Balance Endpoint
    const balanceResponse = await fetch(`https://api.truelayer.com/data/v1/accounts/${targetAccount.account_id}/balance`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const balanceData = await balanceResponse.json();
    const liveBalance = balanceData.results?.[0]?.current || 0;

    // 5. Send data back to the frontend
    return new Response(JSON.stringify({
        success: true,
        mortgage: {
            name: targetAccount.provider?.display_name || "Live Mortgage",
            amount: Math.abs(liveBalance), 
            logo: targetAccount.provider?.logo_uri || null,
            type: 'mortgage',
            isLive: true
        }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}