import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, getDocs, orderBy, where, limit } from 'firebase/firestore';
import { LeaveApplication, DTRCorrectionRequest, AttendanceRecord, UserProfile } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import { BarChart2, TrendingUp, Users, Calendar, Filter, Clock } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#ef4444'];

const Reporting: React.FC = () => {
  const [leaveData, setLeaveData] = useState<LeaveApplication[]>([]);
  const [dtrData, setDtrData] = useState<DTRCorrectionRequest[]>([]);
  const [attendData, setAttendData] = useState<AttendanceRecord[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const leaveSnapshot = await getDocs(query(collection(db, 'leave_applications'), orderBy('createdAt', 'desc')));
        const dtrSnapshot = await getDocs(query(collection(db, 'dtr_corrections'), orderBy('createdAt', 'desc')));
        const usersSnapshot = await getDocs(collection(db, 'users'));
        
        const sevenDaysAgo = subDays(new Date(), 7);
        const attendSnapshot = await getDocs(query(
          collection(db, 'attendance'),
          where('date', '>=', startOfDay(sevenDaysAgo))
        ));
        
        setLeaveData(leaveSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveApplication)));
        setDtrData(dtrSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DTRCorrectionRequest)));
        setAttendData(attendSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord)));
        setTotalUsers(usersSnapshot.size);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'reports');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const leaveByType = leaveData.reduce((acc: any, curr) => {
    acc[curr.leaveType] = (acc[curr.leaveType] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(leaveByType).map(key => ({
    name: key,
    value: leaveByType[key]
  }));

  const requestsByMonth = leaveData.concat(dtrData as any).reduce((acc: any, curr: any) => {
    if (!curr.createdAt) return acc;
    const month = format(curr.createdAt.toDate(), 'MMM yyyy');
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.keys(requestsByMonth).map(key => ({
    month: key,
    count: requestsByMonth[key]
  })).reverse();

  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  });

  const attendTrendData = last7Days.map(day => {
    const count = attendData.filter(a => isSameDay(a.date.toDate(), day)).length;
    return {
      date: format(day, 'MMM dd'),
      count
    };
  });

  const todayCount = attendData.filter(a => isSameDay(a.date.toDate(), new Date())).length;

  if (loading) return <div className="flex justify-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div></div>;

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 max-w-7xl mx-auto py-4">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-l-4 border-emerald-500 pl-8 transition-all duration-700">
        <div>
          <h1 className="text-5xl font-black text-slate-950 dark:text-white tracking-tighter mb-2 italic">Personnel Intel</h1>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em]">Operational Analytics</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-3 px-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm dark:shadow-xl dark:shadow-black/40">
            <Filter size={16} /> Filter Dataset
          </button>
          <button className="flex items-center gap-3 px-6 py-3.5 bg-emerald-500 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-2xl shadow-emerald-500/20 active:scale-95">
            Snapshot Report
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Personnel', value: `${todayCount} / ${totalUsers}`, icon: Users, color: 'text-emerald-600 dark:text-emerald-500', bg: 'bg-emerald-500/[0.03] dark:bg-emerald-500/5', border: 'border-emerald-500/20 dark:border-emerald-500/20' },
          { label: 'Workforce Velocity', value: `${Math.round((todayCount / (totalUsers || 1)) * 100)}%`, icon: TrendingUp, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-400/[0.03] dark:bg-blue-400/5', border: 'border-blue-400/20 dark:border-blue-400/20' },
          { label: 'Authorized Leave', value: leaveData.filter(l => l.status === 'approved').length, icon: Calendar, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-400/[0.03] dark:bg-indigo-400/5', border: 'border-indigo-400/20 dark:border-indigo-400/20' },
          { label: 'Pending Validations', value: dtrData.filter(d => d.status === 'pending').length, icon: Clock, color: 'text-amber-600 dark:text-amber-500', bg: 'bg-amber-500/[0.03] dark:bg-amber-500/5', border: 'border-amber-500/20 dark:border-amber-500/20' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} ${stat.border} p-8 rounded-[2rem] border shadow-xl dark:shadow-2xl flex flex-col justify-between group hover:scale-[1.02] transition-all duration-300`}>
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.25em] mb-4 flex items-center justify-between">
              {stat.label}
              <stat.icon size={16} className={`${stat.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
            </div>
            <div className={`text-4xl font-black ${stat.color} tracking-tighter`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl overflow-hidden min-h-[420px] flex flex-col group hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="px-10 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Workforce Presence Trend</h3>
          </div>
          <div className="p-10 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)', fontSize: '10px', fontWeight: 800, color: '#fff'}}
                  itemStyle={{color: '#10b981'}}
                />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={4} dot={{r: 5, fill: '#10b981', strokeWidth: 0}} activeDot={{r: 8, fill: '#fff'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl overflow-hidden min-h-[420px] flex flex-col group hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="px-10 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Operational Request Volume</h3>
          </div>
          <div className="p-10 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9', opacity: 0.4}}
                  contentStyle={{backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)', fontSize: '10px', fontWeight: 800, color: '#fff'}}
                  itemStyle={{color: '#3b82f6'}}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl overflow-hidden min-h-[450px] flex flex-col lg:col-span-2 group hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="px-10 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
             <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Leave Classification Matrix</h3>
          </div>
          <div className="p-10 flex-1 flex flex-col md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2 h-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{backgroundColor: '#0f172a', borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)', fontSize: '10px', fontWeight: 800, color: '#fff'}}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-6 px-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {pieData.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between group/item">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{backgroundColor: COLORS[i % COLORS.length]}} shadow-inner />
                      <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider group-hover/item:text-slate-950 dark:group-hover/item:text-white transition-colors">{entry.name}</span>
                    </div>
                    <span className="text-base font-black text-slate-950 dark:text-white italic">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function
function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

export default Reporting;
