import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp, orderBy, onSnapshot, updateDoc, doc, limit } from 'firebase/firestore';
import { DTRCorrectionRequest, LeaveApplication, AttendanceRecord, RequestStatus, ExchangeRequest, UserProfile } from '../types';
import { Plus, Clock, Calendar, CheckCircle, XCircle, AlertCircle, Trash2, Send, Timer, LogOut, RefreshCcw, Users } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';

const EmployeeDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [dtrRequests, setDtrRequests] = useState<DTRCorrectionRequest[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveApplication[]>([]);
  const [exchangeRequests, setExchangeRequests] = useState<ExchangeRequest[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendLoading, setAttendLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dtr' | 'leave' | 'exchange'>('dtr');
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [dtrForm, setDtrForm] = useState({ date: '', type: 'in', time: '', timeIn: '', timeOut: '', reason: '' });
  const [leaveForm, setLeaveForm] = useState({ start: '', end: '', type: 'Sick Leave', reason: '' });
  const [exchangeForm, setExchangeForm] = useState({ withId: '', withName: '', originalDate: '', exchangeDate: '', reason: '' });

  useEffect(() => {
    if (!profile) return;

    // Fetch Requests
    const dtrQuery = query(
      collection(db, 'dtr_corrections'),
      where('requesterId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );

    const leaveQuery = query(
      collection(db, 'leave_applications'),
      where('requesterId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );

    const exchangeQuery = query(
      collection(db, 'exchange_requests'),
      where('requesterId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );

    const usersQuery = query(
      collection(db, 'users'),
      where('uid', '!=', profile.uid)
    );

    // Fetch Today's Attendance
    const today = new Date();
    const attendQuery = query(
      collection(db, 'attendance'),
      where('userId', '==', profile.uid),
      where('date', '>=', startOfDay(today)),
      where('date', '<=', endOfDay(today)),
      limit(1)
    );

    const unsubDtr = onSnapshot(dtrQuery, (snapshot) => {
      setDtrRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DTRCorrectionRequest)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'dtr_corrections'));

    const unsubLeave = onSnapshot(leaveQuery, (snapshot) => {
      setLeaveRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveApplication)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'leave_applications'));

    const unsubExchange = onSnapshot(exchangeQuery, (snapshot) => {
      setExchangeRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExchangeRequest)));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'exchange_requests'));

    getDocs(usersQuery).then(snapshot => {
      setUsers(snapshot.docs.map(doc => doc.data() as UserProfile));
    }).catch(err => handleFirestoreError(err, OperationType.LIST, 'users'));

    const unsubAttend = onSnapshot(attendQuery, (snapshot) => {
      if (!snapshot.empty) {
        setTodayAttendance({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as AttendanceRecord);
      } else {
        setTodayAttendance(null);
      }
      setAttendLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'attendance'));

    return () => {
      unsubDtr();
      unsubLeave();
      unsubExchange();
      unsubAttend();
    };
  }, [profile]);

  const handleClockIn = async () => {
    if (!profile) return;
    try {
      await addDoc(collection(db, 'attendance'), {
        userId: profile.uid,
        userEmail: profile.email,
        userName: profile.displayName,
        date: serverTimestamp(),
        timeIn: serverTimestamp(),
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'attendance');
    }
  };

  const handleClockOut = async () => {
    if (!profile || !todayAttendance) return;
    try {
      await updateDoc(doc(db, 'attendance', todayAttendance.id), {
        timeOut: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'attendance');
    }
  };

  const handleDtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      const payload: any = {
        requesterId: profile.uid,
        requesterEmail: profile.email,
        requesterName: profile.displayName,
        requesterPhotoURL: profile.photoURL || '',
        date: new Date(dtrForm.date),
        correctionType: dtrForm.type,
        reason: dtrForm.reason,
        status: 'pending' as RequestStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (dtrForm.type === 'both') {
        payload.requestedTimeIn = dtrForm.timeIn;
        payload.requestedTimeOut = dtrForm.timeOut;
      } else {
        payload.requestedTime = dtrForm.time;
      }

      await addDoc(collection(db, 'dtr_corrections'), payload);
      setShowModal(false);
      setDtrForm({ date: '', type: 'in', time: '', timeIn: '', timeOut: '', reason: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'dtr_corrections');
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      await addDoc(collection(db, 'leave_applications'), {
        requesterId: profile.uid,
        requesterEmail: profile.email,
        requesterName: profile.displayName,
        requesterPhotoURL: profile.photoURL || '',
        startDate: new Date(leaveForm.start),
        endDate: new Date(leaveForm.end),
        leaveType: leaveForm.type,
        reason: leaveForm.reason,
        status: 'pending' as RequestStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setShowModal(false);
      setLeaveForm({ start: '', end: '', type: 'Sick Leave', reason: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'leave_applications');
    }
  };

  const handleExchangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      await addDoc(collection(db, 'exchange_requests'), {
        requesterId: profile.uid,
        requesterEmail: profile.email,
        requesterName: profile.displayName,
        requesterPhotoURL: profile.photoURL || '',
        exchangeWithId: exchangeForm.withId,
        exchangeWithName: exchangeForm.withName,
        originalDate: new Date(exchangeForm.originalDate),
        exchangeDate: new Date(exchangeForm.exchangeDate),
        reason: exchangeForm.reason,
        status: 'pending' as RequestStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setShowModal(false);
      setExchangeForm({ withId: '', withName: '', originalDate: '', exchangeDate: '', reason: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'exchange_requests');
    }
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'pending': return <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full"><Clock size={12} /> Pending</span>;
      case 'admin_approved': return <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-400/10 border border-blue-400/20 px-3 py-1 rounded-full"><CheckCircle size={12} /> Admin Approved</span>;
      case 'approved': return <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-full"><CheckCircle size={12} /> Final Approved</span>;
      case 'rejected': return <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full"><XCircle size={12} /> Rejected</span>;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4 animate-in fade-in duration-1000">
      {/* Attendance Section */}
      <section className="bg-white dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl overflow-hidden p-8 flex flex-col md:flex-row items-center justify-between gap-8 transition-colors duration-500">
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${todayAttendance ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30 dark:border-emerald-500/50 text-emerald-600 dark:text-emerald-400 shadow-xl shadow-emerald-500/10' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600'}`}>
            <Timer size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Duty Status</h2>
            <p className="text-2xl font-black text-slate-950 dark:text-white tracking-tighter">
              {attendLoading ? 'Verifying...' : 
               todayAttendance?.timeOut ? 'Shift Logged' :
               todayAttendance?.timeIn ? 'Currently Working' : 'Inactive'}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8 w-full md:w-auto">
          {todayAttendance?.timeIn && (
            <div className="flex gap-12 md:gap-8 md:pr-8 md:border-r border-slate-200 dark:border-slate-800">
              <div className="text-center md:text-left">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Login</p>
                <p className="text-lg font-black text-slate-950 dark:text-white tracking-tight">{format(todayAttendance.timeIn.toDate(), 'p')}</p>
              </div>
              {todayAttendance.timeOut ? (
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Logout</p>
                  <p className="text-lg font-black text-slate-950 dark:text-white tracking-tight">{format(todayAttendance.timeOut.toDate(), 'p')}</p>
                </div>
              ) : (
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-500/50 uppercase tracking-widest mb-1 animate-pulse">Session</p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-500/80 tracking-tight animate-pulse">Running</p>
                </div>
              )}
            </div>
          )}

          {!attendLoading && (
            <div className="flex-1 md:flex-none">
              {!todayAttendance ? (
                <button 
                  onClick={handleClockIn}
                  className="w-full md:w-40 py-4 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/10 dark:shadow-white/5 hover:bg-emerald-500 transition-all active:scale-95"
                >
                  Clock In
                </button>
              ) : !todayAttendance.timeOut ? (
                <button 
                  onClick={handleClockOut}
                  className="w-full md:w-40 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl dark:shadow-black/20 hover:bg-rose-500 hover:text-white hover:border-rose-400 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <LogOut size={16} /> <span>Clock Out</span>
                </button>
              ) : (
                <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-6 py-4 rounded-2xl flex items-center gap-2 uppercase tracking-widest">
                  <CheckCircle size={14} strokeWidth={3} /> Day Complete
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-950 dark:text-white tracking-tighter">Request Hub</h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">Employee Portal</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-500 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all active:scale-95"
        >
          <Plus size={20} strokeWidth={3} /> CREATE NEW
        </button>
      </div>

      <div className="flex gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl self-center md:self-start w-fit shadow-sm dark:shadow-none">
        <button 
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dtr' ? 'bg-slate-950 dark:bg-slate-800 shadow-xl text-emerald-400 border border-slate-900 dark:border-slate-700' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}
          onClick={() => setActiveTab('dtr')}
        >
          DTR Corrections
        </button>
        <button 
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'leave' ? 'bg-slate-950 dark:bg-slate-800 shadow-xl text-emerald-400 border border-slate-900 dark:border-slate-700' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}
          onClick={() => setActiveTab('leave')}
        >
          Leave Requests
        </button>
        <button 
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'exchange' ? 'bg-slate-950 dark:bg-slate-800 shadow-xl text-emerald-400 border border-slate-900 dark:border-slate-700' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}
          onClick={() => setActiveTab('exchange')}
        >
          Duty Exchange
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div></div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {activeTab === 'dtr' ? (
            dtrRequests.length > 0 ? (
              dtrRequests.map(req => (
                <div key={req.id} className="bg-white dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col md:flex-row items-center px-8 py-6 gap-8 hover:border-emerald-500/30 dark:hover:border-slate-700 transition-all group">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-2xl flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800 group-hover:border-emerald-500/30 transition-colors">
                    <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">{format(req.date.toDate(), 'MMM')}</span>
                    <span className="text-2xl font-black text-slate-950 dark:text-white tracking-tighter">{format(req.date.toDate(), 'dd')}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <h3 className="text-xl font-black text-slate-950 dark:text-white tracking-tight capitalize">{req.correctionType} Log</h3>
                      {getStatusBadge(req.status)}
                    </div>
                    <div className="flex items-center gap-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                        <Clock size={12} className="text-emerald-600 dark:text-emerald-500" /> 
                        {req.correctionType === 'both' ? `IN: ${req.requestedTimeIn} | OUT: ${req.requestedTimeOut}` : req.requestedTime}
                      </span>
                      <span className="italic normal-case font-medium text-slate-400 dark:text-slate-500 line-clamp-1 max-w-xs">{req.reason}</span>
                    </div>
                  </div>
                  <div className="text-center md:text-right">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-1">Submitted On</p>
                    <p className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{format(req.createdAt.toDate(), 'MMM dd, p')}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-24 bg-white dark:bg-slate-900/20 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                <AlertCircle className="mx-auto text-slate-300 dark:text-slate-800 mb-4" size={48} strokeWidth={1} />
                <p className="text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">Zero DTR Records Found</p>
              </div>
            )
          ) : activeTab === 'leave' ? (
            leaveRequests.length > 0 ? (
              leaveRequests.map(req => (
                <div key={req.id} className="bg-white dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col md:flex-row items-center px-8 py-6 gap-8 hover:border-emerald-500/30 dark:hover:border-slate-700 transition-all group">
                  <div className="w-16 h-16 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:border-indigo-500/40 transition-colors">
                    <Calendar size={28} />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <h3 className="text-xl font-black text-slate-950 dark:text-white tracking-tight">{req.leaveType}</h3>
                      {getStatusBadge(req.status)}
                    </div>
                    <div className="flex items-center gap-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800"><Calendar size={12} className="text-indigo-600 dark:text-indigo-400" /> {format(req.startDate.toDate(), 'MMM dd')} - {format(req.endDate.toDate(), 'MMM dd')}</span>
                      <span className="italic normal-case font-medium text-slate-400 dark:text-slate-500 line-clamp-1 max-w-xs">{req.reason}</span>
                    </div>
                  </div>
                  <div className="text-center md:text-right">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-1">Submitted On</p>
                    <p className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{format(req.createdAt.toDate(), 'MMM dd, p')}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-24 bg-white dark:bg-slate-900/20 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                <AlertCircle className="mx-auto text-slate-300 dark:text-slate-800 mb-4" size={48} strokeWidth={1} />
                <p className="text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">Zero Leave Records Found</p>
              </div>
            )
          ) : (
            exchangeRequests.length > 0 ? (
              exchangeRequests.map(req => (
                <div key={req.id} className="bg-white dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col md:flex-row items-center px-8 py-6 gap-8 hover:border-emerald-500/30 dark:hover:border-slate-700 transition-all group">
                  <div className="w-16 h-16 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/20 group-hover:border-blue-500/40 transition-colors">
                    <RefreshCcw size={28} />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <h3 className="text-xl font-black text-slate-950 dark:text-white tracking-tight">Duty with {req.exchangeWithName}</h3>
                      {getStatusBadge(req.status)}
                    </div>
                    <div className="flex items-center gap-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800"><Calendar size={12} className="text-blue-600 dark:text-blue-400" /> {format(req.exchangeDate.toDate(), 'MMM dd')} Swapped for {format(req.originalDate.toDate(), 'MMM dd')}</span>
                      <span className="italic normal-case font-medium text-slate-400 dark:text-slate-500 line-clamp-1 max-w-xs">{req.reason}</span>
                    </div>
                  </div>
                  <div className="text-center md:text-right">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-1">Submitted On</p>
                    <p className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{format(req.createdAt.toDate(), 'MMM dd, p')}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-24 bg-white dark:bg-slate-900/20 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                <AlertCircle className="mx-auto text-slate-300 dark:text-slate-800 mb-4" size={48} strokeWidth={1} />
                <p className="text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">Zero Exchange Records Found</p>
              </div>
            )
          )}
        </div>
      )}

      {/* Modal for Forms */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-10 animate-in zoom-in-95 duration-500 relative overflow-hidden transition-colors">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/[0.05] dark:bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
            
            <header className="flex items-center justify-between mb-10 relative z-10">
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-slate-950 dark:text-white tracking-tighter font-heading italic">
                  {activeTab === 'dtr' ? 'Correction' : activeTab === 'leave' ? 'Application' : 'Duty Swap'}
                </h2>
                <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest font-mono">Medical Staff Documentation</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-2xl transition-all active:scale-90"
              >
                <XCircle size={28} strokeWidth={1.5} />
              </button>
            </header>

            {activeTab === 'dtr' ? (
              <form onSubmit={handleDtrSubmit} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Log Date</label>
                    <input 
                      type="date" required 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all cursor-pointer"
                      value={dtrForm.date}
                      onChange={e => setDtrForm({...dtrForm, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Type of Correction</label>
                     <select 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
                      value={dtrForm.type}
                      onChange={e => setDtrForm({...dtrForm, type: e.target.value as any})}
                     >
                       <option value="in">Time IN Entry</option>
                       <option value="out">Time OUT Entry</option>
                       <option value="both">Both IN and OUT</option>
                     </select>
                  </div>
                </div>

                {dtrForm.type === 'both' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Corrected Time IN</label>
                      <input 
                        type="time" required
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all cursor-pointer"
                        value={dtrForm.timeIn}
                        onChange={e => setDtrForm({...dtrForm, timeIn: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Corrected Time OUT</label>
                      <input 
                        type="time" required
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all cursor-pointer"
                        value={dtrForm.timeOut}
                        onChange={e => setDtrForm({...dtrForm, timeOut: e.target.value})}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Correction Time</label>
                    <input 
                      type="time" required
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all cursor-pointer"
                      value={dtrForm.time}
                      onChange={e => setDtrForm({...dtrForm, time: e.target.value})}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Formal Justification</label>
                  <textarea 
                    required rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all resize-none"
                    placeholder="Provide a detailed official reason..."
                    value={dtrForm.reason}
                    onChange={e => setDtrForm({...dtrForm, reason: e.target.value})}
                  />
                </div>
                <button type="submit" className="w-full py-5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 transition-all flex items-center justify-center gap-3 active:scale-95">
                  <Send size={18} strokeWidth={3} /> Dispatch Correction
                </button>
              </form>
            ) : activeTab === 'leave' ? (
              <form onSubmit={handleLeaveSubmit} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Commencement Date</label>
                    <input 
                      type="date" required 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all cursor-pointer"
                      value={leaveForm.start}
                      onChange={e => setLeaveForm({...leaveForm, start: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Conclusion Date</label>
                    <input 
                      type="date" required 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all cursor-pointer"
                      value={leaveForm.end}
                      onChange={e => setLeaveForm({...leaveForm, end: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Classification of Leave</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                    value={leaveForm.type}
                    onChange={e => setLeaveForm({...leaveForm, type: e.target.value})}
                  >
                    <option>Sick Leave</option>
                    <option>Vacation Leave</option>
                    <option>Maternity/Paternity Leave</option>
                    <option>Emergency Leave</option>
                    <option>Compensatory Time Off</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Professional Reason</label>
                  <textarea 
                    required rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all resize-none"
                    placeholder="Describe the reason for the request..."
                    value={leaveForm.reason}
                    onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})}
                  />
                </div>
                <button type="submit" className="w-full py-5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-indigo-500/10 hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center gap-3 active:scale-95">
                  <Send size={18} strokeWidth={3} /> Dispatch Application
                </button>
              </form>
            ) : (
              <form onSubmit={handleExchangeSubmit} className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Swap With Personnel</label>
                  <select 
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                    value={exchangeForm.withId}
                    onChange={e => {
                      const user = users.find(u => u.uid === e.target.value);
                      setExchangeForm({ ...exchangeForm, withId: e.target.value, withName: user?.displayName || '' });
                    }}
                  >
                    <option value="">Select Personnel...</option>
                    {users.map(user => (
                      <option key={user.uid} value={user.uid}>{user.displayName}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">My Duty Date</label>
                    <input 
                      type="date" required 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all cursor-pointer"
                      value={exchangeForm.originalDate}
                      onChange={e => setExchangeForm({...exchangeForm, originalDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Exchange Date</label>
                    <input 
                      type="date" required 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all cursor-pointer"
                      value={exchangeForm.exchangeDate}
                      onChange={e => setExchangeForm({...exchangeForm, exchangeDate: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Exchange Logic/Reason</label>
                  <textarea 
                    required rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all resize-none"
                    placeholder="Provide official context for swap..."
                    value={exchangeForm.reason}
                    onChange={e => setExchangeForm({...exchangeForm, reason: e.target.value})}
                  />
                </div>
                <button type="submit" className="w-full py-5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-blue-500/10 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center gap-3 active:scale-95">
                  <Send size={18} strokeWidth={3} /> Dispatch Swap Request
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
