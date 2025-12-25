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
  browserSessionPersistence
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


// --- JUICE ENHANCEMENTS START ---

const juiceStyles = `
  /* 1. HEARTBEAT ANIMATIONS */
  @keyframes throb-red {
    0% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.4); transform: scale(1); }
    70% { box-shadow: 0 0 0 10px rgba(244, 63, 94, 0); transform: scale(1.02); }
    100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); transform: scale(1); }
  }
  @keyframes breathe-green {
    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.3); }
    50% { box-shadow: 0 0 20px 0 rgba(16, 185, 129, 0.4); border-color: rgba(16, 185, 129, 0.6); }
    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.3); }
  }
  .animate-throb { animation: throb-red 1s infinite; }
  .animate-breathe { animation: breathe-green 3s infinite ease-in-out; }

  /* 2. CONFETTI PARTICLES */
  @keyframes confetti-fall {
    0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(60px) rotate(720deg); opacity: 0; }
  }
  .confetti-piece {
    position: absolute;
    top: -20px;
    width: 8px;
    height: 8px;
    animation: confetti-fall 2.5s ease-out forwards;
    z-index: 0;
  }

  /* 3. VACUUM LIST ANIMATIONS */
  .vacuum-item {
    transition: all 400ms cubic-bezier(0.25, 0.8, 0.25, 1);
    max-height: 200px; /* Adjust if your items are huge */
    opacity: 1;
    transform: translate(0, 0);
    overflow: hidden;
  }
  
  .vacuum-out {
    opacity: 0;
    max-height: 0 !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    transform: translateX(-100px);
    border: none !important;
  }
`;

// HELPER 1: ROLLING NUMBER
const RollingNumber = ({ value, currency = 'GBP', decimals = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let start = displayValue;
    let end = parseFloat(value) || 0;
    if (start === end) return;

    let duration = 800;
    let startTime = null;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const ease = 1 - Math.pow(1 - progress, 4);
      
      const current = start + (end - start) * ease;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [value]);

  return formatCurrency(displayValue, currency, decimals);
};

// HELPER 2: TILT CARD
const TiltCard = ({ children, className }) => {
  const [transform, setTransform] = useState('');
  const [glare, setGlare] = useState('');

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -3; 
    const rotateY = ((x - centerX) / centerX) * 3;

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    setGlare(`radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.2), transparent 40%)`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setGlare('none');
  };

  return (
    <div 
      className={`relative transition-transform duration-200 ease-out ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform, transformStyle: 'preserve-3d' }}
    >
      <div 
        className="absolute inset-0 rounded-[inherit] pointer-events-none z-20 mix-blend-overlay"
        style={{ background: glare }}
      />
      {children}
    </div>
  );
};

// HELPER 3: CONFETTI EXPLOSION
const ConfettiExplosion = () => {
  const particles = Array.from({ length: 30 });
  const colors = ['#10b981', '#fbbf24', '#6366f1', '#f43f5e'];
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[inherit]">
      {particles.map((_, i) => (
        <div 
          key={i} 
          className="confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${1.5 + Math.random()}s`
          }} 
        />
      ))}
    </div>
  );
};

// HELPER 4: VACUUM LIST ITEM
const VacuumItem = ({ children, onRemove, className = '' }) => {
  const [isExiting, setIsExiting] = useState(false);

  const triggerExit = (e) => {
    // Stop click from bubbling up
    if (e) e.stopPropagation();
    playJuiceSound('delete')
    
    // Start animation
    setIsExiting(true);
    
    // Wait for animation (400ms) then actually delete
    setTimeout(() => {
      onRemove();
    }, 400); 
  };

  return (
    <div className={`vacuum-item ${isExiting ? 'vacuum-out' : ''} ${className}`}>
      {/* We pass the triggerExit function to the child component */}
      {typeof children === 'function' ? children(triggerExit) : children}
    </div>
  );
};

// HELPER 6: SPRING DRAWER (Mobile Bottom Sheet)
const SpringDrawer = ({ isOpen, onClose, children, title }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [offsetY, setOffsetY] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Handle entry animation
  useEffect(() => {
    if (isOpen) {
        setIsVisible(true);
        setOffsetY(0); // Reset position
    } else {
        setTimeout(() => setIsVisible(false), 300); // Wait for exit anim
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  // PHYSICS HANDLERS
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - startY;
    
    // Only allow dragging DOWN (positive delta)
    if (delta > 0) {
        e.preventDefault(); // Stop scrolling body
        setOffsetY(delta);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // If dragged down more than 120px, close it. Otherwise spring back.
    if (offsetY > 120) {
        onClose();
    } else {
        setOffsetY(0);
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:justify-center`}>
       {/* BACKDROP (Fades in/out) */}
       <div 
         className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
         onClick={onClose}
       />

       {/* DRAWER PANEL */}
       <div 
         className={`
            relative w-full max-w-sm bg-white shadow-2xl overflow-hidden
            sm:rounded-3xl sm:m-4 sm:translate-y-0 
            rounded-t-[2.5rem] 
            transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
         `}
         style={{ 
            // If dragging, follow finger exactly. If released, animate.
            transform: isDragging ? `translateY(${offsetY}px)` : `translateY(${isOpen ? '0%' : '100%'})`,
            transition: isDragging ? 'none' : 'transform 400ms cubic-bezier(0.32, 0.72, 0, 1)'
         }}
       >
          {/* DRAG HANDLE (Mobile Only) */}
          <div 
            className="w-full h-8 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none sm:hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
             <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
          </div>

          {/* CONTENT */}
          <div className="max-h-[85vh] overflow-y-auto no-scrollbar">
             {children}
          </div>
       </div>
    </div>
  );
};

// HELPER 5: MORPH BUTTON (The Success Morph)
const MorphButton = ({ children, onClick, className = '', ...props }) => {
  const [status, setStatus] = useState('idle'); // idle, loading, success

  const handleClick = async (e) => {
     if (status !== 'idle') return;
     
     // 1. Start Loading
     setStatus('loading');
     
     // 2. Artificial wait
     await new Promise(r => setTimeout(r, 600));
     
     // 3. Show Success
     setStatus('success');
     playJuiceSound('success)');
     if (window.navigator.vibrate) window.navigator.vibrate([50, 50, 50]);

     // 4. Wait, then fire action
     setTimeout(() => {
        onClick(e); 
        setTimeout(() => setStatus('idle'), 500);
     }, 700);
  };

  return (
    <button 
       onClick={handleClick}
       disabled={status !== 'idle'}
       className={`relative transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] flex items-center justify-center overflow-hidden shadow-xl ${status === 'idle' ? className : 'w-14 rounded-full bg-emerald-500 text-white border-transparent'}`}
       style={{ minHeight: '56px' }} 
       {...props}
    >
       {/* Original Button Text */}
       <div className={`absolute w-full transition-all duration-300 transform ${status === 'idle' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-50'}`}>
          {children}
       </div>

       {/* Loading Spinner */}
       <div className={`absolute transition-all duration-300 transform ${status === 'loading' ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
       </div>

       {/* Success Checkmark */}
       <div className={`absolute transition-all duration-300 delay-100 transform ${status === 'success' ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
          <Check className="w-6 h-6 stroke-[4] text-white" />
       </div>
    </button>
  );
};

// HELPER 7: AUDIO JUICE ENGINE
const playJuiceSound = (type) => {
  const sounds = {
    // A satisfying mechanical keyboard "thock" for clicks
    click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
    // A pleasant "ding" for success
    success: 'https://assets.mixkit.co/active_storage/sfx/1114/1114-preview.mp3',
    // A quick "paper crumple" for delete
    delete: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
    // A crisp switch sound for toggles
    toggle: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'
  };

  const audio = new Audio(sounds[type]);
  audio.volume = 0.5; // Keep it subtle, not loud
  
  // Play and catch errors (e.g. if user hasn't interacted with page yet)
  audio.play().catch(e => console.log('Audio play blocked:', e));
};

// HELPER 8: SPOTLIGHT CARD
const SpotlightCard = ({ children, className = "", spotlightColor = "rgba(16, 185, 129, 0.25)" }) => {
  const divRef = React.useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm ${className}`}
    >
      {/* The Moving Spotlight Glow */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
        }}
      />
      {/* Content */}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};
// --- JUICE ENHANCEMENTS END ---

// --- FIREBASE CONFIGURATION AREA ---
const YOUR_FIREBASE_KEYS = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
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

// --- NEW HELPER: PAYDAY LOGIC ---
const calculatePaydayLogic = (payDayStr, salaryInputted) => {
  const today = new Date();
  // Reset time to midnight to ensure clean day calculations
  today.setHours(0,0,0,0);
  
  const currentDay = today.getDate();
  const payDay = parseInt(payDayStr) || 1; 
  
  // Start with Payday of THIS month
  let targetDate = new Date(today.getFullYear(), today.getMonth(), payDay);
  targetDate.setHours(0,0,0,0);

  const hasSalary = salaryInputted && parseFloat(salaryInputted) > 0;

  // LOGIC:
  // If Today >= Payday: We passed it. Next one is Next Month.
  // If Today < Payday AND We have Salary: We are currently IN the cycle, so the money needs to last until the NEXT NEXT Payday.
  
  if (currentDay >= payDay) {
     targetDate.setMonth(targetDate.getMonth() + 1);
  } else if (hasSalary) {
     targetDate.setMonth(targetDate.getMonth() + 1);
  }
  
  const diffTime = targetDate - today;
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return { days, targetDate };
};

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

// 1. Currency Formatter for Inputs
const formatNumberWithCommas = (value) => {
  if (!value) return '';
  // Remove existing commas to get raw number
  const rawValue = value.toString().replace(/,/g, '');
  // formatting
  return rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// 2. Spring Animation Styles (Add this to your existing auroraStyles string or create a new one)
const springStyles = `
  @keyframes spring-popup {
    0% { transform: scale(0.9); opacity: 0; }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); opacity: 1; }
  }
  .animate-spring {
    animation: spring-popup 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }
  /* Active Scale Class for Buttons */
  .btn-press {
    transition: transform 0.1s;
  }
  .btn-press:active {
    transform: scale(0.95);
  }
`;




// --- UPDATED PRINT HELPER (Auto-Landscape & Virtual Paper) ---
const handlePrint = (elementId, title, isLandscape = false) => {
  const content = document.getElementById(elementId);
  if (!content) return;

  // Clone to protect original DOM
  const contentClone = content.cloneNode(true);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
        
        /* 1. SCREEN PREVIEW (The "Virtual Paper" Look) */
        body { 
          font-family: 'Inter', sans-serif; 
          background-color: #f3f4f6; /* Slate-100 background */
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 40px;
          min-height: 100vh;
        }
        
        .paper-sheet {
          background: white;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          /* Enforce dimensions based on orientation */
          width: ${isLandscape ? '297mm' : '210mm'};
          min-height: ${isLandscape ? '210mm' : '297mm'};
          padding: 0; 
          box-sizing: border-box;
          margin: 0 auto;
        }

        /* 2. PRINT DIALOG CONFIGURATION */
        @page { 
          /* This forces the printer to Landscape mode automatically */
          size: ${isLandscape ? 'landscape' : 'portrait'}; 
          margin: 0; 
        }
        
        @media print { 
          body { 
            background: none; 
            padding: 0; 
            display: block; 
          }
          .paper-sheet {
            box-shadow: none;
            width: 100%;
            height: auto;
            margin: 0;
          }
          .no-print { display: none !important; }
          /* Ensure colors print correctly */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      </style>
    </head>
    <body>
      <div class="paper-sheet">
        ${contentClone.innerHTML}
      </div>
      <script>
        // Wait 500ms for Tailwind CDN to load styles, then trigger print
        window.onload = () => { setTimeout(() => { window.print(); }, 500); };
      </script>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};

const formatCurrency = (amount, currency = 'GBP', decimals = 0) => {
  const localeMap = { 'GBP': 'en-GB', 'USD': 'en-US', 'EUR': 'de-DE' };
  return new Intl.NumberFormat(localeMap[currency] || 'en-GB', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
};

const getMonthId = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

// --- UPGRADED HAPTIC + AUDIO FUNCTION ---
const triggerHaptic = () => {
  // 1. Play the "Thock" sound
  playJuiceSound('click');

  // 2. Vibrate the phone
  if (window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(10);
  }
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

// --- ANALYTICS DASHBOARD (FIXED WITH SMART MATCHING) ---
const AnalyticsDashboard = ({ user, onClose, currency, allocationRules }) => {
  const [history, setHistory] = useState([]);
  const [timeRange, setTimeRange] = useState('6M'); // 3M, 6M, 12M, ALL
  const [loading, setLoading] = useState(true);
  const [selectedPot, setSelectedPot] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      // Guard: If we don't have rules yet, wait.
      if (!allocationRules || allocationRules.length === 0) return;

      try {
        const colRef = collection(db, 'artifacts', appId, 'users', user.uid, 'budgetData');
        const snapshot = await getDocs(colRef);
        let rawData = [];
        
        snapshot.forEach(doc => {
          const val = doc.data();
          const salary = parseFloat(val.salary) || 0;
          const expensesTotal = (val.expenses || []).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
          const remainder = Math.max(0, salary - expensesTotal);
          const actuals = val.actualSavings || {};
          
          // --- SMART MAPPING LOGIC ---
          // 1. Create a map of Name -> ID from this specific month's saved rules
          // This allows us to link data even if Pot IDs have changed over time.
          const monthRules = val.allocationRules || [];
          const nameToIdMap = {};
          monthRules.forEach(r => {
             if (r.name && r.id) nameToIdMap[r.name.toLowerCase().trim()] = r.id;
          });

          // 2. Calculate target vs actual for each CURRENT pot
          const potData = {};
          allocationRules.forEach(rule => {
             let actualVal = 0;
             
             // Try A: Direct ID Match (Best)
             if (actuals[rule.id] !== undefined) {
                actualVal = parseFloat(actuals[rule.id]);
             } 
             // Try B: Name Match (Fallback)
             else {
                const historicalId = nameToIdMap[rule.name.toLowerCase().trim()];
                if (historicalId && actuals[historicalId] !== undefined) {
                   actualVal = parseFloat(actuals[historicalId]);
                }
             }
             
             potData[rule.id] = {
                 target: remainder * (rule.percentage / 100),
                 actual: actualVal || 0
             };
          });

          // Only push if there is some meaningful data
          if (salary > 0 || Object.keys(potData).length > 0) {
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
        console.error("Analytics Error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, allocationRules]); // Recalculate when rules change

  // Filter Data based on Time Range
  const filteredData = useMemo(() => {
    if (timeRange === 'ALL') return history;
    const months = parseInt(timeRange.replace('M', ''));
    return history.slice(-months);
  }, [history, timeRange]);

  // 1. Pot-Specific Projections
  const potProjections = useMemo(() => {
    const projections = {};
    if (filteredData.length === 0) return {};

    allocationRules.forEach(rule => {
      const totalActualForPot = filteredData.reduce((sum, m) => {
        const val = m.pots[rule.id]?.actual || 0;
        return sum + val;
      }, 0);
      
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
  
  // 2. Variance Calculations
  const getVariance = (key) => {
      if (filteredData.length < 2) return null;
      const current = filteredData[filteredData.length - 1][key];
      const previous = filteredData[filteredData.length - 2][key];
      if (previous === 0) return null;
      return ((current - previous) / previous) * 100;
  };
  
  const incomeVar = getVariance('salary');
  const expenseVar = getVariance('expenses');

  if (loading) return <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center font-bold text-slate-500">Loading Analytics...</div>;

  return (
    <div className="fixed inset-0 bg-slate-50 z-[60] overflow-y-auto animate-in fade-in slide-in-from-bottom-8">
      
      {/* Header */}
      <div className="bg-white p-4 sticky top-0 z-20 shadow-sm flex justify-between items-center">
        <h2 className="font-bold text-lg flex items-center gap-2 text-slate-800">
          <BarChart3 className="w-5 h-5 text-emerald-500" /> Analytics
        </h2>
        
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
        
        {filteredData.length === 0 ? (
           <div className="text-center py-20 text-slate-400">
             <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-20" />
             <p className="font-bold">No data found</p>
             <p className="text-xs mt-2">Make sure you have saved at least one month of data.</p>
           </div>
        ) : (
          <>
            {/* PROJECTION CARDS */}
            <div className="mb-6">
               <h3 className="text-sm font-bold text-slate-800 mb-3 px-2 flex items-center gap-2">
                 <TrendingUp className="w-4 h-4 text-emerald-500" /> Future Projections
               </h3>
               <div className="flex gap-4 overflow-x-auto pb-4 px-2 -mx-2 no-scrollbar snap-x">
                 {allocationRules.map(rule => {
                    const proj = potProjections[rule.id] || { avg: 0, sixMonths: 0, oneYear: 0, fiveYears: 0 };
                    
                    let colorHex = '#64748b'; 
                    if (rule.hex) colorHex = rule.hex; 

                    return (
                       <div key={rule.id} className="min-w-[280px] bg-slate-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden snap-center flex-shrink-0 border border-slate-800">
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
                    {expenseVar !== null && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${expenseVar <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
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
                    const potHistory = filteredData.map(d => ({ 
                        label: d.label, 
                        value: d.pots[rule.id]?.actual || 0 
                    }));
                    const totalSaved = potHistory.reduce((sum, x) => sum + x.value, 0);
                    
                    let color = rule.hex || '#64748b';

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
                       colors={['bg-slate-300', selectedPot.colorCode]} 
                    />
                 </div>
                 <div className="flex justify-center gap-6 mt-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                       <div className="w-3 h-3 bg-slate-300 rounded-sm"></div> Target
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                       <div className={`w-3 h-3 rounded-sm`} style={{ backgroundColor: selectedPot.colorCode }}></div> Actual
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

// --- ADD EXPENSE MODAL (SMART: Drawer on Mobile, Modal on Desktop) ---
const AddExpenseModal = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [logo, setLogo] = useState(null); 

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
        setName('');
        setAmount('');
        setLogo(null);
    }
  }, [isOpen]);

  // Handle Form Logic
  const handleFormSubmit = (e) => { e.preventDefault(); };
  
  const content = (
    <div className="bg-white">
        {/* Header (Hidden on mobile usually, but good for context) */}
        <div className="px-6 pb-2 pt-2 sm:pt-6 sm:border-b sm:border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800">New Expense</h3>
          {/* Close button only for desktop/modal view */}
          <button onClick={onClose} className="hidden sm:block p-2 hover:bg-slate-200 rounded-full transition">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        {/* Form Inputs */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-5 pb-2">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bill Name</label>
            <div id="input-expense-name">
              <BrandSearchInput 
                autoFocus={false} // False on mobile to prevent keyboard jumping immediately
                placeholder="e.g. Netflix, Tesco..." 
                className="w-full p-4 rounded-2xl bg-slate-50 border-none text-xl font-medium text-slate-800 placeholder-slate-300 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all focus:bg-white"
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
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Monthly Cost</label>
            <div className="relative" id="input-expense-amount">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">£</span>
              <input 
                type="text" 
                inputMode="decimal" // Better keyboard on mobile
                placeholder="0.00" 
                className="w-full pl-10 p-4 rounded-2xl bg-slate-50 border-none text-2xl font-bold text-slate-800 placeholder-slate-300 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all focus:bg-white"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
        </form>

        {/* JUICE FOOTER */}
        <div className="p-6 pt-4 border-t border-slate-50 bg-white sm:bg-slate-50 flex gap-3 pb-8 sm:pb-6">
             <button 
               onClick={onClose}
               className="flex-1 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition"
             >
               Cancel
             </button>
             
             <MorphButton 
               disabled={!name || !amount} 
               onClick={() => {
                  onSave(name, safeCalculate(amount), logo);
               }}
               className={`flex-[2] py-4 rounded-xl font-bold text-white shadow-lg transition-all ${(!name || !amount) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 hover:shadow-2xl'}`}
             >
               Save Bill
             </MorphButton>
        </div>
    </div>
  );

  return (
      <SpringDrawer isOpen={isOpen} onClose={onClose}>
          {content}
      </SpringDrawer>
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
  const [isFocused, setIsFocused] = useState(false); // NEW: Track focus to prevent "spazzing"
  
  // Use the keys provided
  const SECRET_KEY = import.meta.env.VITE_LOGO_DEV_SECRET_KEY;
  const PUBLIC_KEY = import.meta.env.VITE_LOGO_DEV_PUBLIC_KEY;

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
        setResults(data.slice(0, 5)); 
        // FIXED: Removed setShowDropdown(true) here. 
        // We rely on isFocused now, so it won't pop up randomly while you're editing the amount.
      } catch (e) {
        console.error("Logo search failed", e);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [value]);

  // NEW: Handle Enter Key to auto-select the best match (Fixes Bug 1)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // 1. Try to select the first API result
      if (results.length > 0) {
         const brand = results[0];
         const logoUrl = `https://img.logo.dev/${brand.domain}?token=${PUBLIC_KEY}`;
         onSelectBrand(brand.name, logoUrl);
      } 
      // 2. Fallback to manual entry if no results but text exists
      else if (value.length > 0) {
         onSelectBrand(value, null);
      }
      // Close dropdown by blurring (or relying on parent state updates)
      e.currentTarget.blur();
    }
  };

  return (
    <div className="relative">
      <input 
        autoFocus={autoFocus}
        type="text" 
        placeholder={placeholder} 
        className={className}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Delay to allow clicks
        onKeyDown={handleKeyDown}
      />
      
      {/* FIXED: Only show if user is FOCUSED on this input. Prevents blocking other buttons. */}
      {isFocused && value.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-xl rounded-xl border border-slate-100 mt-1 z-50 overflow-hidden max-h-60 overflow-y-auto">
          
          {/* Add Manually Option */}
          <button
            className="w-full text-left p-3 hover:bg-emerald-50 flex items-center gap-3 transition border-b border-slate-50 group"
            onClick={() => {
              onSelectBrand(value, null);
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

          {/* API Results */}
          {results.map((brand, i) => (
            <button
              key={i}
              className="w-full text-left p-3 hover:bg-slate-50 flex items-center gap-3 transition border-b border-slate-50 last:border-0"
              onClick={() => {
                const logoUrl = `https://img.logo.dev/${brand.domain}?token=${PUBLIC_KEY}`;
                onSelectBrand(brand.name, logoUrl);
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
const BudgetWheel = ({ salary, expenses, allocations, currency, onSliceClick, activeSlice, bankColor }) => {
  if (!salary || parseFloat(salary) <= 0) return null;

  // NEW: State for Hover Effects
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const salaryNum = parseFloat(salary);
  const totalExpenses = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const expensesPercent = Math.min(100, (totalExpenses / salaryNum) * 100);
  const remainderPercentOfTotal = 100 - expensesPercent;

  // ... (Keep existing segment calculation logic) ...
  let currentDegree = 0;
  const segments = [];
  const crossPattern = "repeating-linear-gradient(45deg, #e2e8f0 0, #e2e8f0 1px, transparent 0, transparent 6px), repeating-linear-gradient(-45deg, #e2e8f0 0, #e2e8f0 1px, transparent 0, transparent 6px)";

  const addSegment = (id, percent, color) => {
    const degrees = (percent / 100) * 360;
    // Highlight logic: if hovering, dim others. If active, hide others.
    let segmentColor = color;
    if (activeSlice && activeSlice !== id) segmentColor = 'transparent';
    else if (hoveredSlice && hoveredSlice !== id && !activeSlice) segmentColor = `${color}80`; // Dim colors not hovered
    
    segments.push(`${segmentColor} ${currentDegree}deg ${currentDegree + degrees}deg`);
    currentDegree += degrees;
  };

  // 1. Expenses Slice
  addSegment('expenses', expensesPercent, '#ef4444'); 
  
  // 2. Pot Slices
  allocations.forEach(plan => {
    const planPercentOfTotal = (plan.percentage / 100) * remainderPercentOfTotal;
    addSegment(plan.id, planPercentOfTotal, plan.hex || '#10b981');
  });
  
  // 3. Remainder Slice
  const remainderColor = bankColor || '#64748b';
  if (currentDegree < 360) {
      const isCurrentAccountActive = activeSlice === 'current_account';
      const isCurrentAccountHovered = hoveredSlice === 'current_account';
      
      let color = remainderColor;
      if (activeSlice && !isCurrentAccountActive) color = 'transparent';
      else if (hoveredSlice && !isCurrentAccountHovered && !activeSlice) color = `${remainderColor}80`;

      segments.push(`${color} ${currentDegree}deg 360deg`);
  }
  
  const conic = `conic-gradient(${segments.join(', ')})`;
  const finalBackground = activeSlice ? `${conic}, ${crossPattern}` : conic;

  // --- DYNAMIC LABEL LOGIC ---
  // Priority: Hovered > Active > Default
  const targetSlice = hoveredSlice || activeSlice;
  
  let centerLabel = "Net Salary";
  let centerAmount = formatCurrency(salaryNum, currency);
  
  if (targetSlice === 'expenses') {
      centerLabel = "Total Expenses";
      centerAmount = formatCurrency(totalExpenses, currency);
  } else if (targetSlice === 'current_account') {
      centerLabel = "Current Account";
      const remainder = salaryNum - totalExpenses;
      const allocatedAmount = allocations.reduce((sum, p) => sum + (remainder * (p.percentage / 100)), 0);
      centerAmount = formatCurrency(remainder - allocatedAmount, currency);
  } else if (targetSlice) {
      const plan = allocations.find(p => p.id === targetSlice);
      if (plan) {
          centerLabel = plan.name;
          const remainder = salaryNum - totalExpenses;
          const amount = remainder * (plan.percentage / 100);
          centerAmount = formatCurrency(amount, currency);
      }
  }

  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden h-full">
      <div className="flex justify-between w-full mb-6">
         <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Where your money goes</h3>
         {(activeSlice || hoveredSlice) && (
             <button onClick={() => onSliceClick(null)} className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 font-bold hover:bg-slate-200">
                 {activeSlice ? 'Reset View' : 'Peek View'}
             </button>
         )}
      </div>
      
      {/* WHEEL INTERACTION AREA */}
      <div className="relative w-56 h-56 transition-transform duration-500 hover:scale-105">
        <div className="w-full h-full rounded-full transition-all duration-300 ease-out shadow-inner" style={{ background: finalBackground }}></div>
        
        {/* CENTER TEXT */}
        <div className="absolute inset-2 bg-white rounded-full flex flex-col items-center justify-center shadow-lg">
           <div className="text-center animate-in fade-in zoom-in duration-200 key={targetSlice}">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wide block mb-1">{centerLabel}</span>
              <span className="text-2xl font-black text-slate-800 tracking-tight">{centerAmount}</span>
           </div>
        </div>
      </div>
      
      {/* LEGEND BUTTONS (Update onMouseEnter to set hover) */}
      <div className="flex flex-wrap justify-center gap-2 mt-8 w-full">
        <button 
            onMouseEnter={() => setHoveredSlice('expenses')}
            onMouseLeave={() => setHoveredSlice(null)}
            onClick={() => onSliceClick(activeSlice === 'expenses' ? null : 'expenses')}
            className={`btn-press flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200
                ${activeSlice === 'expenses' 
                    ? 'bg-rose-50 border-rose-200 ring-2 ring-rose-100 scale-105 shadow-sm' 
                    : activeSlice ? 'opacity-40 grayscale border-transparent' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
        >
          <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
          <span className={`text-xs font-bold ${activeSlice === 'expenses' ? 'text-rose-700' : 'text-slate-600'}`}>Expenses</span>
        </button>

        <button 
            onMouseEnter={() => setHoveredSlice('current_account')}
            onMouseLeave={() => setHoveredSlice(null)}
            onClick={() => onSliceClick(activeSlice === 'current_account' ? null : 'current_account')}
            className={`btn-press flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200
                ${activeSlice === 'current_account' 
                    ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-200 scale-105 shadow-sm' 
                    : activeSlice ? 'opacity-40 grayscale border-transparent' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
        >
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: remainderColor }}></div>
          <span className={`text-xs font-bold ${activeSlice === 'current_account' ? 'text-slate-800' : 'text-slate-600'}`}>Current Account</span>
        </button>

        {allocations.map(plan => (
            <button 
                key={plan.id}
                onMouseEnter={() => setHoveredSlice(plan.id)}
                onMouseLeave={() => setHoveredSlice(null)}
                onClick={() => onSliceClick(activeSlice === plan.id ? null : plan.id)}
                className={`btn-press flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200
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

const LoginScreen = ({ onLogin, isLoggingIn }) => {
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
            disabled={isLoggingIn} // Disable clicks
            className={`w-full bg-white hover:bg-emerald-50 text-slate-900 p-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 group/btn ${isLoggingIn ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] active:scale-[0.98]'}`}
          >
            {isLoggingIn ? (
               // Loading State
               <>
                 <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                 Signing in...
               </>
            ) : (
               // Normal State
               <>
                 <div className="bg-slate-50 p-1.5 rounded-full border border-slate-200 group-hover/btn:scale-110 transition">
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                 </div>
                 Sign in with Google
               </>
            )}
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
  const progressPercent = Math.min(100, Math.max(0, (actualNum / targetAmount) * 100));
  const [showHelp, setShowHelp] = useState(false);
  
  // JUICE: Confetti Trigger
  const isComplete = progressPercent >= 100 && targetAmount > 0;
  
  const activeColor = hexColor || '#10b981';

  return (
    <div
      className="bg-white p-5 rounded-[1.5rem] border border-slate-100 transition-all duration-300 group relative overflow-hidden btn-press"
      style={{
        boxShadow: `0 10px 15px -3px ${activeColor}20, 0 4px 6px -2px ${activeColor}10`
      }}
    >
      {/* JUICE: Confetti restricted to card */}
      {isComplete && <ConfettiExplosion />}
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
            style={{ backgroundColor: `${activeColor}20`, color: activeColor }}
          >
            {isComplete ? <Check className="w-5 h-5 animate-bounce" /> : <Target className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm leading-tight">{title}</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{percentage}% Pot</p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-slate-800 text-lg leading-tight">
             <RollingNumber value={actualNum} currency={currency} />
          </div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-1">
            Target: {formatCurrency(targetAmount, currency)}
          </div>
        </div>
      </div>

      {/* Progress Bar Background */}
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden mb-4 relative z-10">
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-out relative"
          style={{ width: `${progressPercent}%`, backgroundColor: activeColor }}
        >
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50"></div>
        </div>
      </div>

      {/* Input Row */}
      <div className="relative z-10">
        {showHelp && (
            <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowHelp(false)}></div>
        )}

        <div className="relative flex items-center gap-1.5 mb-1.5 ml-1 w-fit">
           <label className="block text-[10px] font-bold text-slate-400 uppercase">Actual Money Deposited</label>
           <button 
             onClick={() => setShowHelp(!showHelp)}
             className="focus:outline-none transition hover:scale-110 active:scale-95"
           >
             <HelpCircle className="w-3 h-3 text-slate-500" />
           </button>
           
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
              placeholder="0"
              value={actualAmount}
              onChange={(e) => onUpdateActual(e.target.value)}
              className="w-full pl-7 pr-3 py-3 bg-white border-2 border-slate-100 rounded-xl text-base font-bold text-slate-800 outline-none focus:border-transparent focus:ring-4 transition shadow-sm placeholder:text-slate-300 placeholder:font-normal"
              style={{ '--tw-ring-color': `${activeColor}30` }} 
            />
          </div>
          
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

const MonthReportView = ({ date, salary, expenses, allocations, actuals, onClose, currency, bankDetails }) => {
  const totalExpenses = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const salaryNum = parseFloat(salary) || 0;
  const remainder = Math.max(0, salaryNum - totalExpenses);

  const allocatedAmount = allocations.reduce((sum, p) => sum + (remainder * (p.percentage / 100)), 0);
  const currentAccountTarget = Math.max(0, remainder - allocatedAmount);
  const totalPotActuals = Object.values(actuals || {}).reduce((s,v)=>s+(parseFloat(v)||0),0);
  const currentAccountActual = Math.max(0, remainder - totalPotActuals);

  return (
    <div className="fixed inset-0 bg-slate-100 z-[70] overflow-y-auto animate-in fade-in duration-300">
      {/* HEADER BAR */}
      <div className="bg-slate-900 text-white p-4 sticky top-0 z-50 flex justify-between items-center shadow-lg print:hidden">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg"><FileText className="w-5 h-5 text-emerald-400" /></div>
            <div>
                <h2 className="font-bold text-sm hidden sm:block">Statement Preview</h2>
                <p className="text-xs text-slate-400">{MONTH_NAMES[date.getMonth()]} {date.getFullYear()}</p>
            </div>
        </div>
        <div className="flex gap-2">
          {/* Print Button - Portrait Mode */}
          <button 
            onClick={() => handlePrint('month-report-content', `Statement - ${MONTH_NAMES[date.getMonth()]}`, false)} 
            className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-xs hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
          >
            <Printer className="w-4 h-4" /> <span className="hidden sm:inline">Print / Save PDF</span>
          </button>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex justify-center p-4">
        {/* REPORT CONTENT WRAPPER */}
        {/* We use padding here (p-10) which simulates the paper margin in the Blob view */}
        <div id="month-report-content" className="w-full max-w-[210mm] bg-white shadow-2xl rounded-xl p-10 md:p-12 text-slate-900">
          
          {/* 1. COMPACT HEADER */}
          <div className="flex justify-between items-center border-b-2 border-slate-900 pb-6 mb-8">
              <div className="flex gap-4 items-center">
                 <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
                    <Wallet className="w-6 h-6" />
                 </div>
                 <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Budget Statement</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">
                      {FULL_MONTH_NAMES[date.getMonth()]} {date.getFullYear()}
                    </p>
                 </div>
              </div>
              
              {bankDetails && (
                  <div className="text-right flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Primary Account</div>
                        <div className="text-sm font-bold text-slate-800 leading-none">{bankDetails.name}</div>
                      </div>
                      {bankDetails.logo && <img src={bankDetails.logo} className="w-8 h-8 object-contain rounded-full bg-white border border-slate-100 p-0.5" />}
                  </div>
              )}
          </div>

          {/* 2. SUMMARY STRIP */}
          <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Net Income</p>
                 <p className="text-xl font-black text-slate-800">{formatCurrency(salaryNum, currency)}</p>
              </div>
              <div className="p-4 rounded-lg bg-rose-50 border border-rose-100">
                 <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">Outgoings</p>
                 <p className="text-xl font-black text-rose-600">{formatCurrency(totalExpenses, currency)}</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                 <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Net Savings</p>
                 <p className="text-xl font-black text-emerald-700">{formatCurrency(remainder, currency)}</p>
              </div>
          </div>

          {/* 3. MAIN CONTENT GRID */}
          <div className="grid grid-cols-2 gap-10">
              
              {/* LEFT: EXPENSES */}
              <div>
                  <div className="flex items-center gap-2 mb-3 border-b border-slate-200 pb-2">
                      <TrendingDown className="w-4 h-4 text-rose-500" />
                      <h3 className="font-bold text-slate-800 text-sm">Expenses</h3>
                  </div>
                  
                  <table className="w-full text-xs">
                      <tbody className="divide-y divide-slate-100">
                          {expenses.map(e => {
                              const Icon = getExpenseIcon(e.name);
                              return (
                                  <tr key={e.id}>
                                      <td className="py-2 flex items-center gap-3 pr-2">
                                          <div className="w-6 h-6 rounded bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                              {e.logo ? (
                                                  <img src={e.logo} className="w-4 h-4 object-contain mix-blend-multiply" />
                                              ) : (
                                                  <Icon className="w-3 h-3 text-slate-400" />
                                              )}
                                          </div>
                                          <span className="font-semibold text-slate-700 truncate max-w-[120px]">{e.name}</span>
                                      </td>
                                      <td className="py-2 text-right font-medium text-slate-600">
                                          {formatCurrency(e.amount, currency)}
                                      </td>
                                  </tr>
                              )
                          })}
                          {expenses.length === 0 && (
                               <tr><td colSpan={2} className="py-6 text-center text-slate-400 italic">No expenses recorded</td></tr>
                          )}
                          <tr className="border-t border-slate-800">
                              <td className="py-3 font-black text-slate-900 text-xs">Total</td>
                              <td className="py-3 text-right font-black text-sm text-slate-900">{formatCurrency(totalExpenses, currency)}</td>
                          </tr>
                      </tbody>
                  </table>
              </div>

              {/* RIGHT: ALLOCATIONS */}
              <div>
                  <div className="flex items-center gap-2 mb-3 border-b border-slate-200 pb-2">
                      <Target className="w-4 h-4 text-indigo-500" />
                      <h3 className="font-bold text-slate-800 text-sm">Allocations</h3>
                  </div>

                  <div className="space-y-3">
                      <div className="flex text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
                          <span className="flex-1">Pot Name</span>
                          <span className="w-16 text-right">Target</span>
                          <span className="w-16 text-right">Actual</span>
                      </div>

                      {allocations.map(plan => {
                           const target = remainder * (plan.percentage / 100);
                           const rawActual = actuals && actuals[plan.id];
                           const actual = rawActual !== undefined && rawActual !== '' ? parseFloat(rawActual) : 0;
                           const percentFilled = Math.min(100, (actual / target) * 100);
                           
                           return (
                              <div key={plan.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                  <div className="flex justify-between items-center mb-1.5">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                          <div className={`w-2 h-2 rounded-full shrink-0 ${plan.color.split(' ')[0]}`}></div>
                                          <div className="min-w-0">
                                              <div className="font-bold text-slate-800 text-xs truncate leading-none">{plan.name}</div>
                                          </div>
                                      </div>
                                      <div className="text-right shrink-0 flex gap-2">
                                           <div className="text-[10px] text-slate-400 w-16">{formatCurrency(target, currency)}</div>
                                           <div className={`text-[10px] font-bold w-16 ${actual >= target -1 ? 'text-emerald-600' : 'text-slate-800'}`}>
                                              {formatCurrency(actual, currency)}
                                           </div>
                                      </div>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${plan.color.split(' ')[0]}`} style={{ width: `${percentFilled}%` }}></div>
                                  </div>
                              </div>
                           );
                      })}

                      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-sm mt-4">
                           <div className="flex justify-between items-center mb-2">
                               <span className="font-bold text-xs flex items-center gap-2">
                                  {bankDetails?.logo && <img src={bankDetails.logo} className="w-4 h-4 rounded-full bg-white border border-white" />}
                                  Remainder
                               </span>
                               <span className="text-[8px] bg-white/20 px-1.5 py-0.5 rounded text-white font-bold">CURRENT ACC</span>
                           </div>
                           <div className="flex justify-between items-end">
                              <div className="opacity-60 text-[10px]">Target: {formatCurrency(currentAccountTarget, currency)}</div>
                              <div className="text-sm font-bold">{formatCurrency(currentAccountActual, currency)}</div>
                           </div>
                      </div>
                  </div>
              </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                  Budget Planner • {new Date().toLocaleDateString()}
              </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const HistoryReportView = ({ data, allocations, onClose, currency, bankDetails }) => {
  return (
    <div className="fixed inset-0 bg-slate-100 z-[70] overflow-y-auto animate-in zoom-in-95 duration-200">
      <div className="bg-slate-900 text-white p-4 sticky top-0 z-20 flex justify-between items-center shadow-lg print:hidden">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg"><Table className="w-5 h-5 text-amber-400" /></div>
            <div>
                <h2 className="font-bold text-sm hidden sm:block">Annual History</h2>
                <p className="text-xs text-slate-400">{data.length} months on record</p>
            </div>
        </div>
        <div className="flex gap-2">
          {/* ACTION: Force Landscape Mode (true) */}
          <button 
            onClick={() => handlePrint('history-report-content', 'Annual_Financial_History', true)} 
            className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-xs hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
          >
            <Printer className="w-4 h-4" /> <span className="hidden sm:inline">Print Landscape</span>
          </button>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex justify-center p-8 min-h-screen">
        
        {/* LANDSCAPE CONTAINER (297mm Width) */}
        {/* We use p-10 padding here to act as the document margins */}
        <div id="history-report-content" className="w-[297mm] bg-white shadow-2xl p-10 rounded-xl overflow-hidden text-slate-900 origin-top">
          
          <div className="flex justify-between items-end border-b-2 border-slate-900 pb-6 mb-6">
              <div>
                  <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Financial History</h1>
                  <p className="text-slate-500 text-sm mt-1">Annual breakdown of income, expenses, and savings pots.</p>
              </div>
              {bankDetails && bankDetails.logo && (
                  <img src={bankDetails.logo} className="h-8 object-contain" alt="Bank Logo" />
              )}
          </div>
          
          <div className="w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="py-3 px-2 font-black text-slate-900 uppercase tracking-wider w-24">Month</th>
                  <th className="py-3 px-2 font-bold text-slate-600 text-right">Net Salary</th>
                  <th className="py-3 px-2 font-bold text-rose-600 text-right">Expenses</th>
                  <th className="py-3 px-2 font-black text-emerald-700 text-right border-r border-slate-200 pr-4">Net Savings</th>
                  
                   <th className="py-3 px-2 font-bold text-indigo-900 text-right w-28 bg-indigo-50/50">
                      Current Acc.
                   </th>

                  {allocations.map(plan => (
                    <th key={plan.id} className="py-3 px-2 font-bold text-slate-600 text-right whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]" title={plan.name}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${plan.color.split(' ')[0]}`}></span>
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((row, index) => {
                  const totalExpenses = (row.expenses || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                  const salary = parseFloat(row.salary) || 0;
                  const remainder = Math.max(0, salary - totalExpenses);
                  const actuals = row.actualSavings || {};

                  return (
                    <tr key={row.id} className={`break-inside-avoid ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                      <td className="py-2.5 px-2 font-bold text-slate-800">{row.id}</td>
                      
                      <td className="py-2.5 px-2 text-right font-mono text-slate-500">
                          {formatCurrency(salary, currency)}
                      </td>
                      
                      <td className="py-2.5 px-2 text-right font-mono text-rose-600 font-medium">
                          {formatCurrency(totalExpenses, currency)}
                      </td>
                      
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-600 border-r border-slate-200 pr-4">
                          {formatCurrency(remainder, currency)}
                      </td>

                      <td className="py-2.5 px-2 text-right font-mono font-bold text-indigo-700 bg-indigo-50/30">
                        {formatCurrency(Math.max(0, remainder - Object.values(actuals).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)), currency)}
                      </td>

                      {allocations.map(plan => {
                        const rawActual = actuals[plan.id];
                        const actual = rawActual !== undefined && rawActual !== '' ? parseFloat(rawActual) : 0;
                        const target = remainder * (plan.percentage / 100);
                        const isMet = actual >= target - 1; 
                        
                        return (
                          <td key={plan.id} className="py-2.5 px-2 text-right font-mono text-slate-600">
                            <span className={isMet ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                               {formatCurrency(actual, currency)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
             <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                 Budget Planner History • {new Date().getFullYear()}
             </p>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- NEW: CREDIT CARD SELECTOR ---
const CreditCardSelector = ({ selectedCards, onToggle }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const LOGO_PUBLIC_KEY = import.meta.env.VITE_LOGO_DEV_PUBLIC_KEY;

  const isSelected = (name) => selectedCards.some(c => c.name === name);

  return (
    <div className="space-y-4">
      {!isSearching ? (
        <>
          <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
            {UK_CREDIT_CARDS.map(card => {
               const active = isSelected(card.name);
               return (
                <button
                  key={card.id}
                  onClick={() => onToggle({ name: card.name, logo: `https://img.logo.dev/${card.domain}?token=${LOGO_PUBLIC_KEY}`, type: 'credit_card' })}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left ${active ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                >
                  <img 
                    src={`https://img.logo.dev/${card.domain}?token=${LOGO_PUBLIC_KEY}`} 
                    alt={card.name} 
                    className="w-8 h-8 object-contain rounded-full bg-white p-0.5 shadow-sm"
                  />
                  <span className={`text-xs font-bold ${active ? 'text-emerald-700' : 'text-slate-700'}`}>{card.name}</span>
                  {active && <Check className="w-4 h-4 text-emerald-600 ml-auto" />}
                </button>
            )})}
          </div>
          <button 
            onClick={() => setIsSearching(true)}
            className="w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-dashed border-slate-300 transition"
          >
            Search for other cards...
          </button>
        </>
      ) : (
        <div className="animate-in fade-in">
           <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Search Card Provider</label>
              <button onClick={() => setIsSearching(false)} className="text-xs text-indigo-500 font-bold">Back to list</button>
           </div>
           <BrandSearchInput 
              placeholder="e.g. Vanquis, Aqua..."
              value={searchTerm}
              onChange={setSearchTerm}
              onSelectBrand={(name, logo) => {
                 onToggle({ name, logo, type: 'credit_card' });
                 setSearchTerm('');
                 setIsSearching(false);
              }}
              className="w-full p-3 rounded-xl border border-slate-200"
              autoFocus
           />
        </div>
      )}
    </div>
  );
};

// --- NEW: MORTGAGE SELECTOR ---
const MortgageSelector = ({ selectedLenders, onToggle }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const LOGO_PUBLIC_KEY = import.meta.env.VITE_LOGO_DEV_PUBLIC_KEY;

  const isSelected = (name) => selectedLenders.some(m => m.name === name);

  return (
    <div className="space-y-4">
      {!isSearching ? (
        <>
          <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
            {UK_MORTGAGE_LENDERS.map(lender => {
               const active = isSelected(lender.name);
               return (
                <button
                  key={lender.id}
                  onClick={() => onToggle({ name: lender.name, logo: `https://img.logo.dev/${lender.domain}?token=${LOGO_PUBLIC_KEY}`, type: 'mortgage' })}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left ${active ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                >
                  <img 
                    src={`https://img.logo.dev/${lender.domain}?token=${LOGO_PUBLIC_KEY}`} 
                    alt={lender.name} 
                    className="w-8 h-8 object-contain rounded-full bg-white p-0.5 shadow-sm"
                  />
                  <span className={`text-xs font-bold ${active ? 'text-blue-700' : 'text-slate-700'}`}>{lender.name}</span>
                  {active && <Check className="w-4 h-4 text-blue-600 ml-auto" />}
                </button>
            )})}
          </div>
          <button 
            onClick={() => setIsSearching(true)}
            className="w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-dashed border-slate-300 transition"
          >
            Search other lenders...
          </button>
        </>
      ) : (
        <div className="animate-in fade-in">
           <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Search Mortgage Lender</label>
              <button onClick={() => setIsSearching(false)} className="text-xs text-indigo-500 font-bold">Back to list</button>
           </div>
           <BrandSearchInput 
              placeholder="e.g. Leeds Building Society..."
              value={searchTerm}
              onChange={setSearchTerm}
              onSelectBrand={(name, logo) => {
                 onToggle({ name, logo, type: 'mortgage' });
                 setSearchTerm('');
                 setIsSearching(false);
              }}
              className="w-full p-3 rounded-xl border border-slate-200"
              autoFocus
           />
        </div>
      )}
    </div>
  );
};

// --- NEW: COLLAPSIBLE EXPENSE SECTION ---
const CollapsibleSection = ({ title, count, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-2">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-slate-50/80 px-6 py-3 border-y border-slate-100 hover:bg-slate-100 transition group"
      >
         <div className="flex items-center gap-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition">{title}</h4>
            <span className="bg-slate-200 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">{count}</span>
         </div>
         <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
         {children}
      </div>
    </div>
  );
};


const SettingsScreen = ({ user, onClose, currentSettings, onSaveSettings, onResetMonth, isTutorial, onExitTutorial, isLegacyMode }) => {
  const [displayName, setDisplayName] = useState(currentSettings.displayName || user.displayName || '');
  const [currency, setCurrency] = useState(currentSettings.currency || 'GBP');
  const [bank, setBank] = useState(currentSettings.bankDetails || null);
  
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

  const [payDay, setPayDay] = useState(currentSettings.payDay || '1');
  

  // --- NEW: Local State for Pace Targets ---
  const [paceTargets, setPaceTargets] = useState(currentSettings.dailyPaceTargets || { low: 10, high: 30 });
  // --- NEW: Credit Cards State ---
  const [creditCards, setCreditCards] = useState(currentSettings.creditCards || []);

  // --- UPDATED: Mortgages State ---
  const [mortgages, setMortgages] = useState(currentSettings.mortgages || []);

  // --- NEW: Update Mortgage Amount ---
  const updateMortgageAmount = (name, amount) => {
     setMortgages(mortgages.map(m => m.name === name ? { ...m, amount: parseFloat(amount) || 0 } : m));
  };

  const toggleCreditCard = (card) => {
     if (creditCards.some(c => c.name === card.name)) {
        setCreditCards(creditCards.filter(c => c.name !== card.name));
     } else {
        setCreditCards([...creditCards, card]);
     }
  };

  // --- NEW: Toggle Mortgage ---
  const toggleMortgage = (lender) => {
    if (mortgages.some(m => m.name === lender.name)) {
       setMortgages(mortgages.filter(m => m.name !== lender.name));
    } else {
       // Default amount to 0 if adding new
       setMortgages([...mortgages, { ...lender, amount: '' }]);
    }
 };

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
      defaultFixedExpenses: defaultExpenses,
      creditCards: creditCards,
      mortgages: mortgages,
      dailyPaceTargets: paceTargets
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
             Please complete your setup: Add Bank, Payday, and any Credit Cards.
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

        {/* --- NEW: CREDIT CARDS SECTION (Insert after Bank/Payday section) --- */}
        <section className="space-y-3">
           <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">My Credit Cards</h3>
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                 Select cards you use. These will appear in your budget with a variable amount (starting at 0) each month.
              </p>
              
              {/* Selected Cards Pills */}
              <div className="flex flex-wrap gap-2 mb-2">
                 {creditCards.map(c => (
                    <div key={c.name} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-emerald-100 shadow-sm animate-in zoom-in">
                       {c.logo && <img src={c.logo} className="w-4 h-4 object-contain" />}
                       <span className="text-xs font-bold text-slate-700">{c.name}</span>
                       <button onClick={() => toggleCreditCard(c)} className="text-slate-300 hover:text-red-500"><X className="w-3 h-3" /></button>
                    </div>
                 ))}
                 {creditCards.length === 0 && <span className="text-xs text-slate-400 italic">No cards selected</span>}
              </div>

              <CreditCardSelector 
                 selectedCards={creditCards}
                 onToggle={toggleCreditCard}
              />
           </div>
        </section>

        {/* --- UPDATED: MORTGAGES SECTION --- */}
        <section className="space-y-3">
           <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">My Mortgages</h3>
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                 Select your mortgage provider and enter your <strong>fixed monthly repayment</strong>.
              </p>
              
              {/* Selected Mortgages with Amount Input */}
              <div className="space-y-2 mb-2">
                 {mortgages.map(m => (
                    <div key={m.name} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-blue-200 shadow-sm animate-in zoom-in">
                       <div className="flex items-center gap-2 flex-1">
                           {m.logo && <img src={m.logo} className="w-6 h-6 object-contain" />}
                           <span className="text-sm font-bold text-slate-700">{m.name}</span>
                       </div>
                       
                       {/* Amount Input */}
                       <div className="relative w-24">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">£</span>
                          <input 
                            type="number" 
                            placeholder="0"
                            value={m.amount}
                            onChange={(e) => updateMortgageAmount(m.name, e.target.value)}
                            className="w-full pl-5 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100"
                          />
                       </div>

                       <button onClick={() => toggleMortgage(m)} className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition"><X className="w-4 h-4" /></button>
                    </div>
                 ))}
              </div>

              <MortgageSelector 
                 selectedLenders={mortgages}
                 onToggle={toggleMortgage}
              />
           </div>
        </section>

        {/* DAILY PACE SETTINGS */}
        <section className="space-y-3">
           <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Daily Pace Targets</h3>
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                 Customize when the heartbeat widget warns you (red throb) or celebrates (green breathing).
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-rose-500 mb-1">Low Warning (&lt;)</label>
                    <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'}</span>
                       <input 
                         type="number" 
                         value={paceTargets.low}
                         onChange={(e) => setPaceTargets({ ...paceTargets, low: parseFloat(e.target.value) || 0 })}
                         className="w-full pl-7 p-3 bg-white border border-rose-200 rounded-xl text-rose-600 font-bold outline-none focus:ring-2 focus:ring-rose-100"
                       />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-emerald-600 mb-1">Healthy Goal (&gt;)</label>
                    <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'}</span>
                       <input 
                         type="number" 
                         value={paceTargets.high}
                         onChange={(e) => setPaceTargets({ ...paceTargets, high: parseFloat(e.target.value) || 0 })}
                         className="w-full pl-7 p-3 bg-white border border-emerald-200 rounded-xl text-emerald-600 font-bold outline-none focus:ring-2 focus:ring-emerald-100"
                       />
                    </div>
                 </div>
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

           {/* --- NEW: MONEY MAP EXPLANATION WITH DUMMY DASHBOARD --- */}
           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
             <div className="flex gap-4">
               <div className="bg-indigo-100 p-3 rounded-full h-fit"><Target className="w-5 h-5 text-indigo-600" /></div>
               <div>
                  <h4 className="font-bold text-slate-800 text-sm">The Money Map</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed mb-3">
                     Once your bills are deducted, this map shows you exactly where your <strong>remaining money</strong> lives.
                  </p>
               </div>
             </div>

             {/* DUMMY DASHBOARD VISUAL */}
             <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 text-center">How it works</p>
                <div className="flex flex-col gap-2">
                   {/* Dummy Current Account Card */}
                   <div className="bg-slate-800 text-white p-3 rounded-lg shadow-md flex justify-between items-center opacity-90">
                      <div className="flex items-center gap-2">
                         <div className="bg-white/20 p-1.5 rounded"><Wallet className="w-3 h-3" /></div>
                         <div>
                            <div className="text-[10px] font-bold opacity-70">Current Account</div>
                            <div className="text-xs font-bold">Safe to Spend</div>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-xs font-bold">£450.00</div>
                      </div>
                   </div>
                   {/* Dummy Pot Card */}
                   <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm flex justify-between items-center opacity-60">
                      <div className="flex items-center gap-2">
                         <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded"><Target className="w-3 h-3" /></div>
                         <div className="text-[10px] font-bold text-slate-600">Savings Pot</div>
                      </div>
                      <div className="text-xs font-bold text-slate-400">£200.00</div>
                   </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-3 text-center leading-relaxed">
                   The dark card is your <strong>Safe-to-Spend</strong> daily money. The light cards are your Pots. 
                   Move money physically in your bank, then update the Pots here to match.
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

// --- NEW: UK CREDIT CARDS ---
const UK_CREDIT_CARDS = [
  { id: 'amex', name: 'American Express', domain: 'americanexpress.com' },
  { id: 'barclaycard', name: 'Barclaycard', domain: 'barclays.co.uk' }, // Often shares domain
  { id: 'capitalone', name: 'Capital One', domain: 'capitalone.co.uk' },
  { id: 'mbna', name: 'MBNA', domain: 'mbna.co.uk' },
  { id: 'tesco', name: 'Tesco Bank', domain: 'tescobank.com' },
  { id: 'sainsburys', name: 'Sainsburys Bank', domain: 'sainsburysbank.co.uk' },
  { id: 'santander_cc', name: 'Santander Cards', domain: 'santander.co.uk' },
  { id: 'natwest_cc', name: 'NatWest Cards', domain: 'natwest.com' },
  { id: 'halifax_cc', name: 'Halifax Cards', domain: 'halifax.co.uk' },
  { id: 'virgin', name: 'Virgin Money', domain: 'virginmoney.com' },
];

// --- NEW: UK MORTGAGE LENDERS ---
const UK_MORTGAGE_LENDERS = [
  { id: 'nationwide', name: 'Nationwide', domain: 'nationwide.co.uk' },
  { id: 'halifax_mort', name: 'Halifax', domain: 'halifax.co.uk' },
  { id: 'santander_mort', name: 'Santander', domain: 'santander.co.uk' },
  { id: 'barclays_mort', name: 'Barclays', domain: 'barclays.co.uk' },
  { id: 'natwest_mort', name: 'NatWest', domain: 'natwest.com' },
  { id: 'hsbc_mort', name: 'HSBC', domain: 'hsbc.co.uk' },
  { id: 'lloyds_mort', name: 'Lloyds Bank', domain: 'lloydsbank.com' },
  { id: 'coventry', name: 'Coventry BS', domain: 'coventrybuildingsociety.co.uk' },
  { id: 'tsb_mort', name: 'TSB', domain: 'tsb.co.uk' },
  { id: 'virgin_mort', name: 'Virgin Money', domain: 'virginmoney.com' },
  { id: 'yorkshire', name: 'Yorkshire BS', domain: 'ybs.co.uk' },
  { id: 'skipton', name: 'Skipton BS', domain: 'skipton.co.uk' },
];

// --- ADMIN TEST LAB SCENARIOS ---
// --- ADMIN TEST LAB SCENARIOS ---
const DEMO_SCENARIOS = {
  'ONBOARDING_NEW': {
    label: 'Fresh User (Onboarding)',
    description: 'Simulates a user who just signed up. No settings, no data.',
    overrides: {
      onboardingComplete: false,
      userSettings: { displayName: '', currency: 'GBP', allocationRules: [], defaultFixedExpenses: [] },
      salary: '', expenses: [], actualSavings: {}
    }
  },
  // --- MERGED SCENARIO HERE ---
  'LEGACY_UPDATE': {
    label: 'Legacy User (Update Required)',
    description: 'Simulates an existing user who needs to add Bank & Payday to continue.',
    overrides: {
      onboardingComplete: true,
      userSettings: { 
        displayName: 'Old User', 
        currency: 'GBP', 
        allocationRules: DEFAULT_ALLOCATIONS, 
        defaultFixedExpenses: DEFAULT_FIXED_EXPENSES,
        // BOTH MISSING: This triggers the "Complete Setup" modal
        bankDetails: null,
        payDay: null 
      },
      salary: '2500', 
      expenses: DEFAULT_FIXED_EXPENSES, 
      actualSavings: {}
    }
  },
  'EMPTY_MONTH': {
    label: 'Month Reset (No Data)',
    description: 'User is set up, but has added no data for this month yet.',
    overrides: {
      onboardingComplete: true,
      salary: '', 
      expenses: [], 
      actualSavings: {}
    }
  }
};

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

const OnboardingWizard = ({ user, onComplete }) => {
  const [step, setStep] = useState(0); 
  // Steps: 0:Intro, 1:Bank, 2:Payday, 3:CreditCards, 4:Currency, 5:Pots, 6:Bills, 7:Pace

  const [paceTargets, setPaceTargets] = useState({ low: 10, high: 30 });
  
  const [currency, setCurrency] = useState('GBP');
  const [bank, setBank] = useState(null);
  const [payDay, setPayDay] = useState(''); // Stores string '1' to '31'
  
  // --- NEW: Credit Cards State ---
  const [creditCards, setCreditCards] = useState([]);

  // --- NEW: Mortgages State ---
  const [mortgages, setMortgages] = useState([]);
  
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
      bankDetails: bank, 
      payDay: payDay,
      creditCards: creditCards,
      mortgages: mortgages,
      allocationRules: pots,
      defaultFixedExpenses: bills,
      dailyPaceTargets: paceTargets 
    };
    onComplete(settings);
  };

  const toggleCard = (card) => {
    if (creditCards.some(c => c.name === card.name)) {
       setCreditCards(creditCards.filter(c => c.name !== card.name));
    } else {
       setCreditCards([...creditCards, card]);
    }
 };

 const toggleMortgage = (lender) => {
  if (mortgages.some(m => m.name === lender.name)) {
     setMortgages(mortgages.filter(m => m.name !== lender.name));
  } else {
     setMortgages([...mortgages, { ...lender, amount: '' }]);
  }};


  const updateMortgageAmount = (name, amount) => {
    setMortgages(mortgages.map(m => m.name === name ? { ...m, amount: parseFloat(amount) || 0 } : m));
 };


  return (
    <div className="fixed inset-0 bg-white z-[200] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 overflow-y-auto">
      <div className="max-w-md w-full space-y-8 py-10">
        
        {/* Progress Dots - 9 Steps total */}
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
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

        {/* STEP 1: BANK SELECTION */}
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

        {/* STEP 2: PAYDAY */}
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

        {/* --- UPDATED STEP 3: MORTGAGES --- */}
        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800">Mortgages</h2>
              <p className="text-slate-500">Select lender & enter <strong>monthly repayment</strong>.</p>
            </div>

            {/* List of Selected Mortgages with Inputs */}
            <div className="space-y-2">
                 {mortgages.map(m => (
                    <div key={m.name} className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200 animate-in zoom-in">
                       <span className="text-xs font-bold bg-slate-900 text-white px-2 py-1 rounded">{m.name}</span>
                       <div className="relative w-28">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">£</span>
                          <input 
                             type="number"
                             placeholder="Amount"
                             value={m.amount}
                             onChange={(e) => updateMortgageAmount(m.name, e.target.value)}
                             className="w-full pl-6 pr-2 py-2 rounded-lg border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-200"
                          />
                       </div>
                    </div>
                 ))}
            </div>

            <MortgageSelector 
                selectedLenders={mortgages}
                onToggle={toggleMortgage}
            />

            <button onClick={() => setStep(4)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 transition mt-4">
              {mortgages.length === 0 ? 'No Mortgage' : 'Next'}
            </button>
          </div>
        )}

        {/* STEP 4: CREDIT CARDS */}
        {step === 4 && (
          <div className="space-y-6 animate-in slide-in-from-right-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800">Credit Cards</h2>
              <p className="text-slate-500">Do you have any credit cards you pay off monthly?</p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
                 {creditCards.map(c => (
                    <span key={c.name} className="text-xs font-bold bg-slate-900 text-white px-2 py-1 rounded animate-in zoom-in">{c.name}</span>
                 ))}
            </div>

            <CreditCardSelector 
                selectedCards={creditCards}
                onToggle={toggleCard}
            />

            <button onClick={() => setStep(5)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 transition mt-4">
              {creditCards.length === 0 ? 'I don\'t have any cards' : 'Next'}
            </button>
          </div>
        )}

        {/* STEP 5: CURRENCY */}
        {step === 5 && (
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
            {/* FIXED: Was setStep(4), changed to setStep(5) */}
            <button onClick={() => setStep(6)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 transition mt-4">
              Next Step
            </button>
          </div>
        )}

        {/* STEP 6: POTS & CURRENT ACCOUNT */}
        {step === 6 && (
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

            {/* FIXED: Was setStep(5), changed to setStep(6) */}
            <button 
              disabled={totalPercent > 100}
              onClick={() => setStep(7)} 
              className="w-full bg-slate-900 disabled:bg-slate-300 disabled:text-slate-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 transition"
            >
              {totalPercent > 100 ? 'Total cannot exceed 100%' : 'Continue'}
            </button>
          </div>
        )}

        {/* STEP 7: FIXED EXPENSES */}
        {step === 7 && (
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

            {/* FIXED: Was setStep(6), changed to setStep(7) */}
            <button onClick={() => setStep(8)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 transition mt-4">
              Next
            </button>
          </div>
        )}

        {/* STEP 8: DAILY PACE GOALS */}
        {step === 8 && (
          <div className="space-y-6 animate-in slide-in-from-right-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800">Your Speed Limit</h2>
              <p className="text-slate-500 text-sm">
                We calculate your "Daily Pace" by dividing your <strong>Safe-to-Spend</strong> by the days left until payday.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-6">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
                   <span>Panic Zone</span>
                   <span>Healthy Zone</span>
                </div>
                <div className="h-4 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                   <div className="h-full bg-rose-400" style={{ width: '30%' }}></div>
                   <div className="h-full bg-slate-300" style={{ width: '30%' }}></div>
                   <div className="h-full bg-emerald-400" style={{ width: '40%' }}></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Warn me below:</label>
                      <div className="relative">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'}</span>
                         <input 
                           type="number" 
                           value={paceTargets.low}
                           onChange={(e) => setPaceTargets({...paceTargets, low: parseFloat(e.target.value)})}
                           className="w-full pl-8 p-3 bg-white border border-rose-200 rounded-xl font-bold text-rose-600 outline-none focus:ring-2 focus:ring-rose-100"
                         />
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Target above:</label>
                      <div className="relative">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'}</span>
                         <input 
                           type="number" 
                           value={paceTargets.high}
                           onChange={(e) => setPaceTargets({...paceTargets, high: parseFloat(e.target.value)})}
                           className="w-full pl-8 p-3 bg-white border border-emerald-200 rounded-xl font-bold text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-100"
                         />
                      </div>
                   </div>
                </div>
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
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get key from env
  const LOGO_PUBLIC_KEY = import.meta.env.VITE_LOGO_DEV_PUBLIC_KEY;

  return (
    <div className="space-y-4">
      {!isSearching ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1">
            {UK_BANKS.map(bank => (
              <button
                key={bank.id}
                // UPDATED: Used LOGO_PUBLIC_KEY variable here
                onClick={() => onSelect({ name: bank.name, logo: `https://img.logo.dev/${bank.domain}?token=${LOGO_PUBLIC_KEY}`, color: bank.color })}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedBank?.name === bank.name ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
              >
                <img 
                  // UPDATED: Used LOGO_PUBLIC_KEY variable here
                  src={`https://img.logo.dev/${bank.domain}?token=${LOGO_PUBLIC_KEY}`} 
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

// --- UPDATED ADMIN DASHBOARD ---
const AdminDashboard = ({ user, onExitAdmin, onSelectDemo }) => {
  const [view, setView] = useState('logs'); // 'logs' or 'simulator'
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterUser, setFilterUser] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    if (view !== 'logs') return;
    const fetchLogs = async () => {
      try {
        const q = query(
          collection(db, 'artifacts', appId, 'system_logs'),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
        const snapshot = await getDocs(q);
        setLogs(snapshot.docs.map(doc => ({
            id: doc.id, 
            ...doc.data(), 
            timestamp: doc.data().timestamp?.toDate().toLocaleString()
        })));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchLogs();
  }, [view]);

  // Filter Logic
  const filteredLogs = logs.filter(log => {
    const matchUser = log.userEmail?.toLowerCase().includes(filterUser.toLowerCase());
    const matchType = filterType === 'ALL' || log.type === filterType;
    return matchUser && matchType;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-6 font-mono">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">System Admin</h1>
              <div className="flex gap-4 text-xs font-bold uppercase tracking-wider mt-1">
                 <button onClick={() => setView('logs')} className={view === 'logs' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}>System Logs</button>
                 <button onClick={() => setView('simulator')} className={view === 'simulator' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}>Test Lab</button>
              </div>
            </div>
          </div>
          <button onClick={onExitAdmin} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Exit
          </button>
        </div>

        {/* VIEW: LOGS */}
        {view === 'logs' && (
           <div className="space-y-4 animate-in fade-in">
              {/* Filters */}
              <div className="grid grid-cols-2 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div>
                   <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Search User</label>
                   <input type="text" placeholder="e.g. yaseen..." value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white" />
                </div>
                <div>
                   <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Action Type</label>
                   <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white">
                     <option value="ALL">All Actions</option>
                     <option value="login">Logins</option>
                     <option value="action">User Actions</option>
                     <option value="config">Settings Updates</option>
                   </select>
                </div>
              </div>
              {/* Log Table */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-bold">
                    <tr><th className="p-4">Time</th><th className="p-4">User</th><th className="p-4">Type</th><th className="p-4">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-white/5">
                        <td className="p-4 text-slate-500">{log.timestamp}</td>
                        <td className="p-4 font-bold text-indigo-300">{log.userEmail}</td>
                        <td className="p-4">{log.type}</td>
                        <td className="p-4 text-slate-300">{log.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        )}

        {/* VIEW: SIMULATOR */}
        {view === 'simulator' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-right-4">
              {Object.entries(DEMO_SCENARIOS).map(([key, scenario]) => (
                 <button 
                   key={key}
                   onClick={() => onSelectDemo(key)}
                   className="bg-slate-900 border border-slate-800 hover:border-indigo-500 hover:bg-slate-800 p-6 rounded-2xl text-left transition group relative overflow-hidden"
                 >
                    <div className="relative z-10">
                       <h3 className="font-bold text-white text-lg mb-1 group-hover:text-indigo-400 transition">{scenario.label}</h3>
                       <p className="text-sm text-slate-400">{scenario.description}</p>
                    </div>
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition transform translate-x-4 group-hover:translate-x-0">
                       <ArrowRight className="w-6 h-6 text-indigo-500" />
                    </div>
                 </button>
              ))}
           </div>
        )}

      </div>
    </div>
  );
};

const DailyPaceModal = ({ isOpen, onClose, currentTargets, onSave, currency }) => {
  const [low, setLow] = useState(currentTargets?.low || 10);
  const [high, setHigh] = useState(currentTargets?.high || 30);

  // --- FIX: Sync state with Settings whenever modal opens ---
  useEffect(() => {
    if (isOpen && currentTargets) {
      setLow(currentTargets.low || 10);
      setHigh(currentTargets.high || 30);
    }
  }, [isOpen, currentTargets]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4 animate-in fade-in">
       <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-spring">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
             <h3 className="font-bold text-lg text-slate-800">Daily Pace Settings</h3>
             <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
          </div>
          <div className="p-6 space-y-6">
             <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-xs text-indigo-800 leading-relaxed">
                <strong>How is this calculated?</strong><br/>
                We take your <em>Safe-to-Spend</em> balance and divide it by the number of days left until payday. This is your speed limit.
             </div>
             
             <div className="space-y-4">
                 <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-rose-500 uppercase tracking-wider mb-2">
                       <TrendingDown className="w-4 h-4" /> Panic Zone (Low)
                    </label>
                    <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'}</span>
                       <input 
                         type="number" 
                         value={low}
                         onChange={(e) => setLow(e.target.value)}
                         className="w-full pl-10 p-4 bg-rose-50 border border-rose-100 rounded-xl text-lg font-bold text-rose-600 outline-none focus:ring-2 focus:ring-rose-200"
                       />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Widget throbs red if your daily pace drops below this.</p>
                 </div>

                 <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
                       <TrendingUp className="w-4 h-4" /> Healthy Zone (High)
                    </label>
                    <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'}</span>
                       <input 
                         type="number" 
                         value={high}
                         onChange={(e) => setHigh(e.target.value)}
                         className="w-full pl-10 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-lg font-bold text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-200"
                       />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Widget breathes green if your daily pace is above this.</p>
                 </div>
             </div>

             <button 
               onClick={() => {
                  onSave(parseFloat(low), parseFloat(high));
                  onClose();
               }}
               className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-slate-800 active:scale-95 transition"
             >
               Save Goals
             </button>
          </div>
       </div>
    </div>
  );
};

// --- NEW: MARKETING LANDING PAGE ---
const LandingPage = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      
      {/* 1. NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-slate-900 text-white p-2 rounded-xl"><Wallet className="w-6 h-6" /></div>
             <span className="font-bold text-xl tracking-tight">Budget Planner</span>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={onLogin} className="text-sm font-bold text-slate-500 hover:text-slate-900 transition hidden sm:block">
               Log In
             </button>
             <button onClick={onGetStarted} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-full font-bold text-sm transition shadow-lg shadow-emerald-500/20 active:scale-95">
               Launch App
             </button>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <header className="relative pt-20 pb-32 px-6 overflow-hidden">
         {/* Background Blobs */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-300/20 rounded-full blur-[100px] -z-10 animate-pulse"></div>
         <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-300/20 rounded-full blur-[100px] -z-10"></div>

         <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider animate-in slide-in-from-bottom-4 fade-in duration-700">
               <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
               Live Demo Available
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 leading-[1.1] animate-in slide-in-from-bottom-8 fade-in duration-700 delay-100">
               Stop Tracking. <br/>
               <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-indigo-600">Start Forecasting.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto leading-relaxed animate-in slide-in-from-bottom-8 fade-in duration-700 delay-200">
               Most apps tell you where your money <em>went</em>. We tell you exactly what is safe to spend <em>today</em>.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in zoom-in-50 fade-in duration-700 delay-300">
               <button onClick={onGetStarted} className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition shadow-xl hover:shadow-2xl active:scale-95 flex items-center justify-center gap-2">
                  Get Started for Free <ArrowRight className="w-5 h-5" />
               </button>
               <button onClick={() => {
                   document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
               }} className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-50 transition flex items-center justify-center gap-2">
                  How it works
               </button>
            </div>
         </div>
      </header>

      {/* 3. APP PREVIEW (Tilt Card) */}
      <section className="px-4 mb-24 relative z-20 -mt-10">
         <div className="max-w-5xl mx-auto bg-white rounded-[2.5rem] p-4 shadow-2xl border border-slate-200/50 transform md:rotate-1 hover:rotate-0 transition duration-500">
            <div className="bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100 relative aspect-[16/9] group">
               {/* This represents a screenshot of the app */}
               <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-300">
                  {/* You can replace this with an actual screenshot <img> tag later */}
                  <div className="text-center">
                     <PieChart className="w-20 h-20 mx-auto mb-4 opacity-20" />
                     <p className="font-bold text-lg">App Dashboard Preview</p>
                  </div>
               </div>
               {/* Overlay Content */}
               <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-slate-900/50 to-transparent p-8 flex items-end justify-between text-white">
                  <div>
                    <p className="font-bold text-lg">The Dashboard</p>
                    <p className="text-sm opacity-80">See your financial health in one glance.</p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* 4. FEATURES GRID */}
      <section id="features" className="py-24 bg-white">
         <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
               <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Your Financial GPS</h2>
               <p className="text-lg text-slate-500">We don't just show you numbers. We show you the future of your bank balance.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
               {[
                  { icon: PieChart, title: 'Visual Budgeting', desc: 'See your salary split into clear slices. Know exactly where every penny goes before you spend it.', color: 'text-purple-500', bg: 'bg-purple-50' },
                  { icon: TrendingUp, title: 'Daily Pace', desc: 'We calculate a "Safe-to-Spend" daily limit. Stay below it, and you will never run out of money.', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                  { icon: FlaskConical, title: 'Sandbox Mode', desc: 'Want to buy a car? Enter "Simulation Mode" to test huge purchases without messing up your real data.', color: 'text-indigo-500', bg: 'bg-indigo-50' }
               ].map((f, i) => (
                  <div key={i} className="p-8 rounded-[2rem] border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-xl transition duration-300">
                     <div className={`w-14 h-14 rounded-2xl ${f.bg} ${f.color} flex items-center justify-center mb-6`}>
                        <f.icon className="w-7 h-7" />
                     </div>
                     <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                     <p className="text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
         <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-white">
               <Wallet className="w-5 h-5" />
               <span className="font-bold text-lg">Budget Planner</span>
            </div>
            <p className="text-sm">© {new Date().getFullYear()} Designed & Built by Yaseen Hussain</p>
         </div>
      </footer>
    </div>
  );
};


export default function App() {

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [showLandingPage, setShowLandingPage] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [showMoneyMapTooltip, setShowMoneyMapTooltip] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showReportSelector, setShowReportSelector] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState(null); // 'add_expense' or 'advanced_features'
  const [tutorialStep, setTutorialStep] = useState(0);

  const [isLegacyUser, setIsLegacyUser] = useState(false);

  // --- ADMIN DEMO STATE ---
  const [activeDemoId, setActiveDemoId] = useState(null);

  // Add these new states
  const [showPaceModal, setShowPaceModal] = useState(false);
  const [paceView, setPaceView] = useState('daily'); // 'daily' or 'weekly'

  const [touchStart, setTouchStart] = useState(null); // <--- ADD THIS
  const [touchEnd, setTouchEnd] = useState(null);     // <--- ADD THIS

  

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
    defaultFixedExpenses: DEFAULT_FIXED_EXPENSES,
    creditCards: [],
    mortgages: []
  });

  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [isAddingExpense, setIsAddingExpense] = useState(false); // For Modal
  const [searchTerm, setSearchTerm] = useState(''); // Added search state
  const [sortMode, setSortMode] = useState('date');

  const [highlightedSlice, setHighlightedSlice] = useState(null); // 'expenses' or pot ID

  // --- DATA SOURCE LOGIC (Real vs Sandbox vs Admin Demo) ---

  // 1. Define Tutorial Mode First (Fixes ReferenceError)
  const isTutorialMode = activeTutorial !== null;

  // 2. Define Tutorial Fallbacks
  const tutorialAllocations = TUTORIAL_POTS;
  const tutorialDefaultExpenses = TUTORIAL_EXPENSES.filter(e => e.type === 'fixed');

  // 3. Get the Mock Data if in Admin Demo Mode
  const demoData = activeDemoId ? DEMO_SCENARIOS[activeDemoId].overrides : null;

  // 4. Determine "Effective" Data
  // If Demo: Use Demo Data. If Sandbox: Use Sandbox Data. Else: Use Real DB Data.
  const effectiveSalary = demoData?.salary !== undefined ? demoData.salary : (isSandbox ? sandboxSalary : salary);
  
  const effectiveExpenses = demoData?.expenses !== undefined ? demoData.expenses : (
     isTutorialMode ? TUTORIAL_EXPENSES : (isSandbox ? sandboxExpenses : expenses)
  );

  const effectiveActuals = demoData?.actualSavings !== undefined ? demoData.actualSavings : (
     isTutorialMode ? { t1: 400, t2: 240 } : (isSandbox ? sandboxActualSavings : actualSavings)
  );

  // 5. Settings & Onboarding Overrides
  const effectiveSettings = demoData?.userSettings || (
     isTutorialMode ? { 
       ...userSettings, 
       allocationRules: tutorialAllocations, 
       defaultFixedExpenses: tutorialDefaultExpenses 
     } : userSettings
  );

  const effectiveOnboardingComplete = demoData?.onboardingComplete !== undefined ? demoData.onboardingComplete : onboardingComplete;
  
  // 6. Legacy Check Logic
  const isEffectiveLegacyUser = !effectiveSettings.bankDetails || !effectiveSettings.payDay;

  // 7. Allocations (Pots)
  const activeRules = monthAllocations || effectiveSettings.allocationRules;
  const effectiveAllocations = isTutorialMode ? tutorialAllocations : activeRules;

  // 8. Display Variables (Legacy support for UI components that might still use these names)
  const displayAllocations = effectiveAllocations;
  const displayDefaultExpenses = effectiveSettings.defaultFixedExpenses;
  const displayActualSavings = effectiveActuals;
  const displayExpenses = effectiveExpenses; // Add this to be safe

  // Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const initAuth = async () => {
      const config = getFirebaseConfig();
      if (!config.apiKey) return;

      // --- FIX 1: Set Persistence Here (Once on Load) ---
      try {
        await setPersistence(auth, browserSessionPersistence);
      } catch (e) {
        console.error("Persistence setting failed", e);
      }

      // Check for custom tokens (existing logic)
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
        
        // CHECK IF LEGACY: Missing Bank or Payday OR Credit Cards Config OR Mortgages
        if (!data.bankDetails || !data.payDay || data.creditCards === undefined || data.mortgages === undefined) {
          setIsLegacyUser(true);
          setShowSettings(true); 
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
        let currentExpenses = data.expenses || [];
        let needsUpdate = false; 

        // 1. Inject Credit Cards (Variable = 0)
        if (userSettings.creditCards && userSettings.creditCards.length > 0) {
           userSettings.creditCards.forEach(card => {
              const exists = currentExpenses.some(e => e.name === card.name && e.type === 'credit_card');
              if (!exists) {
                 currentExpenses.push({
                    id: `cc_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,
                    name: card.name,
                    amount: 0, // Credit cards are variable
                    type: 'credit_card',
                    logo: card.logo
                 });
                 needsUpdate = true;
              }
           });
        }

        // 2. Inject Mortgages (FIXED AMOUNT)
        if (userSettings.mortgages && userSettings.mortgages.length > 0) {
           userSettings.mortgages.forEach(mort => {
              const exists = currentExpenses.some(e => e.name === mort.name && e.type === 'mortgage');
              // Only inject if it doesn't exist. If it exists, we respect the existing month's data.
              if (!exists) {
                 currentExpenses.push({
                    id: `mort_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,
                    name: mort.name,
                    amount: parseFloat(mort.amount) || 0, // <--- USE USER SETTING AMOUNT
                    type: 'mortgage',
                    logo: mort.logo
                 });
                 needsUpdate = true;
              }
           });
        }
           
        if (needsUpdate && !isSandbox && !activeDemoId) {
            setDoc(docRef, { ...data, expenses: currentExpenses }, { merge: true });
        }
        
        setExpenses(currentExpenses);
        setSalary(data.salary || '');
        setActualSavings(data.actualSavings || {});

        if (data.salary && !data.allocationRules) {
           setDoc(docRef, { ...data, allocationRules: userSettings.allocationRules }, { merge: true });
           setMonthAllocations(userSettings.allocationRules);
        } else {
           setMonthAllocations(data.allocationRules || null);
        }

      } else {
        // --- NEW/EMPTY MONTH ---
        setSalary('');
        
        const initialExpenses = [...(userSettings.defaultFixedExpenses || [])];
        
        // Add Credit Cards
        if (userSettings.creditCards) {
           userSettings.creditCards.forEach(card => {
              initialExpenses.push({
                 id: `cc_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,
                 name: card.name,
                 amount: 0,
                 type: 'credit_card',
                 logo: card.logo
              });
           });
        }

        // Add Mortgages with FIXED AMOUNT
        if (userSettings.mortgages) {
           userSettings.mortgages.forEach(mort => {
              initialExpenses.push({
                 id: `mort_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,
                 name: mort.name,
                 amount: parseFloat(mort.amount) || 0, // <--- USE USER SETTING AMOUNT
                 type: 'mortgage',
                 logo: mort.logo
              });
           });
        }
        
        setExpenses(initialExpenses);
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
    // 1. Prevent double-clicks
    if (isLoggingIn) return; 
    setIsLoggingIn(true);

    try {
      // --- FIX 2: REMOVED setPersistence FROM HERE ---
      // It caused the "Popup Blocked" error by delaying the window open event.
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      // This now runs immediately on click, satisfying the browser's popup blocker
      const result = await signInWithPopup(auth, provider);
      
      console.log("Login successful:", result.user.email);
      setUser(result.user); 
      logSystemEvent('User Logged In', 'login', result.user);
      
    } catch (error) {
      console.error("Login Failed:", error);
      
      // Ignore popup cancellations/blocks to avoid confusing the user
      if (
        error.code === 'auth/cancelled-popup-request' || 
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/popup-blocked'
      ) {
         console.log("Login popup cancelled or blocked. Ignoring.");
         setIsLoggingIn(false);
         return;
      }

      if (!YOUR_FIREBASE_KEYS.apiKey) {
        await signInAnonymously(auth);
      } else {
        alert(`Login failed: ${error.message}`);
      }
    } finally {
       setIsLoggingIn(false);
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
    if (!user || isSandbox || activeDemoId) return; // <--- ADD activeDemoId HERE
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
    // GUARD: Block saving in Demo Mode
    if (activeDemoId) {
       showToast("Demo Mode: Settings NOT saved to database.");
       // Optional: You could locally update 'userSettings' state here if you wanted 
       // the UI to update instantly, but for a "safe" test, just blocking is best.
       return;
    }
    
    if (!user) return;
    triggerHaptic(); 
    logSystemEvent('Settings & Pots Configuration Saved', 'config');
    const settingsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'config');
    await setDoc(settingsRef, newSettings);
    // Update local state immediately so the UI reflects changes
    setUserSettings(newSettings); 
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
      playJuiceSound('toggle');
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

  // --- UPDATED MATH USING EFFECTIVE DATA ---
  const totalExpenses = effectiveExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const salaryNum = parseFloat(effectiveSalary) || 0;
  const remainder = Math.max(0, salaryNum - totalExpenses);

  // 1. Calculate Target for Current Account
  // Note: We use effectiveSettings here
  const allocatedPercent = effectiveSettings.allocationRules.reduce((sum, p) => sum + p.percentage, 0);
  const currentAccountPercent = Math.max(0, 100 - allocatedPercent);
  const currentAccountTarget = remainder * (currentAccountPercent / 100);

  // 2. Calculate ACTUAL Current Account
  // Note: We use effectiveActuals here
  const totalDepositedToPots = Object.values(effectiveActuals).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const currentAccountActual = Math.max(0, remainder - totalDepositedToPots);
  
  // 3. Payday Logic
  // Note: We pass effectiveSettings.payDay and effectiveSalary
  const { days: daysUntilPayday, targetDate: targetPaydayDate } = calculatePaydayLogic(effectiveSettings.payDay, effectiveSalary);
  
  // 4. Daily Pace
  const rawPace = daysUntilPayday > 0 ? (currentAccountActual / daysUntilPayday) : 0;
  const dailyAllowance = parseFloat(rawPace.toFixed(2));
  const daysLeftLabel = `Next Payday`;

  // Count filled plans using effectiveSettings & effectiveActuals
  const filledPlansCount = effectiveSettings.allocationRules.filter(plan => {
      const val = effectiveActuals[plan.id];
      return val !== undefined && val !== '';
  }).length;

  // Filter Expenses using effectiveExpenses
  let filteredExpenses = effectiveExpenses.filter(e => 
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

  // 1. If Loading, show nothing or a spinner (optional)
  if (loading) return <DashboardSkeleton />; // (I kept your Skeleton here as it looks better than null)

  // 2. If User is NOT logged in...
  if (!user) {
     // ...and we are showing the Landing Page
     if (showLandingPage) {
        return (
           <LandingPage 
              onGetStarted={() => setShowLandingPage(false)} 
              onLogin={() => setShowLandingPage(false)} 
           />
        );
     }
     // ...otherwise show the Login Screen (The existing "App" login)
     return <LoginScreen onLogin={handleLogin} isLoggingIn={isLoggingIn} />;
  }

  // --- ADMIN RENDER CHECK ---
  if (user && isAdminMode && user.email === "yaseen.hussain2001@gmail.com") {
    return (
      <AdminDashboard 
        user={user} 
        onExitAdmin={() => setIsAdminMode(false)} 
        // Pass the selector function
        onSelectDemo={(id) => {
           setActiveDemoId(id);
           setIsAdminMode(false);
           showToast(`Entered Test State: ${DEMO_SCENARIOS[id].label}`);
        }}
      />
    );
  }


  // ... inside render ...
  // Calculate Target Logic
  const paceLow = effectiveSettings.dailyPaceTargets?.low || 10;
  const paceHigh = effectiveSettings.dailyPaceTargets?.high || 30;
  
  // Calculate Display Values
  const weeklyAllowance = dailyAllowance * 7;
  const isWeekly = paceView === 'weekly';
  const displayPace = isWeekly ? weeklyAllowance : dailyAllowance;
  
  // Animation Logic (Scale targets if weekly)
  const targetLow = isWeekly ? paceLow * 7 : paceLow;
  const targetHigh = isWeekly ? paceHigh * 7 : paceHigh;
  
  const isLow = displayPace < targetLow && displayPace > 0;
  const isHealthy = displayPace > targetHigh;

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
          
          {/* UPDATE THIS LINE HERE: */}
          <style>{auroraStyles + springStyles + juiceStyles}</style>
          
          {/* Base Layer (White/Slate) */}
          <div className="absolute inset-0 bg-slate-50"></div>
          
          {/* Top Blobs (Visible immediately) */}
          <div className="absolute top-[300px] left-[-10%] w-[500px] h-[500px] bg-purple-300 rounded-full mix-blend-multiply filter blur-[90px] opacity-60 animate-aurora-1"></div>
          <div className="absolute top-[300px] right-[-10%] w-[500px] h-[500px] bg-cyan-300 rounded-full mix-blend-multiply filter blur-[90px] opacity-60 animate-aurora-2"></div>
          
          {/* Middle Blobs (Visible as you look down) */}
          <div className="absolute top-[60%] left-[20%] w-[600px] h-[600px] bg-pink-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-aurora-3"></div>
          
          {/* Bottom Blobs (Anchoring the bottom of the screen) */}
          <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-emerald-300 rounded-full mix-blend-multiply filter blur-[90px] opacity-50 animate-aurora-2"></div>

          {/* >>> INSERT THIS NEW NOISE LAYER <<< */}
          <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" 
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
          </div>
        </div>
      )}

      {/* Sandbox Banner */}
      {isSandbox && (
        <div className="bg-indigo-600 text-white px-4 py-2 text-center text-sm font-bold sticky top-0 z-50 shadow-md flex justify-between items-center animate-in slide-in-from-top-full">
            <span className="flex items-center gap-2"><FlaskConical className="w-4 h-4" /> Sandbox Mode Active - Changes are NOT saved</span>
            <button onClick={toggleSandbox} className="bg-white/20 p-1 rounded hover:bg-white/30 transition"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Admin Demo Banner */}
      {activeDemoId && (
        <div className="bg-slate-900 text-white px-4 py-3 text-center text-sm font-bold sticky top-0 z-[300] shadow-md flex justify-between items-center animate-in slide-in-from-top-full border-b border-white/10">
            <span className="flex items-center gap-2 text-indigo-300">
               <Shield className="w-4 h-4" /> 
               Test Lab: {DEMO_SCENARIOS[activeDemoId].label}
            </span>
            <button onClick={() => setActiveDemoId(null)} className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-xs transition">
               Exit Test
            </button>
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
        <Plus className="w-5 h-5" /> <span className="hidden sm:inline">Add One-Off Expense</span>
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
          isLegacyMode={isEffectiveLegacyUser} // <--- CHANGED
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
      
      {/* Onboarding Wizard Logic */}
      {!loading && !effectiveOnboardingComplete && user && ( 
        <OnboardingWizard 
          user={user}
          onComplete={async (newSettings) => {
             // GUARD: If in Demo Mode, DO NOT SAVE. Just exit the demo.
             if (activeDemoId) {
                showToast("Demo Completed! No data was saved.");
                setActiveDemoId(null); // Exit demo mode
                return;
             }

             // Real Save Logic
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
          currency={effectiveSettings.currency} // <--- CHANGED
          allocationRules={effectiveSettings.allocationRules} // <--- CHANGED
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
          salary={effectiveSalary} 
          expenses={effectiveExpenses} 
          allocations={effectiveAllocations} 
          actuals={effectiveActuals} 
          onClose={() => setActiveReport(null)}
          currency={effectiveSettings.currency} 
          // ADD THIS LINE:
          bankDetails={effectiveSettings.bankDetails} 
        />
      )}

      {activeReport === 'history' && (
        <HistoryReportView 
          data={reportData}
          allocations={effectiveAllocations} 
          onClose={() => setActiveReport(null)}
          currency={effectiveSettings.currency} 
          // ADD THIS LINE:
          bankDetails={effectiveSettings.bankDetails}
        />
      )}


      <DailyPaceModal 
        isOpen={showPaceModal}
        onClose={() => setShowPaceModal(false)}
        currentTargets={{ low: paceLow, high: paceHigh }}
        currency={effectiveSettings.currency}
        onSave={(low, high) => saveSettings({ 
           ...effectiveSettings, 
           dailyPaceTargets: { low, high } 
        })}
      />

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
                {/* CHANGED: effectiveSettings.displayName */}
                {effectiveSettings.displayName || (user.displayName ? user.displayName.split(' ')[0] : 'Guest')}
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
          <TiltCard className="md:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200/60 relative overflow-hidden group">
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
                      {effectiveSettings.currency === 'GBP' ? '£' : effectiveSettings.currency === 'USD' ? '$' : '€'}
                  </span>
                  
                  {/* UPDATED INPUT: Auto-Formatting */}
                  <input 
                      type="text" 
                      value={formatNumberWithCommas(effectiveSalary)} 
                      onChange={(e) => {
                          const rawVal = e.target.value.replace(/,/g, '');
                          if (!isNaN(rawVal)) updateSalary(rawVal);
                      }}
                      onBlur={(e) => {
                          const finalVal = safeCalculate(e.target.value.replace(/,/g, ''));
                          updateSalary(finalVal);
                          if (!isSandbox && finalVal) logSystemEvent(`Salary Updated: ${finalVal}`, 'action');
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
                 {parseFloat(effectiveSalary) > 0 ? (
                    <BudgetWheel 
                      salary={effectiveSalary}
                      expenses={effectiveExpenses}
                      allocations={effectiveAllocations}
                      currency={effectiveSettings.currency}
                      activeSlice={highlightedSlice}
                      onSliceClick={setHighlightedSlice}
                      bankColor={effectiveSettings.bankDetails?.color}
                    />
                 ) : (
                   <div className="h-48 flex items-center justify-center text-slate-300 font-bold border-2 border-dashed border-slate-100 rounded-full w-48 aspect-square">
                     No Budget Set
                   </div>
                 )}
               </div>
             </div>
          </TiltCard>

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
                      -<RollingNumber value={totalExpenses} currency={effectiveSettings.currency} />
                    </span>
                  </div>

                  {/* Right: Left from Salary */}
                  <div className="text-right border-l border-slate-100 pl-4">
                    <div className="flex items-center justify-end gap-1.5 mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Left</span>
                      <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg"><TrendingUp className="w-3 h-3" /></div>
                    </div>
                    <span className="text-xl md:text-2xl font-black text-emerald-500 tracking-tight block">
                      <RollingNumber value={salaryNum - totalExpenses} currency={effectiveSettings.currency} />
                    </span>
                  </div>
                </div>
             </div>

             {/* Stat 2: Days Left */}
             <div className="flex-1 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200/60 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-8 -mb-8 group-hover:scale-110 transition duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Calendar className="w-4 h-4" /></div>
                    <span className="text-xs font-bold text-slate-400 uppercase">{daysLeftLabel}</span>
                  </div>
                  <div className="flex items-baseline">
                     <span className="text-3xl font-bold text-slate-800 tracking-tight">
                       {daysUntilPayday}
                     </span>
                     <span className="text-xs text-slate-400 ml-1 font-bold lowercase">
                       days
                     </span>
                  </div>
                  {/* Displays the actual date, e.g. "until 28 Jan" */}
                  <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                     until {targetPaydayDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
             </div>
             
             {/* --- PASTE THIS NEW WIDGET BELOW --- */}
             {/* Stat 3: Daily/Weekly Pace Widget (SWIPEABLE + 2 DECIMALS) */}
             <div 
                // SWIPE HANDLERS START
                onTouchStart={(e) => {
                  setTouchEnd(null); 
                  setTouchStart(e.targetTouches[0].clientX);
                }}
                onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
                onTouchEnd={() => {
                  if (!touchStart || !touchEnd) return;
                  const distance = touchStart - touchEnd;
                  const isLeftSwipe = distance > 50;
                  const isRightSwipe = distance < -50;
                  
                  if (isLeftSwipe) {
                     setPaceView('weekly');
                     if (window.navigator.vibrate) window.navigator.vibrate(10);
                  }
                  if (isRightSwipe) {
                     setPaceView('daily');
                     if (window.navigator.vibrate) window.navigator.vibrate(10);
                  }
                }}
                // SWIPE HANDLERS END
                className={`flex-1 p-6 rounded-[2.5rem] shadow-sm border flex flex-col justify-center text-center relative overflow-hidden group transition-all duration-500 cursor-grab active:cursor-grabbing
                ${isLow ? 'bg-rose-50 border-rose-200 animate-throb' : 
                  isHealthy ? 'bg-emerald-50 border-emerald-200 animate-breathe' : 
                  'bg-indigo-50 border-indigo-100'}`}
             >
                {/* Decorative Top Bar */}
                <div className={`absolute top-0 left-0 w-full h-1.5 ${isLow ? 'bg-rose-400' : isHealthy ? 'bg-emerald-400' : 'bg-indigo-200/50'}`}></div>
                
                {/* Settings Icon (Top Right) */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent swipe when clicking settings
                    setShowPaceModal(true);
                  }}
                  className={`absolute top-3 right-3 p-1.5 rounded-full transition hover:bg-black/5 ${isLow ? 'text-rose-400' : isHealthy ? 'text-emerald-500' : 'text-indigo-300'}`}
                >
                   <Settings className="w-3.5 h-3.5" />
                </button>

                {/* Main Label */}
                <div className="flex items-center justify-center gap-2 mb-1">
                   {/* Left Arrow Hint (Only visible on Weekly) */}
                   <ChevronLeft className={`w-3 h-3 transition-opacity ${isWeekly ? 'opacity-30' : 'opacity-0'}`} />
                   
                   <span className={`text-[10px] font-bold uppercase tracking-widest ${isLow ? 'text-rose-600' : isHealthy ? 'text-emerald-600' : 'text-indigo-400'}`}>
                      {isWeekly ? 'Weekly Pace' : 'Daily Pace'}
                   </span>

                   {/* Right Arrow Hint (Only visible on Daily) */}
                   <ChevronRight className={`w-3 h-3 transition-opacity ${!isWeekly ? 'opacity-30' : 'opacity-0'}`} />
                </div>
                
                {/* Rolling Number Display (UPDATED DECIMALS) */}
                <div className="flex items-baseline justify-center gap-1 min-h-[40px]">
                   <span className={`text-3xl font-black tracking-tight ${isLow ? 'text-rose-700' : isHealthy ? 'text-emerald-700' : 'text-indigo-700'}`}>
                     <RollingNumber 
                        value={displayPace} 
                        currency={effectiveSettings.currency} 
                        decimals={2}  // <--- CHANGED TO 2 DECIMAL PLACES
                     />
                   </span>
                </div>
                
                <p className={`text-[10px] mt-2 font-medium opacity-80 px-2 min-h-[30px] ${isLow ? 'text-rose-600' : isHealthy ? 'text-emerald-600' : 'text-indigo-400'}`}>
                   {isLow ? 'Running Low! Slow down.' : isHealthy ? 'Healthy budget. Doing great!' : 'Safe spend limit.'}
                </p>

                {/* Pagination Dots (Bottom) */}
                <div className="flex justify-center gap-1.5 mt-3">
                   <button 
                     onClick={() => setPaceView('daily')}
                     className={`w-2 h-2 rounded-full transition-all ${!isWeekly ? (isLow ? 'bg-rose-400' : isHealthy ? 'bg-emerald-500' : 'bg-indigo-400') : 'bg-black/10 hover:bg-black/20'}`}
                   />
                   <button 
                     onClick={() => setPaceView('weekly')}
                     className={`w-2 h-2 rounded-full transition-all ${isWeekly ? (isLow ? 'bg-rose-400' : isHealthy ? 'bg-emerald-500' : 'bg-indigo-400') : 'bg-black/10 hover:bg-black/20'}`}
                   />
                </div>
             </div>
             {/* ----------------------------------- */}
          </div>
        </div>

        

        {/* TILE 3: ALLOCATIONS STRIP (UNIFIED GRID) */}
        {salaryNum > 0 && (
          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-200/60 mb-6 animate-in slide-in-from-bottom-4">
             
             {/* 1. Header Row (Updated with Help) */}
             <div className="flex items-center justify-between mb-6 relative z-30">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><Target className="w-4 h-4" /></div>
                   <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Your Money Map</h3>
                </div>
                
                {/* Help Icon Wrapper */}
                <div className="relative">
                   <button 
                     onClick={() => setShowMoneyMapTooltip(!showMoneyMapTooltip)}
                     className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-indigo-500 transition"
                   >
                     <HelpCircle className="w-5 h-5" />
                   </button>

                   {/* The Tooltip Popup */}
                   {showMoneyMapTooltip && (
                      <>
                        <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowMoneyMapTooltip(false)}></div>
                        <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 text-white text-xs rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 origin-top-right">
                           <div className="absolute -top-1.5 right-3 w-3 h-3 bg-slate-800 rotate-45"></div>
                           
                           <h4 className="font-bold text-sm mb-2 text-white">What is this?</h4>
                           <p className="text-slate-300 leading-relaxed mb-3">
                              This map lets you decide what to do with your remaining money once bills are paid.
                           </p>
                           
                           <button 
                             onClick={() => {
                               setShowMoneyMapTooltip(false);
                               setShowHelp(true); // Open the main Help Modal
                             }}
                             className="w-full bg-white text-slate-900 py-2 rounded-lg font-bold hover:bg-indigo-50 transition"
                           >
                             Learn More
                           </button>
                        </div>
                      </>
                   )}
                </div>
             </div>

             {/* 2. UNIFIED MONEY GRID (With Isolation Logic) */}
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                
                {/* A. MASTER CARD: CURRENT ACCOUNT */}
                {/* Logic: Show if NO slice selected OR if 'current_account' is selected. Hide if a Pot or Expenses are selected. */}
                {(!highlightedSlice || highlightedSlice === 'current_account') && (
                  <div 
                     className={`col-span-1 sm:col-span-2 md:col-span-3 relative overflow-hidden rounded-[2.5rem] p-6 text-white shadow-xl transition-all duration-500 group animate-in zoom-in-95
                        ${highlightedSlice === 'current_account' ? 'ring-4 ring-offset-2 ring-slate-200 scale-[1.02]' : ''}`}
                     style={{ backgroundColor: userSettings.bankDetails?.color || '#1e293b' }}
                  >
                     {/* Background Decoration */}
                     {/* CHANGED: effectiveSettings.bankDetails */}
                     {effectiveSettings.bankDetails?.logo && (
                        <div className="absolute -right-8 -bottom-8 opacity-10 rotate-12 group-hover:rotate-6 group-hover:scale-110 transition duration-700">
                           <img src={effectiveSettings.bankDetails.logo} className="w-56 h-56 object-contain invert" />
                        </div>
                     )}

                     <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        {/* Left: Identity */}
                        <div className="flex items-center gap-4 w-full md:w-auto">
                           <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-inner border border-white/10 shrink-0">
                              {/* CHANGED: effectiveSettings.bankDetails */}
                              {effectiveSettings.bankDetails?.logo ? (
                                 <img src={effectiveSettings.bankDetails.logo} className="w-8 h-8 object-contain rounded-full bg-white p-0.5" />
                              ) : (
                                 <Wallet className="w-8 h-8 text-white" />
                              )}
                           </div>
                           <div>
                              <h3 className="text-xl font-bold leading-tight">Keep in {effectiveSettings.bankDetails?.name || 'Current Account'}</h3>
                              <div className="flex items-center gap-2 text-sm font-medium opacity-70">
                                 <span>Do not transfer</span>
                                 <span className="w-1 h-1 bg-white rounded-full"></span>
                                 <span>{currentAccountPercent.toFixed(0)}% Allocation</span>
                              </div>
                           </div>
                        </div>

                        {/* Right: Stats (Target vs Actual) */}
                        <div className="flex items-center gap-2 md:gap-6 w-full md:w-auto justify-between md:justify-end">
                           <div className="opacity-80 text-right">
                              <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5">Target</p>
                              <p className="text-xl font-bold">{formatCurrency(currentAccountTarget, effectiveSettings.currency)}</p>
                           </div>
                           <div className="w-px h-10 bg-white/20"></div>
                           <div className="bg-black/20 px-5 py-3 rounded-2xl border border-white/5 backdrop-blur-sm shadow-lg text-right">
                              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1 text-emerald-200">Actual</p>
                              <p className="text-3xl font-black tracking-tight text-white">{formatCurrency(currentAccountActual, effectiveSettings.currency)}</p>
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                {/* B. REGULAR SAVINGS POTS */}
                {/* Logic: Filter the list based on highlightedSlice */}
                {effectiveAllocations
                  .filter(plan => !highlightedSlice || highlightedSlice === plan.id)
                  .map(plan => {
                    const target = remainder * (plan.percentage / 100);
                    const isLastToFill = (displayAllocations.length - filledPlansCount === 1);
                    
                    return (
                      <div key={plan.id} className="animate-in zoom-in-95 duration-300">
                        <AllocationCard 
                          title={plan.name} 
                          targetAmount={target}
                          actualAmount={effectiveActuals[plan.id]}
                          percentage={plan.percentage}
                          hexColor={plan.hex || '#10b981'} 
                          currency={effectiveSettings.currency}
                          onUpdateActual={(val) => updateActualSavings(plan.id, val)}
                          showRemainderButton={isLastToFill}
                          onFillRemainder={() => fillRemainder(plan.id)}
                        />
                      </div>
                  );
                })}

                {/* C. EMPTY STATE BUTTON (If no pots exist) */}
                {effectiveAllocations.length === 0 && (
                   <button 
                     onClick={() => setShowSettings(true)}
                     className="col-span-1 sm:col-span-2 min-h-[160px] flex flex-col items-center justify-center gap-3 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-500 transition-all group bg-slate-50/50"
                   >
                      <div className="bg-white group-hover:bg-indigo-100 p-4 rounded-full shadow-sm transition-colors duration-300">
                         <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="font-bold text-sm">Create your first Pot</span>
                   </button>
                )}
             </div>
          </div>
        )}

        {/* TILE 4: EXPENSES LIST (The Wide Rectangle) */}
        <SpotlightCard className="overflow-hidden min-h-[400px]">
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
             {/* --- NEW: CATEGORIZATION & COLLAPSIBLE LOGIC --- */}
             {(() => {
                // 1. Separate the expenses
                const fixed = finalExpenses.filter(e => e.type === 'fixed');
                const variable = finalExpenses.filter(e => e.type === 'variable');
                const cards = finalExpenses.filter(e => e.type === 'credit_card');
                const mortgages = finalExpenses.filter(e => e.type === 'mortgage'); // <--- ADD THIS

                // 2. Define Groups
                const groups = [
                  { id: 'mort', title: 'Mortgages', items: mortgages, defaultOpen: true }, // <--- ADD THIS
                  { id: 'fix', title: 'Fixed Bills', items: fixed, defaultOpen: true },
                  { id: 'var', title: 'One-Off Expenses', items: variable, defaultOpen: true },
                  { id: 'cc',  title: 'Credit Cards', items: cards, defaultOpen: true } 
                ];
                
                // 3. Render Groups
                return groups.map(group => (
                  group.items.length > 0 && (
                    <CollapsibleSection key={group.id} title={group.title} count={group.items.length} defaultOpen={group.defaultOpen}>
                       {group.items.map((expense) => {
                          const Icon = getExpenseIcon(expense.name);
                          const isEditing = editingExpenseId === expense.id;
                          
                          return (
                            <VacuumItem key={expense.id} onRemove={() => removeExpense(expense.id)}>
                              {(handleVacuum) => (
                                <SwipeableExpenseRow 
                                   isMobile={isMobile}
                                   onEdit={() => { triggerHaptic(); setEditingExpenseId(expense.id); }}
                                   onDelete={handleVacuum}
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
                                        {/* Updated Type Badge Logic for Credit Cards */}
                                        <p className="text-xs text-slate-400 capitalize flex items-center gap-1">
                                           <span className={`w-1.5 h-1.5 rounded-full ${expense.type === 'fixed' ? 'bg-indigo-400' : expense.type === 'credit_card' ? 'bg-purple-400' : expense.type === 'mortgage' ? 'bg-blue-500' : 'bg-emerald-400'}`}></span>
                                           {expense.type.replace('_', ' ')}
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
                                          onClick={() => { triggerHaptic(); setEditingExpenseId(expense.id); }}
                                          className={`flex items-center gap-2 hover:bg-white px-3 py-1.5 rounded-xl transition ${expense.amount === 0 ? 'bg-orange-50 ring-1 ring-orange-200 text-orange-600' : 'text-slate-700'} print:hover:bg-transparent print:p-0 print:ring-0`}
                                        >
                                          {expense.amount === 0 ? (
                                            <span className="text-sm font-bold flex items-center gap-1">
                                              Set Amount <Edit2 className="w-3 h-3" />
                                            </span>
                                          ) : (
                                            <span className="font-bold text-lg">{formatCurrency(expense.amount, effectiveSettings.currency)}</span>
                                          )}
                                        </button>
                                      )}
                                      
                                      {isEditing ? (
                                         <button onClick={() => setEditingExpenseId(null)} className="bg-emerald-500 text-white p-2 rounded-full hover:bg-emerald-600 transition shadow-lg shadow-emerald-200">
                                           <Check className="w-4 h-4" />
                                         </button>
                                      ) : (
                                        <button onClick={handleVacuum} className="text-slate-300 hover:text-red-500 transition p-2 rounded-xl hover:bg-red-50 opacity-0 group-hover:opacity-100 print:hidden hidden md:block">
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </SwipeableExpenseRow>
                              )}
                            </VacuumItem>
                          );
                       })}
                    </CollapsibleSection>
                  )
                ));
             })()}
             
             {expenses.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center justify-center">
                <div className="relative mb-6">
                   <div className="absolute inset-0 bg-emerald-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
                   <div className="relative bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                      <ShoppingCart className="w-10 h-10 text-emerald-200" />
                   </div>
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
             <span className="text-xl font-bold text-slate-800 tracking-tight">{formatCurrency(totalExpenses, effectiveSettings.currency)}</span>
          </div>
        </SpotlightCard>
        
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