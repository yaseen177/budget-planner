import React, { useState, useEffect, useMemo } from 'react';
import { X, RefreshCw, Landmark, ArrowRight, Shield, CreditCard, ShoppingBag, Coffee, Car, Zap, CheckCircle2, AlertCircle, AlertTriangle, MoreVertical, Trash2, Utensils, Tv, ShoppingCart, TrendingUp, Activity, PieChart, ChevronDown, ChevronUp, List, ArrowRightLeft } from 'lucide-react';
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

// --- NEW: SKELETON LOADER COMPONENT ---
const SkeletonLoader = () => (
  <div className="space-y-4 animate-pulse w-full">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex justify-between items-center p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-200 rounded-2xl"></div>
          <div className="space-y-2">
            <div className="w-32 h-4 bg-slate-200 rounded-full"></div>
            <div className="w-20 h-3 bg-slate-100 rounded-full"></div>
          </div>
        </div>
        <div className="w-16 h-6 bg-slate-200 rounded-full"></div>
      </div>
    ))}
  </div>
);

const Transactions = ({ user, appId, db, onClose, onConnectBank, currency = 'GBP', bankDetails, additionalBanks = [], expenses = [] }) => {
  const [loading, setLoading] = useState(true);
  const [bankingData, setBankingData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [balances, setBalances] = useState({});
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null); 
  
  const [activeTab, setActiveTab] = useState('feed'); 
  const [dateFilter, setDateFilter] = useState('30'); 
  const [expandedBanks, setExpandedBanks] = useState({});

  const toggleBankExpansion = (providerId) => {
      setExpandedBanks(prev => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const userBanks = useMemo(() => {
    const banks = [];
    
    if (bankDetails?.name) {
      banks.push({ id: 'current', name: bankDetails.name, type: 'Salary Account', fallbackLogo: bankDetails.logo });
    }

    if (additionalBanks && additionalBanks.length > 0) {
        additionalBanks.forEach((b, i) => {
            banks.push({ id: `extra-${i}`, name: b.name, type: 'Current Account', fallbackLogo: b.logo });
        });
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
        logoUrl: bank.fallbackLogo || liveLogo, 
        status: !providerId ? 'Unavailable' : isConnected ? 'Connected' : 'Inactive'
      };
    });
  }, [bankDetails, additionalBanks, expenses, bankingData]);

  const getCategoryIcon = (category) => {
    switch(category) {
        case 'Groceries': return <ShoppingBag className="w-5 h-5 text-emerald-500" />;
        case 'Eating Out': return <Utensils className="w-5 h-5 text-orange-500" />;
        case 'Transport': return <Car className="w-5 h-5 text-blue-500" />;
        case 'Bills': return <Zap className="w-5 h-5 text-yellow-500" />;
        case 'Entertainment': return <Tv className="w-5 h-5 text-purple-500" />;
        case 'Shopping': return <ShoppingCart className="w-5 h-5 text-pink-500" />;
        case 'Health': return <Activity className="w-5 h-5 text-rose-500" />;
        case 'Income': return <TrendingUp className="w-5 h-5 text-emerald-600" />;
        case 'Transfer': return <ArrowRightLeft className="w-5 h-5 text-slate-400" />; // NEW ICON
        default: return <CreditCard className="w-5 h-5 text-slate-400" />;
    }
  };

  const handleDisconnect = async (providerId) => {
    if (!user) return;
    try {
      const bankingRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'openBanking');
      const docSnap = await getDoc(bankingRef);

      if (docSnap.exists() && docSnap.data().connections) {
         const connections = { ...docSnap.data().connections };
         delete connections[providerId];
         
         await updateDoc(bankingRef, { connections });
         setBankingData({ connections });
         setActiveMenu(null); 
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

    let fromDate = new Date();
    let toDate = new Date();
    
    if (dateFilter === '30') {
       fromDate.setDate(toDate.getDate() - 30);
    } else if (dateFilter === '90') {
       fromDate.setDate(toDate.getDate() - 90);
    } else if (dateFilter === 'thisMonth') {
       fromDate.setDate(1); 
    } else if (dateFilter === 'lastMonth') {
       fromDate.setMonth(toDate.getMonth() - 1);
       fromDate.setDate(1);
       toDate.setDate(0); 
    }

    try {
      const bankingRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'openBanking');
      const docSnap = await getDoc(bankingRef);

      if (!docSnap.exists() || !docSnap.data().connections || Object.keys(docSnap.data().connections).length === 0) {
        setBankingData(null);
        setTransactions([]);
        setBalances({});
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

          try {
              const response = await fetch('/api/transactions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      refreshToken: bankData.refreshToken, 
                      clientId: import.meta.env.VITE_TL_CLIENT_ID,
                      from: fromDate.toISOString(),
                      to: toDate.toISOString(),
                      accounts: bankData.accounts.map(acc => ({
                          account_id: acc.account_id,
                          endpoint_type: acc.endpoint_type || 'accounts',
                          type: acc.type 
                      }))
                  })
              });

              const responseData = await response.json();

              if (responseData.error) {
                  if (responseData.error === "reconnect_required") authErrorOccurred = true;
                  continue; 
              }

              if (responseData.success) {
                  const txsWithBank = responseData.transactions.map(tx => {
                      const accountDetails = bankData.accounts.find(a => a.account_id === tx.account_id);
                      return {
                          ...tx,
                          bankName: accountDetails?.name || 'Bank', 
                          providerLogo: accountDetails?.provider_logo,
                          providerId: providerId
                      };
                  });

                  allTransactions = [...allTransactions, ...txsWithBank];

                  if (responseData.balances) {
                      setBalances(prev => ({ ...prev, ...responseData.balances }));
                  }

                  if (responseData.new_refresh_token && responseData.new_refresh_token !== bankData.refreshToken) {
                      updatedConnections[providerId].refreshToken = responseData.new_refresh_token;
                      tokensChanged = true;
                  }
              }
          } catch (e) {
             console.error(`Failed to fetch bank ${providerId}:`, e);
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
    setLoading(true);
    fetchTransactions();
  }, [user, appId, dateFilter]);

  // --- NEW: ANALYTICS CALCULATIONS EXCLUDING TRANSFERS ---
  const outgoings = transactions.filter(tx => tx.category !== 'Income' && tx.category !== 'Transfer' && tx.amount !== 0);
  const totalSpent = outgoings.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  
  const categoryTotals = outgoings.reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + Math.abs(tx.amount);
      return acc;
  }, {});
  
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col animate-in slide-in-from-bottom-full duration-500">
      
      {/* NEW: MODERN GLASSMORPHIC HEADER */}
      <div className="bg-white/80 backdrop-blur-md px-6 pt-12 pb-4 shadow-sm flex items-center justify-between sticky top-0 z-30 border-b border-slate-200/50">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Landmark className="w-6 h-6 text-indigo-600" /> Bank Connections
          </h2>
          <p className="text-sm font-medium text-slate-500">Manage your connected accounts</p>
        </div>
        <button onClick={onClose} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition active:scale-95">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar pb-32">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* NEW: SKELETON LOADER */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <SkeletonLoader />
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">Synchronising your data...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl font-medium text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 shrink-0" /> {error}
                </div>
              )}

              {/* SECTION 1: MY BANKS LIST */}
              <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-200">
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-emerald-500" /> Your Accounts
                     </h3>
                     {bankingData && Object.keys(bankingData.connections).length > 0 && (
                        <button 
                            onClick={() => fetchTransactions(true)}
                            disabled={isRefreshing}
                            className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 py-1.5 px-3 rounded-full transition flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
                        >
                            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} /> Sync All
                        </button>
                     )}
                 </div>
                 
                 <div className="space-y-4">
                    {userBanks.length === 0 ? (
                       <p className="text-slate-500 text-sm text-center py-4">No banks or credit cards added to your budget yet.</p>
                    ) : (
                       userBanks.map((bank, index) => {
                         const isExpanded = expandedBanks[bank.providerId] !== false; 

                         return (
                         <div key={index} className="flex flex-col p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-slate-200 transition">
                            
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer" onClick={() => {
                                if (bank.status === 'Connected') toggleBankExpansion(bank.providerId);
                            }}>
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

                                   {bank.status === 'Inactive' && (
                                      <button 
                                         onClick={(e) => { e.stopPropagation(); onConnectBank(bank.providerId); }}
                                         className="bg-indigo-600 text-white text-sm font-bold py-2 px-4 rounded-xl hover:bg-indigo-700 transition shadow-md whitespace-nowrap active:scale-95"
                                      >
                                         Connect
                                      </button>
                                   )}

                                   {bank.status === 'Connected' && (
                                      <div className="flex items-center gap-2">
                                         <button className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition">
                                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                         </button>

                                         <div className="relative">
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === bank.providerId ? null : bank.providerId); }}
                                              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition"
                                            >
                                               <MoreVertical className="w-5 h-5" />
                                            </button>

                                            {activeMenu === bank.providerId && (
                                               <>
                                                 <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setActiveMenu(null); }}></div>
                                                 <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-40 animate-in fade-in zoom-in-95 origin-top-right">
                                                    <button 
                                                      onClick={(e) => { e.stopPropagation(); setActiveMenu(null); onConnectBank(bank.providerId); }}
                                                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition"
                                                    >
                                                      <RefreshCw className="w-4 h-4 text-slate-400" /> Reconnect Bank
                                                    </button>
                                                    <div className="h-px bg-slate-100 my-1"></div>
                                                    <button 
                                                      onClick={(e) => { e.stopPropagation(); handleDisconnect(bank.providerId); }}
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

                            {bank.status === 'Connected' && bankingData?.connections?.[bank.providerId]?.accounts && isExpanded && (
                                <div className="mt-4 pt-4 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
                                    {bankingData.connections[bank.providerId].accounts.map(acc => (
                                        <div key={acc.account_id} className="flex justify-between items-center p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-slate-200 transition">
                                            <span className="text-xs font-bold text-slate-600 truncate mr-3">{acc.name}</span>
                                            
                                            <span className={`text-sm font-black whitespace-nowrap ${
                                                balances[acc.account_id] !== undefined && balances[acc.account_id] < 0 
                                                ? 'text-rose-600' 
                                                : 'text-slate-800'
                                            }`}>
                                                {balances[acc.account_id] !== undefined ? (
                                                    <>
                                                       {balances[acc.account_id] < 0 ? '-' : ''}
                                                       {currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'}
                                                       {Math.abs(balances[acc.account_id]).toFixed(2)}
                                                    </>
                                                ) : (
                                                    <span className="w-12 h-4 bg-slate-200 rounded animate-pulse inline-block"></span>
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                         </div>
                       )})
                    )}
                 </div>
              </div>

              {/* NEW: STICKY TABS & FILTERS */}
              {bankingData && Object.keys(bankingData.connections).length > 0 && transactions.length > 0 && (
                <div className="space-y-6 mt-8">
                   <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-[72px] z-20 bg-slate-50/90 backdrop-blur-md py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                       <div className="flex bg-slate-200/60 p-1.5 rounded-2xl w-full sm:w-auto shadow-inner">
                          <button 
                             onClick={() => setActiveTab('feed')}
                             className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'feed' ? 'bg-white text-slate-800 shadow-sm scale-100' : 'text-slate-500 hover:text-slate-700 scale-95'}`}
                          >
                             <List className="w-4 h-4" /> Feed
                          </button>
                          <button 
                             onClick={() => setActiveTab('analytics')}
                             className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'analytics' ? 'bg-white text-slate-800 shadow-sm scale-100' : 'text-slate-500 hover:text-slate-700 scale-95'}`}
                          >
                             <PieChart className="w-4 h-4" /> Analytics
                          </button>
                       </div>

                       <select 
                          value={dateFilter}
                          onChange={(e) => setDateFilter(e.target.value)}
                          className="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm w-full sm:w-auto cursor-pointer"
                       >
                          <option value="30">Last 30 Days</option>
                          <option value="90">Last 90 Days</option>
                          <option value="thisMonth">This Month</option>
                          <option value="lastMonth">Last Month</option>
                       </select>
                   </div>

                   {/* TAB: FEED */}
                   {activeTab === 'feed' && (
                       <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                         <div className="divide-y divide-slate-50">
                           {transactions.map((tx, idx) => {
                             const relatedBank = userBanks.find(b => b.providerId === tx.providerId);
                             const displayLogo = relatedBank?.fallbackLogo || tx.providerLogo || relatedBank?.logoUrl;
                             
                             // NEW: Subtly style Internal Transfers
                             const isTransfer = tx.category === 'Transfer';

                             return (
                             <div key={`${tx.id}-${idx}`} className={`p-4 sm:p-5 flex justify-between items-center transition group ${isTransfer ? 'opacity-70 grayscale-[20%] hover:bg-slate-100' : 'hover:bg-slate-50'}`}>
                                 <div className="flex items-center gap-4">
                                   <div className="relative">
                                       <div className={`p-3 rounded-2xl border transition group-hover:shadow-sm ${isTransfer ? 'bg-slate-100 border-slate-200' : 'bg-slate-50 border-slate-100 group-hover:bg-white'}`}>
                                           {getCategoryIcon(tx.category)}
                                       </div>
                                       {displayLogo && (
                                           <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-sm border border-slate-100">
                                               <img src={displayLogo} className="w-4 h-4 object-contain rounded-full" />
                                           </div>
                                       )}
                                   </div>
                                   <div>
                                       <p className={`font-bold text-sm sm:text-base ${isTransfer ? 'text-slate-600' : 'text-slate-800'}`}>
                                         {tx.merchant && tx.merchant !== 'Unknown' ? tx.merchant : tx.description}
                                       </p>
                                       <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-medium">
                                         <span className="capitalize">{tx.category || 'Miscellaneous'}</span>
                                         <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                         <span>{new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                       </p>
                                   </div>
                                 </div>
                                 
                                 <div className="text-right flex flex-col items-end">
                                   <span className={`font-black text-sm sm:text-lg ${tx.category === 'Income' ? 'text-emerald-600' : isTransfer ? 'text-slate-500' : 'text-slate-900'}`}>
                                       {tx.category === 'Income' ? '+' : ''}
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

                   {/* TAB: ANALYTICS (EXCLUDING TRANSFERS) */}
                   {activeTab === 'analytics' && (
                       <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                             <PieChart className="w-5 h-5 text-indigo-500" /> True Spending Breakdown
                          </h3>
                          
                          <div className="mb-10 text-center sm:text-left bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100/50">
                             <p className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-1">Total Outgoings</p>
                             <p className="text-5xl font-black text-indigo-950 tracking-tight">
                                {currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'}
                                {totalSpent.toFixed(2)}
                             </p>
                             <p className="text-xs font-medium text-slate-500 mt-3 flex items-center justify-center sm:justify-start gap-1">
                                <ArrowRightLeft className="w-3 h-3" /> Excludes internal transfers
                             </p>
                          </div>

                          <div className="space-y-6">
                             {sortedCategories.length === 0 ? (
                                <div className="text-center py-10">
                                   <PieChart className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                   <p className="text-slate-500 text-sm font-medium">No spending data to analyse in this period.</p>
                                </div>
                             ) : (
                                sortedCategories.map(([cat, amount]) => {
                                   const percentage = ((amount / totalSpent) * 100).toFixed(0);
                                   return (
                                   <div key={cat} className="group">
                                      <div className="flex justify-between items-center mb-2">
                                         <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 group-hover:scale-110 transition-transform">
                                               {getCategoryIcon(cat)}
                                            </div>
                                            <span className="font-bold text-slate-700">{cat}</span>
                                         </div>
                                         <div className="text-right">
                                            <span className="font-bold text-slate-800 mr-3">
                                               {currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'}{amount.toFixed(2)}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400 w-8 inline-block">{percentage}%</span>
                                         </div>
                                      </div>
                                      <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden shadow-inner">
                                         <div 
                                            className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden" 
                                            style={{ width: `${percentage}%` }}
                                         >
                                            <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', transform: 'skewX(-20deg)' }}></div>
                                         </div>
                                      </div>
                                   </div>
                                )})
                             )}
                          </div>
                       </div>
                   )}
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