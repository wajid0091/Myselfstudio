
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
import { Download, Play, ArrowLeft, Sparkles, Globe, Smartphone, Maximize2, Monitor, Rocket, Sliders } from 'lucide-react';
import { usePWA } from './hooks/usePWA';
import JSZip from 'jszip';

const IDE: React.FC = () => {
  const { files, activeProjectId, closeProject, activeProject } = useFile();
  const { isInstallable, installApp } = usePWA();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  
  // Layout Visibility States
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Sidebar closed by default
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const downloadProject = async () => {
    const zip = new JSZip();
    files.forEach(file => {
      zip.file(file.name, file.content);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeProject?.name || 'wai-project'}.zip`;
    link.click();
  };

  if (!activeProjectId) return <Dashboard />;

  return (
    <div className="h-screen w-screen bg-[#0F1117] flex flex-col overflow-hidden text-gray-300 select-none">
      {/* Top Navigation */}
      <header className="h-14 bg-[#16181D] border-b border-white/5 flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={closeProject} className="p-2 hover:bg-white/5 rounded-lg transition-all text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center">
            {/* CLEAN HEADER: No icon, just simple text as requested */}
            <h1 className="text-sm font-bold text-gray-200 tracking-wide">
              {activeProject?.name || 'Untitled Project'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button 
            onClick={() => setIsPreviewOpen(!isPreviewOpen)} 
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all shadow-lg ${isPreviewOpen ? 'bg-indigo-600 text-white shadow-indigo-900/20' : 'bg-white/5 text-gray-400 hover:text-white'}`}
          >
            <Play className="w-4 h-4" /> {isPreviewOpen ? 'Close View' : 'Live Preview'}
          </button>

          <div className="h-6 w-px bg-white/5 mx-2"></div>

          <button onClick={downloadProject} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all" title="Download Code">
            <Download className="w-4 h-4" />
          </button>
          
          <button onClick={() => setIsPublishModalOpen(true)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-indigo-400 hover:text-white transition-all" title="Publish Project">
            <Rocket className="w-4 h-4" />
          </button>

          <button onClick={() => setIsSettingsOpen(true)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all" title="Project Features">
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {isSidebarOpen && <Sidebar />}
        
        <main className="flex-1 flex flex-col min-w-0 bg-[#0F1117] relative">
          <EditorWindow 
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            isSidebarOpen={isSidebarOpen} 
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
          
          {/* Draggable/Fixed Chat Interface */}
          <div className={`absolute bottom-0 left-0 right-0 z-[60] transition-all duration-300 ${isChatOpen ? 'h-1/2 md:h-2/5' : 'h-12'}`}>
            <ChatInterface 
                isOpen={isChatOpen} 
                onToggle={() => setIsChatOpen(!isChatOpen)}
                onOpenSettings={() => setIsSettingsOpen(true)} 
            />
          </div>
        </main>

        {/* Live Preview Panel */}
        {isPreviewOpen && (
          <div className="fixed inset-0 md:relative md:inset-auto md:w-[450px] lg:w-[550px] xl:w-[650px] bg-white z-[70] md:z-auto animate-in slide-in-from-right duration-300 border-l border-white/5 shadow-2xl">
            <div className="absolute top-4 left-4 z-[80] flex gap-2">
                <button 
                    onClick={() => setPreviewMode(previewMode === 'desktop' ? 'mobile' : 'desktop')}
                    className="p-2 bg-black/80 backdrop-blur-md rounded-lg text-white shadow-xl"
                >
                    {previewMode === 'desktop' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                </button>
            </div>
            <div className={`h-full w-full transition-all duration-500 mx-auto ${previewMode === 'mobile' ? 'max-w-[375px] my-10 rounded-[3rem] border-[12px] border-black shadow-2xl h-[80%] overflow-hidden' : 'w-full h-full'}`}>
                <Preview onClose={() => setIsPreviewOpen(false)} />
            </div>
          </div>
        )}
      </div>

      <ProjectSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      {activeProjectId && <PublishModal isOpen={isPublishModalOpen} onClose={() => setIsPublishModalOpen(false)} projectId={activeProjectId} />}
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <SettingsProvider>
      <FileProvider>
        <IDE />
      </FileProvider>
    </SettingsProvider>
  </AuthProvider>
);

export default App;
