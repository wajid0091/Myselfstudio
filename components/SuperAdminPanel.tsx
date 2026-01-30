
import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { ref, onValue, update, remove, push, off, get } from 'firebase/database';
import { UserProfile, CommunityProject, Transaction, CreatorApplication, PaymentMethod, PlanConfig, Suggestion } from '../types';
import { 
    X, Trash2, User, Database, CreditCard, Briefcase, Settings, Plus, DollarSign, Edit2, 
    LayoutDashboard, Search, Check, Ban, Menu, Loader2, ArrowRight, Heart, Save, ToggleLeft, ToggleRight, Lock, Unlock, ShieldAlert, Zap
} from 'lucide-react';
import JSZip from 'jszip';
import { useAuth } from '../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SuperAdminPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'projects' | 'payments' | 'suggestions' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Updated admin email: mbhia78@gmail.com
  const isAdminAuthorized = user?.email === 'mbhia78@gmail.com';

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [projects, setProjects] = useState<CommunityProject[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  
  const [newSugg, setNewSugg] = useState({ label: '', prompt: '', order: 0 });

  useEffect(() => {
    if (!isOpen || !isAdminAuthorized) return;

    const refs = {
        users: ref(db, 'users'),
        projects: ref(db, 'community_projects'),
        payments: ref(db, 'pending_approvals'),
        suggestions: ref(db, 'system_settings/suggestions')
    };

    onValue(refs.users, (s) => {
        if(s.exists()) setUsers(Object.values(s.val()).map((u: any) => u.profile).filter(Boolean));
    });

    onValue(refs.projects, (s) => {
        if(s.exists()) setProjects(Object.entries(s.val()).map(([id, v]: [string, any]) => ({...v, id})));
    });

    onValue(refs.payments, (s) => {
        if(s.exists()) setTransactions(Object.entries(s.val()).map(([id, v]: [string, any]) => ({...v, id})));
    });

    onValue(refs.suggestions, (s) => {
        if(s.exists()) setSuggestions(Object.entries(s.val()).map(([id, v]: [string, any]) => ({...v, id})));
    });

    return () => Object.values(refs).forEach(r => off(r));
  }, [isOpen, isAdminAuthorized]);

  const handleAddSugg = async () => {
      if(!newSugg.label || !newSugg.prompt) return;
      await push(ref(db, 'system_settings/suggestions'), newSugg);
      setNewSugg({ label: '', prompt: '', order: 0 });
  };

  const handleDelSugg = async (id: string) => {
      await remove(ref(db, `system_settings/suggestions/${id}`));
  };

  const handleUpdateLikes = async (id: string) => {
      const input = prompt("Enter new likes count:");
      if(input) await update(ref(db, `community_projects/${id}`), { likes: parseInt(input) });
  };

  if (!isOpen) return null;
  if (!isAdminAuthorized) return <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center p-10 text-center text-red-500 font-black">ACCESS DENIED. AUTHORIZED PERSONNEL ONLY.</div>;

  const SidebarContent = () => (
    <div className="flex flex-col gap-2">
        {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Stats' },
            { id: 'users', icon: User, label: 'Users' },
            { id: 'projects', icon: Database, label: 'Projects' },
            { id: 'suggestions', icon: Zap, label: 'Suggestions' },
            { id: 'payments', icon: CreditCard, label: 'Payments' },
        ].map(tab => (
            <button 
                key={tab.id}
                onClick={() => {
                    setActiveTab(tab.id as any);
                    setIsSidebarOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-3 transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-gray-500 hover:bg-white/5'}`}
            >
                <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
        ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] bg-[#0F1117] flex flex-col animate-in fade-in duration-300 text-gray-200">
      <div className="h-16 bg-[#16181D] border-b border-white/10 px-4 md:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 hover:bg-white/10 rounded-lg text-gray-400">
                <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg md:text-xl font-black text-white italic uppercase tracking-tighter">Admin Panel</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400"><X className="w-6 h-6" /></button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-64 bg-[#0B0D12] border-r border-white/5 p-4 flex-col gap-2">
            <SidebarContent />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
            <div className="md:hidden fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}>
                <div className="w-64 h-full bg-[#0B0D12] p-4 animate-in slide-in-from-left duration-300" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-8">
                        <span className="text-indigo-500 font-black uppercase text-sm tracking-widest">Navigation</span>
                        <button onClick={() => setIsSidebarOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
                    </div>
                    <SidebarContent />
                </div>
            </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#1A1D24] p-6 md:p-8 rounded-[2rem] border border-white/5">
                        <span className="text-gray-500 text-xs font-black uppercase tracking-widest">Active Users</span>
                        <h3 className="text-3xl md:text-4xl font-black text-white mt-2">{users.length}</h3>
                    </div>
                    <div className="bg-[#1A1D24] p-6 md:p-8 rounded-[2rem] border border-white/5">
                        <span className="text-gray-500 text-xs font-black uppercase tracking-widest">Public Projects</span>
                        <h3 className="text-3xl md:text-4xl font-black text-indigo-400 mt-2">{projects.length}</h3>
                    </div>
                    <div className="bg-[#1A1D24] p-6 md:p-8 rounded-[2rem] border border-white/5">
                        <span className="text-gray-500 text-xs font-black uppercase tracking-widest">Prompts Set</span>
                        <h3 className="text-3xl md:text-4xl font-black text-green-400 mt-2">{suggestions.length}</h3>
                    </div>
                </div>
            )}

            {activeTab === 'suggestions' && (
                <div className="space-y-8">
                    <div className="bg-[#1A1D24] p-6 md:p-8 rounded-[2rem] border border-white/5">
                        <h3 className="text-white font-black uppercase tracking-tighter text-xl mb-6">Manage Suggestions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <input value={newSugg.label} onChange={e => setNewSugg({...newSugg, label: e.target.value})} placeholder="Button Label" className="bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm" />
                            <input type="number" value={newSugg.order} onChange={e => setNewSugg({...newSugg, order: parseInt(e.target.value)})} placeholder="Order" className="bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm" />
                            <textarea value={newSugg.prompt} onChange={e => setNewSugg({...newSugg, prompt: e.target.value})} placeholder="AI Hidden Prompt" className="bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm md:col-span-2 h-32" />
                            <button onClick={handleAddSugg} className="bg-indigo-600 text-white font-black uppercase py-4 rounded-xl shadow-lg shadow-indigo-900/40 md:col-span-2">Add Suggestion</button>
                        </div>

                        <div className="space-y-2">
                            {suggestions.map(s => (
                                <div key={s.id} className="bg-black/20 p-4 rounded-xl border border-white/5 flex justify-between items-center group">
                                    <div className="truncate pr-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-indigo-400 font-black text-[10px] uppercase">#{s.order}</span>
                                            <span className="text-white font-bold text-sm">{s.label}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{s.prompt}</p>
                                    </div>
                                    <button onClick={() => handleDelSugg(s.id)} className="p-2 text-red-500/30 hover:text-red-500 shrink-0"><Trash2 className="w-5 h-5" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'projects' && (
                <div className="space-y-4">
                    {projects.map(p => (
                        <div key={p.id} className="bg-[#1A1D24] p-6 rounded-[2rem] border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h4 className="font-black text-white uppercase tracking-tighter text-sm md:text-base">{p.name}</h4>
                                <p className="text-xs text-gray-500">by {p.authorName} • {p.likes} Likes</p>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <button onClick={() => handleUpdateLikes(p.id)} className="flex-1 md:flex-none px-4 py-2 bg-pink-600/10 text-pink-500 border border-pink-500/20 rounded-xl text-xs font-black uppercase">Set Likes</button>
                                <button onClick={() => remove(ref(db, `community_projects/${p.id}`))} className="p-3 text-red-500/30 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'users' && (
                <div className="space-y-4">
                    {users.map(u => (
                        <div key={u.id} className="bg-[#1A1D24] p-6 rounded-[2rem] border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h4 className="font-black text-white uppercase tracking-tighter text-sm md:text-base">{u.name}</h4>
                                <p className="text-xs text-gray-500">{u.email} • {u.credits} AI Credits</p>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <button onClick={() => {
                                    const input = prompt("New AI Credits count:", u.credits.toString());
                                    if(input) update(ref(db, `users/${u.id}/profile`), { credits: parseInt(input) });
                                }} className="flex-1 md:flex-none px-4 py-2 bg-indigo-600/10 text-indigo-400 rounded-xl text-xs font-black uppercase">Credits</button>
                                <button onClick={() => update(ref(db, `users/${u.id}/profile`), { isBanned: !u.isBanned })} className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase ${u.isBanned ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{u.isBanned ? 'Unban' : 'Ban'}</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPanel;
