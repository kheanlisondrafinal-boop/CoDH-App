import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  FileEdit, 
  Calendar, 
  CheckSquare, 
  BarChart, 
  Users, 
  Clock, 
  FileText,
  ChevronRight,
  RefreshCcw
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();

  const roleConfigs = {
    employee: [
      { label: 'DTR Correction', icon: <FileEdit size={24} />, path: '/requests', color: 'bg-blue-500', desc: 'Missed login or logout correction' },
      { label: 'Leave Application', icon: <Calendar size={24} />, path: '/requests', color: 'bg-indigo-500', desc: 'Request for vacation or sick leave' },
      { label: 'Duty Exchange', icon: <RefreshCcw size={24} />, path: '/requests', color: 'bg-blue-500', desc: 'Swap shift with other personnel' },
    ],
    admin: [
      { label: 'Review Queue', icon: <CheckSquare size={24} />, path: '/admin', color: 'bg-emerald-500', desc: 'Approve or reject pending requests' },
      { label: 'Reporting', icon: <BarChart size={24} />, path: '/reports', color: 'bg-violet-500', desc: 'Attendance and leave trends' },
    ],
    chief: [
      { label: 'Final Approval', icon: <CheckSquare size={24} />, path: '/chief', color: 'bg-amber-500', desc: 'Final sign-off for corrections and leave' },
    ],
    sysadmin: [
      { label: 'Review Queue', icon: <CheckSquare size={24} />, path: '/admin', color: 'bg-emerald-500', desc: 'Approve or reject pending requests' },
      { label: 'Reporting', icon: <BarChart size={24} />, path: '/reports', color: 'bg-violet-500', desc: 'Attendance and leave trends' },
      { label: 'User Accounts', icon: <Users size={24} />, path: '/settings', color: 'bg-rose-500', desc: 'Manage system users and roles' },
    ],
  };

  const activeLinks = roleConfigs[profile?.role || 'employee'];

  return (
    <div className="space-y-10 max-w-5xl mx-auto py-4">
      <header className="flex flex-col gap-2 border-l-4 border-emerald-500 pl-8 py-2 animate-in slide-in-from-left duration-700">
        <h1 className="text-4xl font-black text-slate-950 dark:text-white tracking-tighter">
          Good morning, <span className="text-emerald-500">{profile?.displayName?.split(' ')[0]}</span>!
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold tracking-tight uppercase text-[10px] tracking-[0.15em]">Hospital Portal &bull; Medical Services Administration</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeLinks.map((link, idx) => (
          <Link 
            key={link.label}
            to={link.path}
            style={{ animationDelay: `${idx * 100}ms` }}
            className="group relative bg-white dark:bg-slate-900/50 backdrop-blur-xl p-5 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-500 flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 shadow-xl dark:shadow-2xl shadow-slate-200 dark:shadow-black/20"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${link.color} bg-opacity-20 border border-current`}>
              {React.cloneElement(link.icon as React.ReactElement, { className: "text-slate-950 dark:text-white", size: 20 })}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-950 dark:text-white mb-1 tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors uppercase text-[12px]">{link.label}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold leading-relaxed line-clamp-2">{link.desc}</p>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 font-black text-[9px] uppercase tracking-widest bg-emerald-500/10 px-4 py-2 rounded-xl self-start group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all active:scale-95">
              Launch <ChevronRight size={12} strokeWidth={3} />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
        <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 relative overflow-hidden group shadow-xl dark:shadow-none">
          <div className="relative z-10">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 border border-blue-500/30">
              <FileText size={18} />
            </div>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white mb-3 tracking-tighter uppercase text-[14px]">Support Desk</h2>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mb-8 max-w-xs leading-relaxed uppercase tracking-wider opacity-60">Admin team available for medical staff assistance.</p>
            <a 
              href="mailto:sysadmin@hospital.com?subject=Technical Assistance Request"
              className="inline-flex px-6 py-3.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-black rounded-xl hover:bg-emerald-500 transition-all active:scale-95 text-[10px] uppercase tracking-widest shadow-xl shadow-black/10 dark:shadow-white/5"
            >
              Contact Support
            </a>
          </div>
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] group-hover:bg-blue-500/20 transition-all duration-1000"></div>
          <div className="absolute top-10 right-10 text-slate-200 dark:text-slate-800 opacity-10">
            <FileText size={140} strokeWidth={1} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 gap-8 flex flex-col shadow-xl dark:shadow-2xl shadow-slate-200 dark:shadow-black/40">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-950 dark:text-white tracking-tighter uppercase text-[14px]">Live Notices</h3>
              <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em]">Broadcast Messages</p>
            </div>
            <span className="text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-1 rounded-full tracking-widest animate-pulse">Updated Live</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 hover:bg-white dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-800/50 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 cursor-pointer group">
                <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-500 border border-slate-200 dark:border-slate-800 group-hover:border-emerald-500/50 transition-all flex-shrink-0">
                  <Clock size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-950 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors uppercase">System maintenance</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold leading-relaxed line-clamp-2">Scheduled maintenance this Sunday at 2 AM.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
