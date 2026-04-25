import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, ClipboardCheck, History, BarChart2, Settings, ShieldCheck, Bell } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AnimatePresence, motion } from 'motion/react';

const Navbar: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [notification, setNotification] = useState<string | null>(null);
  const lastCounts = useRef<{ dtr: number; leave: number; exchange: number }>({ dtr: 0, leave: 0, exchange: 0 });
  const isFirstRun = useRef(true);

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.exponentialRampToValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.exponentialRampToValueAtTime(783.99, audioContext.currentTime + 0.3); // G5

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (e) {
      console.warn("Audio feedback suppressed by browser policy");
    }
  };

  useEffect(() => {
    if (!profile || (profile.role !== 'admin' && profile.role !== 'chief' && profile.role !== 'sysadmin')) return;

    const statusToWatch = profile.role === 'chief' ? 'admin_approved' : 'pending';
    
    const dtrQuery = query(collection(db, 'dtr_corrections'), where('status', '==', statusToWatch));
    const leaveQuery = query(collection(db, 'leave_applications'), where('status', '==', statusToWatch));
    const exchangeQuery = query(collection(db, 'exchange_requests'), where('status', '==', statusToWatch));

    const showNotify = (msg: string) => {
      setNotification(msg);
      playNotificationSound();
      setTimeout(() => setNotification(null), 5000);
    };

    const unsubDtr = onSnapshot(dtrQuery, (snapshot) => {
      const count = snapshot.docs.length;
      if (!isFirstRun.current && count > lastCounts.current.dtr) {
        showNotify(`${count - lastCounts.current.dtr} new DTR Correction request(s)`);
      }
      lastCounts.current.dtr = count;
    });

    const unsubLeave = onSnapshot(leaveQuery, (snapshot) => {
      const count = snapshot.docs.length;
      if (!isFirstRun.current && count > lastCounts.current.leave) {
        showNotify(`${count - lastCounts.current.leave} new Leave Application(s)`);
      }
      lastCounts.current.leave = count;
    });

    const unsubExchange = onSnapshot(exchangeQuery, (snapshot) => {
      const count = snapshot.docs.length;
      if (!isFirstRun.current && count > lastCounts.current.exchange) {
        showNotify(`${count - lastCounts.current.exchange} new Duty Exchange request(s)`);
      }
      lastCounts.current.exchange = count;
    });

    // Mark first run as complete after a short delay to allow initial snapshots to settle
    const timer = setTimeout(() => {
      isFirstRun.current = false;
    }, 2000);

    return () => {
      unsubDtr();
      unsubLeave();
      unsubExchange();
      clearTimeout(timer);
    };
  }, [profile]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 flex items-center shadow-xl dark:shadow-2xl transition-colors duration-500">
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] w-full max-w-md px-4"
          >
            <div className="bg-slate-950 dark:bg-white text-white dark:text-slate-950 p-4 rounded-2xl shadow-2xl border border-white/10 dark:border-slate-200 flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-950 shrink-0">
                <Bell size={20} className="animate-bounce" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">New System Alert</p>
                <p className="text-sm font-black tracking-tight">{notification}</p>
              </div>
              <button 
                onClick={() => setNotification(null)}
                className="p-2 hover:bg-white/10 dark:hover:bg-slate-950/10 rounded-lg transition-colors"
              >
                <LogOut size={16} className="rotate-90" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/5">
                <ShieldCheck size={20} className="text-emerald-500" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-xl md:text-2xl font-black text-slate-950 dark:text-white tracking-tighter leading-none">
                  CoDH <span className="text-emerald-500">App</span>
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {profile && (
              <div className="hidden md:flex items-center gap-8 mr-8">
                {profile.role === 'employee' && (
                  <Link to="/requests" className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest">
                    <History size={16} strokeWidth={2.5} />
                    <span>My Requests</span>
                  </Link>
                )}
                {(profile.role === 'admin' || profile.role === 'sysadmin') && (
                  <Link to="/admin" className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest">
                    <ClipboardCheck size={16} strokeWidth={2.5} />
                    <span>Review Queue</span>
                  </Link>
                )}
                {profile.role === 'chief' && (
                  <Link to="/chief" className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest">
                    <ShieldCheck size={16} strokeWidth={2.5} />
                    <span>Sign-offs</span>
                  </Link>
                )}
                {(profile.role === 'admin' || profile.role === 'sysadmin') && (
                   <Link to="/reports" className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest">
                    <BarChart2 size={16} strokeWidth={2.5} />
                    <span>Reporting</span>
                  </Link>
                )}
                 {profile.role === 'sysadmin' && (
                  <Link to="/settings" className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest">
                    <Settings size={16} strokeWidth={2.5} />
                    <span>Management</span>
                  </Link>
                )}
              </div>
            )}

            <div className="flex items-center gap-4 pl-8 border-l border-slate-200 dark:border-slate-800">
              <ThemeToggle />
              
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-black text-slate-950 dark:text-white tracking-tight leading-none mb-1">{profile?.displayName}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {profile?.role}
                </span>
              </div>
              
              <div className="h-10 w-10 flex items-center justify-center p-0.5 rounded-full bg-gradient-to-tr from-emerald-500 to-blue-500 overflow-hidden shadow-lg">
                {profile?.photoURL ? (
                  <img 
                    src={profile.photoURL} 
                    alt="" 
                    className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                    <UserIcon size={18} className="text-slate-400 dark:text-slate-500" />
                  </div>
                )}
              </div>

              <button
                onClick={handleSignOut}
                className="p-3 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all"
                title="Sign Out"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
