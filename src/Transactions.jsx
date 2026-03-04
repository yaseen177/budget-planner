import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Landmark, ArrowRight, Shield, CreditCard, ShoppingBag, Coffee, Car, Zap } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase'; // Adjust this import based on your actual firebase config file

const Transactions = ({ user, appId, onClose, onConnectBank, currency = 'GBP' }) => {
  const [loading, setLoading] = useState(true);
  const [bankingData, setBankingData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Helper to get a nice icon for categories
  const getCategoryIcon = (category) => {
    const cat = category.toLowerCase();
    if (cat.includes('food') || cat.includes('dining') || cat.includes('groceries')) return <ShoppingBag className="w-5 h-5 text-orange-500" />;
    if (cat.includes('transport') || cat.includes('travel')) return <Car className="w-5 h-5 text-blue-500" />;
    if (cat.includes('bills') || cat.includes('utilities')) return <Zap className="w-5 h-5 text-yellow-500" />;
    if (cat.includes('entertainment') || cat.includes('coffee')) return <Coffee className="w-5 h-5 text-amber-600" />;
    return <CreditCard className="w-5 h-5 text-slate-400" />;
  };

  const fetchTransactions = async (forceRefresh = false) => {
    if (!user) return;
    
    if (forceRefresh) setIsRefreshing(true);
    setError(null);

    try {
      // 1. Check Firebase for the Open Banking keys
      const bankingRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'openBanking');
      const docSnap = await getDoc(bankingRef);

      if (!docSnap.exists()) {
        setBankingData(null);
        setLoading(false);
        return;
      }

      const data = docSnap.data();
      setBankingData(data);

      if (!data.refreshToken || !data.accounts || data.accounts.length === 0) {
        setLoading(false);
        return;
      }

      // 2. Fetch live transactions from our Cloudflare backend
      // We'll use the first spending account for this dashboard
      const primaryAccount = data.accounts[0];

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: data.refreshToken,
          accountId: primaryAccount.account_id,
          clientId: import.meta.env.VITE_TL_CLIENT_ID
        })
      });

      const responseData = await response.json();

      if (responseData.error) {
        if (responseData.error === "reconnect_required") {
            setError("Your secure connection has expired. Please reconnect your bank.");
            setBankingData(null); // Force the "Connect" button to reappear
        } else {
            setError(responseData.error);
        }
      } else if (responseData.success) {
        setTransactions(responseData.transactions);
        
        // 3. IMPORTANT: Update Firebase if TrueLayer gave us a fresh rolling token
        if (responseData.new_refresh_token && responseData.new_refresh_token !== data.refreshToken) {
            await updateDoc(bankingRef, {
                refreshToken: responseData.new_refresh_token,
                lastConnected: new Date().toISOString()
            });
        }
      }
    } catch (err) {
      console.error("Error loading transactions:", err);
      setError("Failed to fetch recent transactions.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Run on mount
  useEffect(() => {
    fetchTransactions();
  }, [user, appId]);

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col animate-in slide-in-from-bottom-full duration-500">
      
      {/* HEADER */}
      <div className="bg-white px-6 pt-12 pb-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Landmark className="w-6 h-6 text-indigo-600" /> Transactions
          </h2>
          <p className="text-sm font-medium text-slate-500">Live feed from your connected bank</p>
        </div>
        <button 
          onClick={onClose} 
          className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* CONTENT SCROLL AREA */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar">
        <div className="max-w-3xl mx-auto">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-slate-500 font-medium animate-pulse">Establishing secure connection...</p>
            </div>
          ) : !bankingData ? (
            
            // --- EMPTY STATE (Not Connected) ---
            <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-sm border border-slate-200 text-center relative overflow-hidden mt-8">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-60 pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-indigo-50">
                    <Shield className="w-10 h-10 text-indigo-600" />
                </div>
                
                <h3 className="text-2xl font-black text-slate-800 mb-4">Connect Your Bank</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
                  Securely link your current account or credit card using Open Banking. We'll automatically fetch and categorise your daily spending.
                </p>

                <ul className="text-left space-y-3 mb-10 text-sm font-medium text-slate-600">
                    <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-emerald-500" /> Read-only access</li>
                    <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-emerald-500" /> Bank-level security</li>
                    <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-emerald-500" /> Cancel anytime</li>
                </ul>

                <button 
                  onClick={onConnectBank}
                  className="w-full sm:w-auto bg-indigo-600 text-white font-bold py-4 px-8 rounded-2xl hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3"
                >
                  Connect Securely <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

          ) : (

            // --- TRANSACTIONS LIST (Connected) ---
            <div className="space-y-6">
              
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl font-medium text-sm">
                  {error}
                </div>
              )}

              {/* Account Overview Card */}
              <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden">
                 <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}></div>
                 
                 <div className="relative z-10 flex items-center gap-4 w-full sm:w-auto">
                    <div className="bg-white p-2 rounded-xl">
                      {bankingData.accounts[0].provider_logo ? (
                          <img src={bankingData.accounts[0].provider_logo} alt="Bank" className="w-8 h-8 object-contain" />
                      ) : (
                          <Landmark className="w-8 h-8 text-slate-800" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">Connected Account</p>
                      <h3 className="text-lg font-bold">{bankingData.accounts[0].name}</h3>
                    </div>
                 </div>

                 <button 
                   onClick={() => fetchTransactions(true)}
                   disabled={isRefreshing}
                   className="relative z-10 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-medium transition w-full sm:w-auto justify-center disabled:opacity-50"
                 >
                   <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                   {isRefreshing ? 'Syncing...' : 'Sync Data'}
                 </button>
              </div>

              {/* The List */}
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                   <h3 className="font-bold text-slate-800">Recent Spending</h3>
                   <span className="text-xs font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">Last 30 Days</span>
                </div>

                <div className="divide-y divide-slate-50">
                  {transactions.length === 0 ? (
                      <div className="p-12 text-center text-slate-500">No recent transactions found.</div>
                  ) : (
                      transactions.map((tx) => (
                        <div key={tx.id} className="p-4 sm:p-5 flex justify-between items-center hover:bg-slate-50 transition group">
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition">
                                 {getCategoryIcon(tx.category)}
                              </div>
                              <div>
                                 <p className="font-bold text-slate-800 text-sm sm:text-base">{tx.merchant || tx.description}</p>
                                 <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                    <span className="capitalize">{tx.category.replace(/_/g, ' ')}</span>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    <span>{new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                 </p>
                              </div>
                           </div>
                           
                           <div className="text-right">
                              {/* TrueLayer amounts are negative for spending, positive for income */}
                              <span className={`font-black text-sm sm:text-lg ${tx.amount < 0 ? 'text-slate-800' : 'text-emerald-600'}`}>
                                 {tx.amount > 0 ? '+' : ''}
                                 {currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'}
                                 {Math.abs(tx.amount).toFixed(2)}
                              </span>
                           </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Small helper for the checkmarks in the empty state
const CheckCircle = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default Transactions;