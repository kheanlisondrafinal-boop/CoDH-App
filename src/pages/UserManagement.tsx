import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, updateDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { UserProfile, UserRole } from '../types';
import { Users, UserPlus, Shield, Edit2, Trash2, Search, Check, X } from 'lucide-react';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('employee');

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data() } as UserProfile)));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    return unsub;
  }, []);

  const handleUpdateRole = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: editRole });
      setEditingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isApproved: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return;
    
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'users');
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4 animate-in fade-in duration-1000">
      <header className="flex flex-col gap-2 border-l-4 border-emerald-500 pl-8 py-2 animate-in slide-in-from-left duration-700">
        <div className="flex items-center gap-4">
          <Users className="text-emerald-500" size={32} strokeWidth={3} />
          <h1 className="text-4xl font-black text-slate-950 dark:text-white tracking-tighter italic">Identity Control</h1>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em]">Access Control</p>
      </header>

      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex flex-col md:flex-row gap-6 items-center">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-emerald-500 transition-colors" size={20} strokeWidth={3} />
            <input 
              type="text"
              placeholder="Filter by name or secure email..."
              className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-black text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all placeholder:text-slate-400"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="px-6 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-inner dark:shadow-none">
            {users.length} Registered Node(s)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/20 text-left border-b border-slate-100 dark:border-slate-800/50">
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.25em]">Personnel Identity</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.25em]">Clearance Level</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.25em]">Deployment</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.25em] text-right">Directives</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredUsers.map(user => (
                <tr key={user.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} className="w-12 h-12 rounded-2xl object-cover shadow-xl border border-white dark:border-slate-800 group-hover:border-emerald-500/30 transition-all" />
                      ) : (
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-950 rounded-2xl text-slate-400 dark:text-slate-500 flex items-center justify-center font-black text-lg border border-slate-200 dark:border-slate-800 group-hover:border-emerald-500/30 transition-all">
                          {user.displayName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="text-base font-black text-slate-950 dark:text-white tracking-tight">{user.displayName}</p>
                          {!user.isApproved && (
                            <span className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-lg font-black uppercase tracking-widest animate-pulse">Waitlist</span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      {editingId === user.uid ? (
                        <div className="flex items-center gap-3">
                          <select 
                            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-black text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
                            value={editRole}
                            onChange={e => setEditRole(e.target.value as UserRole)}
                          >
                            <option value="employee">Employee</option>
                            <option value="admin">Admin Officer</option>
                            <option value="chief">Chief of Hospital</option>
                            <option value="sysadmin">System Admin</option>
                          </select>
                          <div className="flex gap-1">
                            <button onClick={() => handleUpdateRole(user.uid)} className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-slate-950 transition-all"><Check size={16} strokeWidth={3} /></button>
                            <button onClick={() => setEditingId(null)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-950 dark:hover:text-white transition-all"><X size={16} strokeWidth={3} /></button>
                          </div>
                        </div>
                      ) : (
                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-inner border transition-all ${
                          user.role === 'sysadmin' ? 'bg-slate-950 dark:bg-white text-emerald-400 dark:text-slate-950 border-slate-900 dark:border-white' : 
                          user.role === 'chief' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20 shadow-emerald-500/5' :
                          user.role === 'admin' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-700'
                        }`}>
                          {user.role}
                        </span>
                      )}
                    </div>
                    {user.phoneNumber && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold italic mt-2 uppercase tracking-tighter opacity-60">{user.phoneNumber}</p>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{user.department || 'Awaiting Selection'}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3 translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      {!user.isApproved && (
                        <button 
                          onClick={() => handleApprove(user.uid)}
                          className="px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10 hover:bg-emerald-400"
                          title="Authorize Personnel"
                        >
                          <Check size={14} strokeWidth={3} /> Authorize
                        </button>
                      )}
                      <button 
                        onClick={() => { setEditingId(user.uid); setEditRole(user.role); }}
                        className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all border border-slate-200 dark:border-transparent hover:border-emerald-500/30 shadow-sm dark:shadow-xl"
                        title="Modify Credentials"
                      >
                        <Edit2 size={18} strokeWidth={2.5} />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.uid)}
                        className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all border border-slate-200 dark:border-transparent hover:border-rose-500/30 shadow-sm dark:shadow-xl"
                        title="Purge Identity"
                      >
                        <Trash2 size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
