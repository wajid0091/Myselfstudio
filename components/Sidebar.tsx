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
  Image,
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

  const getIcon = (name: string) => {
    if (name.endsWith('.html')) return <FileCode className="w-4 h-4 text-orange-500" />;
    if (name.endsWith('.css')) return <FileCode className="w-4 h-4 text-blue-500" />;
    if (name.endsWith('.js') || name.endsWith('.ts')) return <FileCode className="w-4 h-4 text-yellow-500" />;
    if (name.endsWith('.json')) return <FileJson className="w-4 h-4 text-green-500" />;
    if (name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return <Image className="w-4 h-4 text-purple-400" />;
    if (name.match(/\.(mp4|webm|ogg)$/i)) return <Video className="w-4 h-4 text-pink-400" />;
    return <FileType className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="w-64 bg-[#181a1f] border-r border-ide-border flex flex-col h-full select-none shadow-xl z-20">
      {/* Header */}
      <div className="p-4 border-b border-ide-border/50 bg-[#1e2025]">
        <div className="flex justify-between items-center mb-1">
             <div className="flex items-center gap-2 text-gray-200 font-semibold">
                <FolderOpen className="w-4 h-4 text-blue-400" />
                <span className="text-sm">Explorer</span>
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
                  className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors"
                  title="Upload Files"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsCreating(true)}
                  className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors"
                  title="New File"
                >
                  <FilePlus className="w-4 h-4" />
                </button>
             </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isCreating && (
          <form onSubmit={handleCreate} className="mb-2 px-1">
            <input
              autoFocus
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onBlur={() => setIsCreating(false)}
              placeholder="filename.ext"
              className="w-full bg-[#0F1117] text-white text-sm px-2 py-1.5 border border-blue-500 rounded outline-none shadow-sm"
            />
          </form>
        )}

        {files.map(file => (
          <div 
            key={file.name}
            className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-all duration-150 ${
              selectedFile?.name === file.name 
                ? 'bg-[#2B303B] text-white shadow-sm border border-white/5' 
                : 'text-gray-400 hover:text-gray-100 hover:bg-[#252830]'
            }`}
            onClick={() => selectFile(file.name)}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              {getIcon(file.name)}
              {editingFile === file.name ? (
                <input
                  autoFocus
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => handleRename(file.name)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename(file.name)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-black text-white px-1 outline-none w-24 rounded border border-blue-500"
                />
              ) : (
                <span className="truncate font-medium">{file.name}</span>
              )}
            </div>

            <div className="hidden group-hover:flex items-center gap-1">
              <button 
                onClick={(e) => { e.stopPropagation(); startRenaming(file.name); }}
                className="p-1 text-gray-500 hover:text-blue-400 hover:bg-white/5 rounded"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteFile(file.name); }}
                className="p-1 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded"
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