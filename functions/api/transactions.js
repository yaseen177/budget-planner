// --- SMART CATEGORISATION ENGINE ---
const categoriseTransaction = (merchant, description, tlCategory, amount, accountType, accountHolderNames) => {
    let rawText = `${merchant || ''} ${description || ''}`.toLowerCase();
    let text = rawText.replace(/www\.|co\.uk|\.com|\.org/g, '').replace(/[^a-z0-9\s]/g, ' ');

    const isCreditCard = ['CREDIT', 'CREDIT_CARD', 'CARD', 'CHARGE_CARD'].includes((accountType || '').toUpperCase());

    let isIncome = false;
    if (isCreditCard) {
        isIncome = amount < 0; 
    } else {
        isIncome = amount > 0; 
    }

    // 1. DIRECT DEBIT GUARD: Stop Direct Debits from being hijacked by the Transfer logic
    const isDirectDebit = rawText.includes('direct debit') || 
                          /\bdd\b/.test(text) || 
                          rawText.includes('standing order') || 
                          (tlCategory && tlCategory.toUpperCase().includes('DIRECT_DEBIT'));

    let isTransfer = false;

    // 2. CHECK TRUELAYER CATEGORY (Only if it's not a DD)
    if (tlCategory && !isDirectDebit) {
        const cat = tlCategory.toUpperCase();
        if (cat.includes('TRANSFER') || cat.includes('CREDIT_CARD_PAYMENT')) {
            isTransfer = true;
        }
    }

    // 3. CHECK ACCOUNT HOLDER NAMES (The Ultimate Internal Transfer Check)
    if (accountHolderNames && accountHolderNames.length > 0 && !isDirectDebit) {
        const upperRaw = rawText.toUpperCase();
        for (const name of accountHolderNames) {
            const parts = name.toUpperCase().split(' ').filter(p => p.trim() !== '');
            if (parts.length >= 2) {
                const first = parts[0];
                const last = parts[parts.length - 1];
                const initial = first.charAt(0);

                if (upperRaw.includes(last)) {
                    if (upperRaw.includes(first)) isTransfer = true;
                    const initialRegex = new RegExp(`(^|[^A-Z])${initial}([^A-Z]|$)`);
                    if (initialRegex.test(upperRaw)) isTransfer = true;
                }
            }
        }
    }

    // 4. SMART KEYWORD MATCHING (Looking for exact banking pairings, not just loose words)
    if (!isDirectDebit) {
        // Catch typical internal pot/vault movements
        if (rawText.match(/\b(pot|vault|saving|savings)\b/)) isTransfer = true;
        
        // Catch explicit credit card payments (Requires the word payment/settlement next to the bank)
        if (rawText.match(/\b(credit card|amex|barclaycard|mbna|capital one)\s+(payment|pay|settlement|tfr)\b/)) isTransfer = true;
        
        // Catch standard UK banking terminology for transfers between own accounts
        if (rawText.match(/\b(internal transfer|funds transfer|to a\/c|from a\/c|tfr|bank transfer|faster payment|f p)\b/)) isTransfer = true;
        
        // Catch moving money to other modern banking apps
        if (rawText.match(/\b(monzo|starling|revolut|chase)\s+(transfer|top up|topup)\b/)) isTransfer = true;
    }

    // Assign early exits
    if (isTransfer) return 'Transfer';
    if (isIncome) return 'Income';

    // ... Standard Retail Categorisation ...
    if (text.match(/tesco|sainsbury|asda|morrison|aldi|lidl|waitrose|coop|iceland|costco|ocado|farmfoods/)) return 'Groceries';
    if (text.match(/mcdonald|kfc|burger king|burgerking|nando|costa|starbucks|greggs|deliveroo|ubereats|uber eats|justeat|just eat|domino|pret|pizza hut|subway|wetherspoon|kebab/)) return 'Eating Out';
    if (text.match(/uber|trainline|tfl|rail|petrol|shell|bp|esso|texaco|parking|bus|coach|ryanair|easyjet|ba |britishairways|national express|applegreen/)) return 'Transport';
    if (text.match(/netflix|spotify|amazon prime|disney|cinema|playstation|xbox|steam|apple|itunes|nintendo/)) return 'Entertainment';
    
    // Fallback: If it was flagged as a Direct Debit, guarantee it goes into Bills!
    if (isDirectDebit || text.match(/vodafone|o2|ee|three|virgin|sky|bt|water|energy|gas|electric|council tax|tv licence|octopus|british gas|eon|ovo|bulb/)) return 'Bills';
    
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
        console.error("Failed to fetch info");
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
        const headers = { 'Authorization': `Bearer ${accessToken}` };
        
        // BULLETPROOF FETCH WRAPPER: Never crashes the Promise.all
        const fetchSafely = async (url) => {
            try {
                const res = await fetch(url, { headers });
                if (!res.ok) return { error: true, status: res.status };
                const text = await res.text();
                return text ? JSON.parse(text) : { results: [] };
            } catch (e) {
                return { error: true, message: e.message };
            }
        };

        const txUrl = `https://api.truelayer.com/data/v1/${endpointType}/${acc.account_id}/transactions?from=${fromStr}&to=${toStr}`;
        const pendingUrl = `https://api.truelayer.com/data/v1/${endpointType}/${acc.account_id}/transactions/pending`;
        const balUrl = `https://api.truelayer.com/data/v1/${endpointType}/${acc.account_id}/balance`;

        const [txData, pendingTxData, balanceData] = await Promise.all([
            fetchSafely(txUrl),
            fetchSafely(pendingUrl),
            fetchSafely(balUrl)
        ]);

        let currentBalance = 0;
        if (balanceData && !balanceData.error && balanceData.results && balanceData.results.length > 0) {
            const bal = balanceData.results[0].current;
            currentBalance = (bal !== undefined && bal !== null) ? bal : (balanceData.results[0].available || 0);
        }

        const settledTx = Array.isArray(txData.results) ? txData.results : [];
        const pendingTx = Array.isArray(pendingTxData.results) ? pendingTxData.results : [];

        const allRawTx = [
            ...pendingTx.map(tx => ({ ...tx, is_pending: true })),
            ...settledTx.map(tx => ({ ...tx, is_pending: false }))
        ];

        const cleanedTx = allRawTx.map(tx => ({
            id: tx.transaction_id,
            date: (tx.timestamp || '').split('T')[0] || new Date().toISOString().split('T')[0],
            description: tx.description,
            amount: tx.amount,
            category: categoriseTransaction(tx.merchant_name || '', tx.description || '', tx.transaction_category, tx.amount, acc.type, accountHolderNames),
            merchant: tx.merchant_name || 'Unknown',
            account_id: acc.account_id,
            is_pending: tx.is_pending 
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