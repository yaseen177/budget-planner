// --- SMART CATEGORISATION ENGINE ---
const categoriseTransaction = (merchant, description, tlCategory, amount) => {
    // 1. Combine merchant and description, convert to lowercase
    let rawText = `${merchant} ${description}`.toLowerCase();
    
    // 2. Strip out web domains and non-alphanumeric characters to make matching robust
    // e.g. "www.ubereats.co.uk" becomes "ubereats"
    let text = rawText.replace(/www\.|co\.uk|\.com|\.org/g, '').replace(/[^a-z0-9\s]/g, '');

    // 3. Check for Income
    if (amount > 0) return 'Income';

    // 4. Enhanced Keyword Matching for UK merchants
    if (text.match(/tesco|sainsbury|asda|morrison|aldi|lidl|waitrose|coop|iceland|costco|ocado|farmfoods/)) return 'Groceries';
    if (text.match(/mcdonald|kfc|burger king|burgerking|nando|costa|starbucks|greggs|deliveroo|ubereats|uber eats|justeat|just eat|domino|pret|pizza hut|subway|wetherspoon|kebab/)) return 'Eating Out';
    if (text.match(/uber|trainline|tfl|rail|petrol|shell|bp|esso|texaco|parking|bus|coach|ryanair|easyjet|ba |britishairways|national express|applegreen/)) return 'Transport';
    if (text.match(/netflix|spotify|amazon prime|disney|cinema|playstation|xbox|steam|apple|itunes|nintendo/)) return 'Entertainment';
    if (text.match(/vodafone|o2|ee|three|virgin|sky|bt|water|energy|gas|electric|council tax|tv licence|octopus|british gas|eon|ovo|bulb/)) return 'Bills';
    if (text.match(/amazon|amzn|ebay|argos|boots|superdrug|primark|zara|hm|asos|next|ikea|shein|temu|tiktok/)) return 'Shopping';
    if (text.match(/gym|puregym|david lloyd|fitness|pharmacy|nhs|bupa|specsavers/)) return 'Health';

    // 5. Fallback to TrueLayer's suggested category if we didn't match a keyword
    if (tlCategory) {
        const cat = tlCategory.toUpperCase();
        if (cat.includes('GROCER')) return 'Groceries';
        if (cat.includes('TRANSPORT') || cat.includes('AUTO')) return 'Transport';
        if (cat.includes('SHOPPING')) return 'Shopping';
        if (cat.includes('BILLS') || cat.includes('UTILITIES')) return 'Bills';
        if (cat.includes('FOOD') || cat.includes('DINING')) return 'Eating Out';
        if (cat.includes('ENTERTAINMENT')) return 'Entertainment';
        if (cat.includes('HEALTH')) return 'Health';
    }

    // 6. Default if all else fails
    return 'Miscellaneous';
};

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { refreshToken, clientId, accounts } = body; 

    if (!refreshToken || !accounts || !clientId) {
        return new Response(JSON.stringify({ error: "Missing required parameters." }), { status: 400 });
    }

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

    const fetchPromises = accounts.map(async (acc) => {
        const endpointType = acc.endpoint_type || 'accounts';
        const txResponse = await fetch(`https://api.truelayer.com/data/v1/${endpointType}/${acc.account_id}/transactions?from=${fromStr}&to=${toStr}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const txData = await txResponse.json();
        
        if (txData.error) return [];

        return (txData.results || []).map(tx => ({
            id: tx.transaction_id,
            date: tx.timestamp.split('T')[0],
            description: tx.description,
            amount: tx.amount,
            category: categoriseTransaction(tx.merchant_name || '', tx.description || '', tx.transaction_category, tx.amount),
            merchant: tx.merchant_name || 'Unknown',
            account_id: acc.account_id 
        }));
    });

    const results = await Promise.all(fetchPromises);
    const allTransactions = results.flat(); 

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