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
  RotateCcw
} from 'lucide-react';

// --- FIREBASE CONFIGURATION AREA ---
// PASTE YOUR KEYS INSIDE THE QUOTES BELOW
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
// FIX: Using a static app ID to prevent path errors in database
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
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2
  }).format(amount);
};

const getMonthId = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

// --- COMPONENTS ---

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
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Sign in with Google
      </button>
      <p className="mt-6 text-xs text-slate-400 font-medium">
        Encrypted & Private
      </p>
    </div>
  </div>
);

const StatCard = ({ label, amount, icon: Icon, colorClass, subText }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-full print:border-slate-300 print:shadow-none">
    <div className="flex justify-between items-start mb-2">
      <div className={`p-2.5 rounded-xl ${colorClass} print:bg-white print:border print:border-slate-200`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 print:text-slate-600">{label}</p>
      <h3 className="text-2xl font-bold text-slate-800 print:text-black tracking-tight">{formatCurrency(amount)}</h3>
      {subText && <p className="text-xs text-slate-400 mt-1 print:text-slate-500 font-medium">{subText}</p>}
    </div>
  </div>
);

const AllocationCard = ({ title, amount, percentage, color }) => {
  // Extract Tailwind color classes for the progress bar
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
        <p className="text-lg font-bold text-slate-800 print:text-black">{amount > 0 ? formatCurrency(amount) : '£0.00'}</p>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div 
          className={`h-2.5 rounded-full ${barColor} transition-all duration-1000 ease-out`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="text-right mt-1">
        <span className="text-xs font-semibold text-slate-400">{percentage}% allocation</span>
      </div>
    </div>
  );
};

const SettingsScreen = ({ user, onClose, currentSettings, onSaveSettings, onResetMonth }) => {
  const [displayName, setDisplayName] = useState(currentSettings.displayName || user.displayName || '');
  const [allocations, setAllocations] = useState(currentSettings.allocationRules || DEFAULT_ALLOCATIONS);
  const [defaultExpenses, setDefaultExpenses] = useState(currentSettings.defaultFixedExpenses || DEFAULT_FIXED_EXPENSES);
  
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
    // Allow empty amount (0) for variable expenses
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
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Profile</h3>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Display Name</label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 focus:border-emerald-500 outline-none transition"
              placeholder="Your Name"
            />
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
                    {exp.amount > 0 ? formatCurrency(exp.amount) : 'Variable'}
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

        {/* Danger Zone */}
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
  
  // Data State
  const [salary, setSalary] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [userSettings, setUserSettings] = useState({
    displayName: '',
    allocationRules: DEFAULT_ALLOCATIONS,
    defaultFixedExpenses: DEFAULT_FIXED_EXPENSES
  });

  // UI State
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [isAddingExpense, setIsAddingExpense] = useState(false);

  // Auth Handling
  useEffect(() => {
    const initAuth = async () => {
      const config = getFirebaseConfig();
      if (!config.apiKey) {
        console.warn("No Firebase Config found");
        return;
      }

      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try {
          await signInWithCustomToken(auth, __initial_auth_token);
        } catch (e) {
          console.error("Auth error", e);
        }
      } else {
        // Standard flow: wait for user to click login
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Settings
  useEffect(() => {
    if (!user) return;
    const settingsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'config');
    const unsub = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserSettings(docSnap.data());
      } else {
        const defaults = {
          displayName: user.displayName || '',
          allocationRules: DEFAULT_ALLOCATIONS,
          defaultFixedExpenses: DEFAULT_FIXED_EXPENSES
        };
        setDoc(settingsRef, defaults);
        setUserSettings(defaults);
      }
    });
    return () => unsub();
  }, [user]);

  // Fetch Monthly Data
  useEffect(() => {
    if (!user) return;

    const monthId = getMonthId(currentDate);
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'budgetData', monthId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSalary(data.salary || '');
        setExpenses(data.expenses || []);
      } else {
        setSalary('');
        setExpenses(userSettings.defaultFixedExpenses || DEFAULT_FIXED_EXPENSES);
      }
    }, (error) => {
      console.error("Error fetching data:", error);
    });

    return () => unsubscribe();
  }, [user, currentDate, userSettings.defaultFixedExpenses]);

  // Actions
  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
      if (!YOUR_FIREBASE_KEYS.apiKey) {
        await signInAnonymously(auth);
      } else {
        alert("Login failed. Check your Firebase Keys.");
      }
    }
  };

  const handleLogout = () => signOut(auth);
  const handlePrint = () => window.print();

  const saveData = async (newSalary, newExpenses) => {
    if (!user) return;
    const monthId = getMonthId(currentDate);
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'budgetData', monthId);
    
    await setDoc(docRef, {
      salary: newSalary,
      expenses: newExpenses,
      lastUpdated: new Date()
    });
  };

  const saveSettings = async (newSettings) => {
    if (!user) return;
    const settingsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'config');
    await setDoc(settingsRef, newSettings);
  };

  const resetCurrentMonth = async () => {
    if (!user) return;
    if (confirm("Are you sure? This will delete the salary and expenses for this specific month and reload your defaults.")) {
      const monthId = getMonthId(currentDate);
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'budgetData', monthId);
      await deleteDoc(docRef);
      setShowSettings(false);
    }
  };

  const updateSalary = (val) => {
    setSalary(val);
    saveData(val, expenses);
  };

  const addExpense = () => {
    if (!newExpenseName || !newExpenseAmount) return;
    const newExp = {
      id: Date.now().toString(),
      name: newExpenseName,
      amount: parseFloat(newExpenseAmount),
      type: 'variable'
    };
    const updatedExpenses = [...expenses, newExp];
    setExpenses(updatedExpenses);
    saveData(salary, updatedExpenses);
    setNewExpenseName('');
    setNewExpenseAmount('');
    setIsAddingExpense(false);
  };

  const updateExpenseAmount = (id, newAmount) => {
    const updatedExpenses = expenses.map(e => 
      e.id === id ? { ...e, amount: parseFloat(newAmount) || 0 } : e
    );
    setExpenses(updatedExpenses);
    saveData(salary, updatedExpenses);
    setEditingExpenseId(null);
  };

  const removeExpense = (id) => {
    const updatedExpenses = expenses.filter(e => e.id !== id);
    setExpenses(updatedExpenses);
    saveData(salary, updatedExpenses);
  };

  const changeMonth = (delta) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  // Calculations
  const totalExpenses = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const salaryNum = parseFloat(salary) || 0;
  const remainder = Math.max(0, salaryNum - totalExpenses);

  if (loading) return <div className="h-screen flex items-center justify-center text-emerald-600">Loading Planner...</div>;
  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-900 print:bg-white print:pb-0">
      
      {/* Print Styles */}
      <style>{`
        @media print {
          @page { margin: 15mm; size: A4; }
          body { -webkit-print-color-adjust: exact; background-color: white !important; }
        }
      `}</style>

      {showSettings && (
        <SettingsScreen 
          user={user} 
          currentSettings={userSettings} 
          onClose={() => setShowSettings(false)}
          onSaveSettings={saveSettings}
          onResetMonth={resetCurrentMonth}
        />
      )}

      {/* Modern Header - Compact & Dark */}
      <header className="bg-slate-900 text-white pt-6 pb-20 px-6 rounded-b-[2rem] shadow-xl relative print:bg-white print:text-black print:p-0 print:shadow-none print:mb-8 print:border-b-2 print:border-slate-800">
        <div className="max-w-2xl mx-auto flex justify-between items-center mb-4 print:mb-2">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-xl text-slate-900 print:hidden">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight print:text-4xl print:text-slate-900">
                <span className="print:hidden">Hello, </span>
                {userSettings.displayName || (user.displayName ? user.displayName.split(' ')[0] : 'Guest')}
                <span className="hidden print:inline">'s Budget</span>
              </h1>
              <p className="text-slate-400 text-xs font-medium print:text-slate-500">Wealth Planner</p>
            </div>
          </div>
          <div className="flex gap-2 print:hidden">
            <button onClick={handlePrint} className="bg-slate-800 p-2 rounded-xl hover:bg-slate-700 transition border border-slate-700/50" title="Print / Save PDF">
              <Printer className="w-5 h-5 text-slate-300" />
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

      {/* Main Content Area */}
      <div className="px-4 -mt-12 max-w-2xl mx-auto space-y-5 print:mt-0 print:px-0">
        
        {/* Month Selector - Floating Card style */}
        <div className="flex items-center justify-between bg-white p-2 rounded-2xl shadow-lg border border-slate-100 max-w-xs mx-auto mb-2 print:bg-white print:p-0 print:m-0 print:justify-start print:shadow-none print:border-none">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-xl transition print:hidden">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <span className="font-bold text-sm text-slate-800 uppercase tracking-wide print:text-left print:text-2xl print:text-slate-700 print:pl-0">
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-xl transition print:hidden">
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Salary Input Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 print:shadow-none print:border-slate-300 print:bg-slate-50">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 print:text-slate-600">Net Monthly Salary</label>
          <div className="relative">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-300 print:hidden">£</span>
            {/* Print Only Version */}
            <div className="hidden print:block text-4xl font-bold text-slate-900">
              {salary ? formatCurrency(parseFloat(salary)) : '£0.00'}
            </div>
            {/* Screen Only Version */}
            <input 
              type="number" 
              value={salary}
              onChange={(e) => updateSalary(e.target.value)}
              placeholder="0.00"
              className="w-full pl-6 text-4xl font-bold text-slate-800 placeholder-slate-200 outline-none bg-transparent py-1 print:hidden"
            />
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard 
            label="Total Expenses" 
            amount={totalExpenses} 
            icon={TrendingDown} 
            colorClass="bg-rose-50 text-rose-500"
          />
          <StatCard 
            label="Remainder" 
            amount={remainder} 
            icon={PieChart} 
            colorClass="bg-blue-50 text-blue-600"
            subText="Available for Goals"
          />
        </div>

        {/* Allocations Section - Dynamic based on Settings */}
        {salaryNum > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 print:break-inside-avoid">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-2 print:mt-4 print:mb-2 print:text-black">Financial Goals</h3>
            {userSettings.allocationRules.map(plan => (
              <AllocationCard 
                key={plan.id}
                title={plan.name} 
                amount={remainder * (plan.percentage / 100)} 
                percentage={plan.percentage} 
                color={plan.color || 'bg-slate-100 text-slate-700'}
              />
            ))}
          </div>
        )}

        {/* Expenses List */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none print:mt-6">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white print:bg-white print:px-0 print:border-b-2 print:border-slate-800">
            <h3 className="font-bold text-slate-800 print:text-black print:text-xl">Monthly Expenses</h3>
            <button 
              onClick={() => setIsAddingExpense(!isAddingExpense)}
              className="text-xs bg-slate-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-slate-800 transition flex items-center gap-2 print:hidden"
            >
              <Plus className="w-4 h-4" /> Add Bill
            </button>
          </div>

          {/* Add New Expense Form */}
          {isAddingExpense && (
            <div className="p-4 bg-slate-50 border-b border-slate-100 animate-in slide-in-from-top-2 print:hidden">
              <div className="flex gap-2 mb-2">
                <input 
                  type="text" 
                  placeholder="Bill Name (e.g. Netflix)" 
                  className="flex-1 p-3 rounded-xl border border-slate-200 text-sm"
                  value={newExpenseName}
                  onChange={(e) => setNewExpenseName(e.target.value)}
                />
                <input 
                  type="number" 
                  placeholder="£" 
                  className="w-24 p-3 rounded-xl border border-slate-200 text-sm"
                  value={newExpenseAmount}
                  onChange={(e) => setNewExpenseAmount(e.target.value)}
                />
              </div>
              <button 
                onClick={addExpense}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl text-sm font-semibold shadow-sm active:bg-slate-900"
              >
                Save Expense
              </button>
            </div>
          )}

          {/* List */}
          <div className="divide-y divide-slate-100 print:divide-slate-200">
            {expenses.map((expense) => (
              <div key={expense.id} className="p-4 flex justify-between items-center group hover:bg-slate-50 transition print:hover:bg-transparent print:px-0 print:py-2">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${expense.type === 'fixed' ? 'bg-slate-400' : 'bg-orange-400'} print:hidden`}></div>
                  <div>
                    <p className="font-medium text-slate-800 print:text-black">{expense.name}</p>
                    <p className="text-xs text-slate-400 capitalize print:hidden">{expense.type}</p>
                  </div>
                </div>
                
                {/* Editable Amount Section */}
                <div className="flex items-center gap-2">
                  {editingExpenseId === expense.id ? (
                    <div className="flex items-center gap-1 print:hidden">
                      <span className="text-slate-400 text-sm">£</span>
                      <input 
                        autoFocus
                        type="number"
                        defaultValue={expense.amount}
                        onBlur={(e) => updateExpenseAmount(expense.id, e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && updateExpenseAmount(expense.id, e.currentTarget.value)}
                        className="w-20 p-1 border rounded bg-white text-right font-bold text-slate-800"
                      />
                    </div>
                  ) : (
                    <button 
                      onClick={() => setEditingExpenseId(expense.id)}
                      className={`flex items-center gap-2 hover:bg-slate-50 px-2 py-1 rounded-lg transition ${expense.amount === 0 ? 'bg-orange-50 ring-1 ring-orange-200' : ''} print:hover:bg-transparent print:p-0 print:ring-0`}
                    >
                      {expense.amount === 0 ? (
                        <span className="text-orange-600 text-sm font-bold flex items-center gap-1 px-1 print:text-slate-400 print:italic">
                          Set Amount <Edit2 className="w-3 h-3 print:hidden" />
                        </span>
                      ) : (
                        <span className="font-bold text-slate-700 print:text-black">{formatCurrency(expense.amount)}</span>
                      )}
                      
                      {expense.amount > 0 && (
                        <Edit2 className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 print:hidden" />
                      )}
                    </button>
                  )}
                  
                  <button 
                    onClick={() => removeExpense(expense.id)}
                    className="text-slate-300 hover:text-red-500 transition p-2 ml-1 rounded-full hover:bg-red-50 print:hidden"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {expenses.length === 0 && (
              <div className="p-8 text-center text-slate-400 print:text-slate-500 print:italic">
                No expenses added for this month yet.
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-50 text-right print:bg-white print:border-t-2 print:border-slate-800 print:px-0">
             <span className="text-sm text-slate-500 mr-2 print:text-black">Total Outgoings:</span>
             <span className="font-bold text-slate-800 print:text-black">{formatCurrency(totalExpenses)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}