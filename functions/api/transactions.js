export async function onRequestPost(context) {
    const { request, env } = context;
  
    try {
      const body = await request.json();
      const { refreshToken, accountId, clientId } = body;
  
      if (!refreshToken || !accountId || !clientId) {
          return new Response(JSON.stringify({ error: "Missing required parameters." }), { status: 400 });
      }
  
      // 1. SILENT LOGIN: Exchange the Refresh Token for a fresh Access Token
      // Note: We are using the Live URL 'auth.truelayer.com'
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
      
      // If the token is rejected (e.g., 90-day expiry), tell the frontend so it can ask the user to reconnect
      if (!tokenData.access_token) {
          throw new Error("reconnect_required");
      }
  
      const accessToken = tokenData.access_token;
      
      // TrueLayer sometimes rotates the refresh token for security. We must catch the new one!
      const newRefreshToken = tokenData.refresh_token || refreshToken; 
  
      // 2. SET THE DATE RANGE: Let's fetch the last 30 days of transactions
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(toDate.getDate() - 30); 
  
      const fromStr = fromDate.toISOString();
      const toStr = toDate.toISOString();
  
      // 3. FETCH TRANSACTIONS: Grab the data for the specific account
      const txResponse = await fetch(`https://api.truelayer.com/data/v1/accounts/${accountId}/transactions?from=${fromStr}&to=${toStr}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      const txData = await txResponse.json();
  
      if (txData.error) {
          throw new Error("Failed to fetch transactions from bank.");
      }
  
      // 4. CLEAN THE DATA: Format it nicely for your React charts and lists
      const formattedTransactions = (txData.results || []).map(tx => ({
          id: tx.transaction_id,
          date: tx.timestamp.split('T')[0], // Keep just the YYYY-MM-DD format
          description: tx.description,
          amount: tx.amount, // TrueLayer sends spending as negative numbers, income as positive
          category: tx.transaction_category || 'General',
          merchant: tx.merchant_name || 'Unknown'
      }));
  
      // 5. SEND IT BACK: Send the clean transactions AND the new refresh token back to React
      return new Response(JSON.stringify({
          success: true,
          transactions: formattedTransactions,
          new_refresh_token: newRefreshToken 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
  
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }