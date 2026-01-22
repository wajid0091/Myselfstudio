import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { ref, onValue, update, remove, push, off, get } from 'firebase/database';
import { UserProfile, CommunityProject, Transaction, CreatorApplication, PaymentMethod, PlanConfig } from '../types';
import { 
    X, Trash2, User, Database, CreditCard, Briefcase, Settings, Plus, DollarSign, Edit2, 
    LayoutDashboard, Search, Check, Ban, Menu, Loader2, ArrowRight, Heart, Save, ToggleLeft, ToggleRight, Lock, Unlock, ShieldAlert
} from 'lucide-react';
import JSZip from 'jszip';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_FEATURES = [
    { key: 'enableTailwind', label: 'Tailwind CSS' },
    { key: 'enableBootstrap', label: 'Bootstrap 5' },
    { key: 'enableSEO', label: 'SEO Service' },
    { key: 'enablePWA', label: 'PWA Service' },
    { key: 'enableAdminPanel', label: 'Admin Panel Generator' },
    { key: 'enableFirebaseRules', label: 'Database Rules' },
    { key: 'enableImgBB', label: 'Image Hosting (ImgBB)' },
    { key: 'enableSecureMode', label: 'Secure Files (Multi-page Mode)' },
    { key: 'enableResponsive', label: 'Responsive AI Modes (Mobile/Desktop)' },
    { key: 'enableCustomCursor', label: 'PC Cursor Effect' }
];

const SuperAdminPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'projects' | 'payments' | 'creators' | 'settings'>('dashboard');
  
  // Data States
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [projects, setProjects] = useState<CommunityProject[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [creatorApps, setCreatorApps] = useState<CreatorApplication[]>([]);
  
  // Settings Data
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [plans, setPlans] = useState<Record<string, PlanConfig>>({});
  
  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // --- EDIT STATES ---
  const [newMethod, setNewMethod] = useState<Partial<PaymentMethod>>({ region: 'PK', isEnabled: true, name: '', title: '', details: '' });
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState('');
  const [editingPlanData, setEditingPlanData] = useState<PlanConfig>({
      name: '', price: 0, duration: 1, dailyCredits: 10, copyCredits: 0, features: ['enableTailwind']
  });

  // --- USER MANAGEMENT STATES ---
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingData(true);

    const refs = [
        ref(db, 'users'),
        ref(db, 'community_projects'),
        ref(db, 'pending_approvals'),
        ref(db, 'creator_applications'),
        ref(db, 'system_settings/payment_methods'),
        ref(db, 'system_settings/plans')
    ];

    // 1. Users
    const unsubUsers = onValue(refs[0], (snapshot) => {
      const data = snapshot.val();
      if (data) {
          const list = Object.values(data).map((u: any) => u.profile).filter(Boolean);
          setUsers(list);
      } else setUsers([]);
    });

    // 2. Projects
    const unsubProjects = onValue(refs[1], (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
            ...data[key],
            id: key, 
            firebaseKey: key
        }));
        setProjects(list.reverse());
      } else setProjects([]);
    });

    // 3. Payments
    const unsubPayments = onValue(refs[2], (snapshot) => {
      const data = snapshot.val();
      if(data) {
          const list = Object.keys(data).map(key => ({
              ...data[key],
              id: key
          }));
          setTransactions(list.reverse());
      } else setTransactions([]);
    });

    // 4. Creator Apps
    const unsubCreators = onValue(refs[3], (snapshot) => {
        const data = snapshot.val();
        if(data) {
            const list = Object.keys(data).map(key => ({
                ...data[key],
                id: key
            }));
            const sorted = list.sort((a, b) => {
                if (a.status === 'pending' && b.status !== 'pending') return -1;
                return 0;
            });
            setCreatorApps(sorted);
        } else setCreatorApps([]);
    });

    // 5. Settings: Payment Methods
    const unsubMethods = onValue(refs[4], (s) => {
        if (s.exists()) {
             const data = s.val();
             const list = Object.entries(data).map(([k, v]: [string, any]) => ({...v, id: k}));
             setPaymentMethods(list);
        } else {
            setPaymentMethods([]);
        }
    });

    // 6. Settings: Plans
    const unsubPlans = onValue(refs[5], (s) => {
        if(s.exists()) setPlans(s.val());
        else setPlans({});
    });

    setLoadingData(false);

    return () => {
      refs.forEach(r => off(r));
    };
  }, [isOpen]);

  // --- USER MANAGEMENT LOGIC ---

  const openUserModal = (user: UserProfile) => {
      setEditingUser({ ...user }); // Clone to avoid direct mutations
      setIsUserModalOpen(true);
  };

  const saveUserChanges = async () => {
      if (!editingUser) return;
      try {
          await update(ref(db, `users/${editingUser.id}/profile`), {
              credits: editingUser.credits,
              sourceCodeCredits: editingUser.sourceCodeCredits,
              isBanned: editingUser.isBanned || false,
              features: editingUser.features || []
          });
          alert("User updated successfully!");
          setIsUserModalOpen(false);
      } catch (e) {
          alert("Failed to update user.");
      }
  };

  const toggleUserFeature = (featureKey: string) => {
      if (!editingUser) return;
      const currentFeatures = editingUser.features || [];
      if (currentFeatures.includes(featureKey)) {
          setEditingUser({ ...editingUser, features: currentFeatures.filter(f => f !== featureKey) });
      } else {
          setEditingUser({ ...editingUser, features: [...currentFeatures, featureKey] });
      }
  };

  // --- ACTIONS ---

  // 1. Manual Likes
  const handleUpdateLikes = async (project: CommunityProject) => {
      const currentLikes = project.likes || 0;
      const input = prompt(`Update Likes for "${project.name}"\nCurrent Likes: ${currentLikes}\n\nEnter new number:`, currentLikes.toString());
      
      if (input === null) return;
      
      const newLikes = parseInt(input);
      if (isNaN(newLikes) || newLikes < 0) {
          alert("Please enter a valid number.");
          return;
      }

      const key = (project as any).firebaseKey || project.id;
      try {
          await update(ref(db, `community_projects/${key}`), { likes: newLikes });
      } catch(e) { alert("Failed to update likes."); }
  };

  // 2. Payments & Approvals
  const handleApprovePayment = async (trx: Transaction) => {
      if(!confirm(`Approve payment for ${trx.userName}?`)) return;
      try {
          const planDetails = plans[trx.plan];
          if(!planDetails) {
              alert("Error: Plan details not found in system settings.");
              return;
          }
          const now = Date.now();
          const months = planDetails.duration || 1;
          const durationMs = months * 30 * 24 * 60 * 60 * 1000;

          // Fetch current user features to append, not overwrite
          const userSnapshot = await get(ref(db, `users/${trx.userId}/profile`));
          let currentFeatures: string[] = [];
          if(userSnapshot.exists()) {
              currentFeatures = userSnapshot.val().features || [];
          }

          // Merge plan features with existing (using Set to avoid duplicates)
          const newFeatures = Array.from(new Set([...currentFeatures, ...(planDetails.features || [])]));

          const userRef = ref(db, `users/${trx.userId}/profile`);
          await update(userRef, {
              plan: trx.plan,
              planExpiry: now + durationMs,
              credits: planDetails.dailyCredits,
              sourceCodeCredits: planDetails.copyCredits,
              features: newFeatures
          });

          await remove(ref(db, `pending_approvals/${trx.id}`));
          alert(`Approved! User upgraded.`);
      } catch (e) { alert('Error processing approval.'); }
  };

  const handleRejectPayment = async (id: string) => {
      if(!confirm('Reject this payment request?')) return;
      await remove(ref(db, `pending_approvals/${id}`));
  };

  // 3. Projects
  const handleDeleteProject = async (project: CommunityProject) => {
      const key = (project as any).firebaseKey || project.id;
      if (confirm(`Delete project "${project.name}"?`)) {
          try {
              await remove(ref(db, `community_projects/${key}`));
              alert('Project deleted.');
          } catch(e) { alert('Error deleting project'); }
      }
  };

  const handleDownloadProject = async (project: CommunityProject) => {
      try {
          const zip = new JSZip();
          project.files.forEach(file => zip.file(file.name, file.content));
          const blob = await zip.generateAsync({ type: 'blob' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${project.name}_ADMIN.zip`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      } catch (e) { alert("Download failed"); }
  };

  // 4. Creators
  const handleCreatorDecision = async (app: CreatorApplication, status: 'approved' | 'rejected') => {
      if(!confirm(`Mark as ${status.toUpperCase()}?`)) return;
      try {
          await update(ref(db, `creator_applications/${app.id}`), { status });
          await update(ref(db, `users/${app.userId}/profile`), { isCreator: status === 'approved' });
          alert(`Application ${status}.`);
      } catch(e) { alert("Error updating status"); }
  };

  // 5. SETTINGS: Payment Methods
  const handleAddMethod = async () => {
      if (!newMethod.name || !newMethod.details) return;
      await push(ref(db, 'system_settings/payment_methods'), newMethod);
      setNewMethod({ region: 'PK', isEnabled: true, name: '', title: '', details: '' });
  };

  const handleDeleteMethod = async (id: string) => {
      if(confirm('Delete this payment method?')) {
          await remove(ref(db, `system_settings/payment_methods/${id}`));
      }
  };

  const handleToggleMethod = async (method: PaymentMethod) => {
      await update(ref(db, `system_settings/payment_methods/${method.id}`), {
          isEnabled: !method.isEnabled
      });
  };

  // 6. SETTINGS: Plans
  const handleEditPlan = (key: string, plan: PlanConfig) => {
      setEditingPlanId(key);
      setEditingPlanData(plan);
      setIsPlanModalOpen(true);
  };

  const handleSavePlan = async () => {
      await update(ref(db, `system_settings/plans/${editingPlanId}`), editingPlanData);
      setIsPlanModalOpen(false);
  };

  const toggleFeature = (key: string) => {
      setEditingPlanData(prev => {
          const exists = prev.features.includes(key);
          return {
              ...prev,
              features: exists 
                  ? prev.features.filter(f => f !== key)
                  : [...prev.features, key]
          };
      });
  };

  // --- RENDER HELPERS ---

  const NavItem = ({ id, icon: Icon, label, count }: any) => (
      <button 
        onClick={() => { setActiveTab(id); setShowSidebar(false); }}
        className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition-all ${activeTab === id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
      >
        <Icon className="w-5 h-5" /> {label}
        {count !== undefined && count > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{count}</span>}
      </button>
  );

  const EmptyState = ({ msg }: { msg: string }) => (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Database className="w-12 h-12 mb-2 opacity-20" />
          <p>{msg}</p>
      </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col animate-in fade-in duration-200 text-gray-200 font-sans h-[100dvh]">
      {/* Header */}
      <div className="h-16 bg-[#16181D] border-b border-white/10 px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
             <button onClick={() => setShowSidebar(!showSidebar)} className="md:hidden p-2 text-gray-400 hover:text-white">
                 <Menu className="w-6 h-6" />
             </button>
             <h2 className="text-xl font-bold text-white tracking-tight">Super Admin Panel</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <div className={`absolute md:static inset-y-0 left-0 w-64 bg-[#0F1117] border-r border-white/5 flex flex-col p-4 space-y-2 shrink-0 z-30 transform transition-transform duration-300 ${showSidebar ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
            <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem id="users" icon={User} label="Users" />
            <NavItem id="projects" icon={Database} label="Projects" />
            <NavItem id="payments" icon={CreditCard} label="Payments" count={transactions.length} />
            <NavItem id="creators" icon={Briefcase} label="Creators" count={creatorApps.filter(c => c.status === 'pending').length} />
            <NavItem id="settings" icon={Settings} label="Settings" />
        </div>
        
        {/* Content */}
        <div className="flex-1 flex flex-col bg-[#111318] min-w-0 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
            
            {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-[#1A1D24] p-6 rounded-2xl border border-white/5">
                        <span className="text-gray-400 text-sm">Total Users</span>
                        <h3 className="text-3xl font-bold text-white mt-2">{users.length}</h3>
                    </div>
                    <div className="bg-[#1A1D24] p-6 rounded-2xl border border-white/5">
                        <span className="text-gray-400 text-sm">Pending Payments</span>
                        <h3 className="text-3xl font-bold text-green-400 mt-2">{transactions.length}</h3>
                    </div>
                    <div className="bg-[#1A1D24] p-6 rounded-2xl border border-white/5">
                        <span className="text-gray-400 text-sm">Projects</span>
                        <h3 className="text-3xl font-bold text-blue-400 mt-2">{projects.length}</h3>
                    </div>
                    <div className="bg-[#1A1D24] p-6 rounded-2xl border border-white/5">
                        <span className="text-gray-400 text-sm">Creators</span>
                        <h3 className="text-3xl font-bold text-purple-400 mt-2">{creatorApps.filter(c => c.status === 'approved').length}</h3>
                    </div>
                </div>
            )}

            {activeTab === 'projects' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">All Community Projects</h2>
                        <span className="text-xs text-gray-500">{projects.length} Found</span>
                    </div>
                    {projects.length === 0 ? <EmptyState msg="No public projects found." /> : (
                        <div className="grid grid-cols-1 gap-3">
                            {projects.map(p => (
                                <div key={p.id} className="bg-[#1A1D24] p-4 rounded-xl border border-white/5 flex justify-between items-center group hover:border-blue-500/30">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-500/10 rounded flex items-center justify-center text-blue-400 font-bold">
                                            {p.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">{p.name}</h4>
                                            <p className="text-xs text-gray-500">By {p.authorName} • <span className="text-pink-400 font-bold">{p.likes} Likes</span></p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleUpdateLikes(p)} 
                                            className="flex items-center gap-2 px-3 py-2 bg-pink-500/10 text-pink-400 rounded-lg hover:bg-pink-600 hover:text-white transition-colors"
                                            title="Manually Edit Likes"
                                        >
                                            <Heart className="w-4 h-4" />
                                            <span className="text-xs font-bold hidden md:inline">Edit</span>
                                        </button>

                                        <button onClick={() => handleDownloadProject(p)} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-colors">
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                        
                                        <button onClick={() => handleDeleteProject(p)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'payments' && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white mb-4">Pending Plan Approvals</h2>
                    {transactions.length === 0 ? <EmptyState msg="No pending payments." /> : (
                        <div className="grid grid-cols-1 gap-4">
                            {transactions.map(trx => (
                                <div key={trx.id} className="bg-[#1A1D24] p-5 rounded-xl border border-white/5 flex flex-col md:flex-row justify-between md:items-center gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-green-500/10 rounded-lg text-green-400"><DollarSign className="w-6 h-6" /></div>
                                        <div>
                                            <h4 className="font-bold text-white text-lg">{trx.userName}</h4>
                                            <p className="text-sm text-gray-400">Buying: <span className="text-blue-400 font-bold uppercase">{trx.plan}</span></p>
                                            <p className="text-xs text-gray-500 mt-1">Method: {trx.method} • TID: {trx.transactionId}</p>
                                            <p className="text-xs text-green-500 font-bold mt-1">Amount: {trx.amount}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-3">
                                         {trx.screenshot && (
                                             <a href={trx.screenshot} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1">View Screenshot <ArrowRight className="w-3 h-3" /></a>
                                         )}
                                         <div className="flex gap-2">
                                            <button onClick={() => handleRejectPayment(trx.id)} className="px-4 py-2 bg-red-600/10 text-red-500 rounded-lg text-sm font-bold hover:bg-red-600 hover:text-white transition-colors">Reject</button>
                                            <button onClick={() => handleApprovePayment(trx)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-500 transition-colors shadow-lg shadow-green-900/20">Approve</button>
                                         </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'creators' && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white mb-4">Creator Applications</h2>
                    {creatorApps.length === 0 ? <EmptyState msg="No applications found." /> : (
                        <div className="grid grid-cols-1 gap-4">
                            {creatorApps.map(app => (
                                <div key={app.id} className="bg-[#1A1D24] p-5 rounded-xl border border-white/5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-white">{app.name}</h4>
                                            <p className="text-xs text-gray-500">{app.email}</p>
                                        </div>
                                        <div className={`text-xs px-2 py-1 rounded uppercase font-bold ${app.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : (app.status === 'approved' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500')}`}>
                                            {app.status}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-300 mb-4 bg-black/20 p-3 rounded-lg">
                                        <p>Platform: <span className="text-white">{app.platform}</span></p>
                                        <p>Followers: <span className="text-white">{app.followers}</span></p>
                                        <p>Exp: <span className="text-white">{app.experience}</span></p>
                                        <p>Country: <span className="text-white">{app.country}</span></p>
                                        <a href={app.profileLink} target="_blank" className="col-span-2 text-blue-400 hover:underline text-xs mt-1 truncate">{app.profileLink}</a>
                                    </div>
                                    {app.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleCreatorDecision(app, 'rejected')} className="flex-1 py-2 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-lg text-xs font-bold transition-colors">Reject</button>
                                            <button onClick={() => handleCreatorDecision(app, 'approved')} className="flex-1 py-2 bg-purple-600 text-white hover:bg-purple-500 rounded-lg text-xs font-bold transition-colors">Approve Creator</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            {activeTab === 'users' && (
                <div className="space-y-4">
                     <div className="flex justify-between items-center mb-4">
                         <h2 className="text-xl font-bold text-white">User Management</h2>
                         <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-[#1A1D24] border border-white/10 rounded-lg p-2 text-white text-sm w-64" />
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                         {users.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                             <div key={u.id} className={`p-4 rounded-xl border flex justify-between items-center ${u.isBanned ? 'bg-red-900/10 border-red-500/30' : 'bg-[#1A1D24] border-white/5'}`}>
                                 <div>
                                     <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                         {u.name}
                                         {u.isBanned && <span className="text-[10px] bg-red-500 text-white px-1.5 rounded">BANNED</span>}
                                     </h4>
                                     <p className="text-xs text-gray-500">{u.email}</p>
                                     <div className="flex gap-3 text-xs mt-1">
                                        <span className="text-blue-400 font-bold">{u.plan}</span>
                                        <span className="text-gray-400">{u.credits} AI Credits</span>
                                        <span className="text-gray-400">{u.sourceCodeCredits} Unlocks</span>
                                     </div>
                                 </div>
                                 <button onClick={() => openUserModal(u)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white border border-white/10 transition-colors">
                                     Manage
                                 </button>
                             </div>
                         ))}
                    </div>
                </div>
            )}
            
            {activeTab === 'settings' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* SECTION 1: PLANS CONFIGURATION */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5 text-purple-400" /> Plan Configuration</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(Object.entries(plans) as [string, PlanConfig][]).map(([key, plan]) => (
                                <div key={key} className="bg-[#1A1D24] p-4 rounded-xl border border-white/5 flex flex-col justify-between hover:border-blue-500/30 transition-all">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-bold text-white capitalize">{plan.name}</h4>
                                            <span className="text-xs bg-white/5 px-2 py-1 rounded text-gray-400">{key}</span>
                                        </div>
                                        <div className="text-2xl font-bold text-blue-400 mb-2">${plan.price}</div>
                                        <ul className="text-xs text-gray-400 space-y-1 mb-4">
                                            <li>Daily Credits: {plan.dailyCredits}</li>
                                            <li>Copy Credits: {plan.copyCredits}</li>
                                            <li>Duration: {plan.duration === 0 ? 'Lifetime' : `${plan.duration} Month`}</li>
                                        </ul>
                                    </div>
                                    <button onClick={() => handleEditPlan(key, plan)} className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 hover:text-white transition-colors flex items-center justify-center gap-2">
                                        <Edit2 className="w-3 h-3" /> Edit Plan
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 2: PAYMENT METHODS */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-green-400" /> Payment Methods</h3>
                        
                        {/* Add New Method */}
                        <div className="bg-[#1A1D24] p-4 rounded-xl border border-white/5 mb-4">
                            <h4 className="text-sm font-bold text-gray-300 mb-3">Add New Method</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <select 
                                    value={newMethod.region} 
                                    onChange={e => setNewMethod({...newMethod, region: e.target.value as 'PK' | 'INTL'})}
                                    className="bg-[#0F1117] border border-white/10 rounded px-3 py-2 text-xs text-white"
                                >
                                    <option value="PK">PKR (Local)</option>
                                    <option value="INTL">Crypto/Global</option>
                                </select>
                                <input placeholder="Name (e.g. USDT TRC20)" value={newMethod.name} onChange={e => setNewMethod({...newMethod, name: e.target.value})} className="bg-[#0F1117] border border-white/10 rounded px-3 py-2 text-xs text-white" />
                                <input placeholder="Title / Network" value={newMethod.title} onChange={e => setNewMethod({...newMethod, title: e.target.value})} className="bg-[#0F1117] border border-white/10 rounded px-3 py-2 text-xs text-white" />
                                <input placeholder="Number / Wallet Address" value={newMethod.details} onChange={e => setNewMethod({...newMethod, details: e.target.value})} className="bg-[#0F1117] border border-white/10 rounded px-3 py-2 text-xs text-white" />
                                <button onClick={handleAddMethod} className="bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs">Add</button>
                            </div>
                        </div>

                        {/* List Methods */}
                        <div className="grid grid-cols-1 gap-3">
                            {paymentMethods.map(method => (
                                <div key={method.id} className="bg-[#1A1D24] p-3 rounded-lg border border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => handleToggleMethod(method)} className={`text-2xl ${method.isEnabled ? 'text-green-500' : 'text-gray-600'}`}>
                                            {method.isEnabled ? <ToggleRight /> : <ToggleLeft />}
                                        </button>
                                        <div>
                                            <h5 className="font-bold text-white text-sm flex items-center gap-2">
                                                {method.name} 
                                                <span className={`text-[10px] px-1.5 rounded ${method.region === 'INTL' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'}`}>{method.region}</span>
                                            </h5>
                                            <p className="text-xs text-gray-500">{method.title} - {method.details}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteMethod(method.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
      </div>
      
      {/* PLAN EDITOR MODAL */}
      {isPlanModalOpen && (
          <div className="fixed inset-0 z-[250] bg-black/80 flex items-center justify-center p-4">
              <div className="bg-[#1e2025] w-full max-w-lg rounded-xl border border-white/10 p-6 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar animate-in zoom-in-95">
                  <h3 className="text-lg font-bold text-white mb-4">Edit {editingPlanData.name} Plan</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                          <label className="text-xs text-gray-500 block mb-1">Price ($)</label>
                          <input type="number" value={editingPlanData.price} onChange={e => setEditingPlanData({...editingPlanData, price: Number(e.target.value)})} className="w-full bg-[#15171c] border border-white/10 rounded p-2 text-white text-sm" />
                      </div>
                      <div>
                           <label className="text-xs text-gray-500 block mb-1">Duration (Months, 0=Life)</label>
                          <input type="number" value={editingPlanData.duration} onChange={e => setEditingPlanData({...editingPlanData, duration: Number(e.target.value)})} className="w-full bg-[#15171c] border border-white/10 rounded p-2 text-white text-sm" />
                      </div>
                      <div>
                           <label className="text-xs text-gray-500 block mb-1">Daily Credits</label>
                          <input type="number" value={editingPlanData.dailyCredits} onChange={e => setEditingPlanData({...editingPlanData, dailyCredits: Number(e.target.value)})} className="w-full bg-[#15171c] border border-white/10 rounded p-2 text-white text-sm" />
                      </div>
                      <div>
                           <label className="text-xs text-gray-500 block mb-1">Copy Credits</label>
                          <input type="number" value={editingPlanData.copyCredits} onChange={e => setEditingPlanData({...editingPlanData, copyCredits: Number(e.target.value)})} className="w-full bg-[#15171c] border border-white/10 rounded p-2 text-white text-sm" />
                      </div>
                  </div>
                  
                  <div className="mb-6">
                      <label className="text-xs text-gray-500 block mb-2 font-bold uppercase">Features Enabled</label>
                      <div className="grid grid-cols-2 gap-2">
                          {ALL_FEATURES.map(f => (
                              <label key={f.key} className="flex items-center gap-2 p-2 bg-[#15171c] rounded border border-white/5 cursor-pointer hover:bg-[#20232b]">
                                  <input type="checkbox" checked={editingPlanData.features.includes(f.key)} onChange={() => toggleFeature(f.key)} className="rounded bg-black border-gray-600 text-blue-500" />
                                  <span className="text-xs text-gray-300">{f.label}</span>
                              </label>
                          ))}
                      </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                      <button onClick={() => setIsPlanModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                      <button onClick={handleSavePlan} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold">Save Changes</button>
                  </div>
              </div>
          </div>
      )}

      {/* USER MANAGEMENT MODAL */}
      {isUserModalOpen && editingUser && (
          <div className="fixed inset-0 z-[250] bg-black/80 flex items-center justify-center p-4">
              <div className="bg-[#1e2025] w-full max-w-lg rounded-xl border border-white/10 p-6 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar animate-in zoom-in-95">
                  <div className="flex justify-between items-start mb-6">
                       <div>
                            <h3 className="text-lg font-bold text-white">Manage User</h3>
                            <p className="text-sm text-gray-400">{editingUser.name} ({editingUser.email})</p>
                       </div>
                       <button 
                            onClick={() => setEditingUser({ ...editingUser, isBanned: !editingUser.isBanned })}
                            className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${editingUser.isBanned ? 'bg-red-500 text-white border-red-500' : 'bg-white/5 text-gray-400 border-white/10 hover:border-red-500 hover:text-red-500'}`}
                       >
                            {editingUser.isBanned ? 'UNBAN USER' : 'BAN USER'}
                       </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                          <label className="text-xs text-gray-500 block mb-1">AI Credits</label>
                          <input 
                                type="number" 
                                value={editingUser.credits} 
                                onChange={e => setEditingUser({ ...editingUser, credits: Number(e.target.value) })} 
                                className="w-full bg-[#15171c] border border-white/10 rounded p-2 text-white text-sm" 
                          />
                      </div>
                      <div>
                          <label className="text-xs text-gray-500 block mb-1">Unlock Credits</label>
                          <input 
                                type="number" 
                                value={editingUser.sourceCodeCredits} 
                                onChange={e => setEditingUser({ ...editingUser, sourceCodeCredits: Number(e.target.value) })} 
                                className="w-full bg-[#15171c] border border-white/10 rounded p-2 text-white text-sm" 
                          />
                      </div>
                  </div>

                  <div className="mb-6">
                      <label className="text-xs text-gray-500 block mb-2 font-bold uppercase flex items-center gap-2">
                          <Lock className="w-3 h-3" /> Manual Feature Override (Permanent)
                      </label>
                      <div className="p-3 bg-red-900/10 border border-red-500/20 rounded-lg mb-3 text-[10px] text-red-300 flex items-center gap-2">
                           <ShieldAlert className="w-4 h-4" />
                           Warning: Features toggled here will persist until a new plan is bought.
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                          {ALL_FEATURES.map(f => {
                              const isActive = editingUser.features?.includes(f.key);
                              return (
                                  <label key={f.key} className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all ${isActive ? 'bg-green-500/10 border-green-500/30' : 'bg-[#15171c] border-white/5 opacity-60'}`}>
                                      <div onClick={() => toggleUserFeature(f.key)}>
                                          {isActive ? <Unlock className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-gray-500" />}
                                      </div>
                                      <span className={`text-xs ${isActive ? 'text-green-400 font-bold' : 'text-gray-400'}`}>{f.label}</span>
                                  </label>
                              );
                          })}
                      </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                      <button onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                      <button onClick={saveUserChanges} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold">Save Changes</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default SuperAdminPanel;