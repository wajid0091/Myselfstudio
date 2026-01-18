import React, { useState } from 'react';
import { FileProvider, useFile } from './context/FileContext';
import { SettingsProvider } from './context/SettingsContext';
import Sidebar from './components/Sidebar';
import EditorWindow from './components/Editor';
import Preview from './components/Preview';
import ChatInterface from './components/ChatInterface';
import SettingsModal from './components/SettingsModal';
import Dashboard from './components/Dashboard';
import { Settings, Download, Boxes, Play, ArrowLeft } from 'lucide-react';
import JSZip from 'jszip';

const IDE: React.FC = () => {
  const { files, activeProjectId, closeProject, projects } = useFile();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Layout Visibility States
  const [showSidebar, setShowSidebar] = useState(false);
  const [showChat, setShowChat] = useState(false); // If true, it is now FULL SCREEN

  // Full Screen Preview State
  const [isFullScreenPreview, setIsFullScreenPreview] = useState(false);

  const currentProjectName = projects.find(p => p.id === activeProjectId)?.name || 'Project';

  const handleDownload = async () => {
    const zip = new JSZip();
    files.forEach(file => {
      zip.file(file.name, file.content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    
    // Create download link
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
    <div className="flex flex-col h-screen bg-ide-bg text-ide-fg font-sans overflow-hidden">
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
            onClick={handleDownload}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Export Project"
          >
            <Download className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        {showSidebar && <Sidebar />}

        {/* Center Panel Container */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          
          {/* Editor Pane */}
          <div className="flex-1 flex flex-col overflow-hidden relative h-full">
            <EditorWindow 
                onToggleSidebar={() => setShowSidebar(!showSidebar)} 
                isSidebarOpen={showSidebar}
            />
          </div>
          
          {/* Bottom Panel (Chat) - FULL SCREEN OVERLAY WHEN OPEN */}
          <div 
            className={`
                border-t border-ide-border flex flex-col transition-all duration-300 z-30 bg-ide-panel
                ${showChat ? 'absolute inset-0 h-full' : 'absolute bottom-0 left-0 right-0 h-10'}
            `}
          >
            <ChatInterface 
                isOpen={showChat} 
                onToggle={() => setShowChat(!showChat)} 
            />
          </div>
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Full Screen Preview Modal - CLEAN, NO BORDERS, INTERNAL CONTROLS */}
      {isFullScreenPreview && (
        <div className="fixed inset-0 z-50 bg-ide-bg flex flex-col animate-in fade-in duration-200">
          <div className="w-full h-full bg-white relative">
             <Preview 
                className="w-full h-full" 
                onClose={() => setIsFullScreenPreview(false)} 
                isFullScreen={true}
             />
          </div>
        </div>
      )}
    </div>
  );
};

const Main: React.FC = () => {
    const { activeProjectId } = useFile();
    return activeProjectId ? <IDE /> : <Dashboard />;
}

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <FileProvider>
        <Main />
      </FileProvider>
    </SettingsProvider>
  );
};

export default App;