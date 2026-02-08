
import React, { useState, useMemo } from 'react';
import { useFile } from '../context/FileContext';
import { useAuth } from '../context/AuthContext';
import { 
    Plus, Code2, Heart, FolderOpen, ArrowLeft, Trash2, 
    ChevronRight, Globe, Sparkles, Smartphone, Search, 
    Zap, Info, Shield, Mail, TrendingUp, Clock, Download,
    ShieldCheck, LayoutDashboard, CheckCircle2, X, Monitor
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
        <div className="w-full h-full bg-[#0F1117] relative overflow-hidden pointer-events-none">
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
  const { projects, createProject, communityProjects, cloneCommunityProject, openProject, deleteProject, toggleLike, unpublishProject } = useFile();
  const { user, userProfile, logout } = useAuth();
  const { isInstallable, installApp, isStandalone } = usePWA();
  
  const [currentView, setCurrentView] = useState<'home' | 'community' | 'profile_menu' | 'profile_projects' | 'about' | 'privacy'>('home');
  const [isCreating, setIsCreating] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [viewingProject, setViewingProject] = useState<CommunityProject | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('My Project');
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [dismissedInstall, setDismissedInstall] = useState(false);

  // Search and Sort Algorithm State
  const [searchQuery, setSearchQuery] = useState('');
  const [communitySort, setCommunitySort] = useState<'trending' | 'newest'>('trending');

  const popularProjects = useMemo(() => {
      return [...communityProjects]
        .sort((a, b) => (b.likes || 0) - (a.likes || 0))
        .slice(0, 12);
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
      setNewProjectName('My Project');
      setIsCreating(false);
    }
  };

  return (
    <div className="h-[100dvh] bg-[#0F1117] text-gray-200 font-sans overflow-hidden flex flex-col">
      <div className="w-full mx-auto flex-1 flex flex-col h-full bg-[#0B0D12] relative">
        
        {/* Header - Stays Fixed Width/Center for UX but spans full width background */}
        <header className="px-6 py-5 flex items-center justify-between z-30 shrink-0 bg-[#0B0D12]/80 backdrop-blur-xl border-b border-white/5 sticky top-0">
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>
                    <div className="w-10 h-10 bg-[#4F46E5] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/40">
                        <Code2 className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl font-black text-white tracking-tighter uppercase italic">MYSELF IDE</h1>
                </div>
                <div className="flex items-center gap-2">
                    {isInstallable && (
                        <button 
                            onClick={installApp}
                            className="p-2.5 bg-indigo-600/10 text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all border border-indigo-500/20 shadow-lg"
                            title="Install App"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                    )}
                    {user ? (
                        <button onClick={() => setCurrentView('profile_menu')} className="w-10 h-10 rounded-full bg-[#4F46E5]/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black hover:bg-indigo-600 hover:text-white transition-all overflow-hidden">
                            {userProfile?.avatar ? <img src={userProfile.avatar} className="w-full h-full object-cover" /> : userProfile?.name?.charAt(0) || 'W'}
                        </button>
                    ) : (
                        <button onClick={() => setIsAuthOpen(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-indigo-900/40">Login Account</button>
                    )}
                </div>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 px-6 md:px-10 space-y-8">
            <div className="max-w-7xl mx-auto w-full space-y-8 pt-6">
                
                {/* LUXURY PWA NOTIFICATION BANNER */}
                {isInstallable && !isStandalone && !dismissedInstall && (
                    <div className="bg-[#1A1D24] border border-indigo-500/30 p-6 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-top-4 duration-500 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-indigo-600/20 rounded-2xl flex items-center justify-center shrink-0">
                                    <Smartphone className="w-7 h-7 text-indigo-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight italic">Professional App Experience</h3>
                                    <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-wider leading-relaxed opacity-70">Install MYSELF IDE for full-screen coding, zero interruptions, and ultra-fast AI responses.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={installApp}
                                    className="px-6 py-3 bg-indigo-600 text-white text-[11px] font-black uppercase rounded-2xl shadow-xl shadow-indigo-900/40 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <Zap className="w-3.5 h-3.5 fill-current" /> Install Now
                                </button>
                                <button 
                                    onClick={() => setDismissedInstall(true)}
                                    className="px-5 py-3 bg-white/5 text-gray-400 text-[11px] font-black uppercase rounded-2xl hover:text-white transition-colors flex items-center gap-2"
                                >
                                    <Monitor className="w-3.5 h-3.5" /> Use in Chrome
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {currentView === 'home' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div onClick={() => { setIsCreating(true); setNewProjectName('My Project'); }} className="bg-[#1A1D24] p-10 rounded-[2.5rem] border border-white/5 flex items-center gap-8 cursor-pointer hover:border-indigo-500/40 transition-all group shadow-2xl relative overflow-hidden">
                                <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl"></div>
                                <div className="w-20 h-20 bg-indigo-600/20 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform z-10 border border-indigo-500/20">
                                    <Plus className="w-10 h-10 text-indigo-500" />
                                </div>
                                <div className="z-10">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Create Project</h3>
                                    <p className="text-xs text-gray-500 font-bold tracking-widest uppercase opacity-60 mt-1">Develop unique Web Apps with WAI Engine</p>
                                </div>
                            </div>

                            <div onClick={() => setCurrentView('profile_projects')} className="bg-[#1A1D24] p-10 rounded-[2.5rem] border border-white/5 flex items-center gap-8 cursor-pointer hover:border-purple-500/40 transition-all group shadow-2xl relative overflow-hidden">
                                 <div className="absolute -right-6 -top-6 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl"></div>
                                <div className="w-20 h-20 bg-purple-600/20 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform z-10 border border-purple-500/20">
                                    <FolderOpen className="w-10 h-10 text-purple-500" />
                                </div>
                                <div className="z-10">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">My Workspace</h3>
                                    <p className="text-xs text-gray-500 font-bold tracking-widest uppercase opacity-60 mt-1">{projects.length} Saved Professional Projects</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-2 pt-6">
                            <div className="flex items-center gap-3 text-white font-black uppercase italic tracking-tighter text-xl">
                                <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                Worldwide Trending
                            </div>
                            <button onClick={() => setCurrentView('community')} className="text-xs text-indigo-400 font-black uppercase flex items-center gap-1 hover:text-white transition-colors border-b border-indigo-500/20 pb-1">Enter Community Hub <ChevronRight className="w-4 h-4" /></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
                            {popularProjects.map(project => (
                                <div key={project.id} onClick={() => setViewingProject(project)} className="bg-[#16181D] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl cursor-pointer group hover:border-indigo-500/30 transition-all flex flex-col h-full">
                                    <div className="h-64 relative bg-[#0F1117] shrink-0">
                                        <LiveThumbnail project={project} />
                                        <div className="absolute top-5 right-5 flex gap-2">
                                            <div className="px-4 py-1.5 bg-black/70 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase border border-white/10 tracking-widest shadow-xl">
                                                {project.tags?.[0] || 'Web Project'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-7 flex items-center justify-between bg-[#16181D]">
                                        <div>
                                            <h4 className="text-lg font-black text-white uppercase tracking-tighter line-clamp-1 italic">{project.name}</h4>
                                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1 opacity-60">{project.authorName}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-center">
                                                <Heart className={`w-5 h-5 transition-all ${project.likedBy?.[user?.uid] ? 'text-pink-500 fill-pink-500 scale-110' : 'text-gray-600 group-hover:text-gray-400'}`} />
                                                <span className="text-[10px] font-black text-gray-500 mt-1">{project.likes || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {currentView === 'community' && (
                    <div className="space-y-8 pt-4 animate-in fade-in slide-in-from-bottom duration-500 pb-20">
                        <button onClick={() => setCurrentView('home')} className="flex items-center gap-3 text-gray-500 font-black uppercase text-xs tracking-widest mb-2 hover:text-white transition-colors group"><ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home Dashboard</button>
                        <div className="flex items-center justify-between">
                            <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Community Hub</h2>
                        </div>

                        {/* Search Algorithm UI */}
                        <div className="relative group">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-500 transition-colors">
                                <Search className="w-6 h-6" />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Search high-quality projects, portfolios, games..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#1A1D24] border border-white/10 rounded-3xl py-6 pl-16 pr-6 text-base text-white focus:outline-none focus:border-indigo-500 transition-all font-bold shadow-2xl"
                            />
                        </div>

                        {/* Sorting Algorithm UI */}
                        <div className="flex max-w-md bg-[#16181D] p-1.5 rounded-2xl border border-white/5 shadow-inner">
                            <button 
                                onClick={() => setCommunitySort('trending')}
                                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${communitySort === 'trending' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40' : 'text-gray-500 hover:text-white'}`}
                            >
                                <TrendingUp className="w-4 h-4" /> Most Trending
                            </button>
                            <button 
                                onClick={() => setCommunitySort('newest')}
                                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${communitySort === 'newest' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40' : 'text-gray-500 hover:text-white'}`}
                            >
                                <Clock className="w-4 h-4" /> Newest Uploads
                            </button>
                        </div>

                        {/* Filtered Content Grid - Fully Responsive */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                             {filteredCommunityProjects.length > 0 ? filteredCommunityProjects.map(project => (
                                 <div key={project.id} onClick={() => setViewingProject(project)} className="bg-[#16181D] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-xl cursor-pointer group hover:border-indigo-500/30 transition-all flex flex-col h-full">
                                     <div className="h-48 relative bg-[#0F1117] shrink-0">
                                         <LiveThumbnail project={project} />
                                         <div className="absolute top-4 left-4 flex flex-wrap gap-1">
                                             {project.tags?.slice(0, 2).map(tag => (
                                                 <span key={tag} className="px-3 py-1 bg-black/70 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase border border-white/10 tracking-widest">{tag}</span>
                                             ))}
                                         </div>
                                     </div>
                                     <div className="p-6 flex justify-between items-center bg-[#16181D] flex-1">
                                         <div>
                                             <h4 className="font-black text-white uppercase tracking-tighter text-base truncate max-w-[140px] italic">{project.name}</h4>
                                             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest opacity-60 italic">{project.authorName}</p>
                                         </div>
                                         <div className="flex items-center gap-2 text-pink-500 text-xs font-black bg-pink-500/10 px-3 py-1.5 rounded-full border border-pink-500/10">
                                             <Heart className={`w-3.5 h-3.5 ${project.likedBy?.[user?.uid] ? 'fill-current' : ''}`} />
                                             {project.likes}
                                         </div>
                                     </div>
                                 </div>
                             )) : (
                                 <div className="col-span-full text-center py-32 text-gray-600 font-black uppercase text-sm tracking-widest italic opacity-40 border-2 border-dashed border-white/5 rounded-[3rem]">
                                     No matching professional projects found in this criteria
                                 </div>
                             )}
                        </div>
                    </div>
                )}
                
                {/* Other views updated for responsiveness */}
                {currentView === 'profile_menu' && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-300 pt-6 pb-20 max-w-3xl mx-auto w-full">
                         <button onClick={() => setCurrentView('home')} className="flex items-center gap-3 text-gray-500 font-black uppercase text-xs tracking-widest mb-6 hover:text-white transition-colors group"><ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Dashboard Home</button>
                         
                         <div className="bg-[#1A1D24] p-12 md:p-16 rounded-[4rem] border border-white/5 text-center shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"></div>
                            <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-600 mx-auto flex items-center justify-center text-5xl font-black text-white mb-8 border-4 border-white/5 overflow-hidden shadow-2xl shadow-indigo-900/40">
                                 {userProfile?.avatar ? <img src={userProfile.avatar} className="w-full h-full object-cover" /> : userProfile?.name?.charAt(0)}
                            </div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">{userProfile?.name}</h2>
                            <p className="text-xs text-indigo-400 font-black mt-2 mb-10 tracking-widest uppercase opacity-80">{userProfile?.email}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg mx-auto">
                                <div className="bg-black/30 p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
                                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest opacity-60">Source Credits</span>
                                    <div className="text-4xl font-black text-indigo-400 mt-2">{userProfile?.sourceCodeCredits || 0}</div>
                                </div>
                                <div className="bg-black/30 p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
                                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest opacity-60">Global Publishes</span>
                                    <div className="text-4xl font-black text-green-400 mt-2">{userProfile?.projectsPublished || 0}</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <button onClick={() => setCurrentView('about')} className="flex items-center justify-between p-7 bg-[#1A1D24] rounded-[2rem] border border-white/5 hover:border-indigo-500/40 transition-all group shadow-xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-600/10 flex items-center justify-center text-purple-500 border border-purple-500/10"><Info className="w-6 h-6" /></div>
                                    <span className="font-black uppercase text-xs tracking-widest text-gray-300">About Myself IDE</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-white transition-colors" />
                             </button>
                             <button onClick={() => setCurrentView('privacy')} className="flex items-center justify-between p-7 bg-[#1A1D24] rounded-[2rem] border border-white/5 hover:border-blue-500/40 transition-all group shadow-xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/10"><Shield className="w-6 h-6" /></div>
                                    <span className="font-black uppercase text-xs tracking-widest text-gray-300">User Data Privacy</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-white transition-colors" />
                             </button>
                        </div>

                        {user?.email === 'mbhia78@gmail.com' && (
                            <button 
                                onClick={() => setIsAdminOpen(true)}
                                className="w-full p-8 bg-indigo-600/10 text-indigo-400 rounded-[2.5rem] font-black hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-widest flex items-center justify-center gap-4 border border-indigo-500/20 shadow-2xl"
                            >
                                <ShieldCheck className="w-7 h-7" />
                                Super Admin Control Panel
                            </button>
                        )}

                        <button onClick={() => logout()} className="w-full p-8 bg-red-600/10 text-red-500 rounded-[2.5rem] font-black hover:bg-red-600 hover:text-white transition-all uppercase tracking-widest border border-red-500/10 shadow-xl">Logout Professional Account</button>
                    </div>
                )}

                {currentView === 'profile_projects' && (
                    <div className="space-y-8 pt-6 pb-20 max-w-7xl mx-auto w-full">
                        <button onClick={() => setCurrentView('home')} className="flex items-center gap-3 text-gray-500 font-black uppercase text-xs tracking-widest mb-4 hover:text-white transition-colors group"><ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Dashboard Home</button>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
                            <div>
                                <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">My Professional Workspace</h2>
                                <p className="text-xs text-gray-500 font-bold uppercase mt-1 tracking-widest opacity-60">Manage and edit your saved cloud projects</p>
                            </div>
                            <button onClick={() => { setIsCreating(true); setNewProjectName('My Project'); }} className="flex items-center justify-center gap-3 px-8 py-5 bg-indigo-600 text-white rounded-[1.5rem] shadow-2xl hover:bg-indigo-500 active:scale-95 transition-all text-xs font-black uppercase tracking-widest"><Plus className="w-5 h-5" /> New Project</button>
                        </div>

                        {projects.length === 0 ? (
                            <div className="text-center py-40 bg-[#1A1D24] rounded-[3rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center">
                                <FolderOpen className="w-20 h-20 text-gray-700 mb-6 opacity-30" />
                                <p className="text-gray-500 font-black uppercase text-xs tracking-widest opacity-60">No Workspace Data Found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {projects.map(p => (
                                    <div key={p.id} className="bg-[#1A1D24] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl hover:border-indigo-500/20 transition-all overflow-hidden relative group/item flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-10">
                                            <div className="flex-1 min-w-0 pr-6">
                                                <h4 className="font-black text-white uppercase tracking-tighter text-xl truncate italic">{p.name}</h4>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest bg-black/30 px-3 py-1 rounded-full">{new Date(p.lastModified).toLocaleDateString()}</span>
                                                    {p.isPublic && (
                                                        <span className="px-3 py-1 bg-green-600/10 text-green-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-green-500/20 flex items-center gap-1.5">
                                                            <Globe className="w-3 h-3" /> Live Hub
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button onClick={() => { if(window.confirm('PERMANENTLY DELETE PROJECT?')) deleteProject(p.id); }} className="p-3 text-red-500/20 hover:text-red-500 transition-colors bg-red-500/5 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
                                            <button onClick={() => openProject(p.id)} className="py-5 bg-indigo-600 rounded-2xl text-[10px] font-black text-white uppercase hover:bg-indigo-500 active:scale-95 transition-all shadow-xl shadow-indigo-900/30">Open Code Editor</button>
                                            {p.isPublic ? (
                                                <button 
                                                    onClick={() => { if(window.confirm('UNPUBLISH PROJECT FROM GLOBAL HUB?')) unpublishProject(p.id); }}
                                                    className="py-5 bg-pink-600/10 text-pink-500 border border-pink-500/20 rounded-2xl text-[10px] font-black uppercase hover:bg-pink-600 hover:text-white transition-all"
                                                >
                                                    Unpublish Hub
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => setPublishingId(p.id)}
                                                    className="py-5 bg-white/5 text-gray-400 border border-white/5 rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white hover:border-transparent transition-all"
                                                >
                                                    Publish Globally
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
      
      {/* Modals updated with better max-widths */}
      {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-6 animate-in fade-in duration-300">
              <form onSubmit={handleCreate} className="bg-[#1e2025] w-full max-w-md p-12 rounded-[3.5rem] border border-white/10 shadow-2xl scale-in-center">
                      <h3 className="text-3xl font-black text-white mb-8 text-center uppercase tracking-tighter italic">New Web Project</h3>
                      <input autoFocus type="text" placeholder="Project Title..." value={newProjectName} onChange={e => setNewProjectName(e.target.value)} className="w-full bg-[#15171c] border border-white/10 rounded-2xl p-6 text-white mb-10 focus:border-indigo-600 outline-none text-center font-black shadow-inner text-lg" />
                      <div className="flex gap-4">
                          <button type="button" onClick={() => setIsCreating(false)} className="flex-1 text-gray-500 font-black uppercase text-xs hover:text-white transition-colors tracking-widest">Discard</button>
                          <button type="submit" className="flex-2 px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase shadow-2xl shadow-indigo-900/50 hover:bg-indigo-500 transition-all tracking-widest text-xs">Create App</button>
                      </div>
              </form>
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
