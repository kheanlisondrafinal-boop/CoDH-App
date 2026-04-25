import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminReview from './pages/AdminReview';
import ChiefReview from './pages/ChiefReview';
import Reporting from './pages/Reporting';
import UserManagement from './pages/UserManagement';
import Navbar from './components/Navbar';
import ProfileCompletion from './components/ProfileCompletion';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading, signOut } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 transition-colors duration-500">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  
  // 1. Account Pending Approval
  if (profile && !profile.isApproved && profile.role !== 'sysadmin') return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-500">
      <div className="max-w-md w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-10 text-center border border-slate-200 dark:border-slate-800">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-500/20 shadow-xl shadow-amber-500/5">
          <span className="text-3xl font-black text-amber-500 italic">!</span>
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-50 mb-3 tracking-tighter">Access Delayed</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 font-bold text-sm leading-relaxed">Your account ({user.email}) is currently awaiting validation by the Directorate level authorization.</p>
        
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => window.location.reload()}
            className="w-full px-8 py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-2xl shadow-emerald-500/20 active:scale-[0.98]"
          >
            Refresh Status
          </button>
          <button 
            onClick={() => signOut()}
            className="w-full px-8 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
          >
            End Session
          </button>
        </div>
      </div>
    </div>
  );

  // 2. Profile Incomplete (Only if approved)
  if (profile && profile.isApproved && !profile.profileCompleted && profile.role !== 'sysadmin') {
    return <ProfileCompletion />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 flex flex-col selection:bg-emerald-500/30 transition-colors duration-500">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {children}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/requests" 
            element={
              <PrivateRoute>
                <EmployeeDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <PrivateRoute>
                <AdminReview />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/chief" 
            element={
              <PrivateRoute>
                <ChiefReview />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <PrivateRoute>
                <Reporting />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <PrivateRoute>
                <UserManagement />
              </PrivateRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
  );
}
