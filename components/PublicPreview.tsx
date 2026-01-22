import React, { useEffect, useRef, useState } from 'react';
import { useFile } from '../context/FileContext';
import { Heart, X, Lock, Unlock, Code2, Download, Share2 } from 'lucide-react';
import { CommunityProject } from '../types';

interface Props {
  project: CommunityProject;
  onClose: () => void;
  onClone: () => void;
}

const PublicPreview: React.FC<Props> = ({ project, onClose, onClone }) => {
  const { toggleLike, userProfile } = useFile();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const generateDoc = () => {
    const htmlFile = project.files.find(f => f.name === 'index.html');
    if (!htmlFile) return '<div style="color:white; padding:40px; text-align:center;">No HTML file found.</div>';

    let html = htmlFile.content;
    
    // Inject CSS/JS
    const cssFiles = project.files.filter(f => f.name.endsWith('.css'));
    const styles = cssFiles.map(f => `<style>${f.content}</style>`).join('\n');
    const jsFiles = project.files.filter(f => f.name.endsWith('.js'));
    const scripts = jsFiles.map(f => `<script>${f.content}</script>`).join('\n');

    // Inject styles
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${styles}\n<script src="https://cdn.tailwindcss.com"></script>\n</head>`);
    } else {
      html = `<head>${styles}<script src="https://cdn.tailwindcss.com"></script></head>${html}`;
    }

    // Inject scripts
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${scripts}\n</body>`);
    } else {
      html += `${scripts}`;
    }

    return html;
  };

  useEffect(() => {
    if (iframeRef.current) {
        iframeRef.current.srcdoc = generateDoc();
    }
  }, [project]);

  const shareProject = () => {
      const url = `${window.location.origin}/?project=${project.id}`;
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
  };

  const isLiked = userProfile && project.likedBy && project.likedBy[userProfile.id];
  const canClone = userProfile && userProfile.sourceCodeCredits > 0;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0F1117] flex flex-col animate-in fade-in duration-200">
        {/* Header */}
        <div className="h-14 bg-[#16181D] border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0 shadow-xl">
            <div className="flex items-center gap-3 overflow-hidden">
                <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors shrink-0">
                    <X className="w-5 h-5" />
                </button>
                <div className="truncate">
                    <h2 className="text-white font-bold text-sm truncate">{project.name}</h2>
                    <p className="text-[10px] text-gray-500 truncate">by {project.authorName}</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button onClick={shareProject} className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors" title="Share">
                    <Share2 className="w-4 h-4" />
                </button>

                <button 
                    onClick={() => toggleLike(project.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all text-xs ${isLiked ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20' : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'}`}
                >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{project.likes}</span>
                </button>

                <button 
                    onClick={onClone}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-xs shadow-lg transition-all ${
                        !canClone 
                            ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500/20' 
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
                    }`}
                >
                    {canClone ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span className="hidden md:inline">{canClone ? 'Clone Project' : 'Get Code'}</span>
                    {!canClone && <span className="md:hidden">Get Code</span>}
                </button>
            </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-white relative">
            <iframe 
                ref={iframeRef}
                className="w-full h-full border-none"
                title="Preview"
                sandbox="allow-scripts allow-modals"
            />
        </div>
    </div>
  );
};

export default PublicPreview;