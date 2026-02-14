
import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { X, Save, Shield, Info, MousePointer2, Key, ExternalLink, Code2, Zap, Settings, CreditCard, ChevronRight, Crown, Plus, Trash2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenPlans: () => void;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose, onOpenPlans }) => {
  const { settings, updateSettings, addUserModel, removeUserModel } = useSettings();
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'api' | 'general'>('api');

  // New Model Form State
  const [newName, setNewName] = useState('');
  const [newKey, setNewKey] = useState('');

  if (!isOpen) return null;

  const handleAddKey = () => {
      if (newName.trim() && newKey.trim()) {
          addUserModel(newName.trim(), newKey.trim());
          setNewName('');
          setNewKey('');
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-0 md:p-6 animate-in fade-in duration-200">
      <div className="bg-[#16181D] w-full h-full md:h-[85vh] md:max-w-5xl md:rounded-3xl shadow-2xl border border-white/10 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Close Button Mobile */}
        <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 bg-black/50 rounded-full text-white md:hidden">
            <X className="w-5 h-5" />
        </button>

        {/* Sidebar Navigation */}
        <div className="w-full md:w-72 bg-[#0F1117] border-b md:border-b-0 md:border-r border-white/5 p-6 flex flex-col gap-2 shrink-0">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6 px-2">Configuration</h2>
            
            <button 
                onClick={() => setActiveTab('api')} 
                className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'api' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
                <Key className="w-4 h-4" /> My Gemini Keys
            </button>

            <button 
                onClick={() => setActiveTab('general')} 
                className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'general' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
                <Settings className="w-4 h-4" /> General / Billing
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-[#16181D] relative h-full">
            <div className="flex items-center justify-between p-6 md:p-8 border-b border-white/5 shrink-0 bg-[#16181D]/95 backdrop-blur z-10">
                <div>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                        {activeTab === 'api' ? 'AI Key Management' : 'App Preferences'}
                    </h2>
                    <p className="text-xs text-gray-500 font-bold mt-1">
                        {activeTab === 'api' ? 'Add your own Gemini keys' : 'Manage your environment and billing'}
                    </p>
                </div>
                <button onClick={onClose} className="hidden md:block p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                {activeTab === 'api' ? (
                    <div className="space-y-8 max-w-3xl pb-20">
                         {/* Default Info */}
                         <div className="bg-indigo-900/10 border border-indigo-500/20 p-4 rounded-2xl flex items-start gap-3">
                             <Zap className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                             <div>
                                 <h4 className="text-sm font-bold text-white">System Default</h4>
                                 <p className="text-xs text-gray-400 mt-1">
                                     The IDE uses a shared <strong>Gemini 3 Flash</strong> key by default. You don't need to add a key unless you want to use your own quota.
                                 </p>
                             </div>
                         </div>

                         {/* Add New Key */}
                         <div className="bg-[#1A1D24] p-6 rounded-3xl border border-white/5">
                             <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                 <Plus className="w-4 h-4 text-green-400" /> Add Custom Gemini Key
                             </h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div>
                                     <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Model/Key Name</label>
                                     <input 
                                         type="text"
                                         value={newName}
                                         onChange={(e) => setNewName(e.target.value)}
                                         placeholder="e.g. My Personal Gemini"
                                         className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                                     />
                                 </div>
                                 <div>
                                     <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">API Key (Google Studio)</label>
                                     <input 
                                         type="password"
                                         value={newKey}
                                         onChange={(e) => setNewKey(e.target.value)}
                                         placeholder="AIza..."
                                         className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                                     />
                                 </div>
                             </div>
                             <div className="mt-4 flex justify-end">
                                 <button 
                                    onClick={handleAddKey}
                                    disabled={!newName || !newKey}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black uppercase disabled:opacity-50 transition-all"
                                 >
                                     Add Key
                                 </button>
                             </div>
                         </div>

                         {/* List Keys */}
                         <div>
                             <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">Your Saved Keys</h3>
                             {settings.userGeminiModels.length === 0 ? (
                                 <p className="text-xs text-gray-500 italic">No custom keys added yet.</p>
                             ) : (
                                 <div className="space-y-3">
                                     {settings.userGeminiModels.map(model => (
                                         <div key={model.id} className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
                                             <div className="flex items-center gap-3">
                                                 <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                                     <Key className="w-4 h-4 text-indigo-400" />
                                                 </div>
                                                 <div>
                                                     <h4 className="text-sm font-bold text-white">{model.name}</h4>
                                                     <p className="text-[10px] text-gray-500 uppercase tracking-wider">Gemini 3 Flash</p>
                                                 </div>
                                             </div>
                                             <button 
                                                onClick={() => removeUserModel(model.id)}
                                                className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                                             >
                                                 <Trash2 className="w-4 h-4" />
                                             </button>
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>
                    </div>
                ) : (
                    <div className="space-y-6 max-w-3xl pb-20">
                        {/* Billing / Plan Card */}
                        <div className="bg-gradient-to-r from-[#1A1D24] to-[#16181D] p-6 rounded-3xl border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-gradient-to-tr from-green-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg shadow-green-900/30">
                                    <Crown className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-white uppercase tracking-wider mb-1">Current Plan</h3>
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-black text-white">{userProfile?.plan === 'free' ? 'Free' : userProfile?.plan.toUpperCase()}</span>
                                        <span className="px-2 py-1 bg-white/10 rounded-md text-[10px] font-bold text-gray-400 uppercase tracking-widest">{userProfile?.credits} Credits</span>
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={onOpenPlans} 
                                className="w-full sm:w-auto px-6 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xl shadow-green-900/20 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                            >
                                <CreditCard className="w-4 h-4" /> Upgrade / Buy Credits
                            </button>
                        </div>

                        {/* Settings Toggles */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="flex items-center justify-between p-5 bg-[#1A1D24] border border-white/5 rounded-2xl cursor-pointer hover:border-blue-500/30 transition-all group">
                                 <div className="flex items-center gap-4">
                                     <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors"><MousePointer2 className="w-5 h-5 text-blue-400" /></div>
                                     <div>
                                        <div className="text-white text-sm font-bold group-hover:text-blue-400 transition-colors">Custom Cursor</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wide">PC style cursor</div>
                                     </div>
                                 </div>
                                 <input type="checkbox" checked={settings.enableCustomCursor} onChange={e => updateSettings({enableCustomCursor: e.target.checked})} className="w-5 h-5 rounded border-gray-600 bg-ide-bg text-blue-500 focus:ring-offset-0" />
                            </label>
                        </div>
                        
                        {/* Info Links (Policies) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                            <a href="#" className="p-6 bg-[#1A1D24] border border-white/5 rounded-2xl hover:bg-white/5 flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-white transition-all group">
                                <Shield className="w-6 h-6 group-hover:text-indigo-400 transition-colors" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Privacy Policy</span>
                            </a>
                            <a href="#" className="p-6 bg-[#1A1D24] border border-white/5 rounded-2xl hover:bg-white/5 flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-white transition-all group">
                                <Info className="w-6 h-6 group-hover:text-indigo-400 transition-colors" />
                                <span className="text-[10px] font-black uppercase tracking-widest">About WAI</span>
                            </a>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="p-6 border-t border-white/5 bg-[#16181D] flex justify-end shrink-0 z-20 relative">
                <button onClick={onClose} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-indigo-900/30 transition-all flex items-center gap-2">
                    <Save className="w-4 h-4" /> Save Changes
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
