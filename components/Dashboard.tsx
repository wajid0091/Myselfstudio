
import React, { useState, useMemo } from 'react';
import { useFile } from '../context/FileContext';
import { useAuth } from '../context/AuthContext';
import { 
    Plus, Code2, Heart, FolderOpen, ArrowLeft, Trash2, 
    ChevronRight, Globe, Search, Zap, Download,
    ShieldCheck, LayoutDashboard, X, Smartphone,
    UserCircle, Layers, Settings, LogOut, TrendingUp, Clock
} from 'lucide-react';
import { CommunityProject } from '../types';
import PublicPreview from './PublicPreview';
import AuthScreen from './AuthScreen';
import SuperAdminPanel from './SuperAdminPanel';
import PublishModal from './PublishModal';
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
        <div className="w-full h-full bg-[#0F1117] relative overflow-hidden pointer-events-none rounded-t-[2rem]">
            <iframe 
                title="preview"
                srcDoc={srcDoc}
                className="w-full h-full border-none pointer-events-none"
                loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#16181D] via-transparent to-transparent"></div>
        </div>
    );
};

const Dashboard: React.FC = () => {
  const { projects, createProject, communityProjects, cloneCommunityProject, openProject, deleteProject, toggleLike, unpublishProject } = useFile();
  const { user, userProfile, logout } = useAuth();
  const { isInstallable, installApp, isStandalone } = usePWA();
  
  const [currentView, setCurrentView] = useState<'home' | 'community' | 'profile_menu' | 'profile_projects'>('home');
  const [isCreating, setIsCreating] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [viewingProject, setViewingProject] = useState<CommunityProject | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('New Project');
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [dismissedInstall, setDismissedInstall] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCommunityProjects = useMemo(() => {
      if (!searchQuery.trim()) return communityProjects;
      const q = searchQuery.toLowerCase();
      return communityProjects.filter(p => p.name.toLowerCase().includes(q) || p.authorName.toLowerCase().includes(q));
  }, [communityProjects, searchQuery]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      await createProject(newProjectName.trim());
      setIsCreating(false);
    }
  };

  return (
    <div className="h-screen bg-[#0F1117] text-gray-200 font-sans overflow-hidden flex flex-col">
      {/* Top Header */}
      <header className="px-6 py-4 flex items-center justify-between z-30 shrink-0 bg-[#0F1117]/80 backdrop-blur-xl border-b border-white/5 sticky top-0">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentView('home')}>
                  <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:rotate-6 transition-transform">
                      <Code2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none">MYSELF IDE</h1>
                    <span className="text-[8px] text-indigo-400 font-bold uppercase tracking-widest">WAI Assistant v3</span>
                  </div>
              </div>
              <div className="flex items-center gap-3">
                  {isInstallable && (
                      <button onClick={installApp} className="p-2.5 bg-indigo-600/10 text-indigo-400 rounded-full border border-indigo-500/10">
                          <Download className="w-5 h-5" />
                      </button>
                  )}
                  {user ? (
                      <button onClick={() => setCurrentView('profile_menu')} className="w-10 h-10 rounded-full border-2 border-indigo-500/20 p-0.5">
                          <div className="w-full h-full rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-black overflow-hidden uppercase">
                              {userProfile?.avatar ? <img src={userProfile.avatar} className="w-full h-full object-cover" /> : userProfile?.name?.charAt(0)}
                          </div>
                      </button>
                  ) : (
                      <button onClick={() => setIsAuthOpen(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-indigo-900/30">Sign In</button>
                  )}
              </div>
          </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto scrollbar-hide pb-32">
          <div className="max-w-7xl mx-auto w-full px-6 pt-8 space-y-10">
              
              {currentView === 'home' && (
                  <>
                      {/* Hero Section */}
                      <div className="relative p-10 bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[3rem] shadow-2xl overflow-hidden group">
                          <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                          <div className="relative z-10 space-y-4">
                              <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">Innovate <br/> Your Vision</h2>
                              <p className="text-indigo-100/70 text-xs font-bold uppercase tracking-[0.2em]">Build anything with AI Assistant</p>
                              <button onClick={() => setIsCreating(true)} className="px-8 py-4 bg-white text-indigo-900 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Start Project</button>
                          </div>
                      </div>

                      {/* Stats & Actions */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div onClick={() => setCurrentView('profile_projects')} className="bg-[#1A1D24] p-6 rounded-[2.5rem] border border-white/5 text-center cursor-pointer hover:bg-[#20232b] transition-all">
                              <Layers className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
                              <span className="text-xl font-black text-white">{projects.length}</span>
                              <p className="text-[9px] text-gray-500 font-black uppercase mt-1 tracking-widest">Workspace</p>
                          </div>
                          <div className="bg-[#1A1D24] p-6 rounded-[2.5rem] border border-white/5 text-center">
                              <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
                              <span className="text-xl font-black text-white">{userProfile?.credits || 0}</span>
                              <p className="text-[9px] text-gray-500 font-black uppercase mt-1 tracking-widest">AI Credits</p>
                          </div>
                          <div onClick={() => setCurrentView('community')} className="bg-[#1A1D24] p-6 rounded-[2.5rem] border border-white/5 text-center cursor-pointer hover:bg-[#20232b] transition-all">
                              <Globe className="w-8 h-8 text-green-500 mx-auto mb-3" />
                              <span className="text-xl font-black text-white">{communityProjects.length}</span>
                              <p className="text-[9px] text-gray-500 font-black uppercase mt-1 tracking-widest">Global Hub</p>
                          </div>
                          <div className="bg-[#1A1D24] p-6 rounded-[2.5rem] border border-white/5 text-center">
                              <Heart className="w-8 h-8 text-pink-500 mx-auto mb-3" />
                              <span className="text-xl font-black text-white">{userProfile?.projectsPublished || 0}</span>
                              <p className="text-[9px] text-gray-500 font-black uppercase mt-1 tracking-widest">Publishes</p>
                          </div>
                      </div>

                      {/* Trending Feed */}
                      <div className="space-y-6 pt-4">
                          <div className="flex items-center justify-between px-2">
                              <h3 className="text-lg font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                                  <TrendingUp className="w-5 h-5 text-indigo-500" /> Trending Projects
                              </h3>
                              <button onClick={() => setCurrentView('community')} className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">View All Hub</button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                              {communityProjects.slice(0, 4).map(p => (
                                  <div key={p.id} onClick={() => setViewingProject(p)} className="bg-[#16181D] rounded-[2.5rem] border border-white/5 shadow-xl group cursor-pointer hover:border-indigo-500/30 transition-all flex flex-col">
                                      <div className="h-44 relative bg-black/50">
                                          <LiveThumbnail project={p} />
                                      </div>
                                      <div className="p-6 flex items-center justify-between">
                                          <div className="truncate pr-4">
                                              <h4 className="font-black text-white uppercase text-sm truncate italic">{p.name}</h4>
                                              <p className="text-[9px] text-gray-500 font-bold uppercase mt-1 truncate">@{p.authorName}</p>
                                          </div>
                                          <div className="flex items-center gap-1 text-pink-500 text-xs font-black">
                                              <Heart className={`w-3.5 h-3.5 ${p.likedBy?.[user?.uid] ? 'fill-current' : ''}`} />
                                              {p.likes}
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </>
              )}

              {currentView === 'community' && (
                  <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Global Hub</h2>
                          <div className="relative group w-full md:w-96">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                              <input 
                                  type="text" 
                                  placeholder="Search community..." 
                                  value={searchQuery}
                                  onChange={e => setSearchQuery(e.target.value)}
                                  className="w-full bg-[#1A1D24] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-indigo-500 transition-all font-bold"
                              />
                          </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {filteredCommunityProjects.map(p => (
                              <div key={p.id} onClick={() => setViewingProject(p)} className="bg-[#16181D] rounded-[2.5rem] border border-white/5 shadow-xl group cursor-pointer hover:border-indigo-500/30 transition-all">
                                  <div className="h-44 relative bg-black/50">
                                      <LiveThumbnail project={p} />
                                  </div>
                                  <div className="p-6 flex items-center justify-between">
                                      <div className="truncate pr-4">
                                          <h4 className="font-black text-white uppercase text-sm truncate italic">{p.name}</h4>
                                          <p className="text-[9px] text-gray-500 font-bold mt-1">@{p.authorName}</p>
                                      </div>
                                      <Heart className={`w-5 h-5 text-pink-500 ${p.likedBy?.[user?.uid] ? 'fill-current' : ''}`} />
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {currentView === 'profile_projects' && (
                  <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
                      <div className="flex items-center justify-between">
                          <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Workspace</h2>
                          <button onClick={() => setIsCreating(true)} className="p-4 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-900/40"><Plus className="w-6 h-6" /></button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {projects.map(p => (
                              <div key={p.id} className="bg-[#1A1D24] p-8 rounded-[3rem] border border-white/5 shadow-2xl flex flex-col justify-between group">
                                  <div>
                                      <div className="flex justify-between items-start mb-6">
                                          <div className="truncate pr-4">
                                              <h4 className="text-xl font-black text-white uppercase tracking-tighter italic truncate">{p.name}</h4>
                                              <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">{new Date(p.lastModified).toLocaleDateString()}</p>
                                          </div>
                                          <button onClick={() => {if(window.confirm('Delete project?')) deleteProject(p.id)}} className="p-2 text-red-500/20 group-hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                                      </div>
                                  </div>
                                  <div className="flex gap-3">
                                      <button onClick={() => openProject(p.id)} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-900/20 active:scale-95 transition-all">Launch IDE</button>
                                      {p.isPublic ? (
                                          <button onClick={() => unpublishProject(p.id)} className="px-6 py-4 bg-white/5 text-gray-500 rounded-2xl font-black uppercase text-[10px] border border-white/5">Unpublish</button>
                                      ) : (
                                          <button onClick={() => setPublishingId(p.id)} className="px-6 py-4 bg-indigo-600/10 text-indigo-400 rounded-2xl font-black uppercase text-[10px] border border-indigo-500/20">Share</button>
                                      )}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {currentView === 'profile_menu' && (
                  <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right duration-300">
                      <div className="bg-gradient-to-br from-[#1A1D24] to-[#0B0D12] p-12 rounded-[4rem] border border-white/5 text-center shadow-2xl relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
                          <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-600/10 mx-auto flex items-center justify-center border border-indigo-500/20 mb-8 overflow-hidden">
                              {userProfile?.avatar ? <img src={userProfile.avatar} className="w-full h-full object-cover" /> : <UserCircle className="w-20 h-20 text-indigo-500 opacity-50" />}
                          </div>
                          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">{userProfile?.name}</h2>
                          <p className="text-xs text-indigo-400 font-bold mt-2 uppercase tracking-widest opacity-60">{userProfile?.email}</p>
                          
                          <div className="grid grid-cols-2 gap-4 mt-12">
                              <div className="bg-black/40 p-6 rounded-3xl border border-white/5">
                                  <span className="text-[10px] text-gray-500 uppercase font-black block tracking-widest">AI Power</span>
                                  <div className="text-2xl font-black text-indigo-400 mt-1">{userProfile?.credits || 0}</div>
                              </div>
                              <div className="bg-black/40 p-6 rounded-3xl border border-white/5">
                                  <span className="text-[10px] text-gray-500 uppercase font-black block tracking-widest">Unlocked</span>
                                  <div className="text-2xl font-black text-green-400 mt-1">{userProfile?.sourceCodeCredits || 0}</div>
                              </div>
                          </div>
                      </div>

                      <div className="space-y-3">
                          {user?.email === 'mbhia78@gmail.com' && (
                              <button onClick={() => setIsAdminOpen(true)} className="w-full p-6 bg-indigo-600/10 rounded-[2rem] border border-indigo-500/20 text-indigo-400 font-black uppercase text-xs flex items-center justify-between">
                                  <span className="flex items-center gap-3"><ShieldCheck className="w-5 h-5" /> Admin Controls</span>
                                  <ChevronRight className="w-5 h-5" />
                              </button>
                          )}
                          <button onClick={() => logout()} className="w-full p-6 bg-red-600/10 rounded-[2rem] border border-red-500/20 text-red-500 font-black uppercase text-xs flex items-center justify-between">
                              <span className="flex items-center gap-3"><LogOut className="w-5 h-5" /> Terminate Session</span>
                              <ChevronRight className="w-5 h-5" />
                          </button>
                      </div>
                  </div>
              )}
          </div>
      </main>

      {/* Floating Navigation (Android Style) */}
      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-[#0B0D12]/90 backdrop-blur-2xl border-t border-white/5 z-40 flex items-center justify-around px-8">
          <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-1.5 transition-all ${currentView === 'home' ? 'text-indigo-500' : 'text-gray-600'}`}>
              <LayoutDashboard className={`w-7 h-7 ${currentView === 'home' ? 'scale-110' : ''}`} />
              <span className="text-[9px] font-black uppercase tracking-widest italic">Home</span>
          </button>
          <button onClick={() => setCurrentView('community')} className={`flex flex-col items-center gap-1.5 transition-all ${currentView === 'community' ? 'text-indigo-500' : 'text-gray-600'}`}>
              <Globe className={`w-7 h-7 ${currentView === 'community' ? 'scale-110' : ''}`} />
              <span className="text-[9px] font-black uppercase tracking-widest italic">Hub</span>
          </button>
          <button onClick={() => setIsCreating(true)} className="w-20 h-20 -mt-16 bg-indigo-600 text-white rounded-full shadow-[0_15px_40px_rgba(79,70,229,0.4)] flex items-center justify-center active:scale-90 transition-all border-[6px] border-[#0B0D12]">
              <Plus className="w-10 h-10" />
          </button>
          <button onClick={() => setCurrentView('profile_projects')} className={`flex flex-col items-center gap-1.5 transition-all ${currentView === 'profile_projects' ? 'text-indigo-500' : 'text-gray-600'}`}>
              <Layers className={`w-7 h-7 ${currentView === 'profile_projects' ? 'scale-110' : ''}`} />
              <span className="text-[9px] font-black uppercase tracking-widest italic">Work</span>
          </button>
          <button onClick={() => setCurrentView('profile_menu')} className={`flex flex-col items-center gap-1.5 transition-all ${currentView === 'profile_menu' ? 'text-indigo-500' : 'text-gray-600'}`}>
              <Settings className={`w-7 h-7 ${currentView === 'profile_menu' ? 'scale-110' : ''}`} />
              <span className="text-[9px] font-black uppercase tracking-widest italic">Menu</span>
          </button>
      </nav>
      
      {/* Creation Modal */}
      {isCreating && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6 animate-in fade-in duration-300">
              <div className="bg-[#1A1D24] w-full max-w-sm p-12 rounded-[3.5rem] border border-white/10 shadow-2xl scale-in-center">
                  <h3 className="text-3xl font-black text-white mb-10 text-center uppercase tracking-tighter italic">Evolve Idea</h3>
                  <input autoFocus type="text" placeholder="Application Name..." value={newProjectName} onChange={e => setNewProjectName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-white mb-10 focus:border-indigo-500 outline-none text-center font-bold shadow-inner uppercase tracking-widest" />
                  <div className="flex gap-4">
                      <button onClick={() => setIsCreating(false)} className="flex-1 py-4 text-gray-500 font-black uppercase text-xs tracking-widest">Abort</button>
                      <button onClick={handleCreate} className="flex-2 px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase shadow-xl shadow-indigo-900/40 text-[11px] tracking-widest italic">Initialize</button>
                  </div>
              </div>
          </div>
      )}

      {viewingProject && <PublicPreview project={viewingProject} onClose={() => setViewingProject(null)} onClone={() => cloneCommunityProject(viewingProject)} />}
      {isAuthOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute top-8 right-8 z-10">
                <button onClick={() => setIsAuthOpen(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>
            <AuthScreen onSuccess={() => setIsAuthOpen(false)} />
        </div>
      )}
      {publishingId && <PublishModal isOpen={!!publishingId} onClose={() => setPublishingId(null)} projectId={publishingId} />}
      <SuperAdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
    </div>
  );
};

export default Dashboard;
