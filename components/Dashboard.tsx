import React, { useState, useMemo, useEffect } from 'react';
import { useFile } from '../context/FileContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { ref, get, set } from 'firebase/database';
import { usePWA } from '../hooks/usePWA';
import { 
    Plus, Code2, Heart, Zap, CreditCard, UserCircle, X, Briefcase, 
    ArrowRight, LogOut, FolderOpen, Globe, Search, ArrowLeft, Trash2, Edit2, 
    Gift, Copy, CheckCircle, Settings, ChevronRight, Share2, Calendar, Download, Loader2, ExternalLink, ChevronDown, ChevronUp, Tag
} from 'lucide-react';
import { CommunityProject } from '../types';
import PublicPreview from './PublicPreview';
import PlansModal from './PlansModal';
import AuthScreen from './AuthScreen';
import SettingsModal from './SettingsModal';
import SuperAdminPanel from './SuperAdminPanel';

// --- SUB COMPONENTS ---

const CreatorModal = ({ isOpen, onClose, userProfile, user }: any) => {
    const [formData, setFormData] = useState({
        experience: 'Junior',
        platform: 'TikTok',
        followers: '',
        link: '', 
        country: userProfile?.country || '',
        phone: userProfile?.phone || ''
    });
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!user) return;
        setSubmitting(true);
        
        // Ensure link has protocol
        let validLink = formData.link;
        if (validLink && !validLink.startsWith('http')) {
            validLink = 'https://' + validLink;
        }

        try {
            await set(ref(db, `creator_applications/${user.uid}`), {
                id: user.uid,
                userId: user.uid,
                name: userProfile?.name,
                email: userProfile?.email,
                profileLink: validLink, 
                experience: formData.experience,
                platform: formData.platform,
                followers: formData.followers,
                country: formData.country,
                phone: formData.phone,
                status: 'pending',
                timestamp: Date.now()
            });
            alert("Application Submitted Successfully!");
            onClose();
        } catch(e) { console.error(e); alert("Submission failed."); }
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-[#1e2025] w-full max-w-md rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-white/5 bg-[#16181D]">
                     <h3 className="text-white font-bold flex items-center gap-2"><Briefcase className="w-5 h-5 text-purple-400" /> Become a Creator</h3>
                     <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <div className="overflow-y-auto p-6 custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 block mb-1">Country</label>
                                <input type="text" required placeholder="Pakistan" 
                                    className="w-full bg-[#15171c] border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-purple-500"
                                    value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 block mb-1">Phone</label>
                                <input type="tel" required placeholder="+92..." 
                                    className="w-full bg-[#15171c] border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-purple-500"
                                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                        </div>
                        {/* Fields */}
                        <div>
                             <label className="text-xs font-bold text-gray-500 block mb-1">Experience Level</label>
                            <select className="w-full bg-[#15171c] border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-purple-500"
                                value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})}
                            >
                                <option>Junior</option>
                                <option>Senior</option>
                                <option>Expert</option>
                            </select>
                        </div>
                         <div>
                            <label className="text-xs font-bold text-gray-500 block mb-1">Primary Platform</label>
                            <select className="w-full bg-[#15171c] border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-purple-500"
                                value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})}
                            >
                                <option>TikTok</option>
                                <option>YouTube</option>
                                <option>Facebook</option>
                                <option>Instagram</option>
                                <option>LinkedIn</option>
                            </select>
                        </div>
                        <div>
                             <label className="text-xs font-bold text-gray-500 block mb-1">Followers Count</label>
                            <input type="text" required placeholder="e.g. 10k" 
                                className="w-full bg-[#15171c] border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-purple-500"
                                value={formData.followers} onChange={e => setFormData({...formData, followers: e.target.value})}
                            />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-gray-500 block mb-1">Profile Link</label>
                            <input type="url" required placeholder="https://..." 
                                className="w-full bg-[#15171c] border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-purple-500"
                                value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})}
                            />
                        </div>
                        <button disabled={submitting} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg mt-4 disabled:opacity-50 flex justify-center">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Application'}
                        </button>
                    </form>
                </div>
             </div>
        </div>
    );
};

// Thumbnail Generator with Tags Overlays
const getPreviewHtml = (project: CommunityProject) => {
    const htmlFile = project.files.find(f => f.name === 'index.html');
    if (!htmlFile) return '';
    let html = htmlFile.content;
    const cssFiles = project.files.filter(f => f.name.endsWith('.css'));
    const styles = cssFiles.map(f => `<style>${f.content}</style>`).join('\n');
    
    // Max 4 tags
    const displayTags = (project.tags || []).slice(0, 4);
    
    // Scale Logic
    return `
    <head>
        ${styles}
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            body {
                transform: scale(0.33); 
                transform-origin: 0 0;
                width: 303%; 
                height: 303%;
                overflow: hidden; 
                pointer-events: none;
                background-color: white;
            }
            /* Overlay styles for Project Name and Tags */
            .thumbnail-overlay {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                padding: 40px;
                background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
                z-index: 9999;
                transform: scale(3); /* Counteract body scale */
                transform-origin: bottom left;
                width: 100%;
                display: flex;
                flex-direction: column;
                justify-content: flex-end;
                align-items: flex-start;
            }
            .project-title {
                color: white;
                font-family: sans-serif;
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 15px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.5);
            }
            .tags-container {
                display: flex;
                gap: 10px;
            }
            .tag {
                background: rgba(255,255,255,0.2);
                color: white;
                padding: 4px 12px;
                border-radius: 50px;
                font-size: 14px;
                font-family: sans-serif;
                backdrop-filter: blur(4px);
                border: 1px solid rgba(255,255,255,0.1);
            }
            * { animation: none !important; transition: none !important; }
        </style>
    </head>
    ${html}
    <div class="thumbnail-overlay">
        <div class="project-title">${project.name}</div>
        <div class="tags-container">
            ${displayTags.map(t => `<span class="tag">#${t}</span>`).join('')}
        </div>
    </div>
    `;
};

// --- DASHBOARD ---

const Dashboard: React.FC = () => {
  const { 
      projects, createProject, communityProjects, 
      cloneCommunityProject, toggleLike, openProject, deleteProject, unpublishProject, renamePublicProject 
  } = useFile();
  const { user, userProfile, logout } = useAuth();
  const { isInstallable, installApp, isStandalone } = usePWA();
  
  // Views
  const [currentView, setCurrentView] = useState<'home' | 'community' | 'profile_menu' | 'profile_projects' | 'profile_published' | 'profile_invite' | 'profile_settings'>('home');
  
  // Modals
  const [isCreating, setIsCreating] = useState(false);
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);
  const [viewingProject, setViewingProject] = useState<CommunityProject | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [creatorStatus, setCreatorStatus] = useState<'none' | 'pending' | 'approved'>('none');
  
  const [newProjectName, setNewProjectName] = useState('');
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  
  const [linkCopied, setLinkCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const isSuperAdmin = user?.email === 'mbhia78@gmail.com';

  useEffect(() => {
      if(user) {
          const appRef = ref(db, `creator_applications/${user.uid}`);
          get(appRef).then(snapshot => {
              if(snapshot.exists()) {
                  const data = snapshot.val();
                  setCreatorStatus(data.status);
              }
          });
      }
  }, [user, isCreatorModalOpen]);

  const popularProjects = useMemo(() => {
      return [...communityProjects].sort((a, b) => b.likes - a.likes).slice(0, 6);
  }, [communityProjects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      await createProject(newProjectName.trim());
      setNewProjectName('');
      setIsCreating(false);
    }
  };

  const handleClone = async (project: CommunityProject) => {
      const result = await cloneCommunityProject(project);
      if (result === 'REQUIRE_LOGIN') setIsAuthOpen(true);
      else if (result === 'NO_CREDITS') setIsPlansOpen(true);
      setViewingProject(null);
  };

  const handleRenamePublic = async (project: CommunityProject) => {
      const newName = prompt("Enter new name for published project:", project.name);
      if(newName && newName.trim() !== "") {
          await renamePublicProject(project.id, newName.trim());
          alert("Project renamed.");
      }
  };

  const handleUnpublish = async (project: CommunityProject) => {
      if(confirm("Are you sure you want to unpublish this project from the Community? It will remain in your local projects if you haven't deleted it.")) {
          await unpublishProject(project.id);
      }
  };

  const handleDeleteLocal = async (projectId: string) => {
      if(confirm("Delete this project locally? This will NOT delete the public version if published.")) {
          await deleteProject(projectId);
      }
  };

  const referralLink = `${window.location.origin}/?ref=${user?.uid.slice(0,8).toUpperCase()}`;
  const referralCode = user?.uid.slice(0,8).toUpperCase();

  const copyLink = () => {
      navigator.clipboard.writeText(referralLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
  };

  const copyCode = () => {
      if (referralCode) {
        navigator.clipboard.writeText(referralCode);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      }
  };

  const shareProject = (e: React.MouseEvent, projectId: string) => {
      e.stopPropagation();
      const link = `${window.location.origin}/?project=${projectId}`;
      navigator.clipboard.writeText(link);
      alert("Link copied to clipboard!");
  };

  const renderHeader = () => (
    <header className="flex flex-row items-center justify-between mb-6 shrink-0 z-30 relative pt-4 pb-2">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
                <Code2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">MYSELF IDE</h1>
        </div>
        
        <div className="flex items-center">
            {user ? (
                <button 
                    onClick={() => setCurrentView('profile_menu')}
                    className={`flex items-center gap-2 px-2 py-1 rounded-full border transition-all ${currentView.startsWith('profile') ? 'bg-blue-600/20 border-blue-500/50' : 'bg-[#1A1D24] border-white/5 hover:border-blue-500/50'}`}
                >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                        {userProfile?.name?.charAt(0) || 'U'}
                    </div>
                </button>
            ) : (
                <button 
                    onClick={() => setIsAuthOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-bold shadow-lg transition-all"
                >
                    <UserCircle className="w-4 h-4" /> Login
                </button>
            )}
        </div>
    </header>
  );

  return (
    <div className="h-[100dvh] bg-[#0F1117] text-gray-200 font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col">
      <div className="relative w-full max-w-6xl mx-auto px-5 flex-1 flex flex-col h-full">
        {renderHeader()}

        <div className="flex-1 overflow-y-auto scrollbar-hide pb-10">
            {currentView === 'home' && (
                <>
                    {/* INSTALL APP BUTTON - Hidden if standalone, visible otherwise */}
                    {!isStandalone && (
                        <div className="mb-6 animate-in fade-in slide-in-from-top-2">
                             <button 
                                onClick={installApp}
                                className="w-full bg-[#1A1D24] border border-green-500/20 rounded-xl p-3 flex items-center justify-between group hover:border-green-500/40 transition-all shadow-lg shadow-green-900/10"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-500/20 p-2 rounded-lg text-green-400">
                                        <Download className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-sm font-bold text-white group-hover:text-green-400 transition-colors">Install App</h3>
                                        <p className="text-[10px] text-gray-400">Add to Home Screen for full experience</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white" />
                            </button>
                        </div>
                    )}

                    <div className="bg-[#1A1D24] border border-white/10 rounded-2xl p-5 mb-8 flex flex-col md:flex-row gap-4">
                        <div 
                            onClick={() => setIsCreating(true)} 
                            className="flex-1 bg-[#16181D] hover:bg-[#1E2028] border border-white/5 rounded-xl p-5 cursor-pointer transition-all hover:border-blue-500/30 flex items-center gap-4 group/btn"
                        >
                            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400 group-hover/btn:bg-blue-600 group-hover/btn:text-white transition-colors">
                                <Plus className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">Create Project</h3>
                                <p className="text-[11px] text-gray-500">Start from scratch</p>
                            </div>
                        </div>

                        <div 
                            onClick={() => { if(user) setCurrentView('profile_projects'); else setIsAuthOpen(true); }} 
                            className="flex-1 bg-[#16181D] hover:bg-[#1E2028] border border-white/5 rounded-xl p-5 cursor-pointer transition-all hover:border-purple-500/30 flex items-center gap-4 group/btn"
                        >
                            <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center text-purple-400 group-hover/btn:bg-purple-600 group-hover/btn:text-white transition-colors">
                                <FolderOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">My Workspace</h3>
                                <p className="text-[11px] text-gray-500">{projects.length} Projects</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <div className="text-gray-200 font-bold text-base flex items-center gap-2"><Heart className="w-4 h-4 text-pink-500 fill-pink-500" /> Popular</div>
                        <button onClick={() => setCurrentView('community')} className="text-xs text-blue-400 font-bold flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {popularProjects.map(project => (
                                <div key={project.id} onClick={() => setViewingProject(project)} className="bg-[#1A1D24] border border-white/5 rounded-xl overflow-hidden hover:border-blue-500/30 transition-all cursor-pointer group">
                                    <div className="h-40 bg-white relative overflow-hidden">
                                        <iframe srcDoc={getPreviewHtml(project)} className="w-full h-full border-none select-none pointer-events-none" scrolling="no" />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-sm text-gray-200 line-clamp-1 mb-1">{project.name}</h3>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-[10px] text-gray-500">{project.authorName}</span>
                                            <div className="flex items-center gap-3">
                                                 <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                                      <Heart className={`w-3 h-3 ${project.likes > 0 ? 'fill-pink-500 text-pink-500' : ''}`} /> {project.likes}
                                                 </div>
                                                 <button onClick={(e) => shareProject(e, project.id)} className="text-gray-500 hover:text-white transition-colors">
                                                     <Share2 className="w-3 h-3" />
                                                 </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </>
            )}

            {currentView === 'community' && (
                <>
                    <div className="flex items-center gap-4 mb-6">
                         <button onClick={() => setCurrentView('home')} className="p-2 bg-white/5 rounded-lg text-white"><ArrowLeft className="w-5 h-5" /></button>
                         <h2 className="text-xl font-bold text-white">Community Hub</h2>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {communityProjects.map(project => (
                                <div key={project.id} onClick={() => setViewingProject(project)} className="bg-[#1A1D24] border border-white/5 rounded-xl overflow-hidden hover:border-blue-500/30 cursor-pointer group">
                                    <div className="h-40 bg-white relative overflow-hidden">
                                        <iframe srcDoc={getPreviewHtml(project)} className="w-full h-full border-none select-none pointer-events-none" scrolling="no" />
                                    </div>
                                    <div className="p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-sm text-white mb-1">{project.name}</h3>
                                                <span className="text-[10px] text-gray-500">{project.authorName}</span>
                                            </div>
                                            <button onClick={(e) => shareProject(e, project.id)} className="p-1 text-gray-500 hover:text-white bg-white/5 rounded-md transition-colors">
                                                <Share2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </>
            )}

            {/* ... Profile views kept exactly same ... */}
            {currentView === 'profile_menu' && userProfile && (
                <div className="max-w-md mx-auto animate-in slide-in-from-right duration-200">
                    <button onClick={() => setCurrentView('home')} className="mb-6 text-gray-400 hover:text-white flex items-center gap-2 text-sm font-bold"><ArrowLeft className="w-4 h-4" /> Back Home</button>
                    
                    <div className="mb-8 bg-[#1A1D24] p-5 rounded-2xl border border-white/5 transition-all">
                        <div className="flex gap-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xl font-bold text-white shadow-xl shrink-0">
                                {userProfile.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                     <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        {userProfile.name} 
                                        {userProfile.isCreator && <CheckCircle className="w-4 h-4 text-purple-400 fill-purple-400/20" />}
                                    </h2>
                                    <button 
                                        onClick={() => setIsProfileExpanded(!isProfileExpanded)}
                                        className="p-1 text-gray-400 hover:text-white transition-colors"
                                    >
                                        {isProfileExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400">{userProfile.email}</p>
                            </div>
                        </div>

                        {isProfileExpanded && (
                            <div className="mt-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-2">
                                <div className="grid grid-cols-2 gap-4">
                                     <div className="bg-black/20 p-3 rounded-lg">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">AI Credits</p>
                                        <p className="text-xl font-bold text-blue-400">{userProfile.credits}</p>
                                     </div>
                                     <div className="bg-black/20 p-3 rounded-lg">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">Unlock Credits</p>
                                        <p className="text-xl font-bold text-purple-400">{userProfile.sourceCodeCredits}</p>
                                     </div>
                                </div>
                                <div className="mt-3 bg-black/20 p-3 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-400">Current Plan</span>
                                        <span className="text-xs font-bold text-white uppercase bg-white/5 px-2 py-0.5 rounded">{userProfile.plan}</span>
                                    </div>
                                     {userProfile.planExpiry && userProfile.planExpiry > 0 ? (
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-xs text-gray-400">Expires On</span>
                                            <span className="text-xs text-yellow-500">{new Date(userProfile.planExpiry).toLocaleDateString()}</span>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-xs text-gray-400">Validity</span>
                                            <span className="text-xs text-green-500">Lifetime</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {isSuperAdmin && (
                        <button onClick={() => setIsAdminOpen(true)} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl mb-4 flex items-center justify-center gap-2">
                             Open Admin Panel
                        </button>
                    )}

                    <div className="space-y-2">
                        <button onClick={() => setIsPlansOpen(true)} className="w-full flex items-center justify-between p-4 bg-[#1A1D24] hover:bg-[#20232b] rounded-xl border border-white/5 transition-all">
                            <div className="flex items-center gap-3">
                                <CreditCard className="w-5 h-5 text-yellow-400" /> <span className="text-sm font-bold text-white">Upgrade Plan</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                        </button>

                        <button onClick={() => setCurrentView('profile_projects')} className="w-full flex items-center justify-between p-4 bg-[#1A1D24] hover:bg-[#20232b] rounded-xl border border-white/5 transition-all">
                            <div className="flex items-center gap-3">
                                <FolderOpen className="w-5 h-5 text-blue-400" /> <span className="text-sm font-bold text-white">My Projects</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                        </button>

                        <button onClick={() => setCurrentView('profile_published')} className="w-full flex items-center justify-between p-4 bg-[#1A1D24] hover:bg-[#20232b] rounded-xl border border-white/5 transition-all">
                            <div className="flex items-center gap-3">
                                <Globe className="w-5 h-5 text-green-400" /> <span className="text-sm font-bold text-white">Published Projects</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                        </button>
                        
                        {creatorStatus === 'approved' ? (
                             <div className="w-full flex items-center justify-between p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                                 <div className="flex items-center gap-3">
                                     <Zap className="w-5 h-5 text-purple-400" /> <span className="font-bold text-purple-200 text-sm">Official Creator</span>
                                 </div>
                                 <CheckCircle className="w-4 h-4 text-purple-500" />
                             </div>
                        ) : (
                            <button 
                                onClick={() => setIsCreatorModalOpen(true)} 
                                disabled={creatorStatus === 'pending'}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${creatorStatus === 'pending' ? 'bg-yellow-500/10 border-yellow-500/20 opacity-70' : 'bg-[#1A1D24] hover:bg-[#20232b] border-white/5'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <Briefcase className="w-5 h-5 text-purple-400" /> 
                                    <div className="text-left">
                                        <span className="text-sm font-bold text-white block">Become a Creator</span>
                                        {creatorStatus === 'pending' && <span className="text-[10px] text-yellow-500">Application Pending</span>}
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                            </button>
                        )}

                        <button onClick={() => setCurrentView('profile_invite')} className="w-full flex items-center justify-between p-4 bg-[#1A1D24] hover:bg-[#20232b] rounded-xl border border-white/5 transition-all">
                            <div className="flex items-center gap-3">
                                <Gift className="w-5 h-5 text-pink-400" /> <span className="text-sm font-bold text-white">Invite & Earn</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                        </button>
                        
                        <button onClick={() => setCurrentView('profile_settings')} className="w-full flex items-center justify-between p-4 bg-[#1A1D24] hover:bg-[#20232b] rounded-xl border border-white/5 transition-all">
                            <div className="flex items-center gap-3">
                                <Settings className="w-5 h-5 text-gray-400" /> <span className="text-sm font-bold text-white">Settings</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                        </button>
                        
                        <button onClick={() => { logout(); setCurrentView('home'); }} className="w-full flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 rounded-xl border border-red-500/20 mt-4 text-red-400 font-bold text-sm">
                            <div className="flex items-center gap-3"><LogOut className="w-5 h-5" /> Logout</div>
                        </button>
                    </div>
                </div>
            )}

            {currentView === 'profile_projects' && (
                 <div className="animate-in slide-in-from-right duration-200">
                    <button onClick={() => setCurrentView('profile_menu')} className="mb-4 text-gray-400 flex gap-2 text-sm"><ArrowLeft className="w-4 h-4" /> Back</button>
                    <h2 className="text-xl font-bold text-white mb-4">My Projects</h2>
                    {projects.length === 0 ? <div className="text-gray-500 text-center py-10">No projects yet. Create one!</div> : 
                    <div className="grid grid-cols-1 gap-3">
                        {projects.map(p => (
                             <div key={p.id} className="bg-[#1A1D24] p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                 <div>
                                     <h4 className="font-bold text-white">{p.name}</h4>
                                     <p className="text-xs text-gray-500">Last Modified: {new Date(p.lastModified).toLocaleDateString()}</p>
                                     {p.isPublic && <span className="text-[10px] text-green-500 font-bold uppercase mt-1 inline-block">Published</span>}
                                 </div>
                                 <div className="flex gap-2">
                                     <button onClick={() => openProject(p.id)} className="bg-blue-600 px-3 py-1.5 rounded text-xs font-bold text-white hover:bg-blue-500 transition-colors">Open Editor</button>
                                     <button onClick={() => handleDeleteLocal(p.id)} className="bg-red-500/10 p-2 rounded text-red-500 hover:bg-red-500/20 transition-colors" title="Delete Local Copy"><Trash2 className="w-4 h-4" /></button>
                                 </div>
                             </div>
                        ))}
                    </div>}
                 </div>
            )}

            {currentView === 'profile_published' && (
                <div className="animate-in slide-in-from-right duration-200">
                     <button onClick={() => setCurrentView('profile_menu')} className="mb-4 text-gray-400 flex gap-2 text-sm"><ArrowLeft className="w-4 h-4" /> Back</button>
                     <h2 className="text-xl font-bold text-white mb-4">Published Projects</h2>
                     {communityProjects.filter(p => p.authorId === user?.uid).length === 0 ? 
                         <div className="text-gray-500 text-center py-10">You haven't published any projects yet.</div> : 
                         <div className="grid grid-cols-1 gap-3">
                             {communityProjects.filter(p => p.authorId === user?.uid).map(p => (
                                 <div key={p.id} className="bg-[#1A1D24] p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                                     <div className="flex justify-between items-start">
                                         <div>
                                             <h4 className="font-bold text-white">{p.name}</h4>
                                             <div className="flex items-center gap-2 mt-1">
                                                 <span className="text-xs text-gray-500 flex items-center gap-1"><Heart className="w-3 h-3 text-pink-500" /> {p.likes}</span>
                                             </div>
                                         </div>
                                         <span className="text-[10px] text-green-500 bg-green-500/10 px-2 py-1 rounded font-bold uppercase">Live</span>
                                     </div>
                                     
                                     <div className="flex gap-2 pt-2 border-t border-white/5">
                                         <button onClick={() => handleClone(p)} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-1.5 rounded text-xs font-bold transition-colors">Import to Editor</button>
                                         <button onClick={() => handleRenamePublic(p)} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                                         <button onClick={() => handleUnpublish(p)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors" title="Unpublish"><Trash2 className="w-3.5 h-3.5" /></button>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     }
                </div>
            )}
            
            {currentView === 'profile_settings' && <SettingsModal isOpen={true} onClose={() => setCurrentView('profile_menu')} />}
            
            {currentView === 'profile_invite' && (
                 <div className="text-center pt-10 animate-in slide-in-from-right duration-200 max-w-md mx-auto">
                     <button onClick={() => setCurrentView('profile_menu')} className="mb-4 text-gray-400 flex gap-2 text-sm mx-auto"><ArrowLeft className="w-4 h-4" /> Back</button>
                     <Gift className="w-16 h-16 text-pink-500 mx-auto mb-4" />
                     <h2 className="text-2xl font-bold text-white mb-2">Invite & Earn</h2>
                     <p className="text-gray-400 text-sm mb-6">Earn <span className="text-blue-400 font-bold">10 AI Credits</span> for every friend who joins using your link or code.</p>
                     
                     <div className="space-y-4 text-left">
                        {/* LINK COPY */}
                        <div>
                             <label className="text-xs font-bold text-gray-500 mb-1 block">Referral Link</label>
                             <div className="flex gap-2">
                                <input readOnly value={referralLink} className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none" />
                                <button onClick={copyLink} className="bg-blue-600 hover:bg-blue-500 text-white px-3 rounded-lg font-bold flex items-center gap-2 text-xs transition-colors w-24 justify-center">
                                    {linkCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {linkCopied ? 'Copied' : 'Copy'}
                                </button>
                             </div>
                        </div>

                         {/* CODE COPY */}
                        <div>
                             <label className="text-xs font-bold text-gray-500 mb-1 block">Referral Code</label>
                             <div className="flex gap-2">
                                <input readOnly value={referralCode || ''} className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none font-mono tracking-wider" />
                                <button onClick={copyCode} className="bg-purple-600 hover:bg-purple-500 text-white px-3 rounded-lg font-bold flex items-center gap-2 text-xs transition-colors w-24 justify-center">
                                    {codeCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {codeCopied ? 'Copied' : 'Copy'}
                                </button>
                             </div>
                        </div>
                     </div>
                 </div>
            )}
        </div>
      </div>
      
        {isCreating && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <form onSubmit={handleCreate} className="bg-[#1e2025] w-full max-w-sm p-6 rounded-xl border border-white/10 shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-4">Create New Project</h3>
                        <input autoFocus type="text" placeholder="Project Name" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} className="w-full bg-[#15171c] border border-white/10 rounded-lg p-3 text-white mb-4 focus:border-blue-500 outline-none" />
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-2 text-gray-400 hover:text-white">Cancel</button>
                            <button type="submit" disabled={!newProjectName.trim()} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold disabled:opacity-50">Create</button>
                        </div>
                </form>
            </div>
        )}
        
        {viewingProject && <PublicPreview project={viewingProject} onClose={() => setViewingProject(null)} onClone={() => handleClone(viewingProject)} />}
        <CreatorModal isOpen={isCreatorModalOpen} onClose={() => setIsCreatorModalOpen(false)} userProfile={userProfile} user={user} />
        <PlansModal isOpen={isPlansOpen} onClose={() => setIsPlansOpen(false)} />
        <SuperAdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
        {isAuthOpen && (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="relative w-full max-w-md">
                        <button onClick={() => setIsAuthOpen(false)} className="absolute -top-10 right-0 text-white hover:text-gray-300 z-50"><X className="w-6 h-6" /></button>
                        <AuthScreen onSuccess={() => setIsAuthOpen(false)} />
                    </div>
            </div>
        )}
    </div>
  );
};

export default Dashboard;