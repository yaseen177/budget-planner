import React, { useState, useEffect } from 'react';
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
  ArrowRight
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
const formatCurrency = (amount, currency = 'GBP') => {
  const localeMap = {
    'GBP': 'en-GB',
    'USD': 'en-US',
    'EUR': 'de-DE'
  };
  return new Intl.NumberFormat(localeMap[currency] || 'en-GB', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
};

const getMonthId = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const triggerHaptic = () => {
  if (navigator.vibrate) {
    navigator.vibrate(15); 
  }
};

const openReportInNewTab = (elementId, title) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body { background-color: white; padding: 20px; font-family: sans-serif; -webkit-print-color-adjust: exact; }
        @media print { 
          body { padding: 0; }
          .no-print { display: none; } 
        }
      </style>
    </head>
    <body>
      <div class="max-w-4xl mx-auto">
        ${element.innerHTML}
      </div>
      <div class="fixed bottom-4 right-4 no-print flex gap-2">
        <button onclick="window.print()" class="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg">Print / Save as PDF</button>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};

const getExpenseIcon = (name) => {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('netflix') || lowerName.includes('sky') || lowerName.includes('tv') || lowerName.includes('prime') || lowerName.includes('disney')) return Tv;
  if (lowerName.includes('food') || lowerName.includes('tesco') || lowerName.includes('asda') || lowerName.includes('lidl') || lowerName.includes('sainsbury') || lowerName.includes('aldi') || lowerName.includes('grocer')) return ShoppingCart;
  if (lowerName.includes('car') || lowerName.includes('fuel') || lowerName.includes('petrol') || lowerName.includes('uber') || lowerName.includes('train') || lowerName.includes('bus') || lowerName.includes('transport')) return Car;
  if (lowerName.includes('rent') || lowerName.includes('mortgage') || lowerName.includes('house') || lowerName.includes('home')) return Home;
  if (lowerName.includes('electric') || lowerName.includes('gas') || lowerName.includes('water') || lowerName.includes('bill') || lowerName.includes('council')) return Zap;
  if (lowerName.includes('phone') || lowerName.includes('mobile') || lowerName.includes('ee') || lowerName.includes('vodafone') || lowerName.includes('o2')) return Smartphone;
  if (lowerName.includes('coffee') || lowerName.includes('cafe') || lowerName.includes('starbucks')) return Coffee;
  if (lowerName.includes('restaurant') || lowerName.includes('eat') || lowerName.includes('dinner') || lowerName.includes('lunch')) return Utensils;
  if (lowerName.includes('spotify') || lowerName.includes('music') || lowerName.includes('apple')) return Music;
  
  return CreditCard; // Default
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

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !amount) return;
    onSave(name, amount);
    setName('');
    setAmount('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800">New Expense</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Bill Name</label>
            <input 
              autoFocus
              type="text" 
              placeholder="e.g. Netflix" 
              className="w-full p-4 rounded-xl bg-slate-50 border-none text-lg font-medium text-slate-800 placeholder-slate-300 focus:ring-2 focus:ring-emerald-500/20 outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">£</span>
              <input 
                type="number" 
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

// --- OTHER COMPONENTS ---

const BudgetWheel = ({ salary, expenses, allocations, currency }) => {
  if (!salary || parseFloat(salary) <= 0) return null;

  const salaryNum = parseFloat(salary);
  const totalExpenses = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const expensesPercent = Math.min(100, (totalExpenses / salaryNum) * 100);
  const remainderPercentOfTotal = 100 - expensesPercent;
  
  let currentDegree = 0;
  const segments = [];

  const addSegment = (percent, color) => {
    const degrees = (percent / 100) * 360;
    segments.push(`${color} ${currentDegree}deg ${currentDegree + degrees}deg`);
    currentDegree += degrees;
  };

  addSegment(expensesPercent, '#f43f5e'); // rose-500

  allocations.forEach(plan => {
    const planPercentOfTotal = (plan.percentage / 100) * remainderPercentOfTotal;
    let hex = '#64748b'; 
    if (plan.color.includes('indigo')) hex = '#6366f1';
    if (plan.color.includes('emerald')) hex = '#10b981';
    if (plan.color.includes('sky')) hex = '#0ea5e9';
    if (plan.color.includes('amber')) hex = '#f59e0b';
    
    addSegment(planPercentOfTotal, hex);
  });

  const gradient = `conic-gradient(${segments.join(', ')})`;

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden print:hidden">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 w-full text-left">Where your money goes</h3>
      <div className="relative w-48 h-48">
        <div className="w-full h-full rounded-full" style={{ background: gradient }}></div>
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
           let bgClass = 'bg-slate-500';
           if (plan.color.includes('indigo')) bgClass = 'bg-indigo-500';
           if (plan.color.includes('emerald')) bgClass = 'bg-emerald-500';
           if (plan.color.includes('sky')) bgClass = 'bg-sky-500';
           if (plan.color.includes('amber')) bgClass = 'bg-amber-500';
           return (
            <div key={plan.id} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full ${bgClass}`}></div>
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

const AllocationCard = ({ title, targetAmount, actualAmount, percentage, color, currency, onUpdateActual }) => {
  let barColor = 'bg-slate-500';
  if (color.includes('indigo')) barColor = 'bg-indigo-500';
  if (color.includes('emerald')) barColor = 'bg-emerald-500';
  if (color.includes('sky')) barColor = 'bg-sky-500';
  if (color.includes('amber')) barColor = 'bg-amber-500';

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm print:border-slate-300 print:shadow-none print:break-inside-avoid">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
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
           {onUpdateActual && (
              <button 
                onClick={() => onUpdateActual(targetAmount)}
                className="text-xs text-emerald-600 font-bold hover:bg-emerald-100 px-2 py-1 rounded print:hidden"
                title="Match Target"
              >
                Match Target
              </button>
           )}
           <div className="relative">
             <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                {currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'}
             </span>
             <input 
                type="number"
                value={actualAmount || ''}
                onChange={(e) => onUpdateActual(e.target.value)}
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
            <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3">Savings Breakdown</h3>
            <table className="w-full text-sm">
               <thead>
                 <tr className="text-xs text-slate-400 uppercase">
                   <th className="text-left py-2">Goal</th>
                   <th className="text-right py-2">Target</th>
                   <th className="text-right py-2">Actual</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {allocations.map(plan => {
                   const target = remainder * (plan.percentage / 100);
                   const actual = actuals && actuals[plan.id] ? parseFloat(actuals[plan.id]) : 0;
                   return (
                     <tr key={plan.id}>
                        <td className="py-2 text-slate-600">{plan.name}</td>
                        <td className="py-2 text-right text-slate-400">{formatCurrency(target, currency)}</td>
                        <td className={`py-2 text-right font-bold ${actual >= target ? 'text-emerald-600' : 'text-orange-500'}`}>
                          {formatCurrency(actual, currency)}
                        </td>
                     </tr>
                   )
                 })}
               </tbody>
            </table>
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
  
  // State for new items
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanPercent, setNewPlanPercent] = useState('');
  const [newDefExpName, setNewDefExpName] = useState('');
  const [newDefExpAmount, setNewDefExpAmount] = useState('');

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
      type: 'fixed'
    }]);
    setNewDefExpName('');
    setNewDefExpAmount('');
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

        {/* Allocation Rules */}
        <section className="space-y-3">
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

        {/* Default Fixed Expenses */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Default Monthly Bills</h3>
          <p className="text-xs text-slate-500">These automatically copy over when you start a new month.</p>
          
          <div className="space-y-2">
            {defaultExpenses.map(exp => (
              <div key={exp.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <span className="font-medium text-slate-700">{exp.name}</span>
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
            
            <div className="flex gap-2 pt-2">
              <input 
                placeholder="Bill Name (e.g. AMEX)"
                value={newDefExpName}
                onChange={(e) => setNewDefExpName(e.target.value)}
                className="flex-1 p-3 text-sm border border-slate-200 rounded-xl bg-slate-50"
              />
              <input 
                type="number"
                placeholder="£"
                value={newDefExpAmount}
                onChange={(e) => setNewDefExpAmount(e.target.value)}
                className="w-24 p-3 text-sm border border-slate-200 rounded-xl bg-slate-50"
              />
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

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [showSettings, setShowSettings] = useState(false);
  const [showReportSelector, setShowReportSelector] = useState(false);
  const [activeReport, setActiveReport] = useState(null); // 'month' or 'history'
  const [reportData, setReportData] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  
  const [salary, setSalary] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [actualSavings, setActualSavings] = useState({}); // New State for Actuals
  
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
      } else {
        const defaults = {
          displayName: user.displayName || '',
          currency: 'GBP',
          allocationRules: DEFAULT_ALLOCATIONS,
          defaultFixedExpenses: DEFAULT_FIXED_EXPENSES
        };
        setDoc(settingsRef, defaults);
        setUserSettings(defaults);
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
        setSalary(data.salary || '');
        setExpenses(data.expenses || []);
        saveData(data.salary, data.expenses, {}); // Don't copy actuals, they are new
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
    if (!user) return;
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
    if (confirm("Are you sure? This will clear all data for this month.")) {
      const monthId = getMonthId(currentDate);
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'budgetData', monthId);
      await deleteDoc(docRef);
      setShowSettings(false);
      showToast("Month reset.");
    }
  };

  const updateSalary = (val) => {
    setSalary(val);
    saveData(val, expenses, actualSavings);
  };

  const updateActualSavings = (planId, val) => {
     const newActuals = { ...actualSavings, [planId]: val };
     setActualSavings(newActuals);
     saveData(salary, expenses, newActuals);
  };

  const handleAddExpenseSave = (name, amount) => {
    triggerHaptic(); // Haptic
    const newExp = {
      id: Date.now().toString(),
      name: name,
      amount: parseFloat(amount),
      type: 'variable'
    };
    const updatedExpenses = [...expenses, newExp];
    setExpenses(updatedExpenses);
    saveData(salary, updatedExpenses, actualSavings);
    setIsAddingExpense(false);
    showToast("Bill added!");
  };


  const updateExpenseAmount = (id, newAmount) => {
    const updatedExpenses = expenses.map(e => 
      e.id === id ? { ...e, amount: parseFloat(newAmount) || 0 } : e
    );
    setExpenses(updatedExpenses);
    saveData(salary, updatedExpenses, actualSavings);
  };

  const updateExpenseName = (id, newName) => {
    const updatedExpenses = expenses.map(e => 
      e.id === id ? { ...e, name: newName } : e
    );
    setExpenses(updatedExpenses);
    saveData(salary, updatedExpenses, actualSavings);
  };

  const removeExpense = (id) => {
    triggerHaptic(); // Haptic
    const updatedExpenses = expenses.filter(e => e.id !== id);
    setExpenses(updatedExpenses);
    saveData(salary, updatedExpenses, actualSavings);
    showToast("Bill removed.");
  };

  const changeMonth = (delta) => {
    triggerHaptic(); // Haptic
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };
  
  const toggleSort = () => {
    triggerHaptic();
    if (sortMode === 'date') setSortMode('amount-desc');
    else if (sortMode === 'amount-desc') setSortMode('name');
    else setSortMode('date');
    showToast(`Sorting by ${sortMode === 'date' ? 'Amount' : sortMode === 'amount-desc' ? 'Name' : 'Date'}`);
  };

  const totalExpenses = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const salaryNum = parseFloat(salary) || 0;
  const remainder = Math.max(0, salaryNum - totalExpenses);

  // Filter and Group Expenses
  let filteredExpenses = expenses.filter(e => 
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
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900 print:bg-white print:pb-0">
      <style>{`
        @media print {
          @page { margin: 10mm; size: A4 landscape; }
          body { -webkit-print-color-adjust: exact; background-color: white !important; }
        }
      `}</style>

      {/* Floating Action Button (FAB) - REPLACED WITH PILL */}
      <button 
        onClick={() => {
          triggerHaptic();
          setIsAddingExpense(true);
        }}
        className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition z-40 print:hidden flex items-center gap-2 font-bold"
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

      {showReportSelector && (
        <ReportSelector 
          onClose={() => setShowReportSelector(false)}
          onSelect={handleReportSelection}
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

      {/* MAIN APP HEADER */}
      <header className="bg-slate-900 text-white pt-6 pb-20 px-6 rounded-b-[2rem] shadow-xl relative z-0 print:hidden">
        <div className="max-w-2xl mx-auto flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-xl text-slate-900">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                {userSettings.displayName || (user.displayName ? user.displayName.split(' ')[0] : 'Guest')}
                's Budget
              </h1>
              <p className="text-slate-400 text-xs font-medium">Wealth Planner</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowReportSelector(true)} className="bg-slate-800 p-2 rounded-xl hover:bg-slate-700 transition border border-slate-700/50" title="Reports">
              <FileText className="w-5 h-5 text-emerald-400" />
            </button>
            <button onClick={() => setShowSettings(true)} className="bg-slate-800 p-2 rounded-xl hover:bg-slate-700 transition border border-slate-700/50">
              <Settings className="w-5 h-5 text-slate-300" />
            </button>
            <button onClick={handleLogout} className="bg-slate-800 p-2 rounded-xl hover:bg-red-900/50 hover:text-red-200 transition border border-slate-700/50">
              <LogOut className="w-5 h-5 text-slate-300" />
            </button>
          </div>
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
              type="number" 
              value={salary}
              onChange={(e) => updateSalary(e.target.value)}
              placeholder="0.00"
              className="w-full pl-6 text-4xl font-bold text-slate-800 placeholder-slate-200 outline-none bg-transparent py-1"
            />
          </div>
        </div>

        {/* Budget Wheel */}
        <BudgetWheel 
          salary={salary} 
          expenses={expenses} 
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
              return (
                <AllocationCard 
                  key={plan.id}
                  title={plan.name} 
                  targetAmount={target}
                  actualAmount={actualSavings[plan.id]}
                  percentage={plan.percentage} 
                  color={plan.color || 'bg-slate-100 text-slate-700'}
                  currency={userSettings.currency}
                  onUpdateActual={(val) => updateActualSavings(plan.id, val)}
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
                 {/* Original Inline Add Button - Removed as requested, replaced by FAB */}
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
                  {/* Group Header (Only show if searching or if both exist) */}
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
                        <div className={`p-2 rounded-full bg-slate-100 text-slate-500`}>
                          <Icon className="w-4 h-4" />
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
                              autoFocus // Set autofocus only on the amount field when editing starts
                              type="number"
                              defaultValue={expense.amount}
                              onBlur={(e) => updateExpenseAmount(expense.id, e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingExpenseId(null)}
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

      </div>
    </div>
  );
}