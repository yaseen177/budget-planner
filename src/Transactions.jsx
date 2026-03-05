import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, RefreshCw, Landmark, ArrowRight, Shield, CreditCard, ShoppingBag, Coffee, Car, Zap, CheckCircle2, AlertCircle, AlertTriangle, MoreVertical, Trash2, Utensils, Tv, ShoppingCart, TrendingUp, Activity, PieChart, List, ArrowRightLeft, Wallet, Link as LinkIcon } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const TRUELAYER_PROVIDERS = {
  'monzo': 'ob-monzo', 'barclays': 'ob-barclays', 'natwest': 'ob-natwest', 'lloyds': 'ob-lloyds',
  'halifax': 'ob-halifax', 'santander': 'ob-santander', 'hsbc': 'ob-hsbc', 'starling': 'ob-starling',
  'revolut': 'ob-revolut', 'nationwide': 'ob-nationwide', 'first direct': 'ob-first-direct', 'tsb': 'ob-tsb',
  'amex': 'ob-amex', 'american express': 'ob-amex', 'capital one': 'ob-capital-one', 'mbna': 'ob-mbna',
  'virgin money': 'ob-virgin-money', 'chase': 'ob-chase', 'mock bank': 'mock', 'mock': 'mock'
};

// --- REACT BITS INSPIRED: SPOTLIGHT CARD ---
const SpotlightCard = ({ children, className = "" }) => {
  const divRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 z-0"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(99,102,241,0.06), transparent 40%)`,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};

// --- REACT BITS INSPIRED: SHINY BUTTON ---
const ShinyButton = ({ onClick, disabled, children, className = "" }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`group relative overflow-hidden rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-slate-900/20 disabled:opacity-50 active:scale-95 ${className}`}
  >
    <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full" />
  </button>
);

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

  const userBanks = useMemo(() => {
    const banks = [];
    if (bankDetails?.name) banks.push({ id: 'current', name: bankDetails.name, type: 'Salary Account', fallbackLogo: bankDetails.logo });
    if (additionalBanks && additionalBanks.length > 0) {
        additionalBanks.forEach((b, i) => banks.push({ id: `extra-${i}`, name: b.name, type: 'Current Account', fallbackLogo: b.logo }));
    }
    const creditCards = expenses.filter(e => e.type === 'credit_card');
    creditCards.forEach(cc => banks.push({ id: cc.id, name: cc.name, type: 'Credit Card', fallbackLogo: cc.logo }));

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

  // Extract all individual connected accounts for the Digital Wallet
  const activeWalletAccounts = useMemo(() => {
    if (!bankingData?.connections) return [];
    const accountsList = [];
    Object.entries(bankingData.connections).forEach(([providerId, bankData]) => {
        const relatedBank = userBanks.find(b => b.providerId === providerId);
        if (bankData.accounts) {
            bankData.accounts.forEach(acc => {
                accountsList.push({
                    ...acc,
                    providerId,
                    displayLogo: relatedBank?.fallbackLogo || acc.provider_logo || relatedBank?.logoUrl,
                    parentBankName: relatedBank?.name || 'Bank'
                });
            });
        }
    });
    return accountsList;
  }, [bankingData, userBanks]);

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
        case 'Transfer': return <ArrowRightLeft className="w-5 h-5 text-slate-400" />;
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

  const outgoings = transactions.filter(tx => tx.category !== 'Income' && tx.category !== 'Transfer' && tx.amount !== 0);
  const totalSpent = outgoings.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  
  const categoryTotals = outgoings.reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + Math.abs(tx.amount);
      return acc;
  }, {});
  
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col animate-in slide-in-from-bottom-full duration-500">
      
      {/* Modern Glassmorphic Header */}
      <div className="bg-white/80 backdrop-blur-md px-6 pt-12 pb-4 shadow-sm flex items-center justify-between sticky top-0 z-40 border-b border-slate-200/50">
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
        <div className="max-w-3xl mx-auto space-y-10">
          
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

              {/* NEW: THE DIGITAL WALLET (Live Balances Grid) */}
              {activeWalletAccounts.length > 0 && (
                <div>
                  <div className="flex justify-between items-end mb-4 px-1">
                      <div>
                          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                             <Wallet className="w-5 h-5 text-indigo-500" /> Digital Wallet
                          </h3>
                          <p className="text-xs font-medium text-slate-500 mt-1">Live balances across all connected accounts.</p>
                      </div>
                      <ShinyButton 
                          onClick={() => fetchTransactions(true)}
                          disabled={isRefreshing}
                      >
                          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Sync
                      </ShinyButton>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {activeWalletAccounts.map(acc => (
                         <SpotlightCard key={acc.account_id} className="flex flex-col justify-between p-5 min-h-[140px]">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 shadow-sm flex items-center justify-center w-10 h-10">
                                   {acc.displayLogo ? (
                                       <img src={acc.displayLogo} alt={acc.name} className="w-6 h-6 object-contain" />
                                   ) : (
                                       <CreditCard className="w-5 h-5 text-slate-400" />
                                   )}
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                   {acc.parentBankName}
                               </span>
                            </div>
                            <div className="mt-4">
                               <p className="text-xs font-bold text-slate-500 truncate mb-1">{acc.name}</p>
                               <p className={`text-2xl font-black tracking-tight ${balances[acc.account_id] !== undefined && balances[acc.account_id] < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                                  {balances[acc.account_id] !== undefined ? (
                                      <>
                                         {balances[acc.account_id] < 0 ? '-' : ''}
                                         {currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'}
                                         {Math.abs(balances[acc.account_id]).toFixed(2)}
                                      </>
                                  ) : (
                                      <span className="w-16 h-6 bg-slate-200 rounded animate-pulse inline-block"></span>
                                  )}
                               </p>
                            </div>
                         </SpotlightCard>
                     ))}
                  </div>
                </div>
              )}

              {/* NEW: LINKED CONNECTIONS (Slimline connection manager) */}
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
                 <div className="mb-6">
                     <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <LinkIcon className="w-5 h-5 text-emerald-500" /> Linked Connections
                     </h3>
                     <p className="text-xs font-medium text-slate-500 mt-1">Manage your Open Banking integrations.</p>
                 </div>
                 
                 <div className="divide-y divide-slate-100">
                    {userBanks.length === 0 ? (
                       <p className="text-slate-500 text-sm text-center py-4">No banks or credit cards added to your budget yet.</p>
                    ) : (
                       userBanks.map((bank, index) => (
                         <div key={index} className="flex items-center justify-between py-4 group">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 flex items-center justify-center opacity-80 group-hover:opacity-100 transition">
                                  {bank.logoUrl ? (
                                      <img src={bank.logoUrl} alt={bank.name} className="w-full h-full object-contain" />
                                  ) : (
                                      <Landmark className="w-6 h-6 text-slate-400" />
                                  )}
                               </div>
                               <div>
                                  <h4 className="font-bold text-slate-700 text-sm">{bank.name}</h4>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{bank.type}</p>
                               </div>
                            </div>

                            <div className="flex items-center gap-3">
                               <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  bank.status === 'Connected' ? 'bg-emerald-50 text-emerald-600' :
                                  bank.status === 'Inactive' ? 'bg-slate-100 text-slate-500' :
                                  'bg-rose-50 text-rose-600'
                               }`}>
                                  {bank.status === 'Connected' && <CheckCircle2 className="w-3 h-3" />}
                                  {bank.status === 'Inactive' && <AlertCircle className="w-3 h-3" />}
                                  {bank.status === 'Unavailable' && <AlertTriangle className="w-3 h-3" />}
                                  {bank.status}
                               </div>

                               {bank.status === 'Inactive' && (
                                  <button 
                                     onClick={(e) => { e.stopPropagation(); onConnectBank(bank.providerId); }}
                                     className="bg-indigo-50 text-indigo-600 text-xs font-bold py-1.5 px-3 rounded-lg hover:bg-indigo-100 transition active:scale-95"
                                  >
                                     Connect
                                  </button>
                               )}

                               {bank.status === 'Connected' && (
                                  <div className="relative">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === bank.providerId ? null : bank.providerId); }}
                                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                      >
                                         <MoreVertical className="w-4 h-4" />
                                      </button>

                                      {/* Modern iOS Style Context Menu */}
                                      {activeMenu === bank.providerId && (
                                         <>
                                           <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setActiveMenu(null); }}></div>
                                           <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-white p-1.5 z-40 animate-in fade-in zoom-in-95 origin-top-right">
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); setActiveMenu(null); onConnectBank(bank.providerId); }}
                                                className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-2 transition"
                                              >
                                                <RefreshCw className="w-4 h-4 text-slate-400" /> Reconnect
                                              </button>
                                              <div className="h-px bg-slate-200/50 my-1 mx-2"></div>
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); handleDisconnect(bank.providerId); }}
                                                className="w-full text-left px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition"
                                              >
                                                <Trash2 className="w-4 h-4" /> Disconnect
                                              </button>
                                           </div>
                                         </>
                                      )}
                                  </div>
                               )}
                            </div>
                         </div>
                       ))
                    )}
                 </div>
              </div>

              {/* TABS & FILTERS */}
              {bankingData && Object.keys(bankingData.connections).length > 0 && transactions.length > 0 && (
                <div className="space-y-6 mt-8">
                   <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-2">
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