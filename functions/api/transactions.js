// --- SMART CATEGORISATION ENGINE ---
const categoriseTransaction = (merchant, description, tlCategory, amount, accountType, accountHolderNames) => {
    let rawText = `${merchant} ${description}`.toLowerCase();
    let text = rawText.replace(/www\.|co\.uk|\.com|\.org/g, '').replace(/[^a-z0-9\s]/g, '');

    const isCreditCard = ['CREDIT', 'CREDIT_CARD', 'CARD', 'CHARGE_CARD'].includes((accountType || '').toUpperCase());

    let isIncome = false;
    if (isCreditCard) {
        isIncome = amount < 0; 
    } else {
        isIncome = amount > 0; 
    }

    // 1. CATCH EXPLICIT TRANSFERS & CREDIT CARD PAYMENTS
    if (tlCategory) {
        const cat = tlCategory.toUpperCase();
        if (cat.includes('TRANSFER') || cat.includes('CREDIT_CARD_PAYMENT')) return 'Transfer';
    }

    // 2. DYNAMIC NAME MATCHING (Identifies Internal Transfers to self)
    if (accountHolderNames && accountHolderNames.length > 0) {
        const upperRaw = rawText.toUpperCase();
        for (const name of accountHolderNames) {
            // Split the full name into parts (e.g. ["YASEEN", "MUHAMMAD", "HUSSAIN"])
            const parts = name.toUpperCase().split(' ').filter(p => p.trim() !== '');
            if (parts.length >= 2) {
                const first = parts[0];
                const last = parts[parts.length - 1];
                const initial = first.charAt(0); // "Y"

                // Must contain the Last Name to be considered a match
                if (upperRaw.includes(last)) {
                    // Check for First Name match (e.g. "YASEEN HUSSAIN")
                    if (upperRaw.includes(first)) return 'Transfer';
                    
                    // Check for Initial match (e.g. "Y HUSSAIN", "Y. HUSSAIN", "Y & Y HUSSAIN")
                    const initialRegex = new RegExp(`(^|[^A-Z])${initial}([^A-Z]|$)`);
                    if (initialRegex.test(upperRaw)) return 'Transfer';
                }
            }
        }
    }

    // Generic transfer fallbacks just in case
    if (text.match(/transfer|saving|pot|vault|credit card|amex payment|barclaycard|monzo|starling|revolut/)) return 'Transfer';

    // 3. Then Income
    if (isIncome) return 'Income';

    // 4. Then standard categories
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

    // GRAB THE USER'S TRUE ACCOUNT HOLDER NAME FROM THE API
    let accountHolderNames = [];
    try {
        const infoRes = await fetch('https://api.truelayer.com/data/v1/info', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (infoRes.ok) {
            const infoData = await infoRes.json();
            if (infoData.results) {
                accountHolderNames = infoData.results.map(r => r.full_name).filter(Boolean);
            }
        }
    } catch (e) {
        console.error("Failed to fetch info for transfer matching");
    }

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
            // Pass the API names directly into the categorisation engine
            category: categoriseTransaction(tx.merchant_name || '', tx.description || '', tx.transaction_category, tx.amount, acc.type, accountHolderNames),
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