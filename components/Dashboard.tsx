
import React, { useState, useMemo } from 'react';
import { useFile } from '../context/FileContext';
import { useAuth } from '../context/AuthContext';
import { 
    Plus, Code2, Heart, FolderOpen, ArrowLeft, Trash2, 
    ChevronRight, Globe, Sparkles, Smartphone, Search, 
    Zap, Info, Shield, Mail, TrendingUp, Clock, Download,
    ShieldCheck, LayoutDashboard, CheckCircle2, X, Monitor,
    UserCircle, Layers, Settings, LogOut
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
        <div className="w-full h-full bg-[#0F1117] relative overflow-hidden pointer-events-none rounded-t-3xl">
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
  
  const [currentView, setCurrentView] = useState<'home' | 'community' | 'profile_menu' | 'profile_projects' | 'about' | 'privacy'>('home');
  const [isCreating, setIsCreating] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [viewingProject, setViewingProject] = useState<CommunityProject | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('New Project');
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [dismissedInstall, setDismissedInstall] = useState(false);

  // Search and Sort Algorithm State
  const [searchQuery, setSearchQuery] = useState('');
  const [communitySort, setCommunitySort] = useState<'trending' | 'newest'>('trending');

  const popularProjects = useMemo(() => {
      return [...communityProjects]
        .sort((a, b) => (b.likes || 0) - (a.likes || 0))
        .slice(0, 8);
  }, [communityProjects]);

  const filteredCommunityProjects = useMemo(() => {
      let result = [...communityProjects];
      
      if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          result = result.filter(p => 
              p.name.toLowerCase().includes(q) || 
              p.description?.toLowerCase().includes(q) ||
              p.tags?.some(t => t.toLowerCase().includes(q))
          );
      }

      if (communitySort === 'trending') {
          result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      } else {
          result.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      }
      
      return result;
  }, [communityProjects, searchQuery, communitySort]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      await createProject(newProjectName.trim());
      setNewProjectName('New Project');
      setIsCreating(false);
    }
  };

  return (
    <div className="h-[100dvh] bg-[#0F1117] text-gray-200 font-sans overflow-hidden flex flex-col">
      <div className="w-full mx-auto flex-1 flex flex-col h-full bg-[#0B0D12] relative overflow-hidden">
        
        {/* Modern Top Navigation Bar */}
        <header className="px-6 py-5 flex items-center justify-between z-30 shrink-0 bg-[#0B0D12]/60 backdrop-blur-xl border-b border-white/5 sticky top-0">
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentView('home')}>
                    <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                        <Code2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <h1 className="text-lg font-black text-white tracking-tighter uppercase italic leading-none">MYSELF IDE</h1>
                      <span className="text-[8px] text-indigo-400 font-bold uppercase tracking-[0.2em]">Wajid Ali Engine</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {isInstallable && (
                        <button 
                            onClick={installApp}
                            className="p-2 bg-indigo-600/10 text-indigo-400 rounded-full hover:bg-indigo-600 hover:text-white transition-all border border-indigo-500/10 shadow-lg"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    )}
                    {user ? (
                        <button onClick={() => setCurrentView('profile_menu')} className="w-10 h-10 rounded-full border-2 border-indigo-500/20 p-0.5 hover:border-indigo-500 transition-colors">
                            <div className="w-full h-full rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-black overflow-hidden">
                                {userProfile?.avatar ? <img src={userProfile.avatar} className="w-full h-full object-cover" /> : userProfile?.name?.charAt(0) || <UserCircle className="w-full h-full" />}
                            </div>
                        </button>
                    ) : (
                        <button onClick={() => setIsAuthOpen(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-indigo-900/40 hover:bg-indigo-500 transition-all">Join Hub</button>
                    )}
                </div>
            </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 px-4 md:px-10">
            <div className="max-w-7xl mx-auto w-full pt-6 space-y-8">
                
                {/* Slim PWA Banner */}
                {isInstallable && !isStandalone && !dismissedInstall && (
                    <div className="bg-[#1A1D24] border border-indigo-500/20 p-4 rounded-3xl shadow-xl flex items-center justify-between gap-4 animate-in slide-in-from-top duration-500">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center shrink-0">
                                <Smartphone className="w-5 h-5 text-indigo-400" />
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Experience full-screen mode by installing our app.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={installApp} className="px-4 py-2 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-xl">Install</button>
                            <button onClick={() => setDismissedInstall(true)} className="p-2 text-gray-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}

                {currentView === 'home' && (
                    <>
                        {/* Quick Action Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div onClick={() => { setIsCreating(true); }} className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[2.5rem] flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-all shadow-2xl shadow-indigo-900/40 group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Create</h3>
                                    <p className="text-[10px] text-indigo-100 font-bold tracking-widest uppercase opacity-80">Start new project</p>
                                </div>
                                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:rotate-90 transition-transform">
                                    <Plus className="w-8 h-8 text-white" />
                                </div>
                            </div>

                            <div onClick={() => setCurrentView('profile_projects')} className="bg-[#1A1D24] p-8 rounded-[2.5rem] border border-white/5 flex items-center justify-between cursor-pointer hover:bg-[#20232b] transition-all group shadow-xl">
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Workspace</h3>
                                    <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-1">{projects.length} Saved Apps</p>
                                </div>
                                <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Layers className="w-7 h-7 text-indigo-500" />
                                </div>
                            </div>
                        </div>

                        {/* Sections Header */}
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2 italic">
                                <TrendingUp className="w-4 h-4 text-indigo-500" /> Trending Apps
                            </h2>
                            <button onClick={() => setCurrentView('community')} className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1 hover:text-white transition-all">Explore Hub <ChevronRight className="w-4 h-4" /></button>
                        </div>

                        {/* Trending List - Slim Card Design */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-10">
                            {popularProjects.map(project => (
                                <div key={project.id} onClick={() => setViewingProject(project)} className="bg-[#16181D] rounded-[2rem] overflow-hidden border border-white/5 shadow-lg cursor-pointer group hover:border-indigo-500/40 transition-all flex flex-col h-full active:scale-95">
                                    <div className="h-44 relative overflow-hidden bg-black/40">
                                        <LiveThumbnail project={project} />
                                    </div>
                                    <div className="p-5 flex items-center justify-between">
                                        <div className="truncate pr-4">
                                            <h4 className="text-sm font-black text-white uppercase tracking-tight truncate italic">{project.name}</h4>
                                            <p className="text-[9px] text-gray-500 font-bold uppercase mt-0.5 truncate opacity-60">@{project.authorName}</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-pink-500">
                                            <Heart className={`w-3.5 h-3.5 ${project.likedBy?.[user?.uid] ? 'fill-current' : ''}`} />
                                            <span className="text-[10px] font-black">{project.likes || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {currentView === 'community' && (
                    <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom duration-500 pb-20">
                        <button onClick={() => setCurrentView('home')} className="flex items-center gap-2 text-gray-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Back to dashboard
                        </button>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Global Hub</h2>
                            <div className="flex bg-[#16181D] p-1 rounded-2xl border border-white/5 shadow-inner w-full md:w-auto">
                                <button onClick={() => setCommunitySort('trending')} className={`flex-1 md:px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${communitySort === 'trending' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}>Trending</button>
                                <button onClick={() => setCommunitySort('newest')} className={`flex-1 md:px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${communitySort === 'newest' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}>Newest</button>
                            </div>
                        </div>

                        <div className="relative group max-w-2xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search amazing projects..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#1A1D24] border border-white/10 rounded-[1.5rem] py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-bold shadow-xl"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                             {filteredCommunityProjects.map(project => (
                                 <div key={project.id} onClick={() => setViewingProject(project)} className="bg-[#16181D] rounded-[2rem] overflow-hidden border border-white/5 shadow-xl cursor-pointer group hover:border-indigo-500/30 transition-all flex flex-col h-full">
                                     <div className="h-40 relative bg-black">
                                         <LiveThumbnail project={project} />
                                     </div>
                                     <div className="p-5">
                                         <h4 className="font-black text-white uppercase tracking-tight text-sm truncate italic">{project.name}</h4>
                                         <div className="flex items-center justify-between mt-3">
                                             <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">by {project.authorName}</span>
                                             <div className="flex items-center gap-1 text-pink-500 text-[10px] font-black">
                                                 <Heart className={`w-3 h-3 ${project.likedBy?.[user?.uid] ? 'fill-current' : ''}`} />
                                                 {project.likes}
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    </div>
                )}

                {currentView === 'profile_menu' && (
                    <div className="space-y-4 animate-in slide-in-from-right duration-300 pt-6 pb-20 max-w-md mx-auto">
                         <div className="flex items-center justify-between mb-8">
                            <button onClick={() => setCurrentView('home')} className="p-3 bg-white/5 rounded-full text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
                            <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] italic">Settings</h2>
                            <div className="w-11"></div>
                         </div>
                         
                         <div className="bg-gradient-to-br from-[#1A1D24] to-[#0B0D12] p-10 rounded-[3rem] border border-white/5 text-center shadow-2xl relative overflow-hidden mb-6">
                            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/50"></div>
                            <div className="w-24 h-24 rounded-3xl bg-indigo-600/10 mx-auto flex items-center justify-center border border-indigo-500/20 mb-6 overflow-hidden">
                                 {userProfile?.avatar ? <img src={userProfile.avatar} className="w-full h-full object-cover" /> : <UserCircle className="w-16 h-16 text-indigo-500 opacity-50" />}
                            </div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">{userProfile?.name}</h2>
                            <p className="text-[10px] text-indigo-400 font-bold mt-1 tracking-widest uppercase opacity-60">{userProfile?.email}</p>
                            
                            <div className="grid grid-cols-2 gap-3 mt-10">
                                <div className="bg-black/40 p-5 rounded-2xl border border-white/5 text-center">
                                    <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest block">Credits</span>
                                    <div className="text-xl font-black text-indigo-400 mt-1">{userProfile?.credits || 0}</div>
                                </div>
                                <div className="bg-black/40 p-5 rounded-2xl border border-white/5 text-center">
                                    <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest block">Unlocks</span>
                                    <div className="text-xl font-black text-green-400 mt-1">{userProfile?.sourceCodeCredits || 0}</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                             <button onClick={() => setCurrentView('about')} className="w-full flex items-center justify-between p-5 bg-[#1A1D24] rounded-2xl border border-white/5 group hover:bg-[#20232b] transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-purple-600/10 flex items-center justify-center text-purple-500"><Info className="w-5 h-5" /></div>
                                    <span className="font-black uppercase text-[10px] tracking-widest text-gray-300 italic">About Engine</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-700" />
                             </button>
                             <button onClick={() => setCurrentView('privacy')} className="w-full flex items-center justify-between p-5 bg-[#1A1D24] rounded-2xl border border-white/5 group hover:bg-[#20232b] transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500"><Shield className="w-5 h-5" /></div>
                                    <span className="font-black uppercase text-[10px] tracking-widest text-gray-300 italic">Privacy Shield</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-700" />
                             </button>
                             {user?.email === 'mbhia78@gmail.com' && (
                                <button onClick={() => setIsAdminOpen(true)} className="w-full flex items-center justify-between p-5 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div>
                                        <span className="font-black uppercase text-[10px] tracking-widest italic">Super Admin</span>
                                    </div>
                                    <ArrowLeft className="w-4 h-4 rotate-180" />
                                </button>
                             )}
                             <button onClick={() => logout()} className="w-full flex items-center justify-between p-5 bg-red-600/5 rounded-2xl border border-red-500/10 text-red-500 mt-10 hover:bg-red-600 hover:text-white transition-all">
                                <span className="font-black uppercase text-[10px] tracking-widest italic ml-1">Terminate Session</span>
                                <LogOut className="w-5 h-5" />
                             </button>
                        </div>
                    </div>
                )}

                {currentView === 'profile_projects' && (
                    <div className="space-y-6 pt-6 pb-20 animate-in slide-in-from-bottom duration-500">
                        <div className="flex items-center justify-between">
                            <button onClick={() => setCurrentView('home')} className="p-3 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                            <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] italic">Workspace</h2>
                            <button onClick={() => setIsCreating(true)} className="p-3 bg-indigo-600 text-white rounded-full shadow-lg"><Plus className="w-5 h-5" /></button>
                        </div>
                        
                        {projects.length === 0 ? (
                            <div className="text-center py-32 bg-[#1A1D24] rounded-[3rem] border border-dashed border-white/10 flex flex-col items-center justify-center">
                                <Layers className="w-16 h-16 text-gray-800 mb-6 opacity-20" />
                                <p className="text-gray-500 font-black uppercase text-[9px] tracking-[0.2em] opacity-50">Zero projects found in cloud</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {projects.map(p => (
                                    <div key={p.id} className="bg-[#1A1D24] p-6 rounded-[2.5rem] border border-white/5 flex flex-col justify-between group hover:border-indigo-500/20 transition-all shadow-xl active:scale-[0.98]">
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="truncate pr-4">
                                                    <h4 className="font-black text-white uppercase tracking-tight text-lg truncate italic">{p.name}</h4>
                                                    <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-1 block">{new Date(p.lastModified).toLocaleDateString()}</span>
                                                </div>
                                                <button onClick={() => { if(window.confirm('Erase this project from cloud?')) deleteProject(p.id); }} className="p-2 text-gray-800 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                            <div className="flex items-center gap-2 mb-8">
                                                {p.isPublic && <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[8px] font-black uppercase rounded-full border border-green-500/10">Live on Hub</span>}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button onClick={() => openProject(p.id)} className="py-3.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-2xl shadow-lg">Open</button>
                                            {p.isPublic ? (
                                                <button onClick={() => unpublishProject(p.id)} className="py-3.5 bg-white/5 text-gray-400 text-[10px] font-black uppercase rounded-2xl border border-white/5">Hide</button>
                                            ) : (
                                                <button onClick={() => setPublishingId(p.id)} className="py-3.5 bg-white/5 text-indigo-400 text-[10px] font-black uppercase rounded-2xl border border-indigo-500/10">Share</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* About and Privacy Updated to slim designs */}
                {currentView === 'about' && (
                  <div className="pt-6 pb-20 animate-in slide-in-from-bottom duration-500 max-w-xl mx-auto">
                    <button onClick={() => setCurrentView('profile_menu')} className="mb-6 p-3 bg-white/5 rounded-full text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
                    <div className="bg-[#1A1D24] p-10 rounded-[3rem] border border-white/5 text-center">
                        <div className="w-20 h-20 bg-indigo-600/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-indigo-500/20">
                            <Zap className="w-10 h-10 text-indigo-500" />
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic mb-4">WAI Engine 3.0</h2>
                        <div className="prose prose-invert prose-sm text-gray-400 font-bold uppercase text-[10px] tracking-widest leading-relaxed">
                            <p>Developed by Wajid Ali, this platform is built to revolutionize cloud coding. Powered by OpenRouter intelligence, we deliver unmatched performance and real-time generation logic.</p>
                            <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
                                <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-indigo-400" /> mbhia78@gmail.com</div>
                                <div className="text-[8px] text-gray-600">© 2024 MYSELF IDE ECOSYSTEM</div>
                            </div>
                        </div>
                    </div>
                  </div>
                )}

                {currentView === 'privacy' && (
                  <div className="pt-6 pb-20 animate-in slide-in-from-bottom duration-500 max-w-xl mx-auto">
                    <button onClick={() => setCurrentView('profile_menu')} className="mb-6 p-3 bg-white/5 rounded-full text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
                    <div className="bg-[#1A1D24] p-10 rounded-[3rem] border border-white/5">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-8 flex items-center gap-3"><Shield className="w-6 h-6 text-indigo-500" /> Privacy Shield</h2>
                        <div className="space-y-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-loose">
                            <p>Your data is encrypted end-to-end. We do not store or sell your proprietary source code.</p>
                            <p>All cloud storage is managed via Firebase Secure Clusters with isolated user permissions.</p>
                            <div className="bg-black/20 p-5 rounded-2xl border border-white/5 text-indigo-400 text-center italic">
                                Protection active for user: {userProfile?.email}
                            </div>
                        </div>
                    </div>
                  </div>
                )}
            </div>
        </div>

        {/* Floating Create Project Button for Mobile */}
        <div className="md:hidden fixed bottom-6 right-6 z-40">
            <button 
                onClick={() => setIsCreating(true)}
                className="w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center shadow-indigo-900/60 active:scale-90 transition-transform"
            >
                <Plus className="w-8 h-8" />
            </button>
        </div>

        {/* Global Bottom Navigation for Mobile feel */}
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-[#0B0D12]/90 backdrop-blur-2xl border-t border-white/5 z-30 flex items-center justify-around px-4 md:hidden">
            <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-1 transition-colors ${currentView === 'home' ? 'text-indigo-500' : 'text-gray-600'}`}>
                <LayoutDashboard className="w-6 h-6" />
                <span className="text-[8px] font-black uppercase tracking-widest italic">Dashboard</span>
            </button>
            <button onClick={() => setCurrentView('community')} className={`flex flex-col items-center gap-1 transition-colors ${currentView === 'community' ? 'text-indigo-500' : 'text-gray-600'}`}>
                <Globe className="w-6 h-6" />
                <span className="text-[8px] font-black uppercase tracking-widest italic">Hub</span>
            </button>
            <div className="w-16"></div> {/* Spacer for Create Button */}
            <button onClick={() => setCurrentView('profile_projects')} className={`flex flex-col items-center gap-1 transition-colors ${currentView === 'profile_projects' ? 'text-indigo-500' : 'text-gray-600'}`}>
                <Layers className="w-6 h-6" />
                <span className="text-[8px] font-black uppercase tracking-widest italic">Work</span>
            </button>
            <button onClick={() => setCurrentView('profile_menu')} className={`flex flex-col items-center gap-1 transition-colors ${currentView === 'profile_menu' ? 'text-indigo-400' : 'text-gray-600'}`}>
                <Settings className="w-6 h-6" />
                <span className="text-[8px] font-black uppercase tracking-widest italic">Menu</span>
            </button>
        </div>
      </div>
      
      {/* Native-style Creation Modal */}
      {isCreating && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6 animate-in fade-in duration-300">
              <div className="bg-[#1A1D24] w-full max-w-sm p-10 rounded-[3rem] border border-white/10 shadow-2xl scale-in-center">
                  <h3 className="text-3xl font-black text-white mb-8 text-center uppercase tracking-tighter italic">Evolve Idea</h3>
                  <input autoFocus type="text" placeholder="Application Name..." value={newProjectName} onChange={e => setNewProjectName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white mb-8 focus:border-indigo-500 outline-none text-center font-bold shadow-inner uppercase tracking-widest" />
                  <div className="flex gap-3">
                      <button onClick={() => setIsCreating(false)} className="flex-1 py-4 text-gray-500 font-black uppercase text-xs tracking-widest">Abort</button>
                      <button onClick={handleCreate} className="flex-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase shadow-xl shadow-indigo-900/40 text-[11px] tracking-widest italic">Initialize</button>
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
