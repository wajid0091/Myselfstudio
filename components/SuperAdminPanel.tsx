
import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { ref, onValue, update, remove, push, off, get, set } from 'firebase/database';
import { UserProfile, CommunityProject, Transaction, CreatorApplication, PaymentMethod, PlanConfig, Suggestion, AIModel } from '../types';
import { 
    X, Trash2, User, Database, CreditCard, Briefcase, Settings, Plus, DollarSign, Edit2, 
    LayoutDashboard, Search, Check, Ban, Menu, Loader2, ArrowRight, Heart, Save, ToggleLeft, ToggleRight, Lock, Unlock, ShieldAlert, Zap, Globe, Package
} from 'lucide-react';
import JSZip from 'jszip';
import { useAuth } from '../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SuperAdminPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'projects' | 'payments' | 'suggestions' | 'models' | 'plans' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Updated admin email: mbhia78@gmail.com
  const isAdminAuthorized = user?.email === 'mbhia78@gmail.com';

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [projects, setProjects] = useState<CommunityProject[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [adminModels, setAdminModels] = useState<AIModel[]>([]); 
  const [plans, setPlans] = useState<Record<string, PlanConfig>>({});
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  
  const [newSugg, setNewSugg] = useState({ label: '', prompt: '', order: 0 });
  const [newModel, setNewModel] = useState({ name: '', modelId: '' });
  
  // Plan/Method Forms
  const [editPlanId, setEditPlanId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<PlanConfig | null>(null);
  const [newMethod, setNewMethod] = useState<Partial<PaymentMethod>>({ name: '', title: '', details: '', region: 'PK', isEnabled: true });

  useEffect(() => {
    if (!isOpen || !isAdminAuthorized) return;

    const refs = {
        users: ref(db, 'users'),
        projects: ref(db, 'community_projects'),
        payments: ref(db, 'pending_approvals'),
        suggestions: ref(db, 'system_settings/suggestions'),
        models: ref(db, 'system_settings/models'),
        plans: ref(db, 'system_settings/plans'),
        methods: ref(db, 'system_settings/payment_methods')
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

    onValue(refs.models, (s) => {
        if(s.exists()) setAdminModels(Object.entries(s.val()).map(([id, v]: [string, any]) => ({...v, id})));
        else setAdminModels([]);
    });

    onValue(refs.plans, (s) => {
        if(s.exists()) setPlans(s.val());
    });

    onValue(refs.methods, (s) => {
        if(s.exists()) {
             setPaymentMethods(Object.entries(s.val()).map(([id, v]: [string, any]) => ({...v, id})));
        }
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

  const handleAddModel = async () => {
      if(!newModel.name || !newModel.modelId) return;
      await push(ref(db, 'system_settings/models'), newModel);
      setNewModel({ name: '', modelId: '' });
  };

  const handleDelModel = async (id: string) => {
      await remove(ref(db, `system_settings/models/${id}`));
  };

  const handleUpdateLikes = async (id: string) => {
      const input = prompt("Enter new likes count:");
      if(input) await update(ref(db, `community_projects/${id}`), { likes: parseInt(input) });
  };

  // Plan Handlers
  const handleSavePlan = async () => {
      if(editPlanId && editingPlan) {
          await update(ref(db, `system_settings/plans/${editPlanId}`), editingPlan);
          setEditPlanId(null);
          setEditingPlan(null);
      }
  };

  const handleToggleFeature = (feature: string) => {
      if(!editingPlan) return;
      const current = editingPlan.features || [];
      const updated = current.includes(feature) 
        ? current.filter(f => f !== feature)
        : [...current, feature];
      setEditingPlan({ ...editingPlan, features: updated });
  };
  
  const handleToggleModel = (modelId: string) => {
      if(!editingPlan) return;
      const current = editingPlan.allowedModels || [];
      const updated = current.includes(modelId) 
        ? current.filter(id => id !== modelId)
        : [...current, modelId];
      setEditingPlan({ ...editingPlan, allowedModels: updated });
  };

  // Payment Method Handlers
  const handleAddMethod = async () => {
      if(newMethod.name && newMethod.details) {
          await push(ref(db, 'system_settings/payment_methods'), newMethod);
          setNewMethod({ name: '', title: '', details: '', region: 'PK', isEnabled: true });
      }
  };

  const handleDeleteMethod = async (id: string) => {
      await remove(ref(db, `system_settings/payment_methods/${id}`));
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
            { id: 'models', icon: Globe, label: 'AI Models' },
            { id: 'plans', icon: Package, label: 'Plans & Billing' },
            { id: 'payments', icon: CreditCard, label: 'Approvals' },
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

            {activeTab === 'plans' && (
                <div className="space-y-8">
                    {/* Plans Manager */}
                    <div className="bg-[#1A1D24] p-6 rounded-[2rem] border border-white/5">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6">Subscription Plans</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {Object.entries(plans).map(([id, plan]: [string, PlanConfig]) => (
                                <div key={id} className="bg-black/20 p-6 rounded-2xl border border-white/5">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-lg font-black text-white uppercase italic">{plan.name}</h4>
                                        <button onClick={() => { setEditPlanId(id); setEditingPlan(plan); }} className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                    </div>
                                    
                                    {editPlanId === id && editingPlan ? (
                                        <div className="space-y-3 bg-black/40 p-4 rounded-xl mb-4 border border-indigo-500/30">
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="number" value={editingPlan.price} onChange={e => setEditingPlan({...editingPlan, price: parseFloat(e.target.value)})} className="bg-[#0F1117] border border-white/10 rounded p-2 text-xs text-white" placeholder="Price (USD)" />
                                                <input type="number" value={editingPlan.dailyCredits} onChange={e => setEditingPlan({...editingPlan, dailyCredits: parseInt(e.target.value)})} className="bg-[#0F1117] border border-white/10 rounded p-2 text-xs text-white" placeholder="Daily Credits" />
                                            </div>
                                            
                                            <div className="text-[10px] text-gray-500 font-bold uppercase mt-2 mb-1">Toggle Features</div>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {['enableTailwind', 'enableBootstrap', 'enableAdminPanel', 'enableSEO', 'enablePWA', 'enableImgBB', 'enableResponsive'].map(f => (
                                                    <button 
                                                        key={f} 
                                                        onClick={() => handleToggleFeature(f)}
                                                        className={`px-2 py-1 rounded text-[9px] uppercase font-bold border ${editingPlan.features?.includes(f) ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-white/5 border-white/10 text-gray-500'}`}
                                                    >
                                                        {f.replace('enable', '')}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="text-[10px] text-gray-500 font-bold uppercase mt-2 mb-1">Allowed AI Models</div>
                                            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto custom-scrollbar p-2 bg-[#0F1117] rounded-lg border border-white/5">
                                                {adminModels.length === 0 && <span className="text-[9px] text-gray-500 italic">No admin models added.</span>}
                                                {adminModels.map(m => (
                                                    <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={editingPlan.allowedModels?.includes(m.id) || false} 
                                                            onChange={() => handleToggleModel(m.id)}
                                                            className="rounded bg-black border-white/20 text-indigo-500 focus:ring-0"
                                                        />
                                                        <span className={`text-xs ${editingPlan.allowedModels?.includes(m.id) ? 'text-white font-bold' : 'text-gray-500'}`}>{m.name}</span>
                                                    </label>
                                                ))}
                                            </div>

                                            <button onClick={handleSavePlan} className="w-full py-2 bg-green-600 text-white rounded font-bold uppercase text-xs mt-4">Save Changes</button>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-400 space-y-1">
                                            <p>Price: ${plan.price}</p>
                                            <p>Credits: {plan.dailyCredits}/day</p>
                                            <p className="text-xs mt-2 text-gray-500">{plan.features?.length || 0} Features • {plan.allowedModels?.length || 0} Models</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="bg-[#1A1D24] p-6 rounded-[2rem] border border-white/5">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6">Payment Methods</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                             <input value={newMethod.name} onChange={e => setNewMethod({...newMethod, name: e.target.value})} placeholder="Method Name (e.g. EasyPaisa)" className="bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs" />
                             <input value={newMethod.title} onChange={e => setNewMethod({...newMethod, title: e.target.value})} placeholder="Title/Subtitle" className="bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs" />
                             <input value={newMethod.details} onChange={e => setNewMethod({...newMethod, details: e.target.value})} placeholder="Account Number / IBAN" className="bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs md:col-span-2" />
                             <select value={newMethod.region} onChange={e => setNewMethod({...newMethod, region: e.target.value as any})} className="bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs">
                                 <option value="PK">Pakistan Only</option>
                                 <option value="INTL">International</option>
                             </select>
                             <button onClick={handleAddMethod} className="bg-indigo-600 text-white font-bold uppercase text-xs rounded-xl p-3">Add Method</button>
                        </div>

                        <div className="space-y-3">
                            {paymentMethods.map(m => (
                                <div key={m.id} className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-white/5">
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{m.name} <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded ml-2">{m.region}</span></h4>
                                        <p className="text-xs text-gray-500 font-mono">{m.details}</p>
                                    </div>
                                    <button onClick={() => handleDeleteMethod(m.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Other tabs existing logic ... */}
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

            {activeTab === 'models' && (
                <div className="space-y-8">
                    <div className="bg-[#1A1D24] p-6 md:p-8 rounded-[2rem] border border-white/5">
                        <h3 className="text-white font-black uppercase tracking-tighter text-xl mb-6">OpenRouter Models</h3>
                        <p className="text-xs text-gray-500 mb-6">These models will be available to all users via the server-side OpenRouter API Key.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <input value={newModel.name} onChange={e => setNewModel({...newModel, name: e.target.value})} placeholder="Display Name (e.g. DeepSeek R1)" className="bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm" />
                            <input value={newModel.modelId} onChange={e => setNewModel({...newModel, modelId: e.target.value})} placeholder="Model ID (e.g. deepseek/deepseek-r1)" className="bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm" />
                            <button onClick={handleAddModel} className="bg-blue-600 text-white font-black uppercase py-4 rounded-xl shadow-lg shadow-blue-900/40 md:col-span-2">Add Model</button>
                        </div>

                        <div className="space-y-2">
                            {adminModels.map(m => (
                                <div key={m.id} className="bg-black/20 p-4 rounded-xl border border-white/5 flex justify-between items-center group">
                                    <div>
                                        <h4 className="text-white font-bold text-sm">{m.name}</h4>
                                        <p className="text-[10px] text-gray-500 font-mono">{m.modelId}</p>
                                    </div>
                                    <button onClick={() => handleDelModel(m.id)} className="p-2 text-red-500/30 hover:text-red-500 shrink-0"><Trash2 className="w-5 h-5" /></button>
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

             {activeTab === 'payments' && (
                <div className="space-y-4">
                    {transactions.length === 0 && <div className="text-gray-500 text-center py-10">No pending payments.</div>}
                    {transactions.map(t => (
                        <div key={t.id} className="bg-[#1A1D24] p-6 rounded-[2rem] border border-white/5">
                            <div className="flex flex-col md:flex-row gap-6">
                                {t.screenshot && (
                                    <div className="w-full md:w-32 h-32 bg-black/40 rounded-xl overflow-hidden shrink-0">
                                        <img src={t.screenshot} className="w-full h-full object-cover" onClick={() => window.open(t.screenshot, '_blank')} />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-lg font-black text-white">{t.userName}</h4>
                                            <p className="text-xs text-gray-500">{t.plan.toUpperCase()} Plan • {t.amount}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded text-gray-400">{t.transactionId}</span>
                                            <p className="text-[10px] text-gray-500 mt-1">{new Date(t.timestamp).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <button 
                                            onClick={async () => {
                                                if(confirm('Approve this payment?')) {
                                                    // 1. Update User Profile
                                                    const planSnap = await get(ref(db, `system_settings/plans/${t.plan}`));
                                                    if(planSnap.exists()) {
                                                        const planData = planSnap.val();
                                                        await update(ref(db, `users/${t.userId}/profile`), {
                                                            plan: t.plan,
                                                            planExpiry: Date.now() + (planData.duration * 24 * 60 * 60 * 1000),
                                                            credits: planData.dailyCredits,
                                                            features: planData.features,
                                                            sourceCodeCredits: (planData.copyCredits || 5)
                                                        });
                                                    }
                                                    // 2. Remove Request
                                                    await remove(ref(db, `pending_approvals/${t.id}`));
                                                }
                                            }}
                                            className="px-6 py-2 bg-green-600 text-white rounded-xl font-bold uppercase text-xs shadow-lg shadow-green-900/20 hover:bg-green-500"
                                        >
                                            Approve
                                        </button>
                                        <button 
                                            onClick={async () => {
                                                if(confirm('Reject this payment?')) {
                                                    await remove(ref(db, `pending_approvals/${t.id}`));
                                                }
                                            }}
                                            className="px-6 py-2 bg-red-600/10 text-red-500 rounded-xl font-bold uppercase text-xs hover:bg-red-600 hover:text-white"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
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
