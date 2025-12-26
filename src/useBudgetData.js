// FILE: ./useBudgetData.js

import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase'; // Adjust path if needed

// Helper to get month ID (YYYY-MM)
const getMonthId = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const useBudgetData = (user, currentDate, appId = 'nuha-budget-app') => {
  // --- STATE ---
  const [isSandbox, setIsSandbox] = useState(false);
  
  // Real Data State
  const [realSalary, setRealSalary] = useState('');
  const [realExpenses, setRealExpenses] = useState([]);
  const [realActuals, setRealActuals] = useState({});

  // Sandbox Data State
  const [sandboxSalary, setSandboxSalary] = useState('');
  const [sandboxExpenses, setSandboxExpenses] = useState([]);
  const [sandboxActuals, setSandboxActuals] = useState({});

  // --- SYNC: Fetch Real Data from Firebase ---
  useEffect(() => {
    if (!user) return;
    const monthId = getMonthId(currentDate);
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'budgetData', monthId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRealSalary(data.salary || '');
        setRealExpenses(data.expenses || []);
        setRealActuals(data.actualSavings || {});
      } else {
        setRealSalary('');
        setRealExpenses([]);
        setRealActuals({});
      }
    });
    return () => unsubscribe();
  }, [user, currentDate, appId]);

  // --- ACTIONS ---

  // 1. Toggle Sandbox Mode
  const toggleSandbox = () => {
    if (!isSandbox) {
      // ENTERING: Copy Real -> Sandbox
      setSandboxSalary(realSalary);
      setSandboxExpenses([...realExpenses]);
      setSandboxActuals({ ...realActuals });
      setIsSandbox(true);
    } else {
      // EXITING: Just switch flag
      setIsSandbox(false);
    }
  };

  // Internal Helper: Save to Firebase
  const saveToFirebase = async (updates) => {
    if (!user) return;
    const monthId = getMonthId(currentDate);
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'budgetData', monthId);
    
    await setDoc(docRef, {
        salary: updates.salary !== undefined ? updates.salary : realSalary,
        expenses: updates.expenses !== undefined ? updates.expenses : realExpenses,
        actualSavings: updates.actuals !== undefined ? updates.actuals : realActuals,
        lastUpdated: new Date()
    }, { merge: true });
  };

  // 2. Update Salary
  const updateSalary = (val) => {
    if (isSandbox) {
      setSandboxSalary(val);
    } else {
      setRealSalary(val);
      saveToFirebase({ salary: val });
    }
  };

  // 3. Add Expense
  const addExpense = (newExpense) => {
    if (isSandbox) {
      setSandboxExpenses(prev => [...prev, newExpense]);
    } else {
      const updated = [...realExpenses, newExpense];
      setRealExpenses(updated);
      saveToFirebase({ expenses: updated });
    }
  };

  // 4. Update Expense (Amount/Name)
  const updateExpense = (id, updates) => {
    // updates is object like { amount: 500 } or { name: 'Rent' }
    if (isSandbox) {
      setSandboxExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    } else {
      const updated = realExpenses.map(e => e.id === id ? { ...e, ...updates } : e);
      setRealExpenses(updated);
      saveToFirebase({ expenses: updated });
    }
  };

  // 5. Remove Expense
  const removeExpense = (id) => {
    if (isSandbox) {
      setSandboxExpenses(prev => prev.filter(e => e.id !== id));
    } else {
      const updated = realExpenses.filter(e => e.id !== id);
      setRealExpenses(updated);
      saveToFirebase({ expenses: updated });
    }
  };

  // 6. Update Actual Savings
  const updateActuals = (planId, val) => {
    if (isSandbox) {
      setSandboxActuals(prev => ({ ...prev, [planId]: val }));
    } else {
      const updated = { ...realActuals, [planId]: val };
      setRealActuals(updated);
      saveToFirebase({ actuals: updated });
    }
  };

  // --- RETURN ---
  return {
    salary: isSandbox ? sandboxSalary : realSalary,
    expenses: isSandbox ? sandboxExpenses : realExpenses,
    actualSavings: isSandbox ? sandboxActuals : realActuals,
    isSandbox,
    toggleSandbox,
    updateSalary,
    addExpense,
    updateExpense,
    removeExpense,
    updateActuals
  };
};