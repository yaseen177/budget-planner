import React, { useState, useEffect } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  query,
  orderBy,
  limit,
  where
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  Search, 
  LogOut, 
  Shield, 
  Key, 
  Eye, 
  ChevronRight, 
  ArrowLeft,
  MousePointer2,
  Lock
} from 'lucide-react';

// --- CONFIG ---
const ADMIN_EMAIL = "yaseen.hussain2001@gmail.com";
const APP_ID = 'nuha-budget-app';

export default function AdminDashboard({ user, onLogout, onExitAdmin }) {
  const [activeTab, setActiveTab] = useState('users'); // users, logs
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ totalUsers: 0, activeThisMonth: 0 });

  const db = getFirestore();
  const auth = getAuth();

  // --- SECURITY CHECK ---
  if (user?.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-3xl font-bold">Access Denied</h1>
          <p className="text-slate-400">You do not have permission to view this page.</p>
          <button onClick={onExitAdmin} className="bg-slate-800 px-6 py-2 rounded-lg hover:bg-slate-700">Go Back</button>
        </div>
      </div>
    );
  }

  // --- DATA FETCHING ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users (Iterating through the artifacts collection)
      // Note: In a real prod app, you'd use Firebase Admin SDK for listing users.
      // Here we assume every user has a document in 'users' collection.
      const usersRef = collection(db, 'artifacts', APP_ID, 'users');
      const snapshot = await getDocs(usersRef);
      
      const userData = [];
      for (const userDoc of snapshot.docs) {
        // Fetch their settings to get display name
        const settingsRef = doc(db, 'artifacts', APP_ID, 'users', userDoc.id, 'settings', 'config');
        const settingsSnap = await getDoc(settingsRef);
        
        userData.push({
          uid: userDoc.id,
          lastActive: 'Unknown', // Firestore client doesn't give metadata without custom tracking
          ...settingsSnap.data()
        });
      }
      setUsers(userData);
      setStats({ ...stats, totalUsers: userData.length });

      // 2. Fetch Logs (If you have a logs collection)
      // This part assumes you create a 'logs' collection
      try {
        const logsRef = collection(db, 'artifacts', APP_ID, 'system_logs');
        const q = query(logsRef, orderBy('timestamp', 'desc'), limit(50));
        const logsSnap = await getDocs(q);
        const logData = logsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setLogs(logData);
      } catch (e) {
        console.log("No logs collection found yet");
      }

    } catch (error) {
      console.error("Admin Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (email) => {
    if (!email) return alert("No email associated with this user data.");
    if (confirm(`Send password reset email to ${email}?`)) {
      try {
        await sendPasswordResetEmail(auth, email);
        alert("Reset email sent!");
      } catch (e) {
        alert("Error: " + e.message);
      }
    }
  };

  // --- FILTERING ---
  const filteredUsers = users.filter(u => 
    (u.displayName || 'Unknown').toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.uid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Admin Panel</h1>
              <p className="text-xs text-slate-400">Master Control</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Users className="w-5 h-5" /> Users
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'logs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Activity className="w-5 h-5" /> System Logs
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button onClick={onExitAdmin} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition">
            <ArrowLeft className="w-5 h-5" /> Back to App
          </button>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-900/20 transition">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-64 p-8">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
             <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
             <p className="text-slate-500">Welcome back, Yaseen.</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 min-w-[200px]">
                <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600"><Users className="w-6 h-6"/></div>
                <div>
                   <div className="text-2xl font-bold text-slate-800">{stats.totalUsers}</div>
                   <div className="text-xs text-slate-500 font-bold uppercase">Total Users</div>
                </div>
             </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px]">
           
           {/* -- USERS TAB -- */}
           {activeTab === 'users' && (
             <div className="p-6">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-lg text-slate-700">User Management</h3>
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search users..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                 </div>
               </div>

               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                     <tr>
                       <th className="px-6 py-4 rounded-tl-xl">User</th>
                       <th className="px-6 py-4">Currency</th>
                       <th className="px-6 py-4">UID</th>
                       <th className="px-6 py-4 text-right rounded-tr-xl">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {filteredUsers.map((u) => (
                       <tr key={u.uid} className="hover:bg-slate-50 transition">
                         <td className="px-6 py-4">
                           <div className="font-bold text-slate-800">{u.displayName || 'Unnamed User'}</div>
                           <div className="text-xs text-slate-400">Email hidden by Firestore</div>
                         </td>
                         <td className="px-6 py-4">
                           <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">{u.currency || 'GBP'}</span>
                         </td>
                         <td className="px-6 py-4 font-mono text-xs text-slate-400">{u.uid}</td>
                         <td className="px-6 py-4 text-right flex justify-end gap-2">
                            <button 
                              onClick={() => handlePasswordReset('USER_EMAIL_HERE')} 
                              className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg transition" 
                              title="Send Password Reset"
                            >
                               <Key className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition" title="View Data">
                               <Eye className="w-4 h-4" />
                            </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 {filteredUsers.length === 0 && <div className="p-10 text-center text-slate-400">No users found.</div>}
               </div>
               <div className="mt-4 p-4 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-100">
                  <strong>Note:</strong> Due to Firestore client security, you cannot read user emails directly unless you store them in the database when they sign up. The password reset button will require you to manually know the email or implement email storage in your main app.
               </div>
             </div>
           )}

           {/* -- LOGS TAB -- */}
           {activeTab === 'logs' && (
             <div className="p-6">
                <h3 className="font-bold text-lg text-slate-700 mb-6">Activity Logs</h3>
                <div className="space-y-2">
                   {logs.length === 0 ? (
                     <div className="text-center py-20 text-slate-400">
                       <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                       <p>No logs recorded yet.</p>
                       <p className="text-xs">You need to implement the logger utility in the main app.</p>
                     </div>
                   ) : (
                     logs.map(log => (
                       <div key={log.id} className="flex items-center justify-between p-3 border-b border-slate-50 hover:bg-slate-50 transition">
                          <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-lg ${log.type === 'login' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                {log.type === 'login' ? <Lock className="w-4 h-4" /> : <MousePointer2 className="w-4 h-4" />}
                             </div>
                             <div>
                                <div className="font-bold text-slate-700 text-sm">{log.action}</div>
                                <div className="text-xs text-slate-400">{log.userEmail || 'Anonymous'}</div>
                             </div>
                          </div>
                          <div className="text-xs font-mono text-slate-400">
                             {new Date(log.timestamp?.seconds * 1000).toLocaleString()}
                          </div>
                       </div>
                     ))
                   )}
                </div>
             </div>
           )}

        </div>
      </main>
    </div>
  );
}