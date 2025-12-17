//REVERT BACK TO THIS IF ANY ERROR
import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  signInWithCustomToken,
  signInAnonymously
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot,
  deleteDoc,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { 
  PieChart, 
  Wallet, 
  TrendingDown, 
  Plus, 
  Trash2, 
  LogOut, 
  ChevronLeft,
  ChevronRight,
  Settings,
  Edit2,
  Check,
  AlertCircle,
  X,
  Save,
  User,
  List,
  Target,
  AlertTriangle,
  Printer,
  FileText,
  Download,
  Calendar,
  Table,
  ShoppingCart,
  Car,
  Home,
  Zap,
  Smartphone,
  Tv,
  Coffee,
  Utensils,
  CreditCard,
  Music,
  Copy,
  PenLine,
  Search,
  ArrowUpDown,
  ArrowRight,
  BarChart3,
  FlaskConical,
  TrendingUp,
  Maximize2,
  HelpCircle,
  Menu
} from 'lucide-react';

// --- FIREBASE CONFIGURATION AREA ---
const YOUR_FIREBASE_KEYS = {
  apiKey: "AIzaSyA6K0QPohae3zLl2z9yqVwblJCfaAmEVlQ",
  authDomain: "budget-planner-d36b4.firebaseapp.com",
  projectId: "budget-planner-d36b4",
  storageBucket: "budget-planner-d36b4.firebasestorage.app",
  messagingSenderId: "420578928126",
  appId: "1:420578928126:web:9f016701869b92fb0f0caf"
};

// --- APP INITIALIZATION ---
const getFirebaseConfig = () => {
  if (YOUR_FIREBASE_KEYS.apiKey) {
    return YOUR_FIREBASE_KEYS;
  }
  return JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
};

const app = initializeApp(getFirebaseConfig());
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'nuha-budget-app';

// --- CONSTANTS & DEFAULTS ---
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const FULL_MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DEFAULT_FIXED_EXPENSES = [
  { id: 'fix_1', name: 'Mortgage', amount: 510.00, type: 'fixed' },
  { id: 'fix_2', name: 'Car Payment', amount: 342.93, type: 'fixed' },
  { id: 'fix_3', name: 'Indemnity Insurance', amount: 74.00, type: 'fixed' },
  { id: 'fix_4', name: 'HMRC', amount: 300.00, type: 'fixed' },
  { id: 'fix_5', name: 'iPhone', amount: 33.29, type: 'fixed' },
  { id: 'fix_6', name: 'EE', amount: 24.31, type: 'fixed' },
];

const DEFAULT_ALLOCATIONS = [
  { id: 'plan_1', name: "Nuha's Allowance", percentage: 35, color: 'bg-indigo-100 text-indigo-700 bar-indigo' },
  { id: 'plan_2', name: "Long Term Savings", percentage: 45, color: 'bg-emerald-100 text-emerald-700 bar-emerald' },
  { id: 'plan_3', name: "Holidays", percentage: 10, color: 'bg-sky-100 text-sky-700 bar-sky' },
  { id: 'plan_4', name: "Current Account", percentage: 10, color: 'bg-amber-100 text-amber-700 bar-amber' },
];

// --- HELPER FUNCTIONS ---

const safeCalculate = (expression) => {
  try {
    // 1. Remove characters that aren't numbers or math operators
    const sanitized = String(expression).replace(/[^0-9+\-*/().]/g, '');
    if (!sanitized) return expression;
    // 2. Evaluate the math string
    const result = new Function('return ' + sanitized)();
    // 3. Return result as string, or original if invalid
    return isFinite(result) ? String(result) : expression;
  } catch (e) {
    return expression;
  }
};

const formatCurrency = (amount, currency = 'GBP') => {
  const localeMap = { 'GBP': 'en-GB', 'USD': 'en-US', 'EUR': 'de-DE' };
  return new Intl.NumberFormat(localeMap[currency] || 'en-GB', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const getMonthId = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const triggerHaptic = () => {
  if (navigator.vibrate) navigator.vibrate(15);
};

const openReportInNewTab = (elementId, title) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title><script src="https://cdn.tailwindcss.com"></script>
      <style>body { background-color: white; padding: 20px; font-family: sans-serif; -webkit-print-color-adjust: exact; } @media print { body { padding: 0; } .no-print { display: none; } }</style>
    </head>
    <body>
      <div class="max-w-4xl mx-auto">${element.innerHTML}</div>
      <div class="fixed bottom-4 right-4 no-print flex gap-2"><button onclick="window.print()" class="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg">Print / Save as PDF</button></div>
    </body>
    </html>`;
  const blob = new Blob([htmlContent], { type: 'text/html' });
  window.open(URL.createObjectURL(blob), '_blank');
};

const getExpenseIcon = (name) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('netflix') || lowerName.includes('sky') || lowerName.includes('tv') || lowerName.includes('prime')) return Tv;
  if (lowerName.includes('food') || lowerName.includes('tesco') || lowerName.includes('asda') || lowerName.includes('lidl') || lowerName.includes('sainsbury')) return ShoppingCart;
  if (lowerName.includes('car') || lowerName.includes('fuel') || lowerName.includes('petrol') || lowerName.includes('uber') || lowerName.includes('train')) return Car;
  if (lowerName.includes('rent') || lowerName.includes('mortgage') || lowerName.includes('house')) return Home;
  if (lowerName.includes('electric') || lowerName.includes('gas') || lowerName.includes('water')) return Zap;
  if (lowerName.includes('phone') || lowerName.includes('mobile') || lowerName.includes('ee')) return Smartphone;
  if (lowerName.includes('coffee') || lowerName.includes('cafe')) return Coffee;
  if (lowerName.includes('restaurant') || lowerName.includes('eat') || lowerName.includes('lunch')) return Utensils;
  if (lowerName.includes('spotify') || lowerName.includes('music')) return Music;
  return CreditCard;
};

// --- CHART COMPONENTS ---

const SimpleLineChart = ({ data, dataKey, color, height = 64, showArea = false }) => {
  if (!data || data.length === 0) return null;
  const values = data.map(d => d[dataKey]);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0); // Optional: set to 0 for absolute scale
  const range = max - 0; // Base on 0
  
  const points = values.map((val, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 100 - ((val / range) * 100);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
      {showArea && (
         <polygon points={areaPoints} fill={color} fillOpacity="0.2" />
      )}
      <polyline 
        fill="none" 
        stroke={color} 
        strokeWidth="3" 
        points={points} 
        strokeLinecap="round" 
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* Dots */}
      {values.map((val, i) => {
         const x = (i / (values.length - 1)) * 100;
         const y = 100 - ((val / range) * 100);
         return <circle key={i} cx={x} cy={y} r="1.5" fill="white" stroke={color} strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
      })}
    </svg>
  );
};

const BarChart = ({ data, dataKey, color, height = 100 }) => {
  const max = Math.max(...data.map(d => d[dataKey]), 100);
  
  return (
    <div className="flex items-end justify-between gap-1 h-full w-full">
      {data.map((d, i) => {
        const h = Math.max(5, (d[dataKey] / max) * 100);
        return (
          <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group relative">
            <div 
              className={`w-full max-w-[20px] rounded-t-md transition-all duration-500 ${color}`}
              style={{ height: `${h}%` }}
            ></div>
            <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-[10px] px-1 rounded pointer-events-none whitespace-nowrap z-10">
               {d.label}: {Math.round(d[dataKey])}
            </div>
          </div>
        )
      })}
    </div>
  );
};

const MultiBarChart = ({ data, keys, colors }) => {
    const max = Math.max(...data.map(d => Math.max(d[keys[0]], d[keys[1]])), 100);

    return (
      <div className="flex items-end justify-between gap-2 h-full w-full px-1">
        {data.map((d, i) => {
          const h1 = Math.max(2, (d[keys[0]] / max) * 100);
          const h2 = Math.max(2, (d[keys[1]] / max) * 100);
          return (
            <div key={i} className="flex flex-col items-center justify-end flex-1 h-full gap-1 group relative">
               <div className="flex items-end gap-[1px] w-full justify-center h-full">
                  <div style={{height: `${h1}%`}} className={`flex-1 max-w-[12px] rounded-t-sm ${colors[0]} opacity-80`}></div>
                  <div style={{height: `${h2}%`}} className={`flex-1 max-w-[12px] rounded-t-sm ${colors[1]}`}></div>
               </div>
               <div className="text-[8px] text-slate-400 mt-1">{d.label}</div>
               {/* Tooltip */}
               <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-[10px] p-2 rounded pointer-events-none z-10">
                   <div className="font-bold mb-1">{d.fullLabel}</div>
                   <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${colors[0]}`}></span> Target: {Math.round(d[keys[0]])}</div>
                   <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${colors[1]}`}></span> Actual: {Math.round(d[keys[1]])}</div>
               </div>
            </div>
          )
        })}
      </div>
    );
};

// --- ANALYTICS DASHBOARD ---
const AnalyticsDashboard = ({ user, onClose, currency, allocationRules }) => {
  const [history, setHistory] = useState([]);
  const [timeRange, setTimeRange] = useState('6M'); // 3M, 6M, 12M, ALL
  const [loading, setLoading] = useState(true);
  const [selectedPot, setSelectedPot] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const colRef = collection(db, 'artifacts', appId, 'users', user.uid, 'budgetData');
        const snapshot = await getDocs(colRef);
        let rawData = [];
        snapshot.forEach(doc => {
          const val = doc.data();
          // Extract basic stats
          const salary = parseFloat(val.salary) || 0;
          const expensesTotal = (val.expenses || []).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
          const remainder = Math.max(0, salary - expensesTotal);
          const actuals = val.actualSavings || {};
          
          // Calculate target vs actual for each pot
          const potData = {};
          allocationRules.forEach(rule => {
             potData[rule.id] = {
                 target: remainder * (rule.percentage / 100),
                 actual: parseFloat(actuals[rule.id]) || 0
             };
          });

          if (salary > 0) {
            rawData.push({
              id: doc.id, // YYYY-MM
              label: MONTH_NAMES[parseInt(doc.id.split('-')[1]) - 1],
              fullLabel: `${FULL_MONTH_NAMES[parseInt(doc.id.split('-')[1]) - 1]} ${doc.id.split('-')[0]}`,
              salary,
              expenses: expensesTotal,
              remainder,
              pots: potData
            });
          }
        });
        rawData.sort((a, b) => a.id.localeCompare(b.id));
        setHistory(rawData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  // Filter Data based on Time Range
  const filteredData = useMemo(() => {
    if (timeRange === 'ALL') return history;
    const months = parseInt(timeRange.replace('M', ''));
    return history.slice(-months);
  }, [history, timeRange]);

  if (loading) return <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center">Loading Analytics...</div>;

  // -- RENDER --
  return (
    <div className="fixed inset-0 bg-slate-50 z-[60] overflow-y-auto animate-in fade-in slide-in-from-bottom-8">
      
      {/* Header */}
      <div className="bg-white p-4 sticky top-0 z-20 shadow-sm flex justify-between items-center">
        <h2 className="font-bold text-lg flex items-center gap-2 text-slate-800">
          <BarChart3 className="w-5 h-5 text-emerald-500" /> Analytics
        </h2>
        
        {/* Range Selector */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
           {['3M', '6M', '12M', 'ALL'].map(r => (
             <button 
               key={r}
               onClick={() => setTimeRange(r)}
               className={`px-3 py-1 text-xs font-bold rounded-md transition ${timeRange === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
             >
               {r}
             </button>
           ))}
        </div>

        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6 pb-20">
        
        {filteredData.length < 2 ? (
           <div className="text-center py-20 text-slate-400">
             <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-20" />
             <p>Need more data to show trends.</p>
             <p className="text-xs">Keep tracking your months!</p>
           </div>
        ) : (
          <>
            {/* 1. SALARY GRAPH */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Income Trend</h3>
                 <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                   Avg: {formatCurrency(filteredData.reduce((a,b)=>a+b.salary,0)/filteredData.length, currency)}
                 </span>
               </div>
               <div className="h-32">
                  <SimpleLineChart data={filteredData} dataKey="salary" color="#10b981" showArea={true} />
               </div>
               <div className="flex justify-between mt-2 px-1">
                  {filteredData.map((d, i) => (
                    <span key={i} className="text-[10px] text-slate-400 font-mono">{d.label}</span>
                  ))}
               </div>
            </div>

            {/* 2. EXPENSES GRAPH */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Monthly Expenses</h3>
                 <span className="text-rose-500 text-xs font-bold bg-rose-50 px-2 py-1 rounded-lg">
                    Avg: {formatCurrency(filteredData.reduce((a,b)=>a+b.expenses,0)/filteredData.length, currency)}
                 </span>
               </div>
               <div className="h-32">
                  <BarChart data={filteredData} dataKey="expenses" color="bg-rose-400" />
               </div>
                <div className="flex justify-between mt-2 px-1">
                  {filteredData.map((d, i) => (
                    <span key={i} className="text-[10px] text-slate-400 font-mono">{d.label}</span>
                  ))}
               </div>
            </div>

            {/* 3. POTS MINI GRAPHS GRID */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 px-2">Savings Performance</h3>
              <div className="grid grid-cols-2 gap-3">
                 {allocationRules.map(rule => {
                    // Prepare mini data for this pot
                    const potHistory = filteredData.map(d => ({ 
                        label: d.label, 
                        value: d.pots[rule.id]?.actual || 0 
                    }));
                    const totalSaved = potHistory.reduce((sum, x) => sum + x.value, 0);
                    
                    // Color mapping
                    let color = '#64748b';
                    if (rule.color.includes('indigo')) color = '#6366f1';
                    if (rule.color.includes('emerald')) color = '#10b981';
                    if (rule.color.includes('sky')) color = '#0ea5e9';
                    if (rule.color.includes('amber')) color = '#f59e0b';

                    return (
                      <button 
                        key={rule.id}
                        onClick={() => setSelectedPot({ ...rule, colorCode: color })}
                        className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-300 transition text-left group"
                      >
                         <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-slate-500 truncate max-w-[80px]">{rule.name}</span>
                            <Maximize2 className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                         </div>
                         <div className="h-12 mb-2">
                            <SimpleLineChart data={potHistory} dataKey="value" color={color} />
                         </div>
                         <div className="text-lg font-bold text-slate-800">{formatCurrency(totalSaved, currency)}</div>
                         <div className="text-[10px] text-slate-400">Total Saved ({timeRange})</div>
                      </button>
                    );
                 })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* POT DETAIL MODAL */}
      {selectedPot && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <div>
                    <h3 className="font-bold text-lg text-slate-800">{selectedPot.name}</h3>
                    <p className="text-xs text-slate-500">Target vs Actual • {timeRange}</p>
                 </div>
                 <button onClick={() => setSelectedPot(null)} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                 <div className="h-64 w-full">
                    <MultiBarChart 
                       data={filteredData.map(d => ({
                          label: d.label,
                          fullLabel: d.fullLabel,
                          target: d.pots[selectedPot.id]?.target || 0,
                          actual: d.pots[selectedPot.id]?.actual || 0
                       }))}
                       keys={['target', 'actual']}
                       colors={['bg-slate-300', selectedPot.color.split(' ')[0].replace('bg-', 'bg-')]} // Hacky color extraction or pass explicit
                    />
                 </div>
                 <div className="flex justify-center gap-6 mt-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                       <div className="w-3 h-3 bg-slate-300 rounded-sm"></div> Target
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                       <div className={`w-3 h-3 rounded-sm ${selectedPot.color.split(' ')[0]}`}></div> Actual
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

// --- TOAST COMPONENT ---
const Toast = ({ message, onClose }) => (
  <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl z-[100] animate-in slide-in-from-bottom-4 fade-in duration-300 flex items-center gap-3">
    <div className="bg-emerald-500 rounded-full p-1">
      <Check className="w-3 h-3 text-slate-900" />
    </div>
    <span className="font-medium text-sm">{message}</span>
  </div>
);

// --- ADD EXPENSE MODAL ---
const AddExpenseModal = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [logo, setLogo] = useState(null); 

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !amount) return;
    onSave(name, safeCalculate(amount), logo);
    setName('');
    setAmount('');
    setLogo(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in">
      {/* 1. ADD ID HERE: Used for 'The Form' step */}
      <div id="modal-add-expense" className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800">New Expense</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Bill Name</label>
            
            {/* 2. ADD ID HERE: Used for 'Smart Search' step */}
            <div id="input-expense-name">
              <BrandSearchInput 
                autoFocus={true}
                placeholder="e.g. Netflix, Tesco..." 
                className="w-full p-4 rounded-xl bg-slate-50 border-none text-lg font-medium text-slate-800 placeholder-slate-300 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                value={name}
                onChange={setName}
                onSelectBrand={(brandName, brandLogo) => {
                  setName(brandName);
                  setLogo(brandLogo);
                }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Amount</label>
            
            {/* 3. ADD ID HERE: Used for 'The Cost' step */}
            <div className="relative" id="input-expense-amount">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">£</span>
              <input 
                type="text" 
                placeholder="0.00" 
                className="w-full pl-10 p-4 rounded-xl bg-slate-50 border-none text-lg font-bold text-slate-800 placeholder-slate-300 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          
          <button 
            type="submit"
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 active:scale-95 transition-all mt-2"
          >
            Add Expense
          </button>
        </form>
      </div>
    </div>
  );
};

// --- SANDBOX INFO MODAL ---
const SandboxInfoModal = ({ onClose, onConfirm }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200 p-6 text-center">
      <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <FlaskConical className="w-8 h-8 text-indigo-600" />
      </div>
      <h3 className="font-bold text-xl text-slate-800 mb-2">Simulation Mode</h3>
      <p className="text-slate-500 text-sm mb-6">
        Enter a safe playground where you can change salaries, add huge expenses, or delete bills to test "What If" scenarios.
        <br/><br/>
        <strong>Nothing you do here will be saved.</strong>
      </p>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition">
          Cancel
        </button>
        <button onClick={onConfirm} className="flex-1 py-3 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg transition">
          Enter Sandbox
        </button>
      </div>
    </div>
  </div>
);

const BrandSearchInput = ({ value, onChange, onSelectBrand, placeholder, className, autoFocus }) => {
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Use the keys provided
  const SECRET_KEY = "sk_EYBVfqJ-SQm1aE9boQ7uzg"; 
  const PUBLIC_KEY = "pk_IlDYZIBjQZOkL2hI7rtHmA";

  useEffect(() => {
    // Debounce search to save API calls
    const timeoutId = setTimeout(async () => {
      if (value.length < 2) {
        setResults([]);
        return;
      }
      
      try {
        const response = await fetch(`https://api.logo.dev/search?q=${encodeURIComponent(value)}`, {
          headers: {
            'Authorization': `Bearer ${SECRET_KEY}`
          }
        });
        const data = await response.json();
        setResults(data.slice(0, 5)); // Limit to 5 results
        setShowDropdown(true);
      } catch (e) {
        console.error("Logo search failed", e);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [value]);

  return (
    <div className="relative">
      <input 
        autoFocus={autoFocus}
        type="text" 
        placeholder={placeholder} 
        className={className}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowDropdown(false); // Hide until debounce fires
        }}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // Delay hide so click registers
      />
      
      {showDropdown && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-xl rounded-xl border border-slate-100 mt-1 z-50 overflow-hidden max-h-60 overflow-y-auto">
          {results.map((brand, i) => (
            <button
              key={i}
              className="w-full text-left p-3 hover:bg-slate-50 flex items-center gap-3 transition border-b border-slate-50 last:border-0"
              onClick={() => {
                const logoUrl = `https://img.logo.dev/${brand.domain}?token=${PUBLIC_KEY}`;
                onSelectBrand(brand.name, logoUrl);
                setShowDropdown(false);
              }}
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 p-1 flex items-center justify-center bg-white">
                 <img src={`https://img.logo.dev/${brand.domain}?token=${PUBLIC_KEY}`} className="w-full h-full object-contain" alt="" />
              </div>
              <div>
                <div className="font-bold text-slate-800 text-sm">{brand.name}</div>
                <div className="text-xs text-slate-400">{brand.domain}</div>
              </div>
            </button>
          ))}
          <div className="p-2 bg-slate-50 text-xs text-center text-slate-400">
            Select a brand or keep typing to add manually
          </div>
        </div>
      )}
    </div>
  );
};



// --- OTHER COMPONENTS ---

const BudgetWheel = ({ salary, expenses, allocations, currency }) => {
  if (!salary || parseFloat(salary) <= 0) return null;

  const salaryNum = parseFloat(salary);
  const totalExpenses = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const expensesPercent = Math.min(100, (totalExpenses / salaryNum) * 100);
  const remainderPercentOfTotal = 100 - expensesPercent;
  
  // --- UPDATED: High Contrast Color Mapping ---
  const getColorHex = (colorString) => {
    if (!colorString) return '#94a3b8'; // Neutral Slate
    const str = colorString.toLowerCase();
    
    // Distinct Spectrum
    if (str.includes('emerald')) return '#10b981'; // Green
    if (str.includes('indigo')) return '#6366f1';  // Deep Blue
    if (str.includes('amber')) return '#f59e0b';   // Yellow/Orange
    if (str.includes('sky')) return '#0ea5e9';     // Light Blue
    if (str.includes('purple')) return '#a855f7';  // Purple
    if (str.includes('rose')) return '#f43f5e';    // Red/Pink
    if (str.includes('cyan')) return '#06b6d4';    // Bright Aqua
    if (str.includes('lime')) return '#84cc16';    // Bright Green
    if (str.includes('fuchsia')) return '#d946ef'; // Hot Pink
    if (str.includes('orange')) return '#f97316';  // Deep Orange
    if (str.includes('teal')) return '#14b8a6';    // Blue-Green
    
    return '#64748b'; // Fallback
  };

  let currentDegree = 0;
  const segments = [];

  const addSegment = (percent, color) => {
    const degrees = (percent / 100) * 360;
    segments.push(`${color} ${currentDegree}deg ${currentDegree + degrees}deg`);
    currentDegree += degrees;
  };

  // 1. Expenses is always Red (Rose-500) for consistency
  addSegment(expensesPercent, '#f43f5e'); 

  allocations.forEach(plan => {
    const planPercentOfTotal = (plan.percentage / 100) * remainderPercentOfTotal;
    addSegment(planPercentOfTotal, getColorHex(plan.color));
  });

  // Fill remainder with white/grey if not 100%
  if (currentDegree < 360) {
      segments.push(`#f1f5f9 ${currentDegree}deg 360deg`);
  }

  const gradient = `conic-gradient(${segments.join(', ')})`;

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden print:hidden">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 w-full text-left">Where your money goes</h3>
      <div className="relative w-48 h-48">
        <div className="w-full h-full rounded-full transition-all duration-1000 ease-out" style={{ background: gradient }}></div>
        <div className="absolute inset-2 bg-white rounded-full flex flex-col items-center justify-center">
           <div className="absolute inset-0 bg-white rounded-full flex flex-col items-center justify-center z-10">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Net Salary</span>
              <span className="text-xl font-bold text-slate-800">{formatCurrency(salaryNum, currency)}</span>
           </div>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center gap-3 mt-6 w-full">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-rose-500"></div>
          <span className="text-xs font-medium text-slate-600">Expenses</span>
        </div>
        {allocations.map(plan => {
           return (
            <div key={plan.id} className="flex items-center gap-1.5">
              <div 
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: getColorHex(plan.color) }}
              ></div>
              <span className="text-xs font-medium text-slate-600">{plan.name.split(' ')[0]}</span>
            </div>
           );
        })}
      </div>
    </div>
  );
};

const LoginScreen = ({ onLogin }) => (
  <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-slate-100 flex flex-col items-center justify-center p-6">
    <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center border border-white/50">
      <div className="bg-emerald-100 p-4 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-inner">
        <Wallet className="w-10 h-10 text-emerald-600" />
      </div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">Budget Planner</h1>
      <p className="text-slate-500 mb-8 font-medium">Secure, private wealth planning.</p>
      
      <button
        onClick={onLogin}
        className="w-full bg-slate-900 text-white py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
      >
        Sign in with Google
      </button>
      <p className="mt-6 text-xs text-slate-400 font-medium">
        Encrypted & Private
      </p>
    </div>
  </div>
);

const StatCard = ({ label, amount, icon: Icon, colorClass, subText, currency }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-full print:border-slate-300 print:shadow-none">
    <div className="flex justify-between items-start mb-2">
      <div className={`p-2.5 rounded-xl ${colorClass} print:bg-white print:border print:border-slate-200`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 print:text-slate-600">{label}</p>
      <h3 className="text-2xl font-bold text-slate-800 print:text-black tracking-tight">{formatCurrency(amount, currency)}</h3>
      {subText && <p className="text-xs text-slate-400 mt-1 print:text-slate-500 font-medium">{subText}</p>}
    </div>
  </div>
);

const AllocationCard = ({ title, targetAmount, actualAmount, percentage, color, currency, onUpdateActual, showRemainderButton, onFillRemainder }) => {
  
  // Robust mapping for the Progress Bar color
  const getBarColor = (c) => {
    if (c.includes('emerald')) return 'bg-emerald-500';
    if (c.includes('indigo')) return 'bg-indigo-500';
    if (c.includes('sky')) return 'bg-sky-500';
    if (c.includes('amber')) return 'bg-amber-500';
    if (c.includes('purple')) return 'bg-purple-500';
    if (c.includes('rose')) return 'bg-rose-500';
    if (c.includes('cyan')) return 'bg-cyan-500';
    if (c.includes('lime')) return 'bg-lime-500';
    if (c.includes('fuchsia')) return 'bg-fuchsia-500';
    if (c.includes('orange')) return 'bg-orange-500';
    if (c.includes('teal')) return 'bg-teal-500';
    return 'bg-slate-500';
  };

  const barColor = getBarColor(color);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm print:border-slate-300 print:shadow-none print:break-inside-avoid">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          {/* Icon container uses the lighter background class passed in props */}
          <div className={`p-2 rounded-lg ${color} bg-opacity-20`}>
            <Target className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-slate-700 print:text-black">{title}</h4>
        </div>
        <div className="text-right">
           <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Target</p>
           <p className="text-lg font-bold text-slate-800 print:text-black">{formatCurrency(targetAmount, currency)}</p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-3">
        <div 
          className={`h-2.5 rounded-full ${barColor} transition-all duration-1000 ease-out`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      {/* Actual Input Row */}
      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl print:bg-transparent print:p-0 print:border-t print:rounded-none print:mt-2">
         <span className="text-xs font-bold text-slate-500 uppercase">Actual Saved</span>
         <div className="flex items-center gap-2">
           {showRemainderButton ? (
              <button 
                onClick={onFillRemainder}
                className="text-xs bg-blue-100 text-blue-600 font-bold hover:bg-blue-200 px-3 py-1.5 rounded-lg print:hidden flex items-center gap-1"
                title="Fill with remaining budget"
              >
                Remainder
              </button>
           ) : (
              onUpdateActual && (
                <button 
                  onClick={() => onUpdateActual(targetAmount)}
                  className="text-xs text-emerald-600 font-bold hover:bg-emerald-100 px-2 py-1 rounded print:hidden"
                  title="Match Target"
                >
                  Match Target
                </button>
              )
           )}
           <div className="relative">
             <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                {currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'}
             </span>
             <input 
                type="text"
                value={actualAmount || ''}
                onChange={(e) => onUpdateActual(e.target.value)}
                onBlur={(e) => onUpdateActual(safeCalculate(e.target.value))}
                onKeyDown={(e) => {
                  if(e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                placeholder="0"
                className="w-24 text-right bg-white border border-slate-200 rounded-lg py-1 pr-2 pl-6 text-sm font-bold text-slate-800 focus:border-emerald-500 outline-none print:bg-transparent print:border-none"
             />
           </div>
         </div>
      </div>
    </div>
  );
};

// --- REPORT COMPONENTS ---

const ReportSelector = ({ onClose, onSelect }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
      <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-400" /> Report Center
        </h2>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
      </div>
      <div className="p-6 space-y-3">
        <button 
          onClick={() => onSelect('month')}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition group text-left"
        >
          <div className="bg-indigo-100 p-3 rounded-full text-indigo-600 group-hover:bg-indigo-200">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Current Month Statement</h3>
            <p className="text-xs text-slate-500">Detailed breakdown for {MONTH_NAMES[new Date().getMonth()]}</p>
          </div>
        </button>

        <button 
          onClick={() => onSelect('history')}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition group text-left"
        >
          <div className="bg-amber-100 p-3 rounded-full text-amber-600 group-hover:bg-amber-200">
            <Table className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Full Annual History</h3>
            <p className="text-xs text-slate-500">Table view of all tracked months</p>
          </div>
        </button>
      </div>
    </div>
  </div>
);

const MonthReportView = ({ date, salary, expenses, allocations, actuals, onClose, currency }) => {
  const totalExpenses = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const salaryNum = parseFloat(salary) || 0;
  const remainder = Math.max(0, salaryNum - totalExpenses);

  return (
    <div className="fixed inset-0 bg-white z-[70] overflow-y-auto">
      <div className="bg-slate-900 text-white p-4 sticky top-0 z-20 flex justify-between items-center shadow-lg print:hidden">
        <h2 className="font-bold">Monthly Statement Preview</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => openReportInNewTab('printable-month-report', `Budget Statement - ${MONTH_NAMES[date.getMonth()]}`)} 
            className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm hover:bg-emerald-400"
          >
            <Printer className="w-4 h-4" /> Open Printable PDF
          </button>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div id="printable-month-report" className="max-w-3xl mx-auto p-8 print:p-0">
        <div className="border-b-2 border-slate-800 pb-4 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-1">Budget Statement</h1>
            <p className="text-slate-500">{MONTH_NAMES[date.getMonth()]} {date.getFullYear()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase">Net Salary</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(salaryNum, currency)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3">Expenses</h3>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {expenses.map(e => (
                  <tr key={e.id}>
                    <td className="py-2 text-slate-600">{e.name}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(e.amount, currency)}</td>
                  </tr>
                ))}
                <tr className="font-bold text-slate-900">
                  <td className="py-3 pt-4">Total Expenses</td>
                  <td className="py-3 pt-4 text-right">{formatCurrency(totalExpenses, currency)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3">Savings & Goals</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase text-right">
                   <th className="text-left font-medium pb-2">Goal</th>
                   <th className="font-medium pb-2">Target</th>
                   <th className="font-medium pb-2">Actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
              {allocations.map(plan => {
                const target = remainder * (plan.percentage / 100);
                const actual = actuals && actuals[plan.id] ? parseFloat(actuals[plan.id]) : 0;
                return (
                  <tr key={plan.id}>
                    <td className="py-2 text-slate-600">{plan.name} <span className="text-xs text-slate-400">({plan.percentage}%)</span></td>
                    <td className="py-2 text-right font-medium text-slate-500">{formatCurrency(target, currency)}</td>
                    <td className={`py-2 text-right font-bold ${actual >= target - 1 ? 'text-emerald-600' : 'text-orange-500'}`}>{formatCurrency(actual, currency)}</td>
                  </tr>
                );
              })}
              </tbody>
            </table>
             <div className="border-t border-slate-200 pt-3 flex justify-between font-bold text-slate-900 mt-2">
                <span>Total Target</span>
                <span>{formatCurrency(remainder, currency)}</span>
              </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center print:border-slate-300">
          <p className="text-sm text-slate-500">This report was generated automatically. Keep it for your records.</p>
        </div>
      </div>
    </div>
  );
};

const HistoryReportView = ({ data, allocations, onClose, currency }) => {
  return (
    <div className="fixed inset-0 bg-white z-[70] overflow-y-auto">
      <div className="bg-slate-900 text-white p-4 sticky top-0 z-20 flex justify-between items-center shadow-lg print:hidden">
        <h2 className="font-bold">Annual History Preview</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => openReportInNewTab('printable-history-report', 'Annual Financial Report')} 
            className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm hover:bg-emerald-400"
          >
            <Printer className="w-4 h-4" /> Open Printable PDF
          </button>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div id="printable-history-report" className="max-w-5xl mx-auto p-8 print:p-0 print:landscape">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 hidden print:block">Annual Financial Report</h1>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="py-3 px-2 font-bold text-slate-700">Month</th>
                <th className="py-3 px-2 font-bold text-slate-700 text-right">Net Salary</th>
                <th className="py-3 px-2 font-bold text-slate-700 text-right">Expenses</th>
                <th className="py-3 px-2 font-bold text-slate-700 text-right border-r border-slate-200 pr-4">Target Savings</th>
                {allocations.map(plan => (
                  <th key={plan.id} className="py-3 px-2 font-bold text-indigo-700 text-right text-xs uppercase w-24">
                    {plan.name.split(' ')[0]} (Act)
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => {
                const totalExpenses = (row.expenses || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                const salary = parseFloat(row.salary) || 0;
                const remainder = Math.max(0, salary - totalExpenses);
                const actuals = row.actualSavings || {};

                return (
                  <tr key={row.id} className="hover:bg-slate-50 break-inside-avoid">
                    <td className="py-3 px-2 font-medium text-slate-800">{row.id}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-emerald-600">{formatCurrency(salary, currency)}</td>
                    <td className="py-3 px-2 text-right font-mono text-rose-500">{formatCurrency(totalExpenses, currency)}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-slate-900 border-r border-slate-200 pr-4">{formatCurrency(remainder, currency)}</td>
                    {allocations.map(plan => {
                      const actual = actuals[plan.id] ? parseFloat(actuals[plan.id]) : 0;
                      const target = remainder * (plan.percentage / 100);
                      const isMet = actual >= target - 1; // Tolerance of 1
                      
                      return (
                        <td key={plan.id} className={`py-3 px-2 text-right font-mono text-sm ${isMet ? 'text-emerald-600' : 'text-orange-500'}`}>
                          {formatCurrency(actual, currency)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SettingsScreen = ({ user, onClose, currentSettings, onSaveSettings, onResetMonth }) => {
  const [displayName, setDisplayName] = useState(currentSettings.displayName || user.displayName || '');
  const [allocations, setAllocations] = useState(currentSettings.allocationRules || DEFAULT_ALLOCATIONS);
  const [defaultExpenses, setDefaultExpenses] = useState(currentSettings.defaultFixedExpenses || DEFAULT_FIXED_EXPENSES);
  const [currency, setCurrency] = useState(currentSettings.currency || 'GBP');
  
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanPercent, setNewPlanPercent] = useState('');
  const [newDefExpName, setNewDefExpName] = useState('');
  const [newDefExpAmount, setNewDefExpAmount] = useState('');
  const [newDefExpLogo, setNewDefExpLogo] = useState(null);

  const totalPercentage = allocations.reduce((sum, item) => sum + parseFloat(item.percentage), 0);

  const handleSave = () => {
    if (totalPercentage !== 100) {
      alert("Total percentage must equal 100%");
      return;
    }
    onSaveSettings({
      displayName,
      currency,
      allocationRules: allocations,
      defaultFixedExpenses: defaultExpenses
    });
    onClose();
  };

  const addAllocation = () => {
    if(!newPlanName || !newPlanPercent) return;
    setAllocations([...allocations, { 
      id: Date.now().toString(), 
      name: newPlanName, 
      percentage: parseFloat(newPlanPercent),
      color: 'bg-slate-100 text-slate-600'
    }]);
    setNewPlanName('');
    setNewPlanPercent('');
  };

  const removeAllocation = (id) => setAllocations(allocations.filter(a => a.id !== id));

  const addDefaultExpense = () => {
    if(!newDefExpName) return; 
    const amountVal = parseFloat(newDefExpAmount) || 0;
    
    setDefaultExpenses([...defaultExpenses, {
      id: Date.now().toString(),
      name: newDefExpName,
      amount: amountVal,
      type: 'fixed',
      logo: newDefExpLogo
    }]);
    setNewDefExpName('');
    setNewDefExpAmount('');
    setNewDefExpLogo(null);
  };

  const removeDefaultExpense = (id) => setDefaultExpenses(defaultExpenses.filter(e => e.id !== id));

  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 overflow-y-auto animate-in slide-in-from-bottom-10 print:hidden">
      <div className="bg-white border-b border-slate-100 p-4 sticky top-0 z-10 flex justify-between items-center shadow-sm">
        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
          <Settings className="w-5 h-5 text-slate-500" /> Settings
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition">
          <X className="w-6 h-6 text-slate-500" />
        </button>
      </div>

      <div className="max-w-xl mx-auto p-6 space-y-8 pb-20">
        {/* Profile Name */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Profile & Currency</h3>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Display Name</label>
              <input 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 focus:border-emerald-500 outline-none transition"
                placeholder="Your Name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Currency</label>
              <div className="flex gap-2">
                 {['GBP', 'USD', 'EUR'].map(c => (
                   <button
                     key={c}
                     onClick={() => setCurrency(c)}
                     className={`px-4 py-2 rounded-lg font-bold text-sm transition ${currency === c ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
                   >
                     {c}
                   </button>
                 ))}
              </div>
            </div>
          </div>
        </section>

        {/* 1. ADD ID: Settings Spending Plan */}
        <section className="space-y-3" id="settings-spending-plan">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Spending Plan</h3>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${totalPercentage === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              Total: {totalPercentage}%
            </span>
          </div>
          
          <div className="space-y-2">
            {allocations.map(plan => (
              <div key={plan.id} className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <input 
                  value={plan.name}
                  onChange={(e) => setAllocations(allocations.map(a => a.id === plan.id ? {...a, name: e.target.value} : a))}
                  className="flex-1 font-medium text-slate-700 bg-transparent border-none outline-none focus:ring-0" 
                />
                <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
                  <input 
                    type="number"
                    value={plan.percentage}
                    onChange={(e) => setAllocations(allocations.map(a => a.id === plan.id ? {...a, percentage: parseFloat(e.target.value) || 0} : a))}
                    className="w-10 bg-transparent text-right font-bold text-slate-800 outline-none"
                  />
                  <span className="text-slate-500 text-sm">%</span>
                </div>
                <button onClick={() => removeAllocation(plan.id)} className="text-slate-300 hover:text-red-500 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            <div className="flex gap-2 pt-2">
              <input 
                placeholder="New Pot Name"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                className="flex-1 p-3 text-sm border border-slate-200 rounded-xl bg-slate-50"
              />
              <input 
                type="number"
                placeholder="%"
                value={newPlanPercent}
                onChange={(e) => setNewPlanPercent(e.target.value)}
                className="w-16 p-3 text-sm border border-slate-200 rounded-xl bg-slate-50"
              />
              <button onClick={addAllocation} className="bg-slate-900 text-white p-3 rounded-xl">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* 2. ADD ID: Settings Fixed Expenses */}
        <section className="space-y-3" id="settings-fixed-expenses">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Default Monthly Bills</h3>
          <p className="text-xs text-slate-500">These automatically copy over when you start a new month.</p>
          
          <div className="space-y-2">
            {defaultExpenses.map(exp => (
              <div key={exp.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                   {exp.logo && <img src={exp.logo} className="w-6 h-6 object-contain rounded-full bg-slate-50" alt="" />}
                   <span className="font-medium text-slate-700">{exp.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-medium text-sm ${exp.amount === 0 ? 'text-orange-500 bg-orange-50 px-2 py-0.5 rounded text-xs' : 'text-slate-600'}`}>
                    {exp.amount > 0 ? formatCurrency(exp.amount, currency) : 'Variable'}
                  </span>
                  <button onClick={() => removeDefaultExpense(exp.id)} className="text-slate-300 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            <div className="flex gap-2 pt-2 items-start">
              <div className="flex-1">
                <BrandSearchInput
                  placeholder="Bill Name (e.g. AMEX)"
                  value={newDefExpName}
                  onChange={setNewDefExpName}
                  onSelectBrand={(brandName, brandLogo) => {
                    setNewDefExpName(brandName);
                    setNewDefExpLogo(brandLogo);
                  }}
                  className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>
              
              {/* 3. ADD ID: Specific Input for Variable Amount Tutorial */}
              <div id="settings-new-expense-amount">
                <input 
                    type="text"
                    inputMode="decimal"
                    placeholder="£"
                    value={newDefExpAmount}
                    onChange={(e) => setNewDefExpAmount(e.target.value)}
                    onBlur={() => setNewDefExpAmount(safeCalculate(newDefExpAmount))}
                    className="w-24 p-3 text-sm border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>
              <button onClick={addDefaultExpense} className="bg-slate-900 text-white p-3 rounded-xl">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-3 pt-6 border-t border-slate-100">
           <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Danger Zone
          </h3>
          <button 
            onClick={onResetMonth}
            className="w-full border border-red-100 text-red-600 bg-red-50 py-4 rounded-xl font-semibold hover:bg-red-100 transition flex items-center justify-center gap-2"
          >
            Reset This Month Data
          </button>
        </section>

        <button 
          onClick={handleSave}
          className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition transform active:scale-95"
        >
          <Save className="w-5 h-5" /> Save Changes
        </button>
      </div>
    </div>
  );
};

// --- UPDATED HELP MODAL ---
const HelpModal = ({ onClose, onStartTutorial }) => (
  <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 overflow-y-auto animate-in slide-in-from-bottom-10">
    <div className="bg-white border-b border-slate-100 p-4 sticky top-0 z-10 flex justify-between items-center shadow-sm">
      <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
        <HelpCircle className="w-5 h-5 text-emerald-500" /> User Guide
      </h2>
      <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition">
        <X className="w-6 h-6 text-slate-500" />
      </button>
    </div>

    <div className="max-w-2xl mx-auto p-6 space-y-8 pb-20">
      
      {/* SECTION 1: BASICS & SETTINGS */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
           <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Configuration</h3>
           {/* --- NEW BUTTON --- */}
           <button 
             onClick={() => onStartTutorial('settings')}
             className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-200 transition flex items-center gap-1"
           >
             <Settings className="w-3 h-3" /> Show me how
           </button>
           {/* ------------------ */}
        </div>
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex gap-4">
             <div className="bg-white p-2 rounded-lg border border-slate-200 h-fit"><Settings className="w-5 h-5 text-slate-400" /></div>
             <div>
              <h4 className="font-bold text-slate-800">Allocations & Fixed Bills</h4>
              <p className="text-sm text-slate-500 mt-1">Configure your savings pots and recurring monthly commitments.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* SECTION 2: EXPENSES */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
           <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Managing Expenses</h3>
           <button 
             onClick={() => onStartTutorial('add_expense')}
             className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-200 transition flex items-center gap-1"
           >
             <Zap className="w-3 h-3" /> Show me how
           </button>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <ul className="space-y-4">
            <li className="flex gap-3">
              <div className="mt-1"><Plus className="w-4 h-4 text-emerald-500" /></div>
              <div>
                <span className="font-bold text-slate-800 text-sm">Adding Bills:</span>
                <p className="text-sm text-slate-500">Tap "New Expense". Type a brand name to find its logo.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="mt-1"><Edit2 className="w-4 h-4 text-indigo-500" /></div>
              <div>
                <span className="font-bold text-slate-800 text-sm">Editing:</span>
                <p className="text-sm text-slate-500">Tap any expense amount to change it instantly.</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* SECTION 4: ADVANCED */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
           <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Advanced Tools</h3>
           <button 
             onClick={() => onStartTutorial('advanced_features')}
             className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-200 transition flex items-center gap-1"
           >
             <Zap className="w-3 h-3" /> Show me how
           </button>
        </div>
        <div className="grid grid-cols-1 gap-3">
           <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white">
              <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><BarChart3 className="w-5 h-5" /></div>
              <div>
                 <h4 className="font-bold text-slate-800 text-sm">Analytics</h4>
                 <p className="text-xs text-slate-500">View trends and history.</p>
              </div>
           </div>
           {/* ... sandbox item ... */}
        </div>
      </section>

    </div>
  </div>
);


// --- NEW COMPONENT: ONBOARDING WIZARD ---
const OnboardingWizard = ({ user, onComplete }) => {
  const [step, setStep] = useState(0); // 0:Intro, 1:Currency, 2:Pots, 3:Bills
  const [currency, setCurrency] = useState('GBP');
  
  // Pots State
  const [pots, setPots] = useState([
    { id: '1', name: 'Savings', percentage: 20, color: 'bg-emerald-100 text-emerald-700 bar-emerald' },
    { id: '2', name: 'Expenses', percentage: 80, color: 'bg-indigo-100 text-indigo-700 bar-indigo' }
  ]);
  const [newPotName, setNewPotName] = useState('');
  const [newPotPercent, setNewPotPercent] = useState('');

  // Bills State
  const [bills, setBills] = useState([]);
  const [newBillName, setNewBillName] = useState('');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [newBillLogo, setNewBillLogo] = useState(null);

  const totalPercent = pots.reduce((sum, p) => sum + p.percentage, 0);

  const addPot = () => {
    if (!newPotName || !newPotPercent) return;
    const colors = [
      'bg-emerald-100 text-emerald-700 bar-emerald',
      'bg-indigo-100 text-indigo-700 bar-indigo',
      'bg-sky-100 text-sky-700 bar-sky',
      'bg-amber-100 text-amber-700 bar-amber',
      'bg-purple-100 text-purple-700 bar-purple',
      'bg-fuchsia-100 text-fuchsia-700 bar-fuchsia',
      'bg-orange-100 text-orange-700 bar-orange',
      'bg-cyan-100 text-cyan-700 bar-cyan',
      'bg-lime-100 text-lime-700 bar-lime'
    ];
    // ---------------------------------------
    
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    setPots([...pots, { 
      id: Date.now().toString(), 
      name: newPotName, 
      percentage: parseFloat(newPotPercent), 
      color: randomColor 
    }]);
    setNewPotName('');
    setNewPotPercent('');
  };

  const addBill = () => {
    if (!newBillName) return;
    setBills([...bills, {
      id: Date.now().toString(),
      name: newBillName,
      amount: parseFloat(newBillAmount) || 0,
      type: 'fixed',
      logo: newBillLogo
    }]);
    setNewBillName('');
    setNewBillAmount('');
    setNewBillLogo(null);
  };

  const handleFinish = () => {
    const settings = {
      displayName: user.displayName || 'Friend',
      currency,
      allocationRules: pots,
      defaultFixedExpenses: bills
    };
    onComplete(settings);
  };

  return (
    <div className="fixed inset-0 bg-white z-[200] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="max-w-md w-full space-y-8">
        
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`w-3 h-3 rounded-full transition-all ${step === i ? 'bg-slate-900 scale-125' : 'bg-slate-200'}`} />
          ))}
        </div>

        {/* STEP 0: WELCOME */}
        {step === 0 && (
          <div className="text-center space-y-6 animate-in slide-in-from-bottom-8">
            <div className="bg-emerald-100 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3">
               <Wallet className="w-12 h-12 text-emerald-600" />
            </div>
            <h1 className="text-4xl font-bold text-slate-800">Welcome to<br/>Budget Planner</h1>
            <p className="text-slate-500 text-lg">Let's build a financial system that works for you, not against you.</p>
            <button onClick={() => setStep(1)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 transition">
              Get Started
            </button>
          </div>
        )}

        {/* STEP 1: CURRENCY */}
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800">First things first</h2>
              <p className="text-slate-500">Select your primary currency.</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {['GBP', 'USD', 'EUR'].map(c => (
                <button 
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`py-6 rounded-2xl font-bold text-xl border-2 transition ${currency === c ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 hover:border-slate-200 text-slate-600'}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 transition mt-4">
              Next Step
            </button>
          </div>
        )}

        {/* STEP 2: POTS */}
        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800">The 100% Rule</h2>
              <p className="text-slate-500">Every penny needs a job. Assign percentages to your savings pots.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 max-h-60 overflow-y-auto">
              {pots.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                  <span className="font-bold text-slate-700">{p.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="bg-slate-100 px-2 py-1 rounded text-sm font-bold">{p.percentage}%</span>
                    <button onClick={() => setPots(pots.filter(x => x.id !== p.id))}><X className="w-4 h-4 text-slate-300 hover:text-red-500" /></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Pot Form */}
            <div className="flex gap-2">
               <input 
                 className="flex-1 p-3 rounded-xl border border-slate-200 bg-white" 
                 placeholder="New Pot (e.g. Holiday)" 
                 value={newPotName} 
                 onChange={e => setNewPotName(e.target.value)} 
               />
               <input 
                 type="number" 
                 className="w-20 p-3 rounded-xl border border-slate-200 bg-white" 
                 placeholder="%" 
                 value={newPotPercent} 
                 onChange={e => setNewPotPercent(e.target.value)} 
               />
               <button onClick={addPot} className="bg-slate-900 text-white p-3 rounded-xl"><Plus className="w-5 h-5" /></button>
            </div>

            <div className={`p-4 rounded-xl flex justify-between items-center ${totalPercent === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
               <span className="font-bold text-sm">Total Allocation</span>
               <span className="font-bold text-xl">{totalPercent}%</span>
            </div>

            <button 
              disabled={totalPercent !== 100}
              onClick={() => setStep(3)} 
              className="w-full bg-slate-900 disabled:bg-slate-300 disabled:text-slate-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 transition"
            >
              Continue
            </button>
          </div>
        )}

        {/* STEP 3: BILLS */}
        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800">Monthly Commitments</h2>
              <p className="text-slate-500">Add bills that stay the same every month (Rent, Netflix, Gym).</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 max-h-60 overflow-y-auto">
              {bills.length === 0 && <p className="text-center text-sm text-slate-400 py-4">No bills added yet.</p>}
              {bills.map(b => (
                <div key={b.id} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                   <div className="flex items-center gap-2">
                     {b.logo && <img src={b.logo} className="w-6 h-6 object-contain" alt="" />}
                     <span className="font-bold text-slate-700">{b.name}</span>
                   </div>
                   <div className="flex items-center gap-3">
                     <span className="text-sm font-bold text-slate-500">{b.amount > 0 ? b.amount : 'Var'}</span>
                     <button onClick={() => setBills(bills.filter(x => x.id !== b.id))}><X className="w-4 h-4 text-slate-300 hover:text-red-500" /></button>
                   </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 items-start">
               <div className="flex-1">
                 <BrandSearchInput
                    placeholder="Search (e.g. Spotify)"
                    value={newBillName}
                    onChange={setNewBillName}
                    onSelectBrand={(name, logo) => {
                       setNewBillName(name);
                       setNewBillLogo(logo);
                    }}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white"
                 />
               </div>
               <input 
                 type="number"
                 className="w-20 p-3 rounded-xl border border-slate-200 bg-white" 
                 placeholder="0.00" 
                 value={newBillAmount} 
                 onChange={e => setNewBillAmount(e.target.value)} 
               />
               <button onClick={addBill} className="bg-slate-900 text-white p-3 rounded-xl"><Plus className="w-5 h-5" /></button>
            </div>

            <button onClick={handleFinish} className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-emerald-600 transition mt-4">
              Finish Setup
            </button>
          </div>
        )}

      </div>
    </div>
  );
};


// --- IMPROVED TUTORIAL OVERLAY ---
const TutorialOverlay = ({ steps, currentStep, onNext, onPrev, onClose }) => {
  const [targetRect, setTargetRect] = useState(null);
  const step = steps[currentStep];
  const isMobile = window.innerWidth < 768;

  // 1. Scroll Lock & Position Calculation
  useEffect(() => {
    // Lock body scroll
    document.body.style.overflow = 'hidden';

    const updatePosition = () => {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
        
        // Only scroll if element is out of view
        const isInViewport = (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );

        if (!isInViewport) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        // If target not found (e.g. menu closed), fallback to center
        setTargetRect(null);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true); // Capture scroll events
    
    // Retry finding element after a short delay (allows menus to open)
    const timer = setTimeout(updatePosition, 100); 

    return () => {
      document.body.style.overflow = 'unset'; // Unlock scroll
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      clearTimeout(timer);
    };
  }, [currentStep, step.target]);

  return (
    <div className="fixed inset-0 z-[200]">
      {/* 1. The Backdrop (Darkness) */}
      <div className="absolute inset-0 bg-black/60 mix-blend-hard-light transition-opacity duration-500" />

      {/* 2. The Spotlight (Hole in the darkness) */}
      {targetRect && (
        <div 
          className="absolute transition-all duration-300 ease-out border-2 border-white/50 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] pointer-events-none"
          style={{
            top: targetRect.top - 5,
            left: targetRect.left - 5,
            width: targetRect.width + 10,
            height: targetRect.height + 10,
          }}
        />
      )}

      {/* 3. The Instruction Card */}
      {/* ON DESKTOP: Floats near element. ON MOBILE: Fixed at bottom */}
      <div 
        className={`absolute w-full max-w-sm transition-all duration-500 ease-in-out px-4 md:px-0 
          ${isMobile ? 'bottom-6 left-0 right-0 mx-auto' : ''}`}
        style={!isMobile && targetRect ? {
           // Desktop Positioning Logic
           top: targetRect.top > 300 ? targetRect.top - 180 : targetRect.top + targetRect.height + 20,
           left: targetRect.left > window.innerWidth - 320 ? 'auto' : Math.max(20, targetRect.left), 
           right: targetRect.left > window.innerWidth - 320 ? 20 : 'auto',
        } : {}}
      >
        <div className="bg-white p-5 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 border border-slate-100">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-slate-800">{step.title}</h3>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">{step.content}</p>
          
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-300">Step {currentStep + 1} / {steps.length}</span>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button 
                    onClick={onPrev} 
                    className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition"
                >
                    Back
                </button>
              )}
              <button 
                onClick={onNext} 
                className="px-6 py-2 text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-lg active:scale-95 transition"
              >
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showReportSelector, setShowReportSelector] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState(null); // 'add_expense' or 'advanced_features'
  const [tutorialStep, setTutorialStep] = useState(0);

  const isMobile = window.innerWidth < 768;

  const getTutorialSteps = (id) => {
    switch(id) {
      case 'add_expense': return [
        { 
          target: '#fab-add-expense', 
          title: 'Start Here', 
          content: 'Tap this button to open the "New Expense" form.',
          action: () => setIsAddingExpense(false)
        },
        { 
          target: '#modal-add-expense', 
          title: 'The Form', 
          content: 'This is where you add your details.',
          action: () => setIsAddingExpense(true)
        },
        { 
          target: '#input-expense-name',
          title: 'Smart Search', 
          content: 'Type a brand name like "Netflix" here. We automatically find the logo.',
          action: () => {}
        },
        { 
          target: '#input-expense-amount',
          title: 'The Cost', 
          content: 'Enter the monthly cost here.',
          action: () => {}
        }
      ];
      case 'advanced_features': return [
        {
          // IF MOBILE: Target the mobile button, ELSE target desktop button
          target: isMobile ? '#btn-analytics-mobile' : '#btn-analytics',
          title: 'Analytics Dashboard',
          content: 'Tap here to see graphs of your spending and savings over time.',
          action: () => { 
             setShowAnalytics(false); 
             // IF MOBILE: Open the menu so the button is visible!
             if(isMobile) setMobileMenuOpen(true);
          }
        },
        {
          target: isMobile ? '#btn-sandbox-mobile' : '#btn-sandbox',
          title: 'Sandbox Mode',
          content: 'This toggle activates "Simulation Mode". Test safe scenarios here.',
          action: () => {
             // Keep menu open for second step on mobile
             if(isMobile) setMobileMenuOpen(true);
          }
        }
      ];
      case 'settings': return [
        {
          target: isMobile ? '#btn-settings-mobile' : '#btn-settings',
          title: 'Global Settings',
          content: 'Tap here to configure your profile, currency, and recurring budget rules.',
          action: () => {
             setShowSettings(false); // Ensure modal is closed initially
             if(isMobile) setMobileMenuOpen(true); // Open menu on mobile
          }
        },
        {
          target: '#settings-spending-plan',
          title: 'Spending Plan',
          content: 'Adjust your savings pots here. Ensure total equals 100%.',
          action: () => {
              setMobileMenuOpen(false); // Close mobile menu now
              setShowSettings(true);    // Open Settings Modal
          }
        },
        {
          target: '#settings-fixed-expenses',
          title: 'Recurring Bills',
          content: 'Add bills here that you pay every single month (Rent, Gym, etc).',
          action: () => {}
        },
        {
          target: '#settings-new-expense-amount',
          title: 'Variable Bills',
          content: 'Leave this amount blank for bills that change every month (like Credit Cards).',
          action: () => {}
        }
      ];
      default: return [];
    }
  };

  const startTutorial = (id) => {
    setShowHelp(false); // Close help menu
    setActiveTutorial(id);
    setTutorialStep(0);
    // Execute the action for the first step immediately
    const steps = getTutorialSteps(id);
    if(steps[0] && steps[0].action) steps[0].action();
  };

  const handleTutorialNext = () => {
    const steps = getTutorialSteps(activeTutorial);
    if (tutorialStep < steps.length - 1) {
      const nextStepIndex = tutorialStep + 1;
      setTutorialStep(nextStepIndex);
      
      // Run the action for the next step
      if (steps[nextStepIndex].action) {
          steps[nextStepIndex].action();
      }
    } else {
      // Finish
      setActiveTutorial(null);
      setIsAddingExpense(false);
      setMobileMenuOpen(false); // Close menu on finish
    }
  };
  const [activeReport, setActiveReport] = useState(null); // 'month' or 'history'
  const [reportData, setReportData] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false); // New state for analytics dashboard
  const [isSandbox, setIsSandbox] = useState(false); // New state for sandbox mode
  const [showSandboxInfo, setShowSandboxInfo] = useState(false);

  // Data State
  const [salary, setSalary] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [actualSavings, setActualSavings] = useState({}); // New State for Actuals
  
  // Sandbox Data State
  const [sandboxSalary, setSandboxSalary] = useState('');
  const [sandboxExpenses, setSandboxExpenses] = useState([]);
  const [sandboxActualSavings, setSandboxActualSavings] = useState({});

  const [userSettings, setUserSettings] = useState({
    displayName: '',
    currency: 'GBP',
    allocationRules: DEFAULT_ALLOCATIONS,
    defaultFixedExpenses: DEFAULT_FIXED_EXPENSES
  });

  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [isAddingExpense, setIsAddingExpense] = useState(false); // For Modal
  const [searchTerm, setSearchTerm] = useState(''); // Added search state
  const [sortMode, setSortMode] = useState('date');

  // Derived state variables to toggle between real and sandbox data
  const displaySalary = isSandbox ? sandboxSalary : salary;
  const displayExpenses = isSandbox ? sandboxExpenses : expenses;
  const displayActualSavings = isSandbox ? sandboxActualSavings : actualSavings;

  // Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const initAuth = async () => {
      const config = getFirebaseConfig();
      if (!config.apiKey) return;

      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try {
          if (YOUR_FIREBASE_KEYS.apiKey === "") {
             await signInWithCustomToken(auth, __initial_auth_token);
          }
        } catch (e) {
          console.error("Auth error", e);
        }
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const settingsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'config');
    const unsub = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserSettings(docSnap.data());
        // User has settings, so they are NOT new (or have finished onboarding)
        setOnboardingComplete(true);
      } else {
        // User has NO settings. Do NOT save defaults yet.
        // This triggers the Onboarding Wizard to appear.
        setOnboardingComplete(false);
        setUserSettings({
          displayName: user.displayName || '',
          currency: 'GBP',
          allocationRules: [], // Start empty
          defaultFixedExpenses: [] // Start empty
        });
      }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const monthId = getMonthId(currentDate);
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'budgetData', monthId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSalary(data.salary || '');
        setExpenses(data.expenses || []);
        setActualSavings(data.actualSavings || {});
      } else {
        setSalary('');
        setExpenses(userSettings.defaultFixedExpenses || DEFAULT_FIXED_EXPENSES);
        setActualSavings({});
      }
    }, (error) => {
      console.error("Error fetching data:", error);
    });

    return () => unsubscribe();
  }, [user, currentDate, userSettings.defaultFixedExpenses]);

  const handleReportSelection = async (type) => {
    if (type === 'month') {
      setActiveReport('month');
      setShowReportSelector(false);
    } else if (type === 'history') {
      try {
        const colRef = collection(db, 'artifacts', appId, 'users', user.uid, 'budgetData');
        const snapshot = await getDocs(colRef);
        const data = [];
        snapshot.forEach(doc => {
          const val = doc.data();
          if (val.salary && parseFloat(val.salary) > 0) {
            data.push({ id: doc.id, ...val });
          }
        });
        data.sort((a, b) => a.id.localeCompare(b.id));
        setReportData(data);
        setActiveReport('history');
        setShowReportSelector(false);
      } catch (e) {
        console.error("Error generating history", e);
        showToast("Could not load history.");
      }
    }
  };

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      if (!YOUR_FIREBASE_KEYS.apiKey) {
        await signInAnonymously(auth);
      } else {
        alert("Login failed. Check your Firebase Keys.");
      }
    }
  };

  const handleLogout = () => signOut(auth);

  const copyFromPreviousMonth = async () => {
    if (!user) return;
    triggerHaptic(); // Haptic
    if (!confirm("Overwrite current month with last month's data?")) return;

    try {
      const prevDate = new Date(currentDate);
      prevDate.setMonth(prevDate.getMonth() - 1);
      const prevMonthId = getMonthId(prevDate);
      
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'budgetData', prevMonthId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (isSandbox) {
             setSandboxSalary(data.salary || '');
             setSandboxExpenses(data.expenses || []);
             // sandbox doesn't save to DB
        } else {
            setSalary(data.salary || '');
            setExpenses(data.expenses || []);
            saveData(data.salary, data.expenses, {}); // Don't copy actuals, they are new
        }
        showToast("Copied from last month!");
      } else {
        showToast("No data found for previous month.");
      }
    } catch (e) {
      console.error("Error copying data", e);
      showToast("Failed to copy data.");
    }
  };

  const saveData = async (newSalary, newExpenses, newActuals) => {
    if (!user || isSandbox) return; // Block saving in Sandbox mode
    const monthId = getMonthId(currentDate);
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'budgetData', monthId);
    await setDoc(docRef, { 
      salary: newSalary, 
      expenses: newExpenses, 
      actualSavings: newActuals || actualSavings,
      lastUpdated: new Date() 
    });
  };

  const saveSettings = async (newSettings) => {
    if (!user) return;
    triggerHaptic(); // Haptic
    const settingsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'config');
    await setDoc(settingsRef, newSettings);
    showToast("Settings saved!");
  };

  const resetCurrentMonth = async () => {
    if (!user) return;
    triggerHaptic(); // Haptic
    if (isSandbox) {
        setSandboxSalary('');
        setSandboxExpenses([]);
        setSandboxActualSavings({});
        showToast("Sandbox reset.");
        setShowSettings(false);
        return;
    }

    if (confirm("Are you sure? This will clear all data for this month.")) {
      const monthId = getMonthId(currentDate);
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'budgetData', monthId);
      await deleteDoc(docRef);
      setShowSettings(false);
      showToast("Month reset.");
    }
  };

  const updateSalary = (val) => {
    if (isSandbox) {
        setSandboxSalary(val);
    } else {
        setSalary(val);
        saveData(val, expenses, actualSavings);
    }
  };

  const fillRemainder = (targetPlanId) => {
    const salaryNum = parseFloat(displaySalary) || 0;
    const totalExp = displayExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const remainder = Math.max(0, salaryNum - totalExp);

    // Calculate total allocated to other plans
    const otherAllocated = userSettings.allocationRules.reduce((sum, plan) => {
      if (plan.id === targetPlanId) return sum;
      const val = displayActualSavings[plan.id];
      return sum + (parseFloat(val) || 0);
    }, 0);
    
    const remainingToAllocate = Math.max(0, remainder - otherAllocated);
    updateActualSavings(targetPlanId, remainingToAllocate.toFixed(2)); // 2 decimal places for currency
    triggerHaptic();
  };

  const updateActualSavings = (planId, val) => {
     if (isSandbox) {
         setSandboxActualSavings({ ...sandboxActualSavings, [planId]: val });
     } else {
         const newActuals = { ...actualSavings, [planId]: val };
         setActualSavings(newActuals);
         saveData(salary, expenses, newActuals);
     }
  };

  const handleAddExpenseSave = (name, amount, logo) => {
    triggerHaptic(); // Haptic
    const newExp = {
      id: Date.now().toString(),
      name: name,
      amount: parseFloat(amount),
      type: 'variable',
      logo: logo
    };
    if (isSandbox) {
        setSandboxExpenses([...sandboxExpenses, newExp]);
    } else {
        const updatedExpenses = [...expenses, newExp];
        setExpenses(updatedExpenses);
        saveData(salary, updatedExpenses, actualSavings);
    }
    setIsAddingExpense(false);
    showToast("Bill added!");
  };


  const updateExpenseAmount = (id, newAmount) => {
    const updatedExpenses = displayExpenses.map(e => 
      e.id === id ? { ...e, amount: parseFloat(newAmount) || 0 } : e
    );
    
    if (isSandbox) {
        setSandboxExpenses(updatedExpenses);
    } else {
        setExpenses(updatedExpenses);
        saveData(salary, updatedExpenses, actualSavings);
    }
    // Removed setEditingExpenseId(null) to keep edit mode open
  };

  const updateExpenseName = (id, newName) => {
    const updatedExpenses = displayExpenses.map(e => 
      e.id === id ? { ...e, name: newName } : e
    );

    if (isSandbox) {
        setSandboxExpenses(updatedExpenses);
    } else {
        setExpenses(updatedExpenses);
        saveData(salary, updatedExpenses, actualSavings);
    }
    // Removed setEditingExpenseId(null)
  };

  const removeExpense = (id) => {
    triggerHaptic(); // Haptic
    const updatedExpenses = displayExpenses.filter(e => e.id !== id);
    
    if (isSandbox) {
        setSandboxExpenses(updatedExpenses);
    } else {
        setExpenses(updatedExpenses);
        saveData(salary, updatedExpenses, actualSavings);
    }
    showToast("Bill removed.");
  };

  const changeMonth = (delta) => {
    triggerHaptic(); // Haptic
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
    // If changing month while in sandbox, maybe reset sandbox or load that month into sandbox?
    // For simplicity, let's exit sandbox or load that month's data INTO sandbox
    if (isSandbox) {
        // When changing month in sandbox, we should probably just load the new month's data
        // But since we don't want to fetch inside this handler easily, let's just reset sandbox to empty or maybe toggle off?
        // Better UX: stay in sandbox, load data for that month (handled by useEffect but we need to intercept it)
        // Actually, the main useEffect for fetching data will fire when currentDate changes.
        // We need to make sure that effect updates SANDBOX state if isSandbox is true.
        // Let's modify the main useEffect.
    }
  };
  
  const toggleSort = () => {
    triggerHaptic();
    if (sortMode === 'date') setSortMode('amount-desc');
    else if (sortMode === 'amount-desc') setSortMode('name');
    else setSortMode('date');
    showToast(`Sorting by ${sortMode === 'date' ? 'Amount' : sortMode === 'amount-desc' ? 'Name' : 'Date'}`);
  };

  const toggleSandbox = () => {
      triggerHaptic();
      if (isSandbox) {
          // Exit immediately
          setIsSandbox(false);
          showToast("Exited Sandbox Mode.");
      } else {
          // Show info modal before entering
          setShowSandboxInfo(true);
      }
  };

  const confirmEnterSandbox = () => {
      setSandboxSalary(salary);
      setSandboxExpenses([...expenses]);
      setSandboxActualSavings({...actualSavings});
      setIsSandbox(true);
      setShowSandboxInfo(false);
      showToast("Entered Sandbox Mode.");
  };

  const totalExpenses = displayExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const salaryNum = parseFloat(displaySalary) || 0;
  const remainder = Math.max(0, salaryNum - totalExpenses);

  // Count how many plans have an actual value entered
  const filledPlansCount = userSettings.allocationRules.filter(plan => {
      const val = displayActualSavings[plan.id];
      return val !== undefined && val !== '';
  }).length;

  // Filter and Group Expenses
  let filteredExpenses = displayExpenses.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (sortMode === 'amount-desc') {
    filteredExpenses.sort((a, b) => b.amount - a.amount);
  } else if (sortMode === 'name') {
    filteredExpenses.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  const fixedExpenses = filteredExpenses.filter(e => e.type === 'fixed');
  const variableExpenses = filteredExpenses.filter(e => e.type === 'variable');

  if (loading) return <div className="h-screen flex items-center justify-center text-emerald-600">Loading Planner...</div>;
  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className={`min-h-screen pb-24 font-sans transition-colors duration-500 ${isSandbox ? 'bg-indigo-50' : 'bg-slate-50'} print:bg-white print:pb-0`}>
      <style>{`
        @media print {
          @page { margin: 10mm; size: A4 landscape; }
          body { -webkit-print-color-adjust: exact; background-color: white !important; }
        }
      `}</style>

      {/* Sandbox Banner */}
      {isSandbox && (
        <div className="bg-indigo-600 text-white px-4 py-2 text-center text-sm font-bold sticky top-0 z-50 shadow-md flex justify-between items-center">
            <span>🧪 Sandbox Mode Active - Changes are NOT saved</span>
            <button onClick={toggleSandbox} className="bg-white/20 p-1 rounded hover:bg-white/30"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        id="fab-add-expense"
        onClick={() => {
          triggerHaptic();
          setIsAddingExpense(true);
        }}
        className={`fixed bottom-6 right-6 text-white px-6 py-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition z-40 print:hidden flex items-center gap-2 font-bold ${isSandbox ? 'bg-indigo-600' : 'bg-slate-900'}`}
      >
        <Plus className="w-5 h-5" /> New Expense
      </button>

      {/* Toast Notification */}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

      {/* MODALS */}
      <AddExpenseModal 
        isOpen={isAddingExpense} 
        onClose={() => setIsAddingExpense(false)}
        onSave={handleAddExpenseSave}
      />

      {showSettings && (
        <SettingsScreen 
          user={user} 
          currentSettings={userSettings} 
          onClose={() => setShowSettings(false)}
          onSaveSettings={saveSettings}
          onResetMonth={resetCurrentMonth}
        />
      )}

      {showHelp && (
        <HelpModal
          onClose={() => setShowHelp(false)}
          onStartTutorial={startTutorial} 
        />
      )}

      {/* ADD NEW TUTORIAL OVERLAY HERE */}
      {activeTutorial && (
        <TutorialOverlay 
          steps={getTutorialSteps(activeTutorial)}
          currentStep={tutorialStep}
          onNext={handleTutorialNext}
          onPrev={() => setTutorialStep(s => Math.max(0, s - 1))}
          onClose={() => {
            setActiveTutorial(null);
            setIsAddingExpense(false); // Cleanup modals if open
          }}
        />
      )}

      {showReportSelector && (
        <ReportSelector 
          onClose={() => setShowReportSelector(false)}
          onSelect={handleReportSelection}
        />
      )}
      
      {!loading && !onboardingComplete && user && (
        <OnboardingWizard 
          user={user}
          onComplete={async (newSettings) => {
             const settingsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'config');
             await setDoc(settingsRef, newSettings);
             setUserSettings(newSettings);
             setOnboardingComplete(true);
             setShowHelp(true); 
          }}
        />
      )}

      {showAnalytics && (
        <AnalyticsDashboard 
          user={user} 
          onClose={() => setShowAnalytics(false)}
          currency={userSettings.currency}
          allocationRules={userSettings.allocationRules}
        />
      )}

      {showSandboxInfo && (
        <SandboxInfoModal 
            onClose={() => setShowSandboxInfo(false)}
            onConfirm={confirmEnterSandbox}
        />
      )}

      {activeReport === 'month' && (
        <MonthReportView 
          date={currentDate}
          salary={salary}
          expenses={expenses}
          allocations={userSettings.allocationRules}
          actuals={actualSavings}
          onClose={() => setActiveReport(null)}
          currency={userSettings.currency}
        />
      )}

      {activeReport === 'history' && (
        <HistoryReportView 
          data={reportData}
          allocations={userSettings.allocationRules}
          onClose={() => setActiveReport(null)}
          currency={userSettings.currency}
        />
      )}

      {/* MAIN APP HEADER - MENU BUTTON IS HERE, DROPDOWN IS GONE */}
      <header className={`text-white pt-6 pb-24 px-6 rounded-b-[2.5rem] shadow-xl relative z-0 print:hidden transition-all duration-500 ease-in-out ${isSandbox ? 'bg-indigo-900' : 'bg-slate-900'}`}>
        <div className="max-w-2xl mx-auto flex justify-between items-center mb-6 relative">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl shadow-lg ${isSandbox ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-slate-900'}`}>
              {isSandbox ? <FlaskConical className="w-6 h-6" /> : <Wallet className="w-6 h-6" />}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight leading-tight">
                {userSettings.displayName || (user.displayName ? user.displayName.split(' ')[0] : 'Guest')}
              </h1>
              <p className={`text-xs font-bold tracking-wide uppercase ${isSandbox ? 'text-indigo-300' : 'text-emerald-400'}`}>
                {isSandbox ? 'Simulation Mode' : 'Wealth Planner'}
              </p>
            </div>
          </div>

          {/* DESKTOP ACTIONS */}
          <div className="hidden md:flex gap-2">
            
            {/* 1. NEEDS ID */}
             <button 
               id="btn-sandbox" 
               onClick={toggleSandbox} 
               className={`p-2 rounded-xl hover:bg-white/10 transition border ${isSandbox ? 'bg-indigo-800 border-indigo-700' : 'bg-slate-800 border-slate-700/50'}`} 
               title="Sandbox Mode"
             >
              <FlaskConical className={`w-5 h-5 ${isSandbox ? 'text-white' : 'text-purple-400'}`} />
            </button>
            
            {/* 2. NEEDS ID */}
            <button 
              id="btn-analytics" 
              onClick={() => setShowAnalytics(true)} 
              className={`p-2 rounded-xl hover:bg-white/10 transition border ${isSandbox ? 'bg-indigo-800 border-indigo-700' : 'bg-slate-800 border-slate-700/50'}`} 
              title="Trends"
            >
              <BarChart3 className={`w-5 h-5 ${isSandbox ? 'text-indigo-200' : 'text-emerald-400'}`} />
            </button>

            {/* The rest DO NOT need IDs right now */}
            <button onClick={() => setShowReportSelector(true)} className={`p-2 rounded-xl hover:bg-white/10 transition border ${isSandbox ? 'bg-indigo-800 border-indigo-700' : 'bg-slate-800 border-slate-700/50'}`} title="Reports">
              <FileText className={`w-5 h-5 ${isSandbox ? 'text-indigo-200' : 'text-emerald-400'}`} />
            </button>
            <button id="btn-settings" onClick={() => setShowSettings(true)} className={`p-2 rounded-xl hover:bg-white/10 transition border ${isSandbox ? 'bg-indigo-800 border-indigo-700' : 'bg-slate-800 border-slate-700/50'}`}>
              <Settings className="w-5 h-5 text-slate-300" />
            </button>
            <button onClick={() => setShowHelp(true)} className={`p-2 rounded-xl hover:bg-white/10 transition border ${isSandbox ? 'bg-indigo-800 border-indigo-700' : 'bg-slate-800 border-slate-700/50'}`}>
              <HelpCircle className="w-5 h-5 text-slate-300" />
            </button>
            <button onClick={handleLogout} className={`p-2 rounded-xl hover:bg-red-900/50 hover:text-red-200 transition border ${isSandbox ? 'bg-indigo-800 border-indigo-700' : 'bg-slate-800 border-slate-700/50'}`}>
              <LogOut className="w-5 h-5 text-slate-300" />
            </button>
          </div>

          {/* MOBILE MENU TRIGGER */}
          <button 
            onClick={() => {
              triggerHaptic();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="md:hidden p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition active:scale-95"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="px-4 -mt-12 max-w-2xl mx-auto space-y-5 relative z-10 print:mt-0 print:px-0">
        
        {/* Month Selector */}
        <div className="flex items-center justify-between bg-white p-2 rounded-2xl shadow-lg border border-slate-100 max-w-xs mx-auto mb-2 print:hidden">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-xl transition">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <span className="font-bold text-sm text-slate-800 uppercase tracking-wide">
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-xl transition">
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Salary Input */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 print:hidden">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Net Monthly Salary</label>
          <div className="relative">
          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-300">
              {userSettings.currency === 'GBP' ? '£' : userSettings.currency === 'USD' ? '$' : '€'}
            </span>
            <input 
              type="text" 
              value={displaySalary}
              onChange={(e) => updateSalary(e.target.value)}
              onBlur={(e) => updateSalary(safeCalculate(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              placeholder="0.00"
              className="w-full pl-6 text-4xl font-bold text-slate-800 placeholder-slate-200 outline-none bg-transparent py-1"
            />
          </div>
        </div>

        {/* Budget Wheel */}
        <BudgetWheel 
          salary={displaySalary} 
          expenses={displayExpenses} 
          allocations={userSettings.allocationRules}
          currency={userSettings.currency}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 print:hidden">
          <StatCard 
            label="Total Expenses" 
            amount={totalExpenses} 
            icon={TrendingDown} 
            colorClass="bg-rose-50 text-rose-500"
            currency={userSettings.currency}
          />
          <StatCard 
            label="Remainder" 
            amount={remainder} 
            icon={PieChart} 
            colorClass="bg-blue-50 text-blue-600"
            subText="Available for Goals"
            currency={userSettings.currency}
          />
        </div>

        {/* Allocations */}
        {salaryNum > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 print:hidden">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-2">Financial Goals</h3>
            {userSettings.allocationRules.map(plan => {
              const target = remainder * (plan.percentage / 100);
              
              const isFilled = displayActualSavings[plan.id] !== undefined && displayActualSavings[plan.id] !== '';
              const isLastToFill = !isFilled && (userSettings.allocationRules.length - filledPlansCount === 1);

              return (
                <AllocationCard 
                  key={plan.id}
                  title={plan.name} 
                  targetAmount={target}
                  actualAmount={displayActualSavings[plan.id]}
                  percentage={plan.percentage} 
                  color={plan.color || 'bg-slate-100 text-slate-700'}
                  currency={userSettings.currency}
                  onUpdateActual={(val) => updateActualSavings(plan.id, val)}
                  showRemainderButton={isLastToFill}
                  onFillRemainder={() => fillRemainder(plan.id)}
                />
              );
            })}
          </div>
        )}

        {/* Expenses */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden print:hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col gap-3 bg-white">
            <div className="flex justify-between items-center">
               <h3 className="font-bold text-slate-800">Monthly Expenses</h3>
               <div className="flex gap-2">
                 <button 
                   onClick={copyFromPreviousMonth}
                   className="text-xs bg-slate-100 text-slate-600 px-3 py-2 rounded-xl font-bold hover:bg-slate-200 transition flex items-center gap-2"
                 >
                   <Copy className="w-4 h-4" /> <span className="hidden sm:inline">Copy Last Month</span>
                 </button>
               </div>
            </div>
            
            {/* Search Bar and Sort */}
            <div className="relative w-full flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search expenses..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border-none text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-100"
                />
              </div>
              <button 
                onClick={toggleSort}
                className={`p-2 rounded-xl transition ${sortMode !== 'date' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                title="Sort Expenses"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {/* Render Groups */}
            {[
              { title: 'Fixed Bills', items: fixedExpenses },
              { title: 'Variable Spending', items: variableExpenses }
            ].map(group => (
              group.items.length > 0 && (
                <React.Fragment key={group.title}>
                  {/* Group Header */}
                  {(searchTerm || (fixedExpenses.length > 0 && variableExpenses.length > 0)) && (
                    <div className="bg-slate-50/50 px-5 py-2 border-y border-slate-100">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{group.title}</h4>
                    </div>
                  )}
                  
                  {group.items.map((expense) => {
                    const Icon = getExpenseIcon(expense.name);
                    const isEditing = editingExpenseId === expense.id;
                    
                    return (
                    <div key={expense.id} className="p-4 flex justify-between items-center group hover:bg-slate-50 transition">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 rounded-full bg-slate-100 text-slate-500 w-10 h-10 flex items-center justify-center`}>
                           {expense.logo ? (
                             <img src={expense.logo} alt={expense.name} className="w-full h-full object-contain mix-blend-multiply" />
                           ) : (
                             <Icon className="w-4 h-4" />
                           )}
                        </div>
                        <div className="flex-1">
                          {isEditing ? (
                            <input 
                              autoFocus
                              type="text"
                              defaultValue={expense.name}
                              className="font-medium text-slate-800 w-full bg-slate-50 border-b border-slate-300 outline-none pb-1"
                              onBlur={(e) => updateExpenseName(expense.id, e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingExpenseId(null)}
                            />
                          ) : (
                            <p className="font-medium text-slate-800">{expense.name}</p>
                          )}
                          <p className="text-xs text-slate-400 capitalize">{expense.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                      {isEditing ? (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 text-sm">
                              {userSettings.currency === 'GBP' ? '£' : userSettings.currency === 'USD' ? '$' : '€'}
                            </span>
                            <input 
                              autoFocus
                              type="text"
                              defaultValue={expense.amount}
                              onBlur={(e) => updateExpenseAmount(expense.id, safeCalculate(e.target.value))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                   updateExpenseAmount(expense.id, safeCalculate(e.currentTarget.value));
                                   setEditingExpenseId(null);
                                }
                              }}
                              className="w-20 p-1 border rounded bg-white text-right font-bold text-slate-800"
                            />
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              triggerHaptic();
                              setEditingExpenseId(expense.id);
                            }}
                            className={`flex items-center gap-2 hover:bg-slate-50 px-2 py-1 rounded-lg transition ${expense.amount === 0 ? 'bg-orange-50 ring-1 ring-orange-200' : ''} print:hover:bg-transparent print:p-0 print:ring-0`}
                          >
                            {expense.amount === 0 ? (
                              <span className="text-orange-600 text-sm font-bold flex items-center gap-1 px-1 print:text-slate-400 print:italic">
                                Set Amount <Edit2 className="w-3 h-3 print:hidden" />
                              </span>
                            ) : (
                              <span className="font-bold text-slate-700 print:text-black">{formatCurrency(expense.amount, userSettings.currency)}</span>
                            )}
                            
                            {expense.amount > 0 && (
                              <PenLine className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 print:hidden" />
                            )}
                          </button>
                        )}
                        
                        {isEditing ? (
                           <button 
                             onClick={() => setEditingExpenseId(null)}
                             className="bg-emerald-100 text-emerald-600 p-2 rounded-full hover:bg-emerald-200 transition"
                           >
                             <Check className="w-4 h-4" />
                           </button>
                        ) : (
                          <button 
                            onClick={() => removeExpense(expense.id)}
                            className="text-slate-300 hover:text-red-500 transition p-2 ml-1 rounded-full hover:bg-red-50 print:hidden"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )})}
                </React.Fragment>
              )
            ))}
            
            {expenses.length === 0 && (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <div className="bg-slate-50 p-4 rounded-full">
                  <ShoppingCart className="w-6 h-6 text-slate-300" />
                </div>
                <p>No expenses yet.</p>
                <p className="text-xs text-slate-400">Tap the + button to add one.</p>
              </div>
            )}
             {expenses.length > 0 && filteredExpenses.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                <p>No expenses match "{searchTerm}"</p>
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-50 text-right">
             <span className="text-sm text-slate-500 mr-2">Total Outgoings:</span>
             <span className="font-bold text-slate-800">{formatCurrency(totalExpenses, userSettings.currency)}</span>
          </div>
        </div>

        {/* --- NEW CODE: CREATOR FOOTER --- */}
        <div className="text-center py-10 text-slate-400 text-xs font-medium print:hidden">
          <p>Designed & Built by <span className="text-slate-600 font-bold">Yaseen Hussain</span></p>
          <p className="opacity-50 mt-1">© {new Date().getFullYear()} Budget Planner • All Rights Reserved</p>
        </div>

      </div>

      {/* --- NEW LOCATION: MOBILE MENU OVERLAY (OUTSIDE HEADER) --- */}
      {/* This ensures it sits on top of absolutely everything in the app */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Menu Grid */}
            <div className="absolute top-20 right-6 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 grid grid-cols-2 gap-2 animate-in slide-in-from-top-4 fade-in">
                {[
                  { id: 'btn-sandbox-mobile', label: 'Sandbox', icon: FlaskConical, action: toggleSandbox, color: 'text-purple-600', bg: 'bg-purple-50' },
                  { id: 'btn-analytics-mobile', label: 'Analytics', icon: BarChart3, action: () => setShowAnalytics(true), color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Reports', icon: FileText, action: () => setShowReportSelector(true), color: 'text-blue-600', bg: 'bg-blue-50' },
                  { id: 'btn-settings-mobile', label: 'Settings', icon: Settings, action: () => setShowSettings(true), color: 'text-slate-600', bg: 'bg-slate-100' },
                  { label: 'Help', icon: HelpCircle, action: () => setShowHelp(true), color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Logout', icon: LogOut, action: handleLogout, color: 'text-red-600', bg: 'bg-red-50' },
                ].map((item, i) => (
                  <button 
                    key={i}
                    id={item.id} // <--- IMPORTANT: Adding ID here
                    onClick={() => {
                      setMobileMenuOpen(false);
                      item.action();
                    }}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl hover:scale-95 transition ${item.bg}`}
                  >
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                    <span className={`text-xs font-bold ${item.color}`}>{item.label}</span>
                  </button>
                ))}
            </div>
        </div>
      )}
      {/* ---------------------------------------------------------- */}
    </div>
  );
}