import React, { useState, useEffect, useMemo } from 'react';
import { X, RefreshCw, Landmark, ArrowRight, Shield, CreditCard, ShoppingBag, Coffee, Car, Zap, CheckCircle2, AlertCircle, AlertTriangle, MoreVertical, Trash2 } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const TRUELAYER_PROVIDERS = {
  'monzo': 'ob-monzo',
  'barclays': 'ob-barclays',
  'natwest': 'ob-natwest',
  'lloyds': 'ob-lloyds',
  'halifax': 'ob-halifax',
  'santander': 'ob-santander',
  'hsbc': 'ob-hsbc',
  'starling': 'ob-starling',
  'revolut': 'ob-revolut',
  'nationwide': 'ob-nationwide',
  'first direct': 'ob-first-direct',
  'tsb': 'ob-tsb',
  'amex': 'ob-amex',
  'american express': 'ob-amex',
  'capital one': 'ob-capital-one',
  'mbna': 'ob-mbna',
  'virgin money': 'ob-virgin-money',
  'chase': 'ob-chase',
  'mock bank': 'mock', 
  'mock': 'mock'
};

const Transactions = ({ user, appId, db, onClose, onConnectBank, currency = 'GBP', bankDetails, expenses = [] }) => {
  const [loading, setLoading] = useState(true);
  const [bankingData, setBankingData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null); // Tracks which options menu is open

  const userBanks = useMemo(() => {
    const banks = [];
    
    if (bankDetails?.name) {
      banks.push({ id: 'current', name: bankDetails.name, type: 'Current Account', fallbackLogo: bankDetails.logo });
    }

    const creditCards = expenses.filter(e => e.type === 'credit_card');
    creditCards.forEach(cc => {
       banks.push({ id: cc.id, name: cc.name, type: 'Credit Card', fallbackLogo: cc.logo });
    });

    return banks.map(bank => {
      const searchName = bank.name.toLowerCase().trim();
      const matchedKey = Object.keys(TRUELAYER_PROVIDERS).find(key => searchName.includes(key));
      const providerId = matchedKey ? TRUELAYER_PROVIDERS[matchedKey] : null;

      const connection = providerId ? bankingData?.connections?.[providerId] : null;
      const isConnected = !!connection;

      const liveLogo = isConnected && connection.accounts?.[0]?.provider_logo ? connection.accounts[0].provider_logo : null;

      return {
        ...bank,
        providerId,
        logoUrl: liveLogo || bank.fallbackLogo, 
        status: !providerId ? 'Unavailable' : isConnected ? 'Connected' : 'Inactive'
      };
    });
  }, [bankDetails, expenses, bankingData]);

  const getCategoryIcon = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('food') || cat.includes('dining') || cat.includes('groceries')) return <ShoppingBag className="w-5 h-5 text-orange-500" />;
    if (cat.includes('transport') || cat.includes('travel')) return <Car className="w-5 h-5 text-blue-500" />;
    if (cat.includes('bills') || cat.includes('utilities')) return <Zap className="w-5 h-5 text-yellow-500" />;
    if (cat.includes('entertainment') || cat.includes('coffee')) return <Coffee className="w-5 h-5 text-amber-600" />;
    return <CreditCard className="w-5 h-5 text-slate-400" />;
  };

  // --- NEW: Disconnect Logic ---
  const handleDisconnect = async (providerId) => {
    if (!user) return;
    try {
      const bankingRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'openBanking');
      const docSnap = await getDoc(bankingRef);

      if (docSnap.exists() && docSnap.data().connections) {
         const connections = { ...docSnap.data().connections };
         
         // Remove this specific bank from the Firebase dictionary
         delete connections[providerId];
         
         await updateDoc(bankingRef, { connections });
         setBankingData({ connections });
         setActiveMenu(null); // Close the dropdown menu
         
         // Refetch to clear out the disconnected bank's transactions from the feed
         fetchTransactions(true); 
      }
    } catch (err) {
      console.error("Failed to disconnect bank:", err);
      setError("Failed to disconnect bank securely.");
    }
  };

  const fetchTransactions = async (forceRefresh = false) => {
    if (!user) return;
    if (forceRefresh) setIsRefreshing(true);
    setError(null);

    try {
      const bankingRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'openBanking');
      const docSnap = await getDoc(bankingRef);

      if (!docSnap.exists() || !docSnap.data().connections || Object.keys(docSnap.data().connections).length === 0) {
        setBankingData(null);
        setTransactions([]); // Clear transactions if no banks are connected
        setLoading(false);
        return;
      }

      const connections = docSnap.data().connections;
      setBankingData({ connections });

      let allTransactions = [];
      let updatedConnections = { ...connections };
      let tokensChanged = false;
      let authErrorOccurred = false;

      for (const [providerId, bankData] of Object.entries(connections)) {
          if (!bankData.accounts || bankData.accounts.length === 0) continue;

          let currentToken = bankData.refreshToken;

          for (const account of bankData.accounts) {
              try {
                  const response = await fetch('/api/transactions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                          refreshToken: currentToken, 
                          accountId: account.account_id,
                          clientId: import.meta.env.VITE_TL_CLIENT_ID,
                          endpointType: account.endpoint_type || 'accounts'
                      })
                  });

                  const responseData = await response.json();

                  if (responseData.error) {
                      if (responseData.error === "reconnect_required") authErrorOccurred = true;
                      continue; 
                  }

                  if (responseData.success) {
                      const txsWithBank = responseData.transactions.map(tx => ({
                          ...tx,
                          bankName: account.name, 
                          providerLogo: account.provider_logo,
                          providerId: providerId
                      }));

                      allTransactions = [...allTransactions, ...txsWithBank];

                      if (responseData.new_refresh_token && responseData.new_refresh_token !== currentToken) {
                          currentToken = responseData.new_refresh_token;
                          updatedConnections[providerId].refreshToken = currentToken;
                          tokensChanged = true;
                      }
                  }
              } catch (e) {
                 console.error(`Failed to fetch account ${account.name}:`, e);
              }
          }
      }

      if (authErrorOccurred) {
          setError("One or more of your connections has expired. Please hit 'Options > Reconnect' to refresh them.");
      }

      allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(allTransactions);

      if (tokensChanged) {
          await updateDoc(bankingRef, { connections: updatedConnections });
      }

    } catch (err) {
      console.error("Error loading transactions:", err);
      setError("Failed to fetch recent transactions.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user, appId]);

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col animate-in slide-in-from-bottom-full duration-500">
      
      <div className="bg-white px-6 pt-12 pb-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Landmark className="w-6 h-6 text-indigo-600" /> Bank Connections
          </h2>
          <p className="text-sm font-medium text-slate-500">Manage your connected accounts</p>
        </div>
        <button onClick={onClose} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-slate-500 font-medium animate-pulse">Synchronising all accounts...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl font-medium text-sm flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" /> {error}
                </div>
              )}

              {/* SECTION 1: MY BANKS LIST */}
              <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-200">
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-emerald-500" /> Your Accounts
                     </h3>
                     {bankingData && Object.keys(bankingData.connections).length > 0 && (
                        <button 
                            onClick={() => fetchTransactions(true)}
                            disabled={isRefreshing}
                            className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 py-1.5 px-3 rounded-full transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} /> Sync All
                        </button>
                     )}
                 </div>
                 
                 <div className="space-y-3">
                    {userBanks.length === 0 ? (
                       <p className="text-slate-500 text-sm text-center py-4">No banks or credit cards added to your budget yet.</p>
                    ) : (
                       userBanks.map((bank, index) => (
                         <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                            
                            <div className="flex items-center gap-4">
                               <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center w-12 h-12">
                                  {bank.logoUrl ? (
                                      <img src={bank.logoUrl} alt={bank.name} className="w-7 h-7 object-contain" />
                                  ) : bank.type === 'Credit Card' ? (
                                      <CreditCard className="w-6 h-6 text-slate-400" />
                                  ) : (
                                      <Landmark className="w-6 h-6 text-slate-400" />
                                  )}
                               </div>
                               <div>
                                  <h4 className="font-bold text-slate-800">{bank.name}</h4>
                                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{bank.type}</p>
                               </div>
                            </div>

                            <div className="flex items-center justify-between w-full sm:w-auto gap-4 pl-14 sm:pl-0">
                               <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                  bank.status === 'Connected' ? 'bg-emerald-100 text-emerald-700' :
                                  bank.status === 'Inactive' ? 'bg-slate-200 text-slate-600' :
                                  'bg-rose-100 text-rose-700'
                               }`}>
                                  {bank.status === 'Connected' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                  {bank.status === 'Inactive' && <AlertCircle className="w-3.5 h-3.5" />}
                                  {bank.status === 'Unavailable' && <AlertTriangle className="w-3.5 h-3.5" />}
                                  {bank.status}
                               </div>

                               {/* --- ACTION BUTTONS --- */}
                               {bank.status === 'Inactive' && (
                                  <button 
                                     onClick={() => onConnectBank(bank.providerId)}
                                     className="bg-indigo-600 text-white text-sm font-bold py-2 px-4 rounded-xl hover:bg-indigo-700 transition shadow-md whitespace-nowrap"
                                  >
                                     Connect
                                  </button>
                               )}

                               {bank.status === 'Connected' && (
                                  <div className="flex items-center gap-2">
                                     <div className="text-xs font-medium text-slate-400 flex items-center gap-1 mr-2 hidden sm:flex">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Active
                                     </div>
                                     
                                     {/* Options Dropdown */}
                                     <div className="relative">
                                        <button 
                                          onClick={() => setActiveMenu(activeMenu === bank.providerId ? null : bank.providerId)}
                                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition"
                                        >
                                           <MoreVertical className="w-5 h-5" />
                                        </button>

                                        {activeMenu === bank.providerId && (
                                           <>
                                             <div className="fixed inset-0 z-30" onClick={() => setActiveMenu(null)}></div>
                                             <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-40 animate-in fade-in zoom-in-95 origin-top-right">
                                                <button 
                                                  onClick={() => { setActiveMenu(null); onConnectBank(bank.providerId); }}
                                                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition"
                                                >
                                                  <RefreshCw className="w-4 h-4 text-slate-400" /> Reconnect Bank
                                                </button>
                                                <div className="h-px bg-slate-100 my-1"></div>
                                                <button 
                                                  onClick={() => handleDisconnect(bank.providerId)}
                                                  className="w-full text-left px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition"
                                                >
                                                  <Trash2 className="w-4 h-4" /> Disconnect
                                                </button>
                                             </div>
                                           </>
                                        )}
                                     </div>
                                  </div>
                               )}
                            </div>
                         </div>
                       ))
                    )}
                 </div>
              </div>

              {/* SECTION 2: UNIFIED TRANSACTIONS FEED */}
              {bankingData && Object.keys(bankingData.connections).length > 0 && transactions.length > 0 && (
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden mt-6">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                     <h3 className="font-bold text-slate-800">Unified Spending Feed</h3>
                     <span className="text-xs font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">Last 30 Days</span>
                  </div>

                  <div className="divide-y divide-slate-50">
                    {transactions.map((tx, idx) => {
                      
                      // REPLACE the old relatedBank line with this one:
                      const relatedBank = userBanks.find(b => b.providerId === tx.providerId);
                      
                      const displayLogo = tx.providerLogo || relatedBank?.logoUrl;

                      return (
                      <div key={`${tx.id}-${idx}`} className="p-4 sm:p-5 flex justify-between items-center hover:bg-slate-50 transition group">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition">
                                    {getCategoryIcon(tx.category)}
                                </div>
                                {displayLogo && (
                                    <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-sm border border-slate-100">
                                        <img src={displayLogo} className="w-4 h-4 object-contain rounded-full" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 text-sm sm:text-base">
                                  {tx.merchant && tx.merchant !== 'Unknown' ? tx.merchant : tx.description}
                                </p>
                                <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span className="capitalize">{tx.category?.replace(/_/g, ' ') || 'General'}</span>
                                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                  <span>{new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                </p>
                            </div>
                          </div>
                          
                          <div className="text-right flex flex-col items-end">
                            <span className={`font-black text-sm sm:text-lg ${tx.amount < 0 ? 'text-slate-800' : 'text-emerald-600'}`}>
                                {tx.amount > 0 ? '+' : ''}
                                {currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'}
                                {Math.abs(tx.amount).toFixed(2)}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">{tx.bankName}</span>
                          </div>
                      </div>
                    )})}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;