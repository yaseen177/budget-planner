export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    // NOW ACCEPTING AN ARRAY OF ACCOUNTS
    const { refreshToken, clientId, accounts } = body; 

    if (!refreshToken || !accounts || !clientId) {
        return new Response(JSON.stringify({ error: "Missing required parameters." }), { status: 400 });
    }

    // 1. Silent Login (Happens just ONCE per bank)
    const tokenResponse = await fetch('https://auth.truelayer.com/connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: env.TL_CLIENT_SECRET,
        refresh_token: refreshToken,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) throw new Error("reconnect_required");

    const accessToken = tokenData.access_token;
    const newRefreshToken = tokenData.refresh_token || refreshToken; 

    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - 30); 

    const fromStr = fromDate.toISOString();
    const toStr = toDate.toISOString();

    // 2. Fetch EVERY account simultaneously (Lightning Fast!)
    const fetchPromises = accounts.map(async (acc) => {
        const endpointType = acc.endpoint_type || 'accounts';
        const txResponse = await fetch(`https://api.truelayer.com/data/v1/${endpointType}/${acc.account_id}/transactions?from=${fromStr}&to=${toStr}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const txData = await txResponse.json();
        
        if (txData.error) return [];

        // Clean the data and tag it with the specific account ID
        return (txData.results || []).map(tx => ({
            id: tx.transaction_id,
            date: tx.timestamp.split('T')[0],
            description: tx.description,
            amount: tx.amount,
            category: tx.transaction_category || 'General',
            merchant: tx.merchant_name || 'Unknown',
            account_id: acc.account_id 
        }));
    });

    // Wait for all simultaneous fetches to finish
    const results = await Promise.all(fetchPromises);
    const allTransactions = results.flat(); // Flatten the arrays into one big list

    return new Response(JSON.stringify({
        success: true,
        transactions: allTransactions,
        new_refresh_token: newRefreshToken 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}