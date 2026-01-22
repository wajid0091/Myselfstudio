import React, { useState } from 'react';
import { FileProvider, useFile } from './context/FileContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import EditorWindow from './components/Editor';
import Preview from './components/Preview';
import ChatInterface from './components/ChatInterface';
import ProjectSettingsModal from './components/ProjectSettingsModal';
import Dashboard from './components/Dashboard';
import PublishModal from './components/PublishModal';
import { Download, Boxes, Play, ArrowLeft, Sparkles, Globe, Loader2, Smartphone } from 'lucide-react';
import { usePWA } from './hooks/usePWA';
import JSZip from 'jszip';

const IDE: React.FC = () => {
  const { files, activeProjectId, closeProject, projects } = useFile();
  const { isInstallable, installApp } = usePWA();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  
  // Layout Visibility States
  const [showSidebar, setShowSidebar] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false); 

  // Full Screen Preview State
  const [isFullScreenPreview, setIsFullScreenPreview] = useState(false);

  const currentProjectName = projects.find(p => p.id === activeProjectId)?.name || 'Project';

  const handleDownload = async () => {
    const zip = new JSZip();
    
    // Add all existing files
    files.forEach(file => {
      zip.file(file.name, file.content);
    });

    // --- NETLIFY / VERCEL SPA FIX ---
    // If _redirects doesn't exist, we add it automatically.
    // This tells Netlify to redirect all routes to index.html so React Router works.
    if (!files.some(f => f.name === '_redirects')) {
        zip.file('_redirects', '/* /index.html 200');
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProjectName.replace(/\s+/g, '_')}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen h-[100dvh] bg-ide-bg text-ide-fg font-sans overflow-hidden">
      {/* Top Navigation */}
      <header className="h-12 bg-ide-panel border-b border-ide-border flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
           <button 
            onClick={closeProject}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-600/20 rounded flex items-center justify-center">
                <Boxes className="w-4 h-4 text-blue-400" />
             </div>
             <h1 className="font-bold text-gray-200 tracking-tight text-sm hidden sm:block">{currentProjectName}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           {isInstallable && (
               <button 
                 onClick={installApp}
                 className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                 title="Install App"
               >
                 <Smartphone className="w-4 h-4" />
               </button>
           )}

           <button 
            onClick={() => setIsFullScreenPreview(true)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold bg-green-600 hover:bg-green-500 text-white shadow-sm transition-all hover:shadow-green-900/20"
            title="Run Project"
          >
             <Play className="w-3 h-3 fill-current" />
             PREVIEW
          </button>

          <div className="h-5 w-px bg-white/10 mx-1"></div>

          <button 
            onClick={() => setIsPublishModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
            title="Publish to Community"
          >
             <Globe className="w-3 h-3" /> Publish
          </button>

          <button 
            onClick={handleDownload}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Export Static Website"
          >
            <Download className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-white/10 rounded-lg transition-colors"
            title="Project Features"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {showSidebar && <Sidebar />}

        <div className="flex-1 flex flex-col min-w-0 relative h-full">
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <EditorWindow 
                onToggleSidebar={() => setShowSidebar(!showSidebar)} 
                isSidebarOpen={showSidebar}
            />
          </div>
          
          <div className={`border-t border-ide-border transition-all duration-300 z-40 bg-[#16181D] flex flex-col ${chatExpanded ? 'h-[60%] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]' : 'h-auto'}`}>
            <ChatInterface 
                isOpen={chatExpanded} 
                onToggle={() => setChatExpanded(!chatExpanded)} 
            />
          </div>
        </div>
      </div>

      <ProjectSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      {activeProjectId && <PublishModal isOpen={isPublishModalOpen} onClose={() => setIsPublishModalOpen(false)} projectId={activeProjectId} />}

      {isFullScreenPreview && (
        <div className="fixed inset-0 z-50 bg-ide-bg flex flex-col animate-in fade-in duration-200 h-[100dvh]">
          <div className="w-full h-full bg-white relative">
             <Preview className="w-full h-full" onClose={() => setIsFullScreenPreview(false)} isFullScreen={true} />
          </div>
        </div>
      )}
    </div>
  );
};

const Main: React.FC = () => {
    const { loading } = useAuth();
    const { activeProjectId } = useFile();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    // Guest Mode allowed, so just show Dashboard or IDE
    return activeProjectId ? <IDE /> : <Dashboard />;
}

const App: React.FC = () => {
  return (
    <AuthProvider>
        <SettingsProvider>
            <FileProvider>
                <Main />
            </FileProvider>
        </SettingsProvider>
    </AuthProvider>
  );
};

export default App;