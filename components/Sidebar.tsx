
import React, { useState, useRef } from 'react';
import { useFile } from '../context/FileContext';
import { 
  FileCode, 
  FilePlus, 
  Trash2, 
  Edit2, 
  X,
  FileJson,
  FileType,
  FolderOpen,
  Upload,
  Image as ImageIcon,
  Video
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { files, selectedFile, selectFile, addFile, deleteFile, renameFile, importFile } = useFile();
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFileName.trim()) {
      addFile(newFileName.trim());
      setNewFileName('');
      setIsCreating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          Array.from(e.target.files).forEach(file => {
              importFile(file);
          });
      }
  };

  const startRenaming = (name: string) => {
    setEditingFile(name);
    setRenameValue(name);
  };

  const handleRename = (oldName: string) => {
    if (renameValue.trim() && renameValue !== oldName) {
      renameFile(oldName, renameValue.trim());
    }
    setEditingFile(null);
  };

  const getIcon = (file: any) => {
    const name = file.name;
    if (file.language === 'image') return <div className="w-4 h-4 rounded overflow-hidden"><img src={file.content} className="w-full h-full object-cover" /></div>;
    if (name.endsWith('.html')) return <FileCode className="w-4 h-4 text-orange-500" />;
    if (name.endsWith('.css')) return <FileCode className="w-4 h-4 text-blue-500" />;
    if (name.endsWith('.js') || name.endsWith('.ts')) return <FileCode className="w-4 h-4 text-yellow-500" />;
    if (name.endsWith('.json')) return <FileJson className="w-4 h-4 text-green-500" />;
    if (name.match(/\.(mp4|webm|ogg)$/i)) return <Video className="w-4 h-4 text-pink-400" />;
    return <FileType className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="w-64 bg-[#0F1117] border-r border-white/5 flex flex-col h-full select-none shadow-2xl z-20">
      <div className="p-4 border-b border-white/5 bg-[#16181D]">
        <div className="flex justify-between items-center mb-1">
             <div className="flex items-center gap-2 text-gray-200 font-black uppercase tracking-widest">
                <FolderOpen className="w-4 h-4 text-blue-500" />
                <span className="text-[10px]">Explorer</span>
             </div>
             <div className="flex items-center gap-1">
                <input 
                    type="file" 
                    multiple 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileUpload}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setIsCreating(true)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                </button>
             </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {isCreating && (
          <form onSubmit={handleCreate} className="mb-2 px-1">
            <input
              autoFocus
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onBlur={() => setIsCreating(false)}
              placeholder="filename.ext"
              className="w-full bg-black/40 text-white text-xs px-3 py-2 border border-blue-500 rounded-lg outline-none shadow-xl shadow-blue-900/10"
            />
          </form>
        )}

        {files.map(file => (
          <div 
            key={file.name}
            className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs transition-all duration-150 ${
              selectedFile?.name === file.name 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/20' 
                : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
            }`}
            onClick={() => selectFile(file.name)}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              {getIcon(file)}
              {editingFile === file.name ? (
                <input
                  autoFocus
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => handleRename(file.name)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename(file.name)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-black text-white px-2 py-0.5 outline-none w-24 rounded border border-blue-500"
                />
              ) : (
                <span className="truncate font-bold tracking-tight">{file.name}</span>
              )}
            </div>

            <div className="hidden group-hover:flex items-center gap-1">
              <button 
                onClick={(e) => { e.stopPropagation(); startRenaming(file.name); }}
                className="p-1 text-gray-500 hover:text-blue-400 hover:bg-white/10 rounded"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteFile(file.name); }}
                className="p-1 text-gray-500 hover:text-red-500 hover:bg-white/10 rounded"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
