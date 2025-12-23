//1REVERT BACK TO THIS IF ANY ERROR

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  signInWithCustomToken,
  signInAnonymously,
  setPersistence,           // <--- ADDED
  browserLocalPersistence
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc,
  onSnapshot,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit
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
  Menu,
  Shield
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

const POT_COLORS = [
  { id: 'emerald', hex: '#10b981', tailwind: 'bg-emerald-100 text-emerald-700' },
  { id: 'blue', hex: '#3b82f6', tailwind: 'bg-blue-100 text-blue-700' },
  { id: 'indigo', hex: '#6366f1', tailwind: 'bg-indigo-100 text-indigo-700' },
  { id: 'violet', hex: '#8b5cf6', tailwind: 'bg-violet-100 text-violet-700' },
  { id: 'amber', hex: '#f59e0b', tailwind: 'bg-amber-100 text-amber-700' },
  { id: 'orange', hex: '#f97316', tailwind: 'bg-orange-100 text-orange-700' },
  { id: 'cyan', hex: '#06b6d4', tailwind: 'bg-cyan-100 text-cyan-700' },
  { id: 'pink', hex: '#ec4899', tailwind: 'bg-pink-100 text-pink-700' },
  { id: 'slate', hex: '#64748b', tailwind: 'bg-slate-200 text-slate-700' },
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
      <title>${title}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body { background-color: white; padding: 20px; font-family: sans-serif; -webkit-print-color-adjust: exact; } 
        @media print { 
          body { padding: 0; margin: 0; } 
          /* Force hide elements with no-print class */
          .no-print, .print\\:hidden { display: none !important; } 
        }
      </style>
    </head>
    <body>
      <div class="max-w-4xl mx-auto print:w-full">${element.innerHTML}</div>
      
      <div class="fixed bottom-4 right-4 no-print print:hidden flex gap-2 z-50">
        <button onclick="window.print()" class="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition">
          Print / Save as PDF
        </button>
      </div>
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

  // 1. Pot-Specific Projections
  // Calculate average actual savings PER POT over the filtered period
  const potProjections = useMemo(() => {
    const projections = {};
    if (filteredData.length === 0) return {};

    allocationRules.forEach(rule => {
      // Sum up actuals for this specific pot across all filtered months
      const totalActualForPot = filteredData.reduce((sum, m) => {
        const val = parseFloat(m.pots[rule.id]?.actual) || 0;
        return sum + val;
      }, 0);
      
      // Calculate monthly average based on the filtered timeframe
      const avg = totalActualForPot / filteredData.length;
      
      projections[rule.id] = {
        avg: avg,
        sixMonths: avg * 6,
        oneYear: avg * 12,
        fiveYears: avg * 60
      };
    });
    return projections;
  }, [filteredData, allocationRules]);
  
  // 2. Variance Calculations (Month-over-Month)
  const getVariance = (key) => {
      if (filteredData.length < 2) return null;
      const current = filteredData[filteredData.length - 1][key];
      const previous = filteredData[filteredData.length - 2][key];
      if (previous === 0) return null;
      const percent = ((current - previous) / previous) * 100;
      return percent;
  };
  
  const incomeVar = getVariance('salary');
  const expenseVar = getVariance('expenses');

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
            {/* --- NEW: POT PROJECTION CARDS --- */}
            <div className="mb-6">
               <h3 className="text-sm font-bold text-slate-800 mb-3 px-2 flex items-center gap-2">
                 <TrendingUp className="w-4 h-4 text-emerald-500" /> Future Projections
               </h3>
               {/* Horizontal Scroll Container */}
               <div className="flex gap-4 overflow-x-auto pb-4 px-2 -mx-2 no-scrollbar snap-x">
                 {allocationRules.map(rule => {
                    const proj = potProjections[rule.id] || { avg: 0, sixMonths: 0, oneYear: 0, fiveYears: 0 };
                    
                    // Simple logic to try and match the pot color (fallback to slate)
                    let colorHex = '#64748b'; 
                    if (rule.color.includes('emerald')) colorHex = '#10b981';
                    else if (rule.color.includes('indigo')) colorHex = '#6366f1';
                    else if (rule.color.includes('sky')) colorHex = '#0ea5e9';
                    else if (rule.color.includes('amber')) colorHex = '#f59e0b';
                    else if (rule.color.includes('rose')) colorHex = '#f43f5e';
                    else if (rule.color.includes('purple')) colorHex = '#a855f7';
                    
                    return (
                       <div key={rule.id} className="min-w-[280px] bg-slate-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden snap-center flex-shrink-0 border border-slate-800">
                          {/* Background Glow based on pot color */}
                          <div 
                            className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-10 -mt-10 blur-xl opacity-20"
                            style={{ backgroundColor: colorHex }}
                          ></div>
                          
                          <div className="relative z-10">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                   <div className="text-[10px] font-bold opacity-60 uppercase tracking-wider mb-1">Projecting</div>
                                   <h4 className="font-bold text-lg leading-tight truncate max-w-[140px]" title={rule.name}>{rule.name}</h4>
                                </div>
                                <div className="text-right">
                                   <div className="text-[10px] font-bold opacity-60 uppercase tracking-wider mb-1">Avg/Mo</div>
                                   <div className="font-mono text-emerald-400 font-bold">{formatCurrency(proj.avg, currency)}</div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10">
                                  <div>
                                     <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">6 Months</div>
                                     <div className="font-bold text-sm">{formatCurrency(proj.sixMonths, currency)}</div>
                                  </div>
                                  <div>
                                     <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">1 Year</div>
                                     <div className="font-bold text-sm">{formatCurrency(proj.oneYear, currency)}</div>
                                  </div>
                                  <div>
                                     <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">5 Years</div>
                                     <div className="font-bold text-sm">{formatCurrency(proj.fiveYears, currency)}</div>
                                  </div>
                              </div>
                          </div>
                       </div>
                    );
                 })}
               </div>
            </div>

            {/* 1. SALARY GRAPH */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
               <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Income Trend</h3>
                    {/* --- NEW: INCOME VARIANCE PILL --- */}
                    {incomeVar !== null && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${incomeVar >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {incomeVar >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(incomeVar).toFixed(1)}%
                        </span>
                    )}
                 </div>
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
                 <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Monthly Expenses</h3>
                    {/* --- NEW: EXPENSE VARIANCE PILL --- */}
                    {expenseVar !== null && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${expenseVar <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {/* Logic flipped for expenses: Up is Bad (Rose), Down is Good (Emerald) */}
                            {expenseVar > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(expenseVar).toFixed(1)}%
                        </span>
                    )}
                 </div>
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
          setShowDropdown(true); // Show immediately when typing
        }}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
      />
      
      {/* Show dropdown if user has typed anything, even if no API results yet */}
      {showDropdown && value.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-xl rounded-xl border border-slate-100 mt-1 z-50 overflow-hidden max-h-60 overflow-y-auto">
          
          {/* --- 1. NEW: ADD MANUALLY BUTTON (Always First) --- */}
          <button
            className="w-full text-left p-3 hover:bg-emerald-50 flex items-center gap-3 transition border-b border-slate-50 group"
            onClick={() => {
              onSelectBrand(value, null); // Pass null logo for manual entry
              setShowDropdown(false);
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 p-1 flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition">
                <Plus className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm group-hover:text-emerald-700">Add "{value}" Manually</div>
              <div className="text-xs text-slate-400">No logo</div>
            </div>
          </button>
          {/* ------------------------------------------------ */}

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
        </div>
      )}
    </div>
  );
};



// --- OTHER COMPONENTS ---

// --- NEW: INTERACTIVE BUDGET WHEEL ---
const BudgetWheel = ({ salary, expenses, allocations, currency, onSliceClick, activeSlice }) => {
  if (!salary || parseFloat(salary) <= 0) return null;

  const salaryNum = parseFloat(salary);
  const totalExpenses = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const expensesPercent = Math.min(100, (totalExpenses / salaryNum) * 100);
  const remainderPercentOfTotal = 100 - expensesPercent;

  let currentDegree = 0;
  
  // Helper to create slice path
  // Note: CSS conic-gradients can't easily handle click events per slice. 
  // To make it truly interactive without complex SVG math, we will use a legend-based interaction 
  // or overlay invisible buttons. For simplicity and robustness, we will make the LEGEND interactive
  // and keep the visual wheel as a reference.
  
  const segments = [];

  // --- CHANGED: Pattern Logic Start ---
  // Define a subtle cross-hatch pattern for inactive areas
  const crossPattern = "repeating-linear-gradient(45deg, #e2e8f0 0, #e2e8f0 1px, transparent 0, transparent 6px), repeating-linear-gradient(-45deg, #e2e8f0 0, #e2e8f0 1px, transparent 0, transparent 6px)";

  const addSegment = (id, percent, color) => {
    const degrees = (percent / 100) * 360;
    // IF activeSlice is set: Only show color if ID matches, otherwise transparent (reveals pattern)
    // IF NO activeSlice: Show color normally
    const segmentColor = activeSlice ? (activeSlice === id ? color : 'transparent') : color;
    
    segments.push(`${segmentColor} ${currentDegree}deg ${currentDegree + degrees}deg`);
    currentDegree += degrees;
  };

  addSegment('expenses', expensesPercent, '#ef4444'); 
  allocations.forEach(plan => {
    const planPercentOfTotal = (plan.percentage / 100) * remainderPercentOfTotal;
    addSegment(plan.id, planPercentOfTotal, plan.hex || '#10b981');
  });
  
  // Remainder segment (Transparent if pattern active, else default slate)
  if (currentDegree < 360) {
      segments.push(`${activeSlice ? 'transparent' : '#f1f5f9'} ${currentDegree}deg 360deg`);
  }
  
  const conic = `conic-gradient(${segments.join(', ')})`;
  
  // Composite Background: Conic Gradient on Top, Pattern on Bottom
  const finalBackground = activeSlice ? `${conic}, ${crossPattern}` : conic;
  // --- CHANGED: Pattern Logic End ---

  // Dynamic Center Text
  let centerLabel = "Net Salary";
  let centerAmount = formatCurrency(salaryNum, currency);
  
  if (activeSlice === 'expenses') {
      centerLabel = "Total Expenses";
      centerAmount = formatCurrency(totalExpenses, currency);
  } else if (activeSlice) {
      const plan = allocations.find(p => p.id === activeSlice);
      if (plan) {
          centerLabel = plan.name;
          const amount = (parseFloat(salary) - totalExpenses) * (plan.percentage / 100);
          centerAmount = formatCurrency(amount, currency);
      }
  }

  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden h-full">
      <div className="flex justify-between w-full mb-6">
         <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Where your money goes</h3>
         {activeSlice && (
             <button onClick={() => onSliceClick(null)} className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 font-bold hover:bg-slate-200">
                 Reset View
             </button>
         )}
      </div>
      
      <div className="relative w-56 h-56 transition-transform duration-500 hover:scale-105">
        {/* UPDATED STYLE PROP HERE: */}
        <div className="w-full h-full rounded-full transition-all duration-1000 ease-out shadow-inner" style={{ background: finalBackground }}></div>
        <div className="absolute inset-2 bg-white rounded-full flex flex-col items-center justify-center shadow-lg">
           <div className="text-center animate-in fade-in zoom-in duration-300 key={activeSlice}">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wide block mb-1">{centerLabel}</span>
              <span className="text-2xl font-black text-slate-800 tracking-tight">{centerAmount}</span>
           </div>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center gap-2 mt-8 w-full">
        {/* Interactive Legend Items */}
        <button 
            onClick={() => onSliceClick(activeSlice === 'expenses' ? null : 'expenses')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200
                ${activeSlice === 'expenses' 
                    ? 'bg-rose-50 border-rose-200 ring-2 ring-rose-100 scale-105 shadow-sm' 
                    : activeSlice ? 'opacity-40 grayscale border-transparent' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
        >
          <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
          <span className={`text-xs font-bold ${activeSlice === 'expenses' ? 'text-rose-700' : 'text-slate-600'}`}>Expenses</span>
        </button>

        {allocations.map(plan => (
            <button 
                key={plan.id}
                onClick={() => onSliceClick(activeSlice === plan.id ? null : plan.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200
                    ${activeSlice === plan.id 
                        ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-100 scale-105 shadow-sm' 
                        : activeSlice ? 'opacity-40 grayscale border-transparent' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.hex || '#10b981' }}></div>
              <span className="text-xs font-bold text-slate-600">{plan.name}</span>
            </button>
        ))}
      </div>
    </div>
  );
};

const LoginScreen = ({ onLogin }) => {
  // Typewriter Effect State
  const [textIndex, setTextIndex] = useState(0);
  const phrases = ["Expenses", "Savings", "Freedom", "Future"];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % phrases.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* 1. ANIMATED BACKGROUND ORBS (Slightly darker for better contrast) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <style>{`
          @keyframes float {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-float-slow { animation: float 10s infinite ease-in-out; }
          .animate-float-medium { animation: float 8s infinite ease-in-out reverse; }
          .animate-float-fast { animation: float 6s infinite ease-in-out; }
        `}</style>
        
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] animate-float-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] animate-float-medium"></div>
        <div className="absolute top-[30%] left-[30%] w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] animate-float-fast"></div>
      </div>

      {/* 2. THE CARD (With Glowing Gradient Border) */}
      <div className="relative group z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-700">
        
        {/* The Glow Effect behind the card */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-[2rem] blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
        
        <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-[1.8rem] shadow-2xl text-center">
          
          {/* Logo */}
          <div className="bg-slate-800/50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/5 ring-1 ring-white/10 rotate-3 group-hover:rotate-6 transition duration-500">
            <Wallet className="w-9 h-9 text-emerald-400" />
          </div>
          
          {/* Gradient Text Title */}
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-400">
              Budget Planner
            </span>
          </h1>
          
          {/* Typewriter Subtitle */}
          <div className="h-6 mb-10 flex items-center justify-center gap-1.5 text-slate-400 font-medium">
            <span>Master your</span>
            <span 
              key={textIndex} 
              className="text-white font-bold animate-in slide-in-from-bottom-2 fade-in duration-300"
            >
              {phrases[textIndex]}
            </span>
          </div>
          
          {/* Main Action Button */}
          <button 
            onClick={onLogin}
            className="w-full bg-white hover:bg-emerald-50 text-slate-900 p-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] active:scale-[0.98] flex items-center justify-center gap-3 group/btn"
          >
            <div className="bg-slate-50 p-1.5 rounded-full border border-slate-200 group-hover/btn:scale-110 transition">
               <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            </div>
            Sign in with Google
          </button>

          {/* 3. FEATURE MICRO-GRID (Shows what's inside) */}
          <div className="grid grid-cols-3 gap-2 mt-8 pt-8 border-t border-white/5">
             <div className="flex flex-col items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><TrendingUp className="w-4 h-4" /></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Trends</span>
             </div>
             <div className="flex flex-col items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><FlaskConical className="w-4 h-4" /></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Sandbox</span>
             </div>
             <div className="flex flex-col items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400"><Target className="w-4 h-4" /></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Goals</span>
             </div>
          </div>

        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-8 text-center text-slate-600 text-xs font-medium animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 relative z-10">
        <p>Designed & Built by <span className="text-slate-400 font-bold">Yaseen Hussain</span></p>
        <p className="opacity-50 mt-1">© {new Date().getFullYear()} Budget Planner • All Rights Reserved</p>
      </div>
    </div>
  );
};

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

const AllocationCard = ({ title, targetAmount, actualAmount, percentage, hexColor, currency, onUpdateActual, showRemainderButton, onFillRemainder }) => {
  const actualNum = parseFloat(actualAmount) || 0;
  // Calculate progress bar width (max 100%)
  const progressPercent = Math.min(100, Math.max(0, (actualNum / targetAmount) * 100));
  const [showHelp, setShowHelp] = useState(false);
  
  // Use the passed Hex Color or fallback to Emerald Green
  const activeColor = hexColor || '#10b981';

  return (
    <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          {/* 1. Icon Background: Uses Hex with 15% opacity */}
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
            style={{ backgroundColor: `${activeColor}20`, color: activeColor }}
          >
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm leading-tight">{title}</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{percentage}% Pot</p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-slate-800">{formatCurrency(actualNum, currency)}</div>
          <div className="text-[10px] text-slate-400 font-medium">of {formatCurrency(targetAmount, currency)}</div>
        </div>
      </div>

      {/* 2. Progress Bar Background */}
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden mb-4 relative z-10">
        {/* 3. The Actual Colored Bar */}
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-out relative"
          style={{ width: `${progressPercent}%`, backgroundColor: activeColor }}
        >
             {/* Subtle shine effect */}
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50"></div>
        </div>
      </div>

      {/* Input Row - NEW DESIGN WITH CLICKABLE HELPER */}
      <div className="relative z-10">
        
        {/* CLICK BACKDROP: This invisible layer catches clicks anywhere else to close the popup */}
        {showHelp && (
            <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowHelp(false)}></div>
        )}

        {/* Label with Clickable Tooltip */}
        <div className="relative flex items-center gap-1.5 mb-1.5 ml-1 w-fit">
           <label className="block text-[10px] font-bold text-slate-400 uppercase">Actual Money Deposited</label>
           
           <button 
             onClick={() => setShowHelp(!showHelp)}
             className="focus:outline-none transition hover:scale-110 active:scale-95"
           >
             {/* Icon Darkened (text-slate-500 instead of 300) */}
             <HelpCircle className="w-3 h-3 text-slate-500" />
           </button>
           
           {/* The Helper Bubble (Shows only when clicked) */}
           {showHelp && (
             <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-800 text-white text-xs rounded-lg p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 origin-bottom-left font-normal normal-case">
                <div className="absolute -bottom-1 left-4 w-2 h-2 bg-slate-800 rotate-45"></div>
                <strong>What is this?</strong><br/>
                Type the exact amount you just transferred to this pot in your real bank app.
             </div>
           )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">{currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'}</span>
            <input 
              type="number" 
              placeholder="Type amount..."
              value={actualAmount}
              onChange={(e) => onUpdateActual(e.target.value)}
              // CHANGED: text-sm -> text-base (Prevents iOS Zoom)
              className="w-full pl-7 pr-3 py-3 bg-white border-2 border-slate-100 rounded-xl text-base font-bold text-slate-800 outline-none focus:border-transparent focus:ring-4 transition shadow-sm placeholder:text-slate-300 placeholder:font-normal"
              style={{ '--tw-ring-color': `${activeColor}30` }} 
            />
          </div>
          
          {/* Dynamic Button Color */}
          {showRemainderButton ? (
            <button 
              onClick={onFillRemainder}
              className="px-4 py-3 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-90 active:scale-95 transition h-full"
              style={{ backgroundColor: activeColor }}
            >
              Max
            </button>
          ) : (
               onUpdateActual && (
                  <button 
                    onClick={() => onUpdateActual(targetAmount)}
                    className="px-3 py-3 rounded-xl text-xs font-bold transition border-2 hover:opacity-100 opacity-70 h-full"
                    style={{ color: activeColor, borderColor: `${activeColor}30`, backgroundColor: `${activeColor}10` }}
                    title="Match Target"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )
          )}
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

const SettingsScreen = ({ user, onClose, currentSettings, onSaveSettings, onResetMonth, isTutorial, onExitTutorial, isLegacyMode }) => {
  const [displayName, setDisplayName] = useState(currentSettings.displayName || user.displayName || '');
  const [currency, setCurrency] = useState(currentSettings.currency || 'GBP');
  const [bank, setBank] = useState(currentSettings.bankDetails || null);
  const [payDay, setPayDay] = useState(currentSettings.payDay || '1');
  
  const [allocations, setAllocations] = useState(currentSettings.allocationRules || []);
  const [defaultExpenses, setDefaultExpenses] = useState(currentSettings.defaultFixedExpenses || []);
  
  // ... (keep existing state for new pots/colors etc) ...
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanPercent, setNewPlanPercent] = useState('');
  const [openColorMenuId, setOpenColorMenuId] = useState(null);
  const [newPlanColor, setNewPlanColor] = useState(POT_COLORS[0]);
  const [showNewPotColorMenu, setShowNewPotColorMenu] = useState(false);
  const [newDefExpName, setNewDefExpName] = useState('');
  const [newDefExpAmount, setNewDefExpAmount] = useState('');
  const [newDefExpLogo, setNewDefExpLogo] = useState(null);

  const totalPercentage = allocations.reduce((sum, item) => sum + parseFloat(item.percentage), 0);
  const remainderPercent = Math.max(0, 100 - totalPercentage);

  const handleSave = () => {
    if (totalPercentage > 100) {
      alert("Total percentage cannot exceed 100%");
      return;
    }
    if (!bank || !payDay) {
      alert("Please select a Bank and Payday");
      return;
    }
    onSaveSettings({
      displayName,
      currency,
      bankDetails: bank,
      payDay,
      allocationRules: allocations,
      defaultFixedExpenses: defaultExpenses
    });
    onClose();
  };

  // ... (Keep addAllocation, removeAllocation, addDefaultExpense, removeDefaultExpense functions exactly as they are) ...
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
          <Settings className="w-5 h-5 text-slate-500" /> {isTutorial ? 'Settings Demo' : isLegacyMode ? 'Complete Setup' : 'Settings'}
        </h2>
        {!isLegacyMode && (
           <button onClick={isTutorial ? onExitTutorial : onClose} className="p-2 hover:bg-slate-100 rounded-full transition">
             <X className="w-6 h-6 text-slate-500" />
           </button>
        )}
      </div>

      <div className="max-w-xl mx-auto p-6 space-y-8 pb-20">
        
        {isLegacyMode && (
          <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200 text-sm font-bold mb-4">
             Please update your Bank and Payday to use the new features.
          </div>
        )}

        {/* BANK & PAYDAY */}
        <section className="space-y-3">
           <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Bank & Payday</h3>
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              
              <div>
                 <label className="block text-xs font-semibold text-slate-500 mb-2">Main Current Account</label>
                 {bank ? (
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                       <div className="flex items-center gap-3">
                          <img src={bank.logo} className="w-8 h-8 rounded-full object-contain" />
                          <span className="font-bold text-slate-700">{bank.name}</span>
                       </div>
                       <button onClick={() => setBank(null)} className="text-xs font-bold text-indigo-500">Change</button>
                    </div>
                 ) : (
                    <BankSelector selectedBank={bank} onSelect={setBank} />
                 )}
              </div>

              <div>
                 <label className="block text-xs font-semibold text-slate-500 mb-2">Payday (Day of Month)</label>
                 <select value={payDay} onChange={(e) => setPayDay(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold">
                    {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                       <option key={day} value={day}>{day}</option>
                    ))}
                 </select>
              </div>

           </div>
        </section>

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
                className="w-full p-2 rounded-lg border border-slate-300 focus:border-emerald-500 outline-none transition text-base"
                disabled={isTutorial}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Currency</label>
              <div className="flex gap-2">
                 {['GBP', 'USD', 'EUR'].map(c => (
                   <button
                     key={c}
                     onClick={() => setCurrency(c)}
                     disabled={isTutorial}
                     className={`px-4 py-2 rounded-lg font-bold text-sm transition ${currency === c ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
                   >
                     {c}
                   </button>
                 ))}
              </div>
            </div>
          </div>
        </section>

        {/* Spending Plan */}
        <section className="space-y-3" id="settings-spending-plan">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Spending Plan</h3>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${totalPercentage <= 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              Allocated: {totalPercentage}%
            </span>
          </div>
          
          <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-center gap-3 mb-2">
              <div className="bg-white p-1.5 rounded-full shadow-sm">
                 {bank?.logo ? <img src={bank.logo} className="w-5 h-5 rounded-full object-contain"/> : <Wallet className="w-5 h-5 text-indigo-500"/>}
              </div>
              <div className="flex-1">
                 <p className="text-xs font-bold text-indigo-400 uppercase">{bank?.name || 'Current Account'} (Remainder)</p>
              </div>
              <div className="text-lg font-black text-indigo-900">{remainderPercent}%</div>
          </div>

          <div className="space-y-3">
             {/* ... (Keep existing POT list rendering logic) ... */}
              {allocations.map(plan => (
              <div key={plan.id} className="relative">
                <div className="flex items-center gap-2 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm z-10 relative overflow-hidden">
                  <button 
                    onClick={() => setOpenColorMenuId(openColorMenuId === plan.id ? null : plan.id)}
                    className="w-10 h-10 rounded-full border-2 border-slate-50 shadow-sm shrink-0 hover:scale-105 transition active:scale-95 group relative"
                    style={{ backgroundColor: plan.hex || '#10b981' }}
                    disabled={isTutorial}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/10 rounded-full">
                      <Edit2 className="w-4 h-4 text-white drop-shadow-md" />
                    </div>
                  </button>
                  <input 
                    value={plan.name}
                    onChange={(e) => setAllocations(allocations.map(a => a.id === plan.id ? {...a, name: e.target.value} : a))}
                    className="flex-1 min-w-0 font-bold text-slate-700 bg-transparent border-none outline-none focus:ring-0 text-base truncate" 
                    disabled={isTutorial}
                  />
                  <div className="flex items-center gap-1 bg-slate-50 px-2 py-2 rounded-xl border border-slate-100 shrink-0">
                    <input 
                      type="number"
                      value={plan.percentage}
                      onChange={(e) => setAllocations(allocations.map(a => a.id === plan.id ? {...a, percentage: parseFloat(e.target.value) || 0} : a))}
                      className="w-9 bg-transparent text-right font-bold text-slate-800 outline-none p-0 text-base"
                      disabled={isTutorial}
                    />
                    <span className="text-slate-400 text-xs font-bold">%</span>
                  </div>
                  {!isTutorial && (
                    <button onClick={() => removeAllocation(plan.id)} className="shrink-0 text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                 {/* ... (Keep Color Menu Logic) ... */}
                 {openColorMenuId === plan.id && (
                  <div className="absolute top-14 left-0 z-20 bg-white p-3 rounded-2xl shadow-xl border border-slate-100 animate-in slide-in-from-top-2 fade-in w-full">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-2">Select Color</div>
                    <div className="flex gap-2 flex-wrap justify-start">
                      {POT_COLORS.map((colorOption) => (
                        <button
                          key={colorOption.id}
                          onClick={() => {
                            setAllocations(allocations.map(a => a.id === plan.id ? {
                                ...a,
                                hex: colorOption.hex,
                                color: colorOption.tailwind
                            } : a));
                            setOpenColorMenuId(null);
                          }}
                          className={`w-8 h-8 rounded-full shadow-sm hover:scale-110 transition border-2 ${plan.hex === colorOption.hex ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: colorOption.hex }}
                        >
                           {plan.hex === colorOption.hex && <Check className="w-4 h-4 text-white mx-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* ... (Keep Create Pot Logic) ... */}
             <div className={`bg-slate-50 rounded-2xl p-3 border border-slate-200/60 ${isTutorial ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex justify-between items-center mb-2">
                   <p className="text-xs font-bold text-slate-400 uppercase">Create New Pot</p>
                </div>
                <div className="flex gap-2 items-center relative">
                    <input 
                      placeholder="Name"
                      value={newPlanName}
                      onChange={(e) => setNewPlanName(e.target.value)}
                      className="flex-1 min-w-0 p-3 text-base border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-slate-200 transition font-medium"
                    />
                    <div className="relative w-20 shrink-0">
                        <input 
                          type="number"
                          placeholder="0"
                          value={newPlanPercent}
                          onChange={(e) => setNewPlanPercent(e.target.value)}
                          className="w-full p-3 text-base border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-slate-200 transition font-bold text-center"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                    </div>
                    {/* ... (Color Dropdown for new pot - keep existing logic) ... */}
                     <div className="relative shrink-0">
                        <button 
                            onClick={() => setShowNewPotColorMenu(!showNewPotColorMenu)}
                            className="w-11 h-11 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center transition hover:scale-105 active:scale-95"
                            style={{ backgroundColor: newPlanColor.hex }}
                        >
                           <div className="bg-black/10 rounded-full p-1"><Edit2 className="w-3 h-3 text-white" /></div>
                        </button>
                        {showNewPotColorMenu && (
                            <div className="absolute bottom-full right-0 mb-2 p-3 bg-white rounded-2xl shadow-xl border border-slate-100 w-48 z-50 animate-in zoom-in-95 grid grid-cols-5 gap-2">
                                {POT_COLORS.map((colorOption) => (
                                    <button
                                        key={colorOption.id}
                                        onClick={() => {
                                            setNewPlanColor(colorOption);
                                            setShowNewPotColorMenu(false);
                                        }}
                                        className={`w-7 h-7 rounded-full shadow-sm border transition hover:scale-110 ${newPlanColor.id === colorOption.id ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: colorOption.hex }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={() => {
                             if(!newPlanName || !newPlanPercent) return;
                             setAllocations([...allocations, { 
                               id: Date.now().toString(), 
                               name: newPlanName, 
                               percentage: parseFloat(newPlanPercent),
                               color: newPlanColor.tailwind, 
                               hex: newPlanColor.hex 
                             }]);
                             setNewPlanName('');
                             setNewPlanPercent('');
                             setNewPlanColor(POT_COLORS[0]); 
                             setShowNewPotColorMenu(false);
                        }} 
                        className="bg-slate-900 text-white w-11 h-11 rounded-xl shadow-lg hover:bg-slate-800 transition active:scale-95 flex items-center justify-center shrink-0"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>
          </div>
        </section>

        {/* 2. Fixed Expenses (Keep existing) */}
        <section className="space-y-3" id="settings-fixed-expenses">
           {/* ... (Existing Fixed Expenses Logic) ... */}
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Default Monthly Bills</h3>
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
                  {!isTutorial && (
                    <button onClick={() => removeDefaultExpense(exp.id)} className="text-slate-300 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className={`flex gap-2 pt-2 items-start ${isTutorial ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex-1">
                <BrandSearchInput
                  placeholder="Bill Name (e.g. AMEX)"
                  value={newDefExpName}
                  onChange={setNewDefExpName}
                  onSelectBrand={(brandName, brandLogo) => {
                    setNewDefExpName(brandName);
                    setNewDefExpLogo(brandLogo);
                  }}
                  className="w-full p-3 text-base border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>
              <div id="settings-new-expense-amount">
                <input 
                    type="text"
                    inputMode="decimal"
                    placeholder="£"
                    value={newDefExpAmount}
                    onChange={(e) => setNewDefExpAmount(e.target.value)}
                    onBlur={() => setNewDefExpAmount(safeCalculate(newDefExpAmount))}
                    className="w-24 p-3 text-base border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>
              <button onClick={addDefaultExpense} className="bg-slate-900 text-white p-3 rounded-xl">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {!isTutorial && (
          <section className="space-y-3 pt-6 border-t border-slate-100">
             <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Danger Zone
            </h3>
            <button onClick={onResetMonth} className="w-full border border-red-100 text-red-600 bg-red-50 py-4 rounded-xl font-semibold hover:bg-red-100 transition flex items-center justify-center gap-2">
              Reset This Month Data
            </button>
          </section>
        )}

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
const HelpModal = ({ onClose, onStartTutorial }) => {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      question: "Why doesn't this match my bank balance?",
      answer: "That is the goal! Your bank shows you history + current funds. We show you the future. We virtually deduct your bills *now* so you see exactly what is 'Safe-to-Spend' without accidentally touching money meant for bills."
    },
    {
      question: "What should I do on Payday?",
      answer: "1. Enter your Salary.\n2. Add any 'One-Off' expenses (like an MOT or Gift) using the 'New Expense' button.\n3. The remaining 'Safe-to-Spend' figure is yours. Transfer it to pots or spend it freely!"
    },
    {
      question: "Fixed vs. Variable Expenses?",
      answer: "Fixed Bills (in Settings) are recurring costs like Rent/Netflix that copy over every month. Variable Expenses are added on the dashboard and are for *this month only* (like a Dentist trip)."
    }
  ];

  return (
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
        
        {/* SECTION 1: DASHBOARD VISUALS */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Dashboard Components</h3>
          
          {/* The Wheel */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4">
             <div className="bg-slate-100 p-3 rounded-full h-fit"><PieChart className="w-5 h-5 text-slate-500" /></div>
             <div>
                <h4 className="font-bold text-slate-800 text-sm">The Budget Wheel</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  This pie chart visualizes your Net Salary. The <span className="text-red-500 font-bold">Red</span> slice is your expenses. The other colors are your savings pots. 
                  <br/><strong>Tip:</strong> Tap any slice to isolate that specific category.
                </p>
             </div>
          </div>

           {/* The Jar */}
           <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4">
             <div className="bg-emerald-100 p-3 rounded-full h-fit"><AlertCircle className="w-5 h-5 text-emerald-600" /></div>
             <div>
                <h4 className="font-bold text-slate-800 text-sm">The Cash Jar</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                   This represents <strong>Unsorted Cash</strong> sitting in your bank right now. It is calculated as: 
                   <br/><em>(Salary - Expenses - Money you already moved to Pots)</em>.
                   <br/>Your goal is to empty this jar by transferring money to your real savings accounts.
                </p>
             </div>
          </div>
        </section>

        {/* SECTION 2: MANAGING MONEY */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Managing Money</h3>
             <button 
               onClick={() => onStartTutorial('add_expense')}
               className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-200 transition flex items-center gap-1"
             >
               <Zap className="w-3 h-3" /> Tutorial
             </button>
          </div>
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <ul className="space-y-4">
              <li className="flex gap-3">
                 <div className="mt-1 bg-white p-1 rounded border border-slate-200"><Search className="w-3 h-3 text-slate-500" /></div>
                 <div>
                    <span className="font-bold text-slate-800 text-sm">Smart Add:</span>
                    <p className="text-xs text-slate-500">When adding a bill, type a brand name (e.g. "Spotify") to automatically find its logo.</p>
                 </div>
              </li>
              <li className="flex gap-3">
                 <div className="mt-1 bg-white p-1 rounded border border-slate-200"><ArrowUpDown className="w-3 h-3 text-slate-500" /></div>
                 <div>
                    <span className="font-bold text-slate-800 text-sm">Swipe Actions (Mobile):</span>
                    <p className="text-xs text-slate-500">
                       On the expenses list: <br/>
                       • <strong>Swipe Right</strong> to Edit amount.<br/>
                       • <strong>Swipe Left</strong> to Delete.
                    </p>
                 </div>
              </li>
            </ul>
          </div>
        </section>

        {/* SECTION 3: TOOLS & REPORTS */}
        <section className="space-y-4">
           <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Tools & Power Features</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              {/* Analytics */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                 <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold text-sm text-slate-800">Analytics</span>
                 </div>
                 <p className="text-xs text-slate-500">View 6-month trends, income variances, and future savings projections.</p>
              </div>

              {/* Sandbox */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                 <div className="flex items-center gap-2 mb-2">
                    <FlaskConical className="w-4 h-4 text-indigo-500" />
                    <span className="font-bold text-sm text-slate-800">Sandbox Mode</span>
                 </div>
                 <p className="text-xs text-slate-500">A safe simulator. Change salaries or add huge bills to test scenarios without saving data.</p>
              </div>

              {/* Reports */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white col-span-full">
                 <div className="flex items-center gap-2 mb-2">
                    <Printer className="w-4 h-4 text-slate-500" />
                    <span className="font-bold text-sm text-slate-800">Reports Center</span>
                 </div>
                 <p className="text-xs text-slate-500">Generate printable PDF statements for the current month or your full annual history.</p>
              </div>
           </div>
        </section>

        {/* SECTION 4: FAQ */}
        <section className="space-y-4">
           <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Common Questions</h3>
           <div className="space-y-2">
              {faqs.map((item, i) => (
                <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                   <button 
                     onClick={() => setOpenFaq(openFaq === i ? null : i)}
                     className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition text-left"
                   >
                      <span className="font-bold text-slate-700 text-sm">{item.question}</span>
                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${openFaq === i ? 'rotate-90' : ''}`} />
                   </button>
                   {openFaq === i && (
                     <div className="p-4 bg-white text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-in slide-in-from-top-2 whitespace-pre-line">
                        {item.answer}
                     </div>
                   )}
                </div>
              ))}
           </div>
        </section>

      </div>
    </div>
  );
};


// --- NEW CONSTANTS: UK BANKS ---
const UK_BANKS = [
  { id: 'monzo', name: 'Monzo', domain: 'monzo.com', color: '#14213d' },
  { id: 'starling', name: 'Starling', domain: 'starlingbank.com', color: '#3D8D7A' },
  { id: 'lloyds', name: 'Lloyds', domain: 'lloydsbank.com', color: '#006A4D' },
  { id: 'barclays', name: 'Barclays', domain: 'barclays.co.uk', color: '#00AEEF' },
  { id: 'hsbc', name: 'HSBC', domain: 'hsbc.co.uk', color: '#DB0011' },
  { id: 'natwest', name: 'NatWest', domain: 'natwest.com', color: '#42145F' },
  { id: 'santander', name: 'Santander', domain: 'santander.co.uk', color: '#EC0000' },
  { id: 'halifax', name: 'Halifax', domain: 'halifax.co.uk', color: '#005EB8' },
  { id: 'revolut', name: 'Revolut', domain: 'revolut.com', color: '#0075EB' },
  { id: 'nationwide', name: 'Nationwide', domain: 'nationwide.co.uk', color: '#D2112C' },
];

// --- NEW HELPER: PAYDAY CALCULATOR ---
const calculateDaysUntilPayday = (payDayStr, salaryInputted) => {
  const today = new Date();
  const currentDay = today.getDate();
  const payDay = parseInt(payDayStr) || 1; // Default to 1st if error
  
  // Logic:
  // If we have salary data, we are likely budgeting for the period STARTING on the next payday.
  // However, usually "Days Left" implies "How long do I have to make this money last?"
  
  // If today is 23rd, Payday is 25th. 
  // Scenario A: I haven't been paid yet. I have 2 days left of OLD money.
  // Scenario B: I just got paid (or input salary early). I have ~30 days until NEXT pay.
  
  // Based on your prompt: "If salary entered BEFORE payday, assume countdown is for NEXT month"
  
  let targetDate = new Date(today.getFullYear(), today.getMonth(), payDay);
  
  // If today is AFTER payday (e.g. 26th, Payday 25th), target is next month
  if (currentDay >= payDay) {
     targetDate.setMonth(targetDate.getMonth() + 1);
  } else {
     // Today is BEFORE payday (e.g. 23rd, Payday 25th).
     // IF salary is entered, we assume we are prepping for the new cycle, so target is NEXT month.
     if (salaryInputted) {
        // targetDate is currently THIS month's payday (25th). 
        // We want the ONE AFTER (Next Month).
        // Wait, if I enter salary early, I want to know how long THAT salary has to last. 
        // It has to last until the payday AFTER the upcoming one.
        // Actually, easiest interpretation: Days Left = Days until the Next Payday occurs.
        
        // Let's stick to strict "Days until money runs out / refresh".
        // If I input salary today (23rd) for the cycle starting 25th, 
        // my "Days Left" for that new money is roughly 30 days (from 25th to 25th).
     }
  }

  // SIMPLIFIED LOGIC based on prompt specifics:
  // If Salary is present > 0, and Today < Payday:
  // We assume the user is "early" and looking at the UPCOMING month. 
  // So the target is Payday of NEXT month.
  if (salaryInputted && parseFloat(salaryInputted) > 0 && currentDay < payDay) {
      targetDate = new Date(today.getFullYear(), today.getMonth() + 1, payDay);
  } else if (currentDay >= payDay) {
      // Standard: It's past payday, next one is next month
      targetDate = new Date(today.getFullYear(), today.getMonth() + 1, payDay);
  }
  // Else (Today < Payday, no salary input yet): Target is THIS month's payday (Upcoming)

  const diffTime = Math.abs(targetDate - today);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

// --- NEW COMPONENT: ONBOARDING WIZARD ---
// --- ONBOARDING WIZARD COMPONENT ---
const OnboardingWizard = ({ user, onComplete }) => {
  const [step, setStep] = useState(0); 
  // Steps: 0:Intro, 1:Bank, 2:Payday, 3:Currency, 4:Pots, 5:Bills
  
  const [currency, setCurrency] = useState('GBP');
  const [bank, setBank] = useState(null);
  const [payDay, setPayDay] = useState(''); // Stores string '1' to '31'
  
  // Pots State (User defined pots only - Current Account is calculated automatically)
  const [pots, setPots] = useState([
    { id: '1', name: 'Savings', percentage: 20, color: 'bg-emerald-100 text-emerald-700 bar-emerald' },
    { id: '2', name: 'Holidays', percentage: 10, color: 'bg-sky-100 text-sky-700 bar-sky' }
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
    
    // Assign a random color style for new pots
    const colors = [
      'bg-indigo-100 text-indigo-700 bar-indigo',
      'bg-amber-100 text-amber-700 bar-amber',
      'bg-purple-100 text-purple-700 bar-purple',
      'bg-rose-100 text-rose-700 bar-rose',
      'bg-cyan-100 text-cyan-700 bar-cyan'
    ];
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
      bankDetails: bank, // Save selected bank (includes name, logo, color)
      payDay: payDay,    // Save selected payday
      allocationRules: pots,
      defaultFixedExpenses: bills
    };
    onComplete(settings);
  };

  return (
    <div className="fixed inset-0 bg-white z-[200] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 overflow-y-auto">
      <div className="max-w-md w-full space-y-8 py-10">
        
        {/* Progress Dots - 6 Steps total */}
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2, 3, 4, 5].map(i => (
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

        {/* STEP 1: BANK SELECTION (NEW) */}
        {step === 1 && (
           <div className="space-y-6 animate-in slide-in-from-right-8">
             <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800">Where does your salary go?</h2>
              <p className="text-slate-500">Select your main Current Account.</p>
            </div>
            
            <BankSelector 
               selectedBank={bank}
               onSelect={(b) => setBank(b)}
            />

            <button disabled={!bank} onClick={() => setStep(2)} className="w-full bg-slate-900 disabled:bg-slate-300 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 transition mt-4">
              Next
            </button>
           </div>
        )}

        {/* STEP 2: PAYDAY SELECTION (NEW) */}
        {step === 2 && (
           <div className="space-y-6 animate-in slide-in-from-right-8">
             <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800">When is Payday?</h2>
              <p className="text-slate-500">We use this to track your monthly cycle.</p>
            </div>

            <div className="grid grid-cols-7 gap-2 max-h-64 overflow-y-auto p-1">
               {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                  <button 
                    key={day}
                    onClick={() => setPayDay(String(day))}
                    className={`aspect-square rounded-lg font-bold border flex items-center justify-center transition ${payDay === String(day) ? 'bg-slate-900 text-white border-slate-900 scale-110 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                  >
                    {day}
                  </button>
               ))}
            </div>
            {payDay && (
              <p className="text-center font-bold text-emerald-600 animate-in fade-in">
                Payday is on the {payDay}{['1','21','31'].includes(payDay)?'st':['2','22'].includes(payDay)?'nd':['3','23'].includes(payDay)?'rd':'th'}
              </p>
            )}

            <button disabled={!payDay} onClick={() => setStep(3)} className="w-full bg-slate-900 disabled:bg-slate-300 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 transition mt-4">
              Next
            </button>
           </div>
        )}

        {/* STEP 3: CURRENCY */}
        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800">Your Currency</h2>
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
            <button onClick={() => setStep(4)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 transition mt-4">
              Next Step
            </button>
          </div>
        )}

        {/* STEP 4: POTS & CURRENT ACCOUNT */}
        {step === 4 && (
          <div className="space-y-6 animate-in slide-in-from-right-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800">Savings & Pots</h2>
              <p className="text-slate-500">Create your pots. <strong>Anything remaining</strong> stays in your {bank?.name || 'Current'} Account.</p>
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

            {/* MANDATORY CURRENT ACCOUNT CARD */}
            <div className={`p-4 rounded-xl flex justify-between items-center border ${totalPercent > 100 ? 'bg-red-50 border-red-200' : 'bg-indigo-50 border-indigo-100'}`}>
                <div className="flex items-center gap-3">
                   {bank?.logo ? (
                     <img src={bank.logo} className="w-8 h-8 rounded-full shadow-sm bg-white object-contain"/> 
                   ) : (
                     <div className="bg-white p-1.5 rounded-full"><Wallet className="w-5 h-5 text-indigo-500"/></div>
                   )}
                   <div>
                     <p className={`text-xs font-bold uppercase ${totalPercent > 100 ? 'text-red-500' : 'text-indigo-400'}`}>Remains in {bank?.name}</p>
                     <p className={`font-black text-xl ${totalPercent > 100 ? 'text-red-700' : 'text-indigo-900'}`}>{Math.max(0, 100 - totalPercent)}%</p>
                   </div>
                </div>
                {totalPercent > 100 && <AlertCircle className="w-6 h-6 text-red-500" />}
            </div>

            <button 
              disabled={totalPercent > 100}
              onClick={() => setStep(5)} 
              className="w-full bg-slate-900 disabled:bg-slate-300 disabled:text-slate-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 transition"
            >
              {totalPercent > 100 ? 'Total cannot exceed 100%' : 'Continue'}
            </button>
          </div>
        )}

        {/* STEP 5: FIXED EXPENSES */}
        {step === 5 && (
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


// --- FINAL FIXED TUTORIAL OVERLAY (ABSOLUTE POSITIONING) ---
const TutorialOverlay = ({ steps, currentStep, onNext, onPrev, onClose }) => {
  const [targetRect, setTargetRect] = useState(null);
  const step = steps[currentStep];
  const isMobile = window.innerWidth < 768;


  const updatePosition = useCallback(() => {
    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect({
        // Document-relative coordinates (Constant even when scrolling)
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
        // Viewport-relative (Changes when scrolling - used for flip logic)
        viewportTop: rect.top,
        viewportBottom: rect.bottom
      });
    } else {
      setTargetRect(null);
    }
  }, [step.target]);

  useEffect(() => {
    const element = document.querySelector(step.target);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      
      if (isMobile) {
        setTimeout(() => {
           const rect = element.getBoundingClientRect();
           if (window.innerHeight - rect.bottom < 250) {
             window.scrollBy({ top: 250, behavior: 'smooth' });
           }
        }, 400);
      }
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [step.target, currentStep, isMobile, updatePosition]);

  // Collision Logic
  const CARD_HEIGHT = 280;
  let showAbove = false;
  
  if (targetRect && !isMobile) {
    const spaceBelow = window.innerHeight - targetRect.viewportBottom;
    // Only flip if we are truly cramped at the bottom of the VIEWPORT
    if (spaceBelow < CARD_HEIGHT && targetRect.viewportTop > CARD_HEIGHT) {
      showAbove = true;
    }
  }

  return (
    <div className="absolute top-0 left-0 w-full h-full z-[200] pointer-events-none">
      
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 mix-blend-hard-light transition-opacity duration-500 pointer-events-auto"
        onClick={onClose}
      />

      {/* Spotlight */}
      {targetRect && (
        <div 
          className="absolute transition-all duration-75 ease-out border-2 border-white/50 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"
          style={{
            top: targetRect.top - 5,
            left: targetRect.left - 5,
            width: targetRect.width + 10,
            height: targetRect.height + 10,
          }}
        />
      )}

      {/* Instruction Card */}
      <div 
        className={`transition-all duration-300 ease-out px-4 md:px-0 pointer-events-auto
          ${isMobile ? 'fixed bottom-6 left-0 right-0 mx-auto w-full max-w-sm' : 'absolute w-80'}`}
        style={!isMobile && targetRect ? {
           // DESKTOP: ABSOLUTE POSITIONING
           top: showAbove 
              ? targetRect.top - 20 
              : targetRect.top + targetRect.height + 20,
           left: targetRect.left > window.innerWidth - 350 ? 'auto' : Math.max(20, targetRect.left),
           right: targetRect.left > window.innerWidth - 350 ? 20 : 'auto',
           transform: showAbove ? 'translateY(-100%)' : 'none' 
        } : {}}
      >
        <div className="bg-white p-5 rounded-2xl shadow-2xl border border-slate-100 animate-in zoom-in-95 flex flex-col max-h-[80vh]">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-slate-800">{step.title}</h3>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="overflow-y-auto custom-scrollbar mb-4">
            <p className="text-sm text-slate-500 leading-relaxed">{step.content}</p>
          </div>
          
          <div className="flex justify-between items-center mt-auto pt-2 border-t border-slate-50">
            <span className="text-xs font-bold text-slate-300">Step {currentStep + 1} / {steps.length}</span>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button onClick={onPrev} className="px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition">Back</button>
              )}
              <button onClick={onNext} className="px-5 py-2 text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-lg active:scale-95 transition">
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MOCK DATA FOR TUTORIALS ---
const TUTORIAL_POTS = [
  { id: 't1', name: 'Needs', percentage: 50, color: 'bg-indigo-100 text-indigo-600' },
  { id: 't2', name: 'Wants', percentage: 30, color: 'bg-emerald-100 text-emerald-600' },
  { id: 't3', name: 'Savings', percentage: 20, color: 'bg-amber-100 text-amber-600' }
];

const TUTORIAL_EXPENSES = [
  { id: 'e1', name: 'Rent', amount: 800, type: 'fixed', logo: null },
  { id: 'e2', name: 'Netflix', amount: 15, type: 'fixed', logo: null },
  { id: 'e3', name: 'Groceries', amount: 250, type: 'variable', logo: null }
];


// --- SKELETON LOADING COMPONENTS ---
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-slate-200/80 rounded-2xl ${className}`} />
);

const DashboardSkeleton = () => (
  <div className="min-h-screen bg-slate-50 p-6 pt-12 max-w-5xl mx-auto space-y-6">
    {/* Header Skeleton */}
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="w-32 h-6" />
          <Skeleton className="w-20 h-4" />
        </div>
      </div>
      <Skeleton className="w-10 h-10 rounded-xl" />
    </div>

    {/* Bento Grid Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Big Square (Wheel) */}
      <div className="md:col-span-2 h-[350px] bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100/50">
        <Skeleton className="w-48 h-8 mb-6" />
        <div className="flex justify-center items-center h-full pb-10">
           <Skeleton className="w-48 h-48 rounded-full" />
        </div>
      </div>

      {/* Side Stack (Stats) */}
      <div className="flex flex-col gap-6">
        <Skeleton className="h-40 w-full rounded-[2rem] bg-white shadow-sm" />
        <Skeleton className="h-40 w-full rounded-[2rem] bg-white shadow-sm" />
      </div>
    </div>

    {/* Expense List Skeleton */}
    <div className="h-96 bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100/50 space-y-4">
       <div className="flex justify-between items-center mb-6">
         <Skeleton className="w-32 h-8" />
         <Skeleton className="w-24 h-10 rounded-xl" />
       </div>
       {[1, 2, 3, 4].map(i => (
         <div key={i} className="flex justify-between items-center py-2">
           <div className="flex gap-4 items-center">
             <Skeleton className="w-12 h-12 rounded-2xl" />
             <div className="space-y-2">
               <Skeleton className="w-24 h-5" />
               <Skeleton className="w-16 h-3" />
             </div>
           </div>
           <Skeleton className="w-16 h-8 rounded-lg" />
         </div>
       ))}
    </div>
  </div>
);

// --- NEW: SWIPEABLE EXPENSE ROW ---
const SwipeableExpenseRow = ({ children, onEdit, onDelete, isMobile }) => {
  const [offset, setOffset] = useState(0);
  const startX = React.useRef(null);

  // If not mobile, just render normal row
  if (!isMobile) return <div className="relative group">{children}</div>;

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!startX.current) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    
    // Limit swipe range: -120px (Right/Delete) to +80px (Left/Edit)
    if (diff < -120) setOffset(-120);
    else if (diff > 80) setOffset(80);
    else setOffset(diff);
  };

  const handleTouchEnd = () => {
    if (offset < -60) {
       // Swiped Left fully -> Delete Logic could trigger here, 
       // but for safety, keep the button exposed
       setOffset(-70); 
    } else if (offset > 60) {
       setOffset(70); // Keep edit exposed
    } else {
       setOffset(0); // Snap back
    }
    startX.current = null;
  };

  return (
    <div className="relative overflow-hidden mb-1">
      {/* Background Actions Layer */}
      <div className="absolute inset-y-0 left-0 w-full flex justify-between items-center px-4">
         {/* Left Action (Edit) */}
         <div className={`flex items-center justify-start w-1/2 h-full transition-opacity ${offset > 0 ? 'opacity-100' : 'opacity-0'}`}>
            <button onClick={() => { onEdit(); setOffset(0); }} className="bg-emerald-500 text-white p-3 rounded-full shadow-sm">
               <Edit2 className="w-5 h-5" />
            </button>
         </div>
         {/* Right Action (Delete) */}
         <div className={`flex items-center justify-end w-1/2 h-full transition-opacity ${offset < 0 ? 'opacity-100' : 'opacity-0'}`}>
            <button onClick={() => { onDelete(); setOffset(0); }} className="bg-rose-500 text-white p-3 rounded-full shadow-sm">
               <Trash2 className="w-5 h-5" />
            </button>
         </div>
      </div>

      {/* Foreground Content Layer */}
      <div 
        className="relative bg-white transition-transform duration-200 ease-out border-b border-slate-50 last:border-0"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};


const BankSelector = ({ selectedBank, onSelect }) => {
  const [isSearching, setIsSearching] = useState(false);
  // FIX: Added local state for the search input
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-4">
      {!isSearching ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1">
            {UK_BANKS.map(bank => (
              <button
                key={bank.id}
                onClick={() => onSelect({ name: bank.name, logo: `https://img.logo.dev/${bank.domain}?token=pk_IlDYZIBjQZOkL2hI7rtHmA`, color: bank.color })}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedBank?.name === bank.name ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
              >
                <img 
                  src={`https://img.logo.dev/${bank.domain}?token=pk_IlDYZIBjQZOkL2hI7rtHmA`} 
                  alt={bank.name} 
                  className="w-8 h-8 object-contain rounded-full"
                />
                <span className="text-xs font-bold text-slate-700">{bank.name}</span>
              </button>
            ))}
          </div>
          <button 
            onClick={() => setIsSearching(true)}
            className="w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-dashed border-slate-300 transition"
          >
            My bank isn't listed
          </button>
        </>
      ) : (
        <div className="animate-in fade-in">
           <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Search Bank</label>
              <button onClick={() => setIsSearching(false)} className="text-xs text-indigo-500 font-bold">Back to list</button>
           </div>
           {/* FIX: Connected value and onChange to state */}
           <BrandSearchInput 
              placeholder="e.g. Chase, Virgin Money..."
              value={searchTerm}
              onChange={setSearchTerm}
              onSelectBrand={(name, logo) => onSelect({ name, logo, color: '#64748b' })} // Default color for unknown banks
              className="w-full p-3 rounded-xl border border-slate-200"
              autoFocus
           />
        </div>
      )}
    </div>
  );
};

// --- INTERNAL ADMIN DASHBOARD COMPONENT ---
const AdminDashboard = ({ user, onExitAdmin }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterUser, setFilterUser] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');

  
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const q = query(
          collection(db, 'artifacts', 'nuha-budget-app', 'system_logs'),
          orderBy('timestamp', 'desc'),
          limit(100) // Increased limit to see more history
        );
        const snapshot = await getDocs(q);
        setLogs(snapshot.docs.map(doc => ({
            id: doc.id, 
            ...doc.data(), 
            // Store raw date for sorting/filtering, formatted for display
            dateObj: doc.data().timestamp?.toDate(),
            timestamp: doc.data().timestamp?.toDate().toLocaleString()
        })));
      } catch (e) {
        console.error("Admin Log Error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Filter Logic
  const filteredLogs = logs.filter(log => {
    const matchUser = log.userEmail?.toLowerCase().includes(filterUser.toLowerCase());
    const matchType = filterType === 'ALL' || log.type === filterType;
    const matchDate = filterDate ? log.timestamp.includes(filterDate) : true;
    return matchUser && matchType && matchDate;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-6 font-mono">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">System Admin</h1>
              <p className="text-xs text-slate-500">Monitoring {filteredLogs.length} events</p>
            </div>
          </div>
          <button 
            onClick={onExitAdmin} 
            className="w-full md:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Exit Dashboard
          </button>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
           <div>
             <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Search User</label>
             <div className="relative">
               <input 
                 type="text" 
                 placeholder="e.g. yaseen..." 
                 value={filterUser}
                 onChange={(e) => setFilterUser(e.target.value)}
                 className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
               />
               <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-500" />
             </div>
           </div>
           
           <div>
             <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Action Type</label>
             <select 
               value={filterType}
               onChange={(e) => setFilterType(e.target.value)}
               className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 outline-none"
             >
               <option value="ALL">All Actions</option>
               <option value="login">Logins</option>
               <option value="action">User Actions (Salary/Exp)</option>
               <option value="config">Settings Updates</option>
             </select>
           </div>

           <div>
             <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Filter Date</label>
             <input 
                 type="text" 
                 placeholder="e.g. 23/12/2025" 
                 value={filterDate}
                 onChange={(e) => setFilterDate(e.target.value)}
                 className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 outline-none"
               />
           </div>
        </div>

        {/* Data Display */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-12 text-center">
               <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
               <p className="text-slate-500 animate-pulse">Syncing logs...</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="p-4 w-48">Timestamp</th>
                      <th className="p-4 w-64">User</th>
                      <th className="p-4 w-32">Type</th>
                      <th className="p-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-white/5 transition group">
                        <td className="p-4 text-slate-500 font-mono">{log.timestamp}</td>
                        <td className="p-4 font-bold text-indigo-300">{log.userEmail}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                            ${log.type === 'login' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                              log.type === 'config' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 
                              'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                            {log.type}
                          </span>
                        </td>
                        <td className="p-4 text-slate-300 group-hover:text-white transition">{log.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards (Visible only on small screens) */}
              <div className="md:hidden divide-y divide-slate-800">
                {filteredLogs.map(log => (
                  <div key={log.id} className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                       <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide
                            ${log.type === 'login' ? 'bg-emerald-500/10 text-emerald-400' : 
                              log.type === 'config' ? 'bg-purple-500/10 text-purple-400' : 
                              'bg-blue-500/10 text-blue-400'}`}>
                            {log.type}
                       </span>
                       <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                    </div>
                    <div className="text-sm text-slate-200 font-medium">{log.action}</div>
                    <div className="text-xs text-indigo-400 flex items-center gap-1">
                      <User className="w-3 h-3" /> {log.userEmail}
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredLogs.length === 0 && (
                <div className="p-12 text-center text-slate-500">
                  <p>No logs match your filters.</p>
                </div>
              )}
            </>
          )}
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

  const [isLegacyUser, setIsLegacyUser] = useState(false);

  const isMobile = window.innerWidth < 768;

  // --- AURORA STYLES (Fixed) ---
  const auroraStyles = `
    @keyframes drift {
      0% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(30px, -50px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
      100% { transform: translate(0, 0) scale(1); }
    }
    .animate-aurora-1 { animation: drift 10s infinite ease-in-out; }
    .animate-aurora-2 { animation: drift 15s infinite ease-in-out reverse; }
    .animate-aurora-3 { animation: drift 12s infinite ease-in-out; }
  `;

  // --- DAYS LEFT CALCULATION ---
  const getDaysLeft = () => {
    const now = new Date();
    // Only calculate "remaining" if we are looking at the current month
    if (currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear()) {
       const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
       const diffTime = Math.abs(lastDay - now);
       return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    }
    // Otherwise show total days in that month
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  };


  // --- NEW: LOGGING HELPER ---
  // Added "directUser" parameter to handle login events immediately
  const logSystemEvent = async (action, type = 'click', directUser = null) => {
    const activeUser = directUser || user; // Use the direct user if provided, otherwise use state
    
    if (!activeUser) return; // Guard clause

    try {
      const logsRef = collection(db, 'artifacts', appId, 'system_logs');
      await addDoc(logsRef, {
        action: action,
        type: type,
        userId: activeUser.uid,
        userEmail: activeUser.email,
        timestamp: new Date()
      });
    } catch (e) {
      console.error("Log error", e);
    }
  };

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

  const [isAdminMode, setIsAdminMode] = useState(false);

  // --- NEW: SCROLL DETECTION FOR MONTH SELECTOR ---
  const [showMonthNav, setShowMonthNav] = useState(true);
  const lastScrollY = React.useRef(0);

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        // Always show if near the very top
        if (window.scrollY < 50) {
            setShowMonthNav(true);
            lastScrollY.current = window.scrollY;
            return;
        }
        // Hide if scrolling down, Show if scrolling up
        if (window.scrollY > lastScrollY.current) {
          setShowMonthNav(false); 
        } else {
          setShowMonthNav(true);  
        }
        lastScrollY.current = window.scrollY;
      }
    };
    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, []);

  // Data State
  const [salary, setSalary] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [actualSavings, setActualSavings] = useState({}); // New State for Actuals
  const [monthAllocations, setMonthAllocations] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  
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

  const [highlightedSlice, setHighlightedSlice] = useState(null); // 'expenses' or pot ID

  // Derived state variables
  const displaySalary = isSandbox ? sandboxSalary : salary;
  
  // --- TUTORIAL DATA SWITCH LOGIC ---
  // If a tutorial is active, we OVERRIDE the data with short, generic lists.
  // This ensures the screen isn't cluttered and the tutorial box fits perfectly.
  const isTutorialMode = activeTutorial !== null;

  const displayExpenses = isTutorialMode 
      ? TUTORIAL_EXPENSES 
      : (isSandbox ? sandboxExpenses : expenses);

  // LOGIC: Use the month's locked rules if they exist, otherwise use global settings
  const activeRules = monthAllocations || userSettings.allocationRules;

  const displayAllocations = isTutorialMode 
      ? TUTORIAL_POTS 
      : activeRules;

  const displayDefaultExpenses = isTutorialMode
      ? TUTORIAL_EXPENSES.filter(e => e.type === 'fixed') // Reuse fixed expenses for settings demo
      : userSettings.defaultFixedExpenses;
      
  const displayActualSavings = isTutorialMode
      ? { t1: 400, t2: 240 } // Mock savings so bars look partially full
      : (isSandbox ? sandboxActualSavings : actualSavings);

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
      console.log("Auth State Changed:", currentUser ? "User Found" : "No User");
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
        const data = docSnap.data();
        setUserSettings(data);
        
        // CHECK IF LEGACY: Missing Bank or Payday
        if (!data.bankDetails || !data.payDay) {
           setIsLegacyUser(true);
           setShowSettings(true); // Force open settings
        } else {
           setIsLegacyUser(false);
        }
        setOnboardingComplete(true);
      } else {
        // User has NO settings. Do NOT save defaults yet.
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

        // --- NEW: AUTO-LOCK LOGIC ---
        if (data.salary && !data.allocationRules) {
           // This is a "Legacy Month" (Has data, but no rules saved).
           // We automatically save the current global rules to it to lock it.
           setDoc(docRef, { ...data, allocationRules: userSettings.allocationRules }, { merge: true });
           
           // Temporarily show global rules until the save confirms
           setMonthAllocations(userSettings.allocationRules);
        } else {
           // Normal load: use the saved rules (or null if it's a fresh/empty month)
           setMonthAllocations(data.allocationRules || null);
        }
      } else {
        // New/Empty Month
        setSalary('');
        setExpenses(userSettings.defaultFixedExpenses || DEFAULT_FIXED_EXPENSES);
        setActualSavings({});
        setMonthAllocations(null);
      }
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
      // 1. Force persistence (Session = keep me logged in until I close the tab/browser)
      await setPersistence(auth, browserLocalPersistence);
      
      const provider = new GoogleAuthProvider();
      
      // 2. Wait for the popup to finish
      const result = await signInWithPopup(auth, provider);
      
      // 3. MANUAL OVERRIDE: 
      // The listener might be blocked by the COOP error, so we manually 
      // tell the app "We have a user!" immediately.
      console.log("Login successful. forcing state update for:", result.user.email);
      setUser(result.user); 
      
      // Pass 'result.user' as the 3rd argument so it logs immediately
      logSystemEvent('User Logged In', 'login', result.user);
      
      logSystemEvent('User Logged In', 'login');
    } catch (error) {
      console.error("Login Failed:", error);
      if (!YOUR_FIREBASE_KEYS.apiKey) {
        // Fallback for demo mode if keys are missing
        await signInAnonymously(auth);
      } else {
        alert(`Login failed: ${error.message}`);
      }
    }
  };

  const handleLogout = () => {
    logSystemEvent('User Logged Out', 'login'); 
    signOut(auth);
  };

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
    
    // Determine which rules to lock in:
    // 1. If we already have locked rules for this month, keep them.
    // 2. If not (new month), lock in the current global settings.
    const rulesToSave = monthAllocations || userSettings.allocationRules;

    await setDoc(docRef, { 
      salary: newSalary, 
      expenses: newExpenses, 
      actualSavings: newActuals || actualSavings,
      allocationRules: rulesToSave, // <--- SAVE THE RULES
      lastUpdated: new Date() 
    });
  };

  const saveSettings = async (newSettings) => {
    if (!user) return;
    triggerHaptic(); // Haptic
    logSystemEvent('Settings & Pots Configuration Saved', 'config');
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
      // Log removed from here to prevent spamming while typing
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
    logSystemEvent(`Added expense: ${name}`, 'action');
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
    const expName = displayExpenses.find(e => e.id === id)?.name || 'Unknown Bill';
    logSystemEvent(`Deleted expense: ${expName}`, 'action');
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

  const jumpToDate = (monthIndex) => {
    triggerHaptic();
    // Create new date for the selected year and month
    const newDate = new Date(pickerYear, monthIndex, 1);
    setCurrentDate(newDate);
    setShowDatePicker(false);
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

  // --- UPDATED LOGIC START ---
  
  // 1. Calculate Target for Current Account (The Remainder)
  const allocatedPercent = userSettings.allocationRules.reduce((sum, p) => sum + p.percentage, 0);
  const currentAccountPercent = Math.max(0, 100 - allocatedPercent);
  const currentAccountTarget = remainder * (currentAccountPercent / 100);
  const totalDepositedToPots = Object.values(displayActualSavings).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const currentAccountActual = Math.max(0, remainder - totalDepositedToPots);
  
  // 2. Calculate Days Until Next Payday
  const calculateDaysUntilPayday = (payDayStr, salaryInputted) => {
    const today = new Date();
    const currentDay = today.getDate();
    const payDay = parseInt(payDayStr) || 1; 
    
    // Start with Payday of THIS month
    let targetDate = new Date(today.getFullYear(), today.getMonth(), payDay);

    // Rule 1: If today is AFTER payday (e.g. 29th, Payday 28th), target is Next Month
    if (currentDay >= payDay) {
       targetDate.setMonth(targetDate.getMonth() + 1);
    } else {
       // Rule 2: Today is BEFORE payday (e.g. 23rd, Payday 28th). 
       // If Salary IS inputted, we assume the user is prepping for the UPCOMING cycle (Dec 28 - Jan 28).
       // Therefore, the money needs to last until the payday AFTER (Jan 28).
       if (salaryInputted && parseFloat(salaryInputted) > 0) {
          targetDate.setMonth(targetDate.getMonth() + 1);
       }
       // If Salary NOT inputted, we are just waiting for the immediate next payday (Dec 28)
    }
    
    const diffTime = targetDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

const daysUntilPayday = calculateDaysUntilPayday(userSettings.payDay, displaySalary);

// 4. Daily Pace = ACTUAL Current Account Remainder / Days Til Next Payday
// This tells you: "Based on the cash actually sitting in your main account, here is what you can spend per day."
const dailyAllowance = daysUntilPayday > 0 ? (currentAccountActual / daysUntilPayday) : 0;

// Label update
const daysLeftLabel = `Next Payday in`;
  // --- UPDATED LOGIC END ---

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
  
  let finalExpenses = filteredExpenses;
  
  // If "Expenses" slice is clicked, show ALL expenses. If a POT slice is clicked, hide expenses.
  // Note: Since this table only shows expenses, clicking a Savings Pot effectively hides the table content 
  // or we could show nothing. For better UX, let's say clicking 'expenses' shows this table, 
  // and clicking a pot shows NOTHING here (focusing user on the Pot cards).
  
  // Actually, a better UX for the list: 
  // If highlightedSlice is 'expenses', show all expenses.
  // If highlightedSlice is null, show all.
  // If highlightedSlice is a pot ID, show nothing (or maybe filter if we had categories).
  
  if (highlightedSlice && highlightedSlice !== 'expenses') {
     finalExpenses = []; // Hide expenses if focusing on a savings pot
  }

  const fixedExpenses = finalExpenses.filter(e => e.type === 'fixed');
  const variableExpenses = finalExpenses.filter(e => e.type === 'variable');

  if (loading) return <DashboardSkeleton />;
  if (!user) return <LoginScreen onLogin={handleLogin} />;

  // --- PASTE HERE: ADMIN RENDER CHECK ---
  if (user && isAdminMode && user.email === "yaseen.hussain2001@gmail.com") {
    return (
      <AdminDashboard 
        user={user} 
        onLogout={handleLogout} 
        onExitAdmin={() => setIsAdminMode(false)} 
      />
    );
  }

  return (
    <div className={`relative min-h-screen pb-24 font-sans transition-colors duration-500 ${isSandbox ? 'bg-slate-50' : ''} print:bg-white print:pb-0`}>
      <style>{`
        @media print {
          @page { margin: 10mm; size: A4 landscape; }
          body { -webkit-print-color-adjust: exact; background-color: white !important; }
        }
        /* Hide scrollbar for clean UI */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* --- 1. AURORA BACKGROUND (FULL PAGE) --- */}
      {!isSandbox && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <style>{auroraStyles}</style>
          
          {/* Base Layer (White/Slate) */}
          <div className="absolute inset-0 bg-slate-50"></div>
          
          {/* Top Blobs (Visible immediately) */}
          <div className="absolute top-[300px] left-[-10%] w-[500px] h-[500px] bg-purple-300 rounded-full mix-blend-multiply filter blur-[90px] opacity-60 animate-aurora-1"></div>
          <div className="absolute top-[300px] right-[-10%] w-[500px] h-[500px] bg-cyan-300 rounded-full mix-blend-multiply filter blur-[90px] opacity-60 animate-aurora-2"></div>
          
          {/* Middle Blobs (Visible as you look down) */}
          <div className="absolute top-[60%] left-[20%] w-[600px] h-[600px] bg-pink-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-aurora-3"></div>
          
          {/* Bottom Blobs (Anchoring the bottom of the screen) */}
          <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-emerald-300 rounded-full mix-blend-multiply filter blur-[90px] opacity-50 animate-aurora-2"></div>
        </div>
      )}

      {/* Sandbox Banner */}
      {isSandbox && (
        <div className="bg-indigo-600 text-white px-4 py-2 text-center text-sm font-bold sticky top-0 z-50 shadow-md flex justify-between items-center animate-in slide-in-from-top-full">
            <span className="flex items-center gap-2"><FlaskConical className="w-4 h-4" /> Sandbox Mode Active - Changes are NOT saved</span>
            <button onClick={toggleSandbox} className="bg-white/20 p-1 rounded hover:bg-white/30 transition"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button 
        id="fab-add-expense"
        onClick={() => {
          triggerHaptic();
          setIsAddingExpense(true);
        }}
        className={`fixed bottom-6 right-6 text-white px-6 py-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 z-40 print:hidden flex items-center gap-2 font-bold ${isSandbox ? 'bg-indigo-600' : 'bg-slate-900'}`}
      >
        <Plus className="w-5 h-5" /> <span className="hidden sm:inline">New Expense</span>
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
          currentSettings={isTutorialMode ? {
            ...userSettings,
            allocationRules: displayAllocations,
            defaultFixedExpenses: displayDefaultExpenses
          } : userSettings}
          onClose={() => setShowSettings(false)}
          onSaveSettings={saveSettings}
          onResetMonth={resetCurrentMonth}
          isTutorial={isTutorialMode}
          onExitTutorial={() => {
             setActiveTutorial(null);
             setShowSettings(false);
             setMobileMenuOpen(false);
             setShowHelp(true);
          }}
          // --- ADD THIS LINE ---
          isLegacyMode={isLegacyUser}
          // --------------------
        />
      )}

      {showHelp && (
        <HelpModal 
          onClose={() => setShowHelp(false)} 
          onStartTutorial={startTutorial} 
        />
      )}

      {activeTutorial && (
        <TutorialOverlay 
          steps={getTutorialSteps(activeTutorial)}
          currentStep={tutorialStep}
          onNext={handleTutorialNext}
          onPrev={() => setTutorialStep(s => Math.max(0, s - 1))}
          onClose={() => {
            setActiveTutorial(null);
            setIsAddingExpense(false);
            setMobileMenuOpen(false);
            setShowSettings(false); // Close Settings if open
            setShowHelp(true); // Redirect to Help
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

      {/* --- 2. PREMIUM HEADER --- */}
      <header className={`pt-8 pb-32 px-6 rounded-b-[3rem] shadow-xl relative z-10 print:hidden transition-all duration-500 ease-in-out ${isSandbox ? 'bg-gradient-to-br from-indigo-900 to-indigo-800' : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'}`}>
        <div className="max-w-3xl mx-auto flex justify-between items-center mb-6 relative">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl shadow-inner border border-white/10 ${isSandbox ? 'bg-indigo-500 text-white' : 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'}`}>
              {isSandbox ? <FlaskConical className="w-6 h-6" /> : <Wallet className="w-6 h-6" />}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
                {userSettings.displayName || (user.displayName ? user.displayName.split(' ')[0] : 'Guest')}
              </h1>
              <p className={`text-xs font-bold tracking-wide uppercase opacity-80 ${isSandbox ? 'text-indigo-200' : 'text-emerald-200'}`}>
                {isSandbox ? 'Simulation Mode' : 'Wealth Planner'}
              </p>
            </div>
          </div>

          {/* DESKTOP ACTIONS */}
          <div className="hidden md:flex gap-2">
             {/* --- PASTE HERE: ADMIN BUTTON --- */}
            {user.email === "yaseen.hussain2001@gmail.com" && (
               <button 
                 onClick={() => setIsAdminMode(true)} 
                 className="p-2.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400 transition shadow-lg shadow-indigo-500/20 border border-white/10"
                 title="Admin Panel"
               >
                 <Shield className="w-5 h-5" />
               </button>
            )}
             <button id="btn-sandbox" onClick={toggleSandbox} className="p-2.5 rounded-xl hover:bg-white/10 transition border border-transparent hover:border-white/10 text-white/70 hover:text-white" title="Sandbox Mode">
              <FlaskConical className={`w-5 h-5`} />
            </button>
            <button id="btn-analytics" onClick={() => setShowAnalytics(true)} className="p-2.5 rounded-xl hover:bg-white/10 transition border border-transparent hover:border-white/10 text-white/70 hover:text-white" title="Trends">
              <BarChart3 className={`w-5 h-5`} />
            </button>
            <button onClick={() => setShowReportSelector(true)} className="p-2.5 rounded-xl hover:bg-white/10 transition border border-transparent hover:border-white/10 text-white/70 hover:text-white" title="Reports">
              <FileText className={`w-5 h-5`} />
            </button>
            <button id="btn-settings" onClick={() => setShowSettings(true)} className="p-2.5 rounded-xl hover:bg-white/10 transition border border-transparent hover:border-white/10 text-white/70 hover:text-white">
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={() => setShowHelp(true)} className="p-2.5 rounded-xl hover:bg-white/10 transition border border-transparent hover:border-white/10 text-white/70 hover:text-white">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className="p-2.5 rounded-xl hover:bg-red-500/20 text-white/70 hover:text-red-200 transition border border-transparent hover:border-red-500/20">
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* MOBILE MENU TRIGGER */}
          <button 
            onClick={() => {
              triggerHaptic();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="md:hidden p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition active:scale-95 border border-white/5"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>
      </header>

      {/* MAIN CONTENT (BENTO GRID) */}
      <div className="px-4 -mt-24 max-w-5xl mx-auto pb-12 relative z-10 print:mt-0 print:px-0">
        
        {/* Month Selector Pill (Sticky) */}
        <div className={`sticky top-6 z-50 mx-auto max-w-[280px] mb-8 print:hidden relative transition-all duration-500 ease-in-out transform ${showMonthNav ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0 pointer-events-none'}`}>
          
          {/* Main Pill Controls */}
          <div className="flex items-center justify-between bg-white backdrop-blur-xl p-1.5 rounded-full shadow-2xl border border-white/40 ring-1 ring-white/60 transition-all duration-300">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500">
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {/* Clickable Label to toggle Menu */}
            <button 
              onClick={() => {
                setPickerYear(currentDate.getFullYear()); // Sync year when opening
                setShowDatePicker(!showDatePicker);
              }}
              className="font-bold text-sm text-slate-800 uppercase tracking-wider px-4 py-1.5 hover:bg-slate-100 rounded-xl transition"
            >
              {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </button>
            
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* THE POPUP MENU */}
          {showDatePicker && (
             <>
               {/* Invisible Backdrop to close when clicking outside */}
               <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)}></div>
               
               {/* The Menu Card */}
               <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 z-50 animate-in zoom-in-95 origin-top">
                  
                  {/* Year Selector */}
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-50">
                     <button onClick={() => setPickerYear(y => y - 1)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600"><ChevronLeft className="w-4 h-4" /></button>
                     <span className="font-bold text-lg text-slate-800">{pickerYear}</span>
                     <button onClick={() => setPickerYear(y => y + 1)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600"><ChevronRight className="w-4 h-4" /></button>
                  </div>

                  {/* Month Grid */}
                  <div className="grid grid-cols-3 gap-2">
                     {MONTH_NAMES.map((m, i) => {
                        const isCurrent = currentDate.getMonth() === i && currentDate.getFullYear() === pickerYear;
                        return (
                          <button 
                             key={m} 
                             onClick={() => jumpToDate(i)}
                             className={`py-2 rounded-xl text-xs font-bold transition ${isCurrent ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                          >
                             {m}
                          </button>
                        );
                     })}
                  </div>
               </div>
             </>
          )}
        </div>

        {/* --- BENTO GRID LAYOUT --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          
          {/* TILE 1: THE COCKPIT (Salary + Wheel) - Spans 2 Columns */}
          <div className="md:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200/60 relative overflow-hidden group">
             {/* Subtle background mesh for the "Cockpit" feel */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-emerald-50/50 transition duration-700"></div>
             
             <div className="relative z-10 flex flex-col md:flex-row items-center justify-between h-full gap-8">
               {/* Left: Salary Input */}
               <div className="w-full md:w-1/2 space-y-2">
                 <div className="flex items-center gap-2 mb-4">
                   <div className="bg-slate-900 text-white p-2 rounded-xl"><Wallet className="w-4 h-4" /></div>
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Income</span>
                 </div>
                 
                 <div className="relative">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl font-medium text-slate-300">
                        {userSettings.currency === 'GBP' ? '£' : userSettings.currency === 'USD' ? '$' : '€'}
                    </span>
                    <input 
                      type="text" 
                      value={displaySalary}
                      onChange={(e) => updateSalary(e.target.value)}
                      onBlur={(e) => {
                        const finalVal = safeCalculate(e.target.value);
                        updateSalary(finalVal);
                        // Only log if not in sandbox and value is valid
                        if (!isSandbox && finalVal) {
                           logSystemEvent(`Salary Updated: ${finalVal} for ${MONTH_NAMES[currentDate.getMonth()]}`, 'action');
                        }
                      }}
                      placeholder="0.00"
                      className="w-full bg-transparent border-none text-5xl font-bold text-slate-800 placeholder-slate-200 outline-none pl-8 tracking-tight"
                    />
                 </div>
                 <p className="text-sm text-slate-400 font-medium pl-1">
                   Tap to edit your budget limit
                 </p>
               </div>

               {/* Right: The Wheel */}
               <div className="w-full md:w-1/2 flex justify-center scale-110">
                 {parseFloat(displaySalary) > 0 ? (
                    <BudgetWheel 
                      salary={displaySalary} 
                      expenses={displayExpenses} 
                      allocations={displayAllocations}
                      currency={userSettings.currency}
                      activeSlice={highlightedSlice}
                      onSliceClick={setHighlightedSlice}
                    />
                 ) : (
                   <div className="h-48 flex items-center justify-center text-slate-300 font-bold border-2 border-dashed border-slate-100 rounded-full w-48 aspect-square">
                     No Budget Set
                   </div>
                 )}
               </div>
             </div>
          </div>

          {/* TILE 2 & 3: STATS STACK - Spans 1 Column */}
          <div className="flex flex-col gap-5">
             
             {/* Stat 1: Total Spent & Remaining (UPDATED) */}
             <div className="flex-1 bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-200/60 flex flex-col justify-center relative overflow-hidden group">
                {/* Subtle Background Blob */}
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-8 -mb-8 group-hover:scale-110 transition duration-500"></div>
                
                <div className="relative z-10 grid grid-cols-2 gap-2 border-slate-100">
                  {/* Left: Total Bills */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg"><TrendingDown className="w-3 h-3" /></div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Bills</span>
                    </div>
                    <span className="text-xl md:text-2xl font-black text-slate-800 tracking-tight block">
                      -{formatCurrency(totalExpenses, userSettings.currency)}
                    </span>
                  </div>

                  {/* Right: Left from Salary */}
                  <div className="text-right border-l border-slate-100 pl-4">
                    <div className="flex items-center justify-end gap-1.5 mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Left</span>
                      <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg"><TrendingUp className="w-3 h-3" /></div>
                    </div>
                    <span className="text-xl md:text-2xl font-black text-emerald-500 tracking-tight block">
                      {formatCurrency(salaryNum - totalExpenses, userSettings.currency)}
                    </span>
                  </div>
                </div>
             </div>

             {/* Stat 2: Days Left (UNCHANGED) */}
             <div className="flex-1 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200/60 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-8 -mb-8 group-hover:scale-110 transition duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Calendar className="w-4 h-4" /></div>
                    <span className="text-xs font-bold text-slate-400 uppercase">{daysLeftLabel}</span>
                  </div>
                  <span className="text-3xl font-bold text-slate-800 tracking-tight">
                    {getDaysLeft()}
                  </span>
                  <span className="text-xs text-slate-400 ml-2 font-medium">
                  {currentDate.getMonth() === new Date().getMonth() ? 'in this month' : 'days total'}
                  </span>
                </div>
             </div>
             
             {/* --- PASTE THIS NEW WIDGET BELOW --- */}
             {/* Stat 3: Daily Allowance Widget */}
             <div className="flex-1 bg-indigo-50 p-6 rounded-[2.5rem] shadow-sm border border-indigo-100 flex flex-col justify-center text-center relative overflow-hidden group">
                {/* Decorative Top Bar */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-200/50"></div>
                
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Daily Pace</span>
                
                <div className="flex items-baseline justify-center gap-1">
                   <span className="text-3xl font-black text-indigo-700 tracking-tight">
                     {formatCurrency(dailyAllowance, userSettings.currency)}
                   </span>
                   <span className="text-sm font-bold text-indigo-400">/ day</span>
                </div>
                
                <p className="text-[10px] text-indigo-400 mt-2 font-medium opacity-80 px-2">
                   Spend less than this today to stay on track.
                </p>
             </div>
             {/* ----------------------------------- */}

          </div>
        </div>

        {/* TILE 3: ALLOCATIONS STRIP */}
        {salaryNum > 0 && (
          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-200/60 mb-6">
             
             {/* 1. Header Row */}
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><Target className="w-4 h-4" /></div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Your Pots</h3>
             </div>

             {/* 2. THE UNSORTED POT VISUALIZER (ACTUALS LOGIC) */}
             {(() => {
                // 1. Calculate Total Disposable (Salary - Fixed Expenses)
                const totalDisposable = salaryNum - expenses.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
                
                // 2. Calculate Total Actually Deposited (Sum of user inputs)
                const totalDeposited = Object.values(displayActualSavings).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
                
                // 3. Calculate Real Unsorted Cash
                const realUnsorted = Math.max(0, totalDisposable - totalDeposited);
                
                // 4. Calculate Percentage (Full jar = lots of unsorted cash)
                const percentFilled = totalDisposable > 0 ? (realUnsorted / totalDisposable) * 100 : 0;
                
                return (
                  <div className="bg-slate-900 rounded-3xl p-6 mb-8 text-white relative overflow-hidden shadow-xl">
                    
                    <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                       
                       {/* THE GRAPHIC JAR */}
                       <div className="relative shrink-0">
                          {/* Jar Body */}
                          <div className="w-24 h-32 border-4 border-slate-600 bg-slate-800/50 rounded-b-3xl rounded-t-lg relative overflow-hidden backdrop-blur-sm">
                             {/* Liquid Level */}
                             <div 
                                className="absolute bottom-0 left-0 w-full bg-emerald-500 transition-all duration-1000 ease-in-out opacity-90"
                                style={{ height: `${percentFilled}%` }}
                             >
                                <div className="absolute top-0 left-0 w-full h-2 bg-emerald-400 opacity-50 animate-pulse"></div>
                                {/* Bubbles */}
                                <div className="absolute bottom-2 left-2 w-2 h-2 bg-white/20 rounded-full animate-bounce"></div>
                                <div className="absolute bottom-6 right-4 w-1 h-1 bg-white/20 rounded-full animate-bounce delay-100"></div>
                             </div>
                             {/* Jar Shine */}
                             <div className="absolute top-0 right-2 w-2 h-full bg-white/5 rounded-full"></div>
                          </div>
                          {/* Lid */}
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-28 h-2 bg-slate-500 rounded-full"></div>
                       </div>

                       {/* THE EXPLANATION */}
                       <div className="text-center md:text-left flex-1">
                          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 border border-emerald-500/30">
                             <AlertCircle className="w-3 h-3" />
                             Actual Cash Remaining
                          </div>
                          
                          <div className="text-4xl font-black tracking-tight text-white mb-2">
                             {formatCurrency(realUnsorted, userSettings.currency)}
                          </div>
                          
                          <p className="text-slate-400 text-sm leading-relaxed">
                             This is the <strong>Physical Cash</strong> still sitting in your main bank account right now.
                             (Salary minus Expenses minus what you have already transferred).
                          </p>

                          <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
                             <div className="bg-white/10 p-2 rounded-full">
                                <ArrowRight className="w-4 h-4 text-emerald-400" />
                             </div>
                             <div className="text-left">
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Action Required</p>
                                <p className="text-xs text-white font-bold">Transfer this money to your pots and type the amounts below to empty this jar.</p>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                );
             })()}

             {/* 3. Grid of Pots */}
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* --- NEW: EMPTY POTS STATE --- */}
                {displayAllocations.length === 0 && (
                   <div className="col-span-full py-10 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                      <div className="bg-white p-4 rounded-full shadow-sm mb-3">
                         <Target className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="font-bold text-sm">No savings pots yet</p>
                      <button onClick={() => setShowSettings(true)} className="text-xs text-indigo-500 font-bold mt-2 hover:underline">
                        Create a Pot in Settings
                      </button>
                   </div>
                )}
                {displayAllocations.map(plan => {
                  const target = remainder * (plan.percentage / 100);
                  const isLastToFill = (displayAllocations.length - filledPlansCount === 1);
                  
                  return (
                    <AllocationCard 
                      key={plan.id}
                      title={plan.name} 
                      targetAmount={target}
                      actualAmount={displayActualSavings[plan.id]}
                      percentage={plan.percentage}
                      hexColor={plan.hex || '#10b981'} 
                      currency={userSettings.currency}
                      onUpdateActual={(val) => updateActualSavings(plan.id, val)}
                      showRemainderButton={isLastToFill}
                      onFillRemainder={() => fillRemainder(plan.id)}
                    />
                  );
                })}
             </div>

             {/* --- NEW SECTION: KEEP IN CURRENT ACCOUNT --- */}
             <div className="mt-6">
                <div 
                   className="rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden"
                   style={{ backgroundColor: userSettings.bankDetails?.color || '#1e293b' }}
                >
                   {/* Background Logo Decoration (Faded) */}
                   {userSettings.bankDetails?.logo && (
                      <div className="absolute -right-6 -bottom-6 opacity-10 rotate-12">
                         <img src={userSettings.bankDetails.logo} className="w-48 h-48 object-contain invert" />
                      </div>
                   )}
                   
                   <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                      {/* Left: Identity */}
                      <div className="flex items-center gap-4">
                         <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm shadow-inner border border-white/10">
                            {userSettings.bankDetails?.logo ? (
                               <img src={userSettings.bankDetails.logo} className="w-8 h-8 object-contain rounded-full bg-white p-0.5" />
                            ) : (
                               <Wallet className="w-8 h-8 text-white" />
                            )}
                         </div>
                         <div>
                            <h3 className="text-lg font-bold opacity-90">Keep in {userSettings.bankDetails?.name || 'Current Account'}</h3>
                            <div className="flex items-center gap-2 text-sm font-medium opacity-70">
                               <span>Do not transfer</span>
                            </div>
                         </div>
                      </div>

                      {/* Right: Stats (Target vs Actual) */}
                      <div className="flex items-center gap-2 md:gap-6 text-right">
                         
                         {/* Target (Small) */}
                         <div className="opacity-80">
                            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5">Target ({currentAccountPercent.toFixed(0)}%)</p>
                            <p className="text-xl font-bold">{formatCurrency(currentAccountTarget, userSettings.currency)}</p>
                         </div>

                         {/* Divider */}
                         <div className="w-px h-10 bg-white/20 hidden md:block"></div>

                         {/* Actual (Big) */}
                         <div className="bg-black/20 px-5 py-3 rounded-2xl border border-white/5 backdrop-blur-sm shadow-lg">
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1 text-emerald-200">Actual to keep</p>
                            <p className="text-3xl font-black tracking-tight text-white">{formatCurrency(currentAccountActual, userSettings.currency)}</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
             {/* ------------------------------------------- */}
          </div>
        )}

        {/* TILE 4: EXPENSES LIST (The Wide Rectangle) */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 overflow-hidden min-h-[400px]">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/50 backdrop-blur-sm sticky top-0 z-20">
             <div className="flex items-center gap-3 w-full md:w-auto">
               <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg shadow-slate-200"><TrendingUp className="w-5 h-5" /></div>
               <h3 className="font-bold text-slate-800 text-lg">Expenses</h3>
             </div>
             
             {/* Search & Actions */}
             <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition" />
                  <input 
                    type="text" 
                    placeholder="Find a bill..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-2xl border border-transparent focus:bg-white focus:border-emerald-100 focus:ring-4 focus:ring-emerald-500/10 text-sm font-medium transition outline-none"
                  />
                </div>
                <button onClick={toggleSort} className="bg-slate-50 hover:bg-slate-100 text-slate-600 p-3 rounded-2xl transition border border-transparent hover:border-slate-200"><ArrowUpDown className="w-5 h-5" /></button>
                <button onClick={copyFromPreviousMonth} className="bg-slate-50 hover:bg-slate-100 text-slate-600 p-3 rounded-2xl transition border border-transparent hover:border-slate-200" title="Copy Previous"><Copy className="w-5 h-5" /></button>
             </div>
          </div>

          <div className="divide-y divide-slate-50">
             {/* ... (Keep existing Expense List mapping logic exactly as before) ... */}
            {[
              { title: 'Fixed Bills', items: fixedExpenses },
              { title: 'Variable Spending', items: variableExpenses }
            ].map(group => (
              group.items.length > 0 && (
                <React.Fragment key={group.title}>
                  {(searchTerm || (fixedExpenses.length > 0 && variableExpenses.length > 0)) && (
                    <div className="bg-slate-50/80 px-6 py-3 border-y border-slate-100">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{group.title}</h4>
                    </div>
                  )}
                  
                  {group.items.map((expense) => {
                    const Icon = getExpenseIcon(expense.name);
                    const isEditing = editingExpenseId === expense.id;
                    
                    return (
                    <SwipeableExpenseRow 
                       key={expense.id} 
                       isMobile={isMobile}
                       onEdit={() => { triggerHaptic(); setEditingExpenseId(expense.id); }}
                       onDelete={() => removeExpense(expense.id)}
                    >
                      <div className="p-4 sm:px-6 flex justify-between items-center group hover:bg-slate-50/80 transition-all duration-200">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-2.5 rounded-2xl bg-slate-50 text-slate-400 w-12 h-12 flex items-center justify-center border border-slate-100 shadow-sm group-hover:scale-110 transition duration-300`}>
                             {expense.logo ? (
                               <img src={expense.logo} alt={expense.name} className="w-full h-full object-contain mix-blend-multiply" />
                             ) : (
                               <Icon className="w-5 h-5" />
                             )}
                          </div>
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <input 
                                autoFocus
                                type="text"
                                defaultValue={expense.name}
                                className="font-medium text-slate-800 w-full bg-white border border-emerald-200 rounded px-2 py-1 outline-none ring-2 ring-emerald-100"
                                onBlur={(e) => updateExpenseName(expense.id, e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && setEditingExpenseId(null)}
                              />
                            ) : (
                              <p className="font-bold text-slate-700 truncate">{expense.name}</p>
                            )}
                            <p className="text-xs text-slate-400 capitalize flex items-center gap-1">
                               <span className={`w-1.5 h-1.5 rounded-full ${expense.type === 'fixed' ? 'bg-indigo-400' : 'bg-emerald-400'}`}></span>
                               {expense.type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                        {isEditing ? (
                            <div className="flex items-center gap-1">
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
                                className="w-24 p-2 border border-emerald-200 rounded-lg bg-white text-right font-bold text-slate-800 ring-2 ring-emerald-100 outline-none"
                              />
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                triggerHaptic();
                                setEditingExpenseId(expense.id);
                              }}
                              className={`flex items-center gap-2 hover:bg-white px-3 py-1.5 rounded-xl transition ${expense.amount === 0 ? 'bg-orange-50 ring-1 ring-orange-200 text-orange-600' : 'text-slate-700'} print:hover:bg-transparent print:p-0 print:ring-0`}
                            >
                              {expense.amount === 0 ? (
                                <span className="text-sm font-bold flex items-center gap-1">
                                  Set Amount <Edit2 className="w-3 h-3" />
                                </span>
                              ) : (
                                <span className="font-bold text-lg">{formatCurrency(expense.amount, userSettings.currency)}</span>
                              )}
                            </button>
                          )}
                          
                          {isEditing ? (
                             <button onClick={() => setEditingExpenseId(null)} className="bg-emerald-500 text-white p-2 rounded-full hover:bg-emerald-600 transition shadow-lg shadow-emerald-200">
                               <Check className="w-4 h-4" />
                             </button>
                          ) : (
                            // Added "hidden md:block" here so it doesn't show on mobile (swipe is used instead)
                            <button onClick={() => removeExpense(expense.id)} className="text-slate-300 hover:text-red-500 transition p-2 rounded-xl hover:bg-red-50 opacity-0 group-hover:opacity-100 print:hidden hidden md:block">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </SwipeableExpenseRow>
                  )})}
                </React.Fragment>
              )
            ))}
             {expenses.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center justify-center">
                <div className="relative mb-6">
                   <div className="absolute inset-0 bg-emerald-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
                   <div className="relative bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                      <ShoppingCart className="w-10 h-10 text-emerald-200" />
                   </div>
                   {/* Floating "Plus" badge */}
                   <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-1.5 rounded-full border-4 border-white shadow-sm">
                      <Plus className="w-4 h-4" />
                   </div>
                </div>
                <h3 className="text-slate-800 font-bold text-lg mb-1">A fresh start!</h3>
                <p className="text-slate-400 text-sm max-w-[200px] leading-relaxed mx-auto">
                  No expenses for this month yet. Tap the button below to add your first bill.
                </p>
              </div>
            )}
          </div>
          
           {/* Footer Summary */}
           <div className="p-6 bg-slate-50/50 text-right border-t border-slate-100">
             <span className="text-sm font-medium text-slate-500 mr-3">Total Outgoings:</span>
             <span className="text-xl font-bold text-slate-800 tracking-tight">{formatCurrency(totalExpenses, userSettings.currency)}</span>
          </div>
        </div>
        
        {/* Creator Footer (Boxed) */}
        <div className="py-12 flex justify-center print:hidden relative z-10">
           <div className="bg-white/60 backdrop-blur-md px-6 py-3 rounded-2xl shadow-sm border border-white/50 text-center">
              <p className="text-slate-500 text-xs font-medium">
                 Designed & Built by <span className="text-slate-800 font-bold">Yaseen Hussain</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-bold tracking-wide uppercase opacity-70">
                 © {new Date().getFullYear()} Budget Planner
              </p>
           </div>
        </div>

      </div>

      {/* --- MOBILE MENU OVERLAY --- */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setMobileMenuOpen(false)} />
            
            <div className="absolute top-20 right-6 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 grid grid-cols-2 gap-2 animate-in slide-in-from-top-4 fade-in">
                {/* --- PASTE HERE: ADMIN BUTTON (MOBILE) --- */}
                {user.email === "yaseen.hussain2001@gmail.com" && (
                    <button 
                      onClick={() => { setMobileMenuOpen(false); setIsAdminMode(true); }}
                      className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-indigo-50 hover:scale-95 transition"
                    >
                      <Shield className="w-6 h-6 text-indigo-600" />
                      <span className="text-xs font-bold text-indigo-600">Admin</span>
                    </button>
                )}
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
                    id={item.id}
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
    </div>
  );
}