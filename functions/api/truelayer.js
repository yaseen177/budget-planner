// --- SMART CATEGORISATION ENGINE ---
const categoriseTransaction = (merchant, description, tlCategory, amount, accountType) => {
  let rawText = `${merchant} ${description}`.toLowerCase();
  // Strip web domains and punctuation for better matching
  let text = rawText.replace(/www\.|co\.uk|\.com|\.org/g, '').replace(/[^a-z0-9\s]/g, '');

  const isCreditCard = ['CREDIT', 'CREDIT_CARD', 'CARD', 'CHARGE_CARD'].includes((accountType || '').toUpperCase());

  // Fix the polarity so Credit Card spending isn't treated as Income
  let isIncome = false;
  if (isCreditCard) {
      isIncome = amount < 0; 
  } else {
      isIncome = amount > 0; 
  }

  if (isIncome) return 'Income';

  if (text.match(/tesco|sainsbury|asda|morrison|aldi|lidl|waitrose|coop|iceland|costco|ocado|farmfoods/)) return 'Groceries';
  if (text.match(/mcdonald|kfc|burger king|burgerking|nando|costa|starbucks|greggs|deliveroo|ubereats|uber eats|justeat|just eat|domino|pret|pizza hut|subway|wetherspoon|kebab/)) return 'Eating Out';
  if (text.match(/uber|trainline|tfl|rail|petrol|shell|bp|esso|texaco|parking|bus|coach|ryanair|easyjet|ba |britishairways|national express|applegreen/)) return 'Transport';
  if (text.match(/netflix|spotify|amazon prime|disney|cinema|playstation|xbox|steam|apple|itunes|nintendo/)) return 'Entertainment';
  if (text.match(/vodafone|o2|ee|three|virgin|sky|bt|water|energy|gas|electric|council tax|tv licence|octopus|british gas|eon|ovo|bulb/)) return 'Bills';
  if (text.match(/amazon|amzn|ebay|argos|boots|superdrug|primark|zara|hm|asos|next|ikea|shein|temu|tiktok/)) return 'Shopping';
  if (text.match(/gym|puregym|david lloyd|fitness|pharmacy|nhs|bupa|specsavers/)) return 'Health';

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

  return 'Miscellaneous';
};

export async function onRequestPost(context) {
const { request, env } = context;

try {
  const body = await request.json();
  // Accept custom dates from the frontend
  const { refreshToken, clientId, accounts, from, to } = body; 

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

  // Use provided dates, or fallback to 30 days
  let fromStr = from;
  let toStr = to;
  if (!fromStr || !toStr) {
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(toDate.getDate() - 30); 
      fromStr = fromDate.toISOString();
      toStr = toDate.toISOString();
  }

  const fetchPromises = accounts.map(async (acc) => {
      const endpointType = acc.endpoint_type || 'accounts';
      
      // Fetch Transactions AND Balances simultaneously
      const txPromise = fetch(`https://api.truelayer.com/data/v1/${endpointType}/${acc.account_id}/transactions?from=${fromStr}&to=${toStr}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const balancePromise = fetch(`https://api.truelayer.com/data/v1/${endpointType}/${acc.account_id}/balance`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      const [txResponse, balanceResponse] = await Promise.all([txPromise, balancePromise]);
      
      const txData = await txResponse.json();
      const balanceData = await balanceResponse.json();

      let currentBalance = 0;
      if (!balanceData.error && balanceData.results && balanceData.results.length > 0) {
          currentBalance = balanceData.results[0].current || 0;
      }

      const cleanedTx = txData.error ? [] : (txData.results || []).map(tx => ({
          id: tx.transaction_id,
          date: tx.timestamp.split('T')[0],
          description: tx.description,
          amount: tx.amount,
          // Pass the account type so it knows if it's a credit card
          category: categoriseTransaction(tx.merchant_name || '', tx.description || '', tx.transaction_category, tx.amount, acc.type),
          merchant: tx.merchant_name || 'Unknown',
          account_id: acc.account_id 
      }));

      return {
          account_id: acc.account_id,
          balance: currentBalance,
          transactions: cleanedTx
      };
  });

  const results = await Promise.all(fetchPromises);
  const allTransactions = results.flatMap(r => r.transactions || []);
  const balances = {};
  results.forEach(r => {
      if (r.account_id) balances[r.account_id] = r.balance;
  });

  return new Response(JSON.stringify({
      success: true,
      transactions: allTransactions,
      balances: balances,
      new_refresh_token: newRefreshToken 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });

} catch (error) {
  return new Response(JSON.stringify({ error: error.message }), { status: 500 });
}
}