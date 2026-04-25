import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

const Login: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  if (user && profile) return <Navigate to="/" />;

  const handleLogin = async () => {
    if (isLoggingIn) return;
    try {
      setIsLoggingIn(true);
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error("Login failed:", error);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 sm:p-12 animate-in fade-in duration-1000 relative overflow-hidden transition-colors duration-500">
      {/* Ambient background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/[0.03] dark:bg-emerald-500/5 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/[0.03] dark:bg-blue-500/5 rounded-full blur-[128px]" />
      
      <div className="w-full max-w-[400px] relative z-10">
        <div className="text-center mb-12 flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 dark:border-emerald-500/30 rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/5 dark:shadow-emerald-500/10 transition-all">
            <LogIn size={32} className="text-emerald-600 dark:text-emerald-500" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-950 dark:text-slate-50 tracking-tighter mb-3">
            CoDH <span className="text-emerald-500">App</span>
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-500 font-black uppercase tracking-[0.25em] mb-2">DTR & Leave Management</p>
        </div>

        <div className="bg-white dark:bg-slate-900/40 backdrop-blur-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-8 md:p-10 text-center relative overflow-hidden group transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="space-y-8 relative z-10">
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-950 dark:text-slate-50 tracking-tight">Authorized Personnel</h2>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">Global Authentication Required</p>
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-4 py-5 px-6 bg-slate-950 dark:bg-slate-950 text-white hover:bg-emerald-500 hover:text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-black transition-all active:scale-[0.97] border border-slate-800 hover:border-emerald-400 shadow-2xl text-[10px] uppercase tracking-widest group/btn"
            >
              {isLoggingIn ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 grayscale group-hover/btn:grayscale-0 transition-all" />
              )}
              {isLoggingIn ? 'Verifying Account...' : 'Continue with email'}
            </button>

            <div className="pt-4">
              <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-bold uppercase tracking-wider opacity-60">
                Unauthorized access is strictly monitored and subject to disciplinary action.
              </p>
            </div>
          </div>
        </div>
        
        <footer className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm dark:shadow-none">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">
              System Online &bull; v2.0.4
            </span>
          </div>
          <p className="mt-8 text-[9px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-[0.3em] italic">
            &copy; {new Date().getFullYear()} Coron District Hospital
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Login;
