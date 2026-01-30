
import React, { useState, useMemo } from 'react';
import { useFile } from '../context/FileContext';
import { useAuth } from '../context/AuthContext';
import { 
    Plus, Code2, Heart, FolderOpen, ArrowLeft, Trash2, 
    ChevronRight, Globe, Sparkles, Smartphone, Search, 
    Zap, Info, Shield, Mail, TrendingUp, Clock, Download,
    // Add missing icons
    ShieldCheck, LayoutDashboard
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
  const { isInstallable, installApp } = usePWA();
  
  const [currentView, setCurrentView] = useState<'home' | 'community' | 'profile_menu' | 'profile_projects' | 'about' | 'privacy'>('home');
  const [isCreating, setIsCreating] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [viewingProject, setViewingProject] = useState<CommunityProject | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('My Project');
  const [publishingId, setPublishingId] = useState<string | null>(null);

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
      setNewProjectName('My Project');
      setIsCreating(false);
    }
  };

  return (
    <div className="h-[100dvh] bg-[#0F1117] text-gray-200 font-sans overflow-hidden flex flex-col">
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col h-full bg-[#0B0D12] shadow-[0_0_100px_rgba(0,0,0,0.8)] relative">
        
        {/* Header */}
        <header className="px-6 py-5 flex items-center justify-between z-30 shrink-0">
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
                    <button onClick={() => setIsAuthOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-indigo-900/40">Login</button>
                )}
            </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 px-4 space-y-6">
            {currentView === 'home' && (
                <>
                    <div className="grid grid-cols-1 gap-4">
                        <div onClick={() => { setIsCreating(true); setNewProjectName('My Project'); }} className="bg-[#1A1D24] p-8 rounded-[2rem] border border-white/5 flex items-center gap-6 cursor-pointer hover:border-indigo-500/40 transition-all group shadow-2xl relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-600/10 rounded-full blur-2xl"></div>
                            <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform z-10">
                                <Plus className="w-8 h-8 text-indigo-500" />
                            </div>
                            <div className="z-10">
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Create Project</h3>
                                <p className="text-xs text-gray-500 font-bold tracking-widest uppercase opacity-60">Start coding from scratch</p>
                            </div>
                        </div>

                        <div onClick={() => setCurrentView('profile_projects')} className="bg-[#1A1D24] p-8 rounded-[2rem] border border-white/5 flex items-center gap-6 cursor-pointer hover:border-purple-500/40 transition-all group shadow-2xl relative overflow-hidden">
                             <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-600/10 rounded-full blur-2xl"></div>
                            <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform z-10">
                                <FolderOpen className="w-8 h-8 text-purple-500" />
                            </div>
                            <div className="z-10">
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">My Workspace</h3>
                                <p className="text-xs text-gray-500 font-bold tracking-widest uppercase opacity-60">{projects.length} Saved Projects</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-2 pt-4">
                        <div className="flex items-center gap-2 text-white font-black uppercase italic tracking-tighter text-sm">
                            <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            Most Popular
                        </div>
                        <button onClick={() => setCurrentView('community')} className="text-[10px] text-indigo-400 font-black uppercase flex items-center gap-1 hover:text-white transition-colors">View All Hub <ChevronRight className="w-4 h-4" /></button>
                    </div>

                    <div className="space-y-6 pb-10">
                        {popularProjects.map(project => (
                            <div key={project.id} onClick={() => setViewingProject(project)} className="bg-[#16181D] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl cursor-pointer group hover:border-indigo-500/30 transition-all">
                                <div className="h-64 relative bg-[#0F1117]">
                                    <LiveThumbnail project={project} />
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase border border-white/10 tracking-widest">
                                            {project.tags?.[0] || 'Web'}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-lg font-black text-white uppercase tracking-tighter line-clamp-1">{project.name}</h4>
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1 opacity-60">{project.authorName}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-center">
                                            <Heart className={`w-5 h-5 ${project.likedBy?.[user?.uid] ? 'text-pink-500 fill-pink-500' : 'text-gray-600'}`} />
                                            <span className="text-[10px] font-black text-gray-500 mt-0.5">{project.likes || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {currentView === 'community' && (
                <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom duration-500 pb-20">
                    <button onClick={() => setCurrentView('home')} className="flex items-center gap-3 text-gray-500 font-black uppercase text-[10px] tracking-widest mb-2 hover:text-white transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Home</button>
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Community Hub</h2>
                    </div>

                    {/* Search Algorithm UI */}
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-500 transition-colors">
                            <Search className="w-5 h-5" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Search by topic (e.g. Portfolio, Game)..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#1A1D24] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-bold shadow-2xl"
                        />
                    </div>

                    {/* Sorting Algorithm UI */}
                    <div className="flex bg-[#16181D] p-1 rounded-2xl border border-white/5 shadow-inner">
                        <button 
                            onClick={() => setCommunitySort('trending')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${communitySort === 'trending' ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}
                        >
                            <TrendingUp className="w-3.5 h-3.5" /> Trending
                        </button>
                        <button 
                            onClick={() => setCommunitySort('newest')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${communitySort === 'newest' ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Clock className="w-3.5 h-3.5" /> Newest
                        </button>
                    </div>

                    {/* Filtered Content Grid */}
                    <div className="grid grid-cols-1 gap-6">
                         {filteredCommunityProjects.length > 0 ? filteredCommunityProjects.map(project => (
                             <div key={project.id} onClick={() => setViewingProject(project)} className="bg-[#16181D] rounded-[2rem] overflow-hidden border border-white/5 shadow-xl cursor-pointer group hover:border-indigo-500/30 transition-all">
                                 <div className="h-48 relative bg-[#0F1117]">
                                     <LiveThumbnail project={project} />
                                     <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                                         {project.tags?.slice(0, 2).map(tag => (
                                             <span key={tag} className="px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase border border-white/10 tracking-widest">{tag}</span>
                                         ))}
                                     </div>
                                 </div>
                                 <div className="p-5 flex justify-between items-center">
                                     <div>
                                         <h4 className="font-black text-white uppercase tracking-tighter text-sm truncate max-w-[150px]">{project.name}</h4>
                                         <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest opacity-60 italic">{project.authorName}</p>
                                     </div>
                                     <div className="flex items-center gap-1.5 text-pink-500 text-xs font-black">
                                         <Heart className={`w-3.5 h-3.5 ${project.likedBy?.[user?.uid] ? 'fill-current' : ''}`} />
                                         {project.likes}
                                     </div>
                                 </div>
                             </div>
                         )) : (
                             <div className="text-center py-20 text-gray-600 font-black uppercase text-xs tracking-widest italic opacity-50 border border-dashed border-white/5 rounded-[2rem]">
                                 No matching projects found
                             </div>
                         )}
                    </div>
                </div>
            )}

            {currentView === 'profile_menu' && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300 pt-6 pb-20">
                     <button onClick={() => setCurrentView('home')} className="flex items-center gap-3 text-gray-500 font-black uppercase text-xs tracking-widest mb-6 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /> Dashboard</button>
                     
                     <div className="bg-[#1A1D24] p-10 rounded-[3rem] border border-white/5 text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                        <div className="w-24 h-24 rounded-full bg-indigo-600 mx-auto flex items-center justify-center text-4xl font-black text-white mb-6 border-4 border-white/5 overflow-hidden shadow-2xl shadow-indigo-900/40">
                             {userProfile?.avatar ? <img src={userProfile.avatar} className="w-full h-full object-cover" /> : userProfile?.name?.charAt(0)}
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{userProfile?.name}</h2>
                        <p className="text-xs text-indigo-400 font-bold mt-1 mb-8 tracking-widest uppercase">{userProfile?.email}</p>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/40 p-5 rounded-3xl border border-white/5">
                                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Unlocks</span>
                                <div className="text-2xl font-black text-indigo-400 mt-1">{userProfile?.sourceCodeCredits || 0}</div>
                            </div>
                            <div className="bg-black/40 p-5 rounded-3xl border border-white/5">
                                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Publishes</span>
                                <div className="text-2xl font-black text-green-400 mt-1">{userProfile?.projectsPublished || 0}</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                         <button onClick={() => setCurrentView('about')} className="flex items-center justify-between p-5 bg-[#1A1D24] rounded-2xl border border-white/5 hover:border-indigo-500/40 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-600/10 flex items-center justify-center text-purple-500"><Info className="w-5 h-5" /></div>
                                <span className="font-black uppercase text-xs tracking-widest text-gray-300">About App</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                         </button>
                         <button onClick={() => setCurrentView('privacy')} className="flex items-center justify-between p-5 bg-[#1A1D24] rounded-2xl border border-white/5 hover:border-blue-500/40 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500"><Shield className="w-5 h-5" /></div>
                                <span className="font-black uppercase text-xs tracking-widest text-gray-300">Privacy Policy</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                         </button>
                    </div>

                    {user?.email === 'mbhia78@gmail.com' && (
                        <button 
                            onClick={() => setIsAdminOpen(true)}
                            className="w-full p-6 bg-indigo-600/10 text-indigo-400 rounded-3xl font-black hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-tighter flex items-center justify-center gap-3 border border-indigo-500/20 shadow-xl"
                        >
                            <ShieldCheck className="w-6 h-6" />
                            Open Super Admin Panel
                        </button>
                    )}

                    <button onClick={() => logout()} className="w-full p-6 bg-red-600/10 text-red-500 rounded-3xl font-black hover:bg-red-600 hover:text-white transition-all uppercase tracking-tighter border border-red-500/10">Logout Account</button>
                </div>
            )}

            {currentView === 'about' && (
                 <div className="space-y-6 pt-6 animate-in slide-in-from-bottom duration-500 pb-20">
                    <button onClick={() => setCurrentView('profile_menu')} className="flex items-center gap-3 text-gray-500 font-black uppercase text-xs tracking-widest mb-4 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /> Profile</button>
                    <div className="bg-[#1A1D24] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
                        <div className="w-20 h-20 bg-indigo-600/20 rounded-3xl flex items-center justify-center mb-6 border border-indigo-500/30">
                            <Code2 className="w-10 h-10 text-indigo-500" />
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic mb-4">MYSELF IDE</h2>
                        <div className="prose prose-invert prose-sm max-w-none text-gray-400 leading-relaxed space-y-4 font-medium">
                            <p>Created and developed by <span className="text-white font-black">Wajid Ali</span>, MYSELF IDE is designed to be the ultimate companion for modern web developers.</p>
                            <p>Our proprietary <span className="text-indigo-400 font-black uppercase">WAI Engine</span> provides specialized coding logic that is significantly more powerful, context-aware, and precise than general-purpose tools like ChatGPT, Gemini, or Google AI Studio. It is optimized for building real-world web applications with high speed and zero logic errors.</p>
                            <div className="bg-black/40 p-6 rounded-2xl border border-white/5 mt-6">
                                <h4 className="text-white font-black uppercase tracking-widest text-xs mb-3">Core Performance:</h4>
                                <ul className="grid grid-cols-1 gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                                    <li className="flex items-center gap-2"><Sparkles className="w-3 h-3" /> specialized Web Generation</li>
                                    <li className="flex items-center gap-2"><LayoutDashboard className="w-3 h-3" /> One-Click Publish Hub</li>
                                    <li className="flex items-center gap-2"><Smartphone className="w-3 h-3" /> Mobile Optimized Experience</li>
                                    <li className="flex items-center gap-2"><Search className="w-3 h-3" /> Better Coding Intelligence than ChatGPT</li>
                                </ul>
                            </div>
                            <div className="mt-8 pt-8 border-t border-white/5 flex items-center gap-3 text-xs text-gray-500 font-bold">
                                <Mail className="w-4 h-4" /> 
                                Support: <span className="text-white">mbhia78@gmail.com</span>
                            </div>
                        </div>
                    </div>
                 </div>
            )}

            {currentView === 'privacy' && (
                 <div className="space-y-6 pt-6 animate-in slide-in-from-bottom duration-500 pb-20">
                    <button onClick={() => setCurrentView('profile_menu')} className="flex items-center gap-3 text-gray-500 font-black uppercase text-xs tracking-widest mb-4 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /> Profile</button>
                    <div className="bg-[#1A1D24] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-6">Privacy Policy</h2>
                        <div className="space-y-6 text-sm text-gray-400 font-medium">
                            <section>
                                <h3 className="text-white font-black uppercase tracking-widest text-xs mb-2">1. Data Ownership</h3>
                                <p>All code, designs, and content generated by you within MYSELF IDE belong exclusively to you. We do not claim any ownership rights over your creative work. You are free to export and use your code anywhere.</p>
                            </section>
                            <section>
                                <h3 className="text-white font-black uppercase tracking-widest text-xs mb-2">2. Secure Storage</h3>
                                <p>We use Google Firebase with industry-leading encryption to ensure that your projects and personal profile data are stored safely and are only accessible by your authenticated account.</p>
                            </section>
                            <section>
                                <h3 className="text-white font-black uppercase tracking-widest text-xs mb-2">3. No Third-Party Sharing</h3>
                                <p>We do not sell or share your personal data, code, or usage patterns with third parties. Your information is used strictly to provide the IDE services and manage your subscription credits.</p>
                            </section>
                            <div className="bg-blue-600/5 p-4 rounded-xl border border-blue-500/20 text-[10px] text-blue-400 font-bold uppercase tracking-widest text-center">
                                Updated: October 2023 | Developed by Wajid Ali
                            </div>
                        </div>
                    </div>
                 </div>
            )}

            {currentView === 'profile_projects' && (
                <div className="space-y-6 pt-6 pb-20">
                    <button onClick={() => setCurrentView('home')} className="flex items-center gap-3 text-gray-500 font-black uppercase text-xs tracking-widest mb-4 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /> Dashboard</button>
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">My Workspace</h2>
                        <button onClick={() => { setIsCreating(true); setNewProjectName('My Project'); }} className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-transform"><Plus className="w-5 h-5" /></button>
                    </div>
                    {projects.length === 0 ? (
                        <div className="text-center py-20 bg-[#1A1D24] rounded-[2rem] border border-dashed border-white/10">
                            <FolderOpen className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">No Projects Found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {projects.map(p => (
                                <div key={p.id} className="bg-[#1A1D24] p-6 rounded-[2rem] border border-white/5 shadow-xl hover:border-white/10 transition-all overflow-hidden relative group/item">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <h4 className="font-black text-white uppercase tracking-tighter text-lg truncate">{p.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{new Date(p.lastModified).toLocaleDateString()}</span>
                                                {p.isPublic && (
                                                    <span className="px-2 py-0.5 bg-green-600/10 text-green-500 text-[8px] font-black uppercase tracking-widest rounded-full border border-green-500/20 flex items-center gap-1">
                                                        <Globe className="w-2.5 h-2.5" /> Public
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={() => deleteProject(p.id)} className="p-2 text-red-500/30 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => openProject(p.id)} className="py-4 bg-indigo-600 rounded-2xl text-[10px] font-black text-white uppercase hover:bg-indigo-500 active:scale-95 transition-all shadow-lg shadow-indigo-900/20">Open Code</button>
                                        {p.isPublic ? (
                                            <button 
                                                onClick={() => { if(window.confirm('Are you sure you want to UNPUBLISH this project from the Community?')) unpublishProject(p.id); }}
                                                className="py-4 bg-pink-600/10 text-pink-500 border border-pink-500/20 rounded-2xl text-[10px] font-black uppercase hover:bg-pink-600 hover:text-white transition-all"
                                            >
                                                Unpublish
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => setPublishingId(p.id)}
                                                className="py-4 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all"
                                            >
                                                Publish Hub
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
      
      {/* Modals */}
      {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-6 animate-in fade-in duration-300">
              <form onSubmit={handleCreate} className="bg-[#1e2025] w-full max-w-sm p-10 rounded-[3rem] border border-white/10 shadow-2xl scale-in-center">
                      <h3 className="text-2xl font-black text-white mb-6 text-center uppercase tracking-tighter italic">Create New Project</h3>
                      <input autoFocus type="text" placeholder="Project Name..." value={newProjectName} onChange={e => setNewProjectName(e.target.value)} className="w-full bg-[#15171c] border border-white/10 rounded-2xl p-5 text-white mb-8 focus:border-indigo-500 outline-none text-center font-bold shadow-inner" />
                      <div className="flex gap-4">
                          <button type="button" onClick={() => setIsCreating(false)} className="flex-1 text-gray-500 font-black uppercase text-xs hover:text-white transition-colors">Cancel</button>
                          <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase shadow-xl shadow-indigo-900/40 hover:bg-indigo-500 transition-all">Create</button>
                      </div>
              </form>
          </div>
      )}
      {viewingProject && <PublicPreview project={viewingProject} onClose={() => setViewingProject(null)} onClone={() => cloneCommunityProject(viewingProject)} />}
      {isAuthOpen && <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6"><AuthScreen onSuccess={() => setIsAuthOpen(false)} /></div>}
      {publishingId && <PublishModal isOpen={!!publishingId} onClose={() => setPublishingId(null)} projectId={publishingId} />}
      <SuperAdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
    </div>
  );
};

export default Dashboard;
