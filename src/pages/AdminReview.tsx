import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, updateDoc, doc, onSnapshot, serverTimestamp, orderBy } from 'firebase/firestore';
import { DTRCorrectionRequest, LeaveApplication, RequestStatus, ExchangeRequest } from '../types';
import { Check, X, Clock, User, MessageCircle, AlertCircle, Calendar, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';

const AdminReview: React.FC = () => {
  const { profile } = useAuth();
  const [dtrRequests, setDtrRequests] = useState<DTRCorrectionRequest[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveApplication[]>([]);
  const [exchangeRequests, setExchangeRequests] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dtr' | 'leave' | 'exchange'>('dtr');

  useEffect(() => {
    if (!profile) return;

    // Admins see all pending and admin_approved (for status tracking)
    // But primarily they review 'pending'
    const dtrQuery = query(
      collection(db, 'dtr_corrections'),
      where('status', 'in', ['pending', 'admin_approved']),
      orderBy('createdAt', 'desc')
    );

    const leaveQuery = query(
      collection(db, 'leave_applications'),
      where('status', 'in', ['pending', 'admin_approved']),
      orderBy('createdAt', 'desc')
    );

    const exchangeQuery = query(
      collection(db, 'exchange_requests'),
      where('status', 'in', ['pending', 'admin_approved']),
      orderBy('createdAt', 'desc')
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

    return () => {
      unsubDtr();
      unsubLeave();
      unsubExchange();
    };
  }, [profile]);

  const handleAction = async (id: string, type: 'dtr' | 'leave' | 'exchange', status: 'admin_approved' | 'rejected') => {
    if (!profile) return;
    const collections = {
      dtr: 'dtr_corrections',
      leave: 'leave_applications',
      exchange: 'exchange_requests'
    };
    const collectionName = collections[type];
    try {
      await updateDoc(doc(db, collectionName, id), {
        status,
        adminId: profile.uid,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, collectionName);
    }
  };

  const getStatusDisplay = (status: RequestStatus) => {
    if (status === 'pending') return <span className="text-amber-500 font-black text-[9px] uppercase tracking-[0.2em] bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full animate-pulse">Pending Review</span>;
    if (status === 'admin_approved') return <span className="text-blue-400 font-black text-[9px] uppercase tracking-[0.2em] bg-blue-400/10 border border-blue-400/20 px-3 py-1 rounded-full text-center">Awaiting Chief Endorsement</span>;
    return null;
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4 animate-in fade-in duration-1000">
      <header className="flex flex-col gap-2 border-l-4 border-emerald-500 pl-8 py-2 animate-in slide-in-from-left duration-700">
        <h1 className="text-4xl font-black text-slate-950 dark:text-white tracking-tighter">Review Queue</h1>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest opacity-80 italic">Personnel Verification Pipeline</p>
      </header>

      <div className="flex gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl self-center md:self-start w-fit shadow-sm dark:shadow-none">
        <button 
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dtr' ? 'bg-slate-950 dark:bg-slate-800 shadow-xl text-emerald-400 border border-slate-900 dark:border-slate-700' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}
          onClick={() => setActiveTab('dtr')}
        >
          DTR Requests ({dtrRequests.filter(r => r.status === 'pending').length})
        </button>
        <button 
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'leave' ? 'bg-slate-950 dark:bg-slate-800 shadow-xl text-emerald-400 border border-slate-900 dark:border-slate-700' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}
          onClick={() => setActiveTab('leave')}
        >
          Leave Applications ({leaveRequests.filter(r => r.status === 'pending').length})
        </button>
        <button 
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'exchange' ? 'bg-slate-950 dark:bg-slate-800 shadow-xl text-emerald-400 border border-slate-900 dark:border-slate-700' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}
          onClick={() => setActiveTab('exchange')}
        >
          Duty Swaps ({exchangeRequests.filter(r => r.status === 'pending').length})
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div></div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {activeTab === 'dtr' ? (
            dtrRequests.length > 0 ? (
              dtrRequests.map(req => (
                <div key={req.id} className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl overflow-hidden flex flex-col group transition-all duration-300 hover:border-emerald-500/30 dark:hover:border-slate-700">
                  <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {req.requesterPhotoURL ? (
                        <img src={req.requesterPhotoURL} alt="" className="w-12 h-12 rounded-2xl object-cover shadow-2xl border border-white dark:border-slate-800" />
                      ) : (
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 text-emerald-600 dark:text-emerald-500 rounded-2xl flex items-center justify-center font-black text-xs border border-slate-200 dark:border-slate-800">D</div>
                      )}
                      <div>
                        <p className="text-base font-black text-slate-950 dark:text-white tracking-tight">{req.requesterName}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{req.requesterEmail}</p>
                      </div>
                    </div>
                    {getStatusDisplay(req.status)}
                  </div>
                  <div className="p-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center md:text-left">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-2">Log Date</p>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{format(req.date.toDate(), 'PPP')}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-2">Correction</p>
                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">{req.correctionType} Entry</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-2">Correction Time</p>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-300 tracking-widest">
                          {req.correctionType === 'both' ? `IN: ${req.requestedTimeIn} | OUT: ${req.requestedTimeOut}` : req.requestedTime}
                        </p>
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-2">Justification</p>
                        <p className="text-xs text-slate-500 italic font-medium leading-relaxed font-serif">"{req.reason}"</p>
                      </div>
                    </div>

                    {req.status === 'pending' && (
                      <div className="flex flex-col md:flex-row gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800/50">
                        <button 
                          onClick={() => handleAction(req.id, 'dtr', 'admin_approved')}
                          className="flex-1 py-4 bg-emerald-500 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/10 hover:bg-emerald-400 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                          <Check size={18} strokeWidth={3} /> Endorse Request
                        </button>
                        <button 
                          onClick={() => handleAction(req.id, 'dtr', 'rejected')}
                          className="px-8 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 dark:hover:bg-rose-500/10 hover:text-white dark:hover:text-rose-500 hover:border-rose-500 transition-all active:scale-[0.98]"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-24 bg-slate-50 dark:bg-slate-900/20 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                <AlertCircle className="mx-auto text-slate-300 dark:text-slate-800 mb-4" size={48} strokeWidth={1} />
                <p className="text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">Zero Attendance Queries Found</p>
              </div>
            )
          ) : activeTab === 'leave' ? (
            leaveRequests.length > 0 ? (
              leaveRequests.map(req => (
                <div key={req.id} className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl overflow-hidden flex flex-col group transition-all duration-300 hover:border-emerald-500/30 dark:hover:border-slate-700">
                  <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {req.requesterPhotoURL ? (
                        <img src={req.requesterPhotoURL} alt="" className="w-12 h-12 rounded-2xl object-cover shadow-2xl border border-white dark:border-slate-800" />
                      ) : (
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center font-black text-xs border border-slate-200 dark:border-slate-800">L</div>
                      )}
                      <div>
                        <p className="text-base font-black text-slate-950 dark:text-white tracking-tight">{req.requesterName}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{req.requesterEmail}</p>
                      </div>
                    </div>
                    {getStatusDisplay(req.status)}
                  </div>
                  <div className="p-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center md:text-left">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-2">Duration Period</p>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{format(req.startDate.toDate(), 'MMM dd')} - {format(req.endDate.toDate(), 'MMM dd')}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-2">Classification</p>
                        <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{req.leaveType}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-2">Professional Reason</p>
                        <p className="text-xs text-slate-500 italic font-medium leading-relaxed font-serif">"{req.reason}"</p>
                      </div>
                    </div>

                    {req.status === 'pending' && (
                      <div className="flex flex-col md:flex-row gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800/50">
                        <button 
                          onClick={() => handleAction(req.id, 'leave', 'admin_approved')}
                          className="flex-1 py-4 bg-emerald-500 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/10 hover:bg-emerald-400 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                          <Check size={18} strokeWidth={3} /> Endorse Application
                        </button>
                        <button 
                          onClick={() => handleAction(req.id, 'leave', 'rejected')}
                          className="px-8 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 dark:hover:bg-rose-500/10 hover:text-white dark:hover:text-rose-500 hover:border-rose-500 transition-all active:scale-[0.98]"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-24 bg-slate-50 dark:bg-slate-900/20 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                <AlertCircle className="mx-auto text-slate-300 dark:text-slate-800 mb-4" size={48} strokeWidth={1} />
                <p className="text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">Zero Leave Records Found</p>
              </div>
            )
          ) : (
            exchangeRequests.length > 0 ? (
              exchangeRequests.map(req => (
                <div key={req.id} className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl overflow-hidden flex flex-col group transition-all duration-300 hover:border-emerald-500/30 dark:hover:border-slate-700">
                  <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {req.requesterPhotoURL ? (
                        <img src={req.requesterPhotoURL} alt="" className="w-12 h-12 rounded-2xl object-cover shadow-2xl border border-white dark:border-slate-800" />
                      ) : (
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center font-black text-xs border border-slate-200 dark:border-slate-800">E</div>
                      )}
                      <div>
                        <p className="text-base font-black text-slate-950 dark:text-white tracking-tight">{req.requesterName}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{req.requesterEmail}</p>
                      </div>
                    </div>
                    {getStatusDisplay(req.status)}
                  </div>
                  <div className="p-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center md:text-left">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-2">My Duty Date</p>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{format(req.originalDate.toDate(), 'MMM dd')}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-2">Swapping With</p>
                        <p className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{req.exchangeWithName}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-2">Exchange Date</p>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{format(req.exchangeDate.toDate(), 'MMM dd')}</p>
                      </div>
                      <div className="">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-2">Justification</p>
                        <p className="text-xs text-slate-500 italic font-medium leading-relaxed font-serif">"{req.reason}"</p>
                      </div>
                    </div>

                    {req.status === 'pending' && (
                      <div className="flex flex-col md:flex-row gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800/50">
                        <button 
                          onClick={() => handleAction(req.id, 'exchange', 'admin_approved')}
                          className="flex-1 py-4 bg-emerald-500 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/10 hover:bg-emerald-400 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                          <Check size={18} strokeWidth={3} /> Endorse Swap
                        </button>
                        <button 
                          onClick={() => handleAction(req.id, 'exchange', 'rejected')}
                          className="px-8 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 dark:hover:bg-rose-500/10 hover:text-white dark:hover:text-rose-500 hover:border-rose-500 transition-all active:scale-[0.98]"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-24 bg-slate-50 dark:bg-slate-900/20 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                <AlertCircle className="mx-auto text-slate-300 dark:text-slate-800 mb-4" size={48} strokeWidth={1} />
                <p className="text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">Zero Exchange Records Found</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default AdminReview;
