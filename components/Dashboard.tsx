
import React, { useState } from 'react';
import { useFile } from '../context/FileContext';
import { useAuth } from '../context/AuthContext';
import { 
    Plus, Code2, Heart, FolderOpen, Trash2, 
    Globe, Search, Zap, Download,
    UserCircle, LogOut, ShieldCheck, ChevronRight, X, Key, Settings, Crown
} from 'lucide-react';
import { CommunityProject } from '../types';
import PublicPreview from './PublicPreview';
import AuthScreen from './AuthScreen';
import SuperAdminPanel from './SuperAdminPanel';
import PublishModal from './PublishModal';
import SettingsModal from './SettingsModal';
import PlansModal from './PlansModal';
import { usePWA } from '../hooks/usePWA';

const LiveThumbnail: React.FC<{ project: CommunityProject }> = ({ project }) => {
    const htmlFile = project.files.find(f => f.name === 'index.html');
    const cssFiles = project.files.filter(f => f.name.endsWith('.css')).map(f => `<style>${f.content}</style>`).join('\n');
    const srcDoc = `
        <html>
            <head>
                <script src="https://cdn.tailwindcss.com"></script>
                ${cssFiles}
                <style>
                    body { margin: 0; padding: 0; overflow: hidden; transform: scale(0.4); transform-origin: top left; width: 250%; height: 250%; pointer-events: none; background: #0F1117; }
                </style>
            </head>
            <body>${htmlFile?.content || ''}</body>
        </html>
    `;

    return (
        <div className="w-full h-full bg-[#0F1117] relative overflow-hidden pointer-events-none rounded-t-xl">
            <iframe 
                title="preview"
                srcDoc={srcDoc}
                className="w-full h-full border-none pointer-events-none"
                loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D24] via-transparent to-transparent"></div>
        </div>
    );
};

const Dashboard: React.FC = () => {
  const { projects, createProject, communityProjects, cloneCommunityProject, openProject, deleteProject, unpublishProject } = useFile();
  const { user, userProfile, logout } = useAuth();
  const { isInstallable, installApp } = usePWA();
  
  const [isCreating, setIsCreating] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [viewingProject, setViewingProject] = useState<CommunityProject | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('New Project');
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'workspace' | 'community'>('workspace');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      await createProject(newProjectName.trim());
      setIsCreating(false);
    }
  };

  return (
    // Main Container with fixed scrolling behavior
    <div className="h-screen bg-[#0F1117] text-gray-200 font-sans flex flex-col overflow-y-auto custom-scrollbar relative selection:bg-indigo-500/30">
      {/* 1. Header (Original Style) */}
      <header className="px-6 py-4 flex items-center justify-between bg-[#16181D] border-b border-white/5 sticky top-0 z-40 shrink-0 shadow-sm backdrop-blur-md bg-opacity-90">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Code2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none">MYSELF IDE</h1>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Wajid Ali v3</span>
              </div>
          </div>
          
          <div className="flex items-center gap-4">
              {isInstallable && (
                  <button onClick={installApp} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                      <Download className="w-5 h-5 text-indigo-400" />
                  </button>
              )}
              
              {user ? (
                  <div className="flex items-center gap-3">
                      {/* BUY PLAN / UPGRADE ICON BUTTON */}
                      <button 
                        onClick={() => setIsPlansOpen(true)}
                        className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform"
                        title="Upgrade Plan"
                      >
                         <Crown className="w-5 h-5 text-white" />
                      </button>

                      <div className="relative">
                          <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="w-10 h-10 rounded-full border border-white/10 p-0.5 hover:border-indigo-500 transition-colors">
                              <div className="w-full h-full rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-black overflow-hidden uppercase">
                                  {userProfile?.avatar ? <img src={userProfile.avatar} className="w-full h-full object-cover" alt="Profile" /> : userProfile?.name?.charAt(0)}
                              </div>
                          </button>

                          {/* Dropdown Profile Menu */}
                          {showProfileMenu && (
                              <div className="absolute right-0 top-14 w-72 bg-[#1A1D24] border border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                                      <div className="w-12 h-12 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-bold text-xl uppercase">
                                         {userProfile?.name?.charAt(0)}
                                      </div>
                                      <div>
                                          <h4 className="font-bold text-white text-sm">{userProfile?.name}</h4>
                                          <p className="text-xs text-gray-500 truncate max-w-[150px]">{userProfile?.email}</p>
                                      </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 mb-4">
                                      <div className="bg-black/30 p-2 rounded-lg text-center">
                                          <div className="text-lg font-bold text-indigo-400">{userProfile?.credits}</div>
                                          <div className="text-[9px] text-gray-500 uppercase font-bold">Credits</div>
                                      </div>
                                      <div className="bg-black/30 p-2 rounded-lg text-center">
                                          <div className="text-lg font-bold text-green-400">{userProfile?.sourceCodeCredits}</div>
                                          <div className="text-[9px] text-gray-500 uppercase font-bold">Unlocks</div>
                                      </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                      {/* AI Engine Settings */}
                                      <button onClick={() => { setIsSettingsOpen(true); setShowProfileMenu(false); }} className="w-full flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-indigo-600/20 to-blue-600/20 hover:from-indigo-600/30 hover:to-blue-600/30 border border-indigo-500/30 text-xs font-bold text-indigo-300">
                                          <Settings className="w-4 h-4 text-indigo-400" /> Settings
                                      </button>

                                      {user?.email === 'mbhia78@gmail.com' && (
                                          <button onClick={() => { setIsAdminOpen(true); setShowProfileMenu(false); }} className="w-full flex items-center gap-2 p-3 rounded-xl hover:bg-white/5 text-xs font-bold text-gray-300">
                                              <ShieldCheck className="w-4 h-4" /> Admin Panel
                                          </button>
                                      )}
                                      
                                      <div className="h-px bg-white/5 my-1"></div>

                                      <button onClick={() => logout()} className="w-full flex items-center gap-2 p-3 rounded-xl hover:bg-red-500/10 text-xs font-bold text-red-400">
                                          <LogOut className="w-4 h-4" /> Sign Out
                                      </button>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              ) : (
                  <button onClick={() => setIsAuthOpen(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-900/30">
                      Login
                  </button>
              )}
          </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-8 pb-20">
          
          {/* Create Project Button (Top) */}
          <div onClick={() => setIsCreating(true)} className="group relative bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl p-8 cursor-pointer shadow-2xl overflow-hidden hover:scale-[1.01] transition-all border border-white/5">
              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10 transition-transform group-hover:translate-x-5 group-hover:translate-y-5">
                  <Code2 className="w-64 h-64 text-white" />
              </div>
              <div className="relative z-10 flex flex-col items-start gap-4">
                  <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-inner">
                      <Plus className="w-8 h-8 text-white" />
                  </div>
                  <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">Create New Project</h2>
                      <p className="text-indigo-100 text-sm font-medium mt-1">Start building your next idea with AI</p>
                  </div>
              </div>
          </div>

          {/* Tab Selection */}
          <div className="flex gap-6 border-b border-white/5 pb-1 sticky top-[72px] bg-[#0F1117]/95 backdrop-blur-sm z-30 pt-2">
              <button 
                onClick={() => setActiveTab('workspace')} 
                className={`pb-3 text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'workspace' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-white'}`}
              >
                My Workspace
              </button>
              <button 
                onClick={() => setActiveTab('community')} 
                className={`pb-3 text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'community' ? 'text-green-500 border-b-2 border-green-500' : 'text-gray-500 hover:text-white'}`}
              >
                Community Hub
              </button>
          </div>

          {/* Workspace Projects */}
          {activeTab === 'workspace' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom duration-500">
                  {projects.length === 0 ? (
                      <div className="col-span-full text-center py-20 text-gray-500">
                          <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
                          <p className="text-sm font-bold uppercase tracking-widest">No projects yet</p>
                      </div>
                  ) : (
                      projects.map(p => (
                          <div key={p.id} className="bg-[#1A1D24] p-6 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col justify-between group h-48 shadow-lg hover:shadow-indigo-500/10">
                              <div>
                                  <div className="flex justify-between items-start mb-4">
                                      <div className="truncate pr-4">
                                          <h4 className="text-lg font-black text-white uppercase tracking-tighter italic truncate">{p.name}</h4>
                                          <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">{new Date(p.lastModified).toLocaleDateString()}</p>
                                      </div>
                                      <button onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete project?')) deleteProject(p.id); }} className="p-2 text-gray-600 hover:text-red-500 transition-colors">
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                  </div>
                              </div>
                              <div className="flex gap-2 mt-auto">
                                  <button onClick={() => openProject(p.id)} className="flex-1 py-3 bg-white/5 hover:bg-indigo-600 hover:text-white text-gray-300 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all">
                                      Open IDE
                                  </button>
                                  {p.isPublic ? (
                                      <button onClick={() => unpublishProject(p.id)} className="px-4 py-3 bg-green-500/10 text-green-500 rounded-xl font-bold uppercase text-[10px]">Published</button>
                                  ) : (
                                      <button onClick={() => setPublishingId(p.id)} className="px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl font-bold uppercase text-[10px]">Share</button>
                                  )}
                              </div>
                          </div>
                      ))
                  )}
              </div>
          )}

          {/* Community Projects */}
          {activeTab === 'community' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom duration-500">
                  {communityProjects.map(p => (
                      <div key={p.id} onClick={() => setViewingProject(p)} className="bg-[#1A1D24] rounded-3xl border border-white/5 overflow-hidden cursor-pointer hover:border-indigo-500/30 transition-all group shadow-lg">
                          <div className="h-40 relative bg-black/50">
                              <LiveThumbnail project={p} />
                          </div>
                          <div className="p-5">
                              <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-bold text-white text-sm truncate">{p.name}</h4>
                                  <div className="flex items-center gap-1 text-pink-500 text-xs font-bold">
                                      <Heart className="w-3 h-3 fill-current" /> {p.likes}
                                  </div>
                              </div>
                              <p className="text-[10px] text-gray-500 uppercase font-bold">@{p.authorName}</p>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </main>

      {/* Modals */}
      {isCreating && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-6">
              <div className="bg-[#1A1D24] w-full max-w-sm p-8 rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in-95">
                  <h3 className="text-2xl font-black text-white mb-6 text-center uppercase tracking-tighter italic">Create Project</h3>
                  <input autoFocus type="text" placeholder="Project Name..." value={newProjectName} onChange={e => setNewProjectName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white mb-6 focus:border-indigo-500 outline-none text-center font-bold" />
                  <div className="flex gap-3">
                      <button onClick={() => setIsCreating(false)} className="flex-1 py-3 bg-white/5 text-gray-400 rounded-xl font-bold uppercase text-xs">Cancel</button>
                      <button onClick={handleCreate} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold uppercase text-xs shadow-lg shadow-indigo-900/30">Create</button>
                  </div>
              </div>
          </div>
      )}

      {viewingProject && <PublicPreview project={viewingProject} onClose={() => setViewingProject(null)} onClone={() => cloneCommunityProject(viewingProject)} />}
      {isAuthOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
            <div className="absolute top-8 right-8 z-10">
                <button onClick={() => setIsAuthOpen(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white">
                    <X className="w-6 h-6" />
                </button>
            </div>
            <AuthScreen onSuccess={() => setIsAuthOpen(false)} />
        </div>
      )}
      {publishingId && <PublishModal isOpen={!!publishingId} onClose={() => setPublishingId(null)} projectId={publishingId} />}
      <SuperAdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onOpenPlans={() => setIsPlansOpen(true)} />
      <PlansModal isOpen={isPlansOpen} onClose={() => setIsPlansOpen(false)} />
    </div>
  );
};

export default Dashboard;
