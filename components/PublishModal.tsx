import React, { useState, useEffect } from 'react';
import { X, Globe, Tag, AlignLeft, Type } from 'lucide-react';
import { useFile } from '../context/FileContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

const PublishModal: React.FC<Props> = ({ isOpen, onClose, projectId }) => {
  const { publishProject, projects } = useFile();
  const [publicName, setPublicName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
      if(isOpen) {
          const proj = projects.find(p => p.id === projectId);
          if(proj) {
              setPublicName(proj.name); // Default to internal name
          }
      }
  }, [isOpen, projectId, projects]);

  if (!isOpen) return null;

  const handlePublish = async () => {
    const tagList = tags.split(',').map(t => t.trim()).filter(t => t);
    
    if (tagList.length > 4) {
        alert("Maximum 4 tags are allowed.");
        return;
    }
    
    if(!publicName.trim()) {
        alert("Public Project Name is required.");
        return;
    }

    setIsSubmitting(true);
    try {
        await publishProject(projectId, publicName.trim(), description, tagList);
        onClose();
    } catch (e) {
        console.error(e);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e2025] border border-white/10 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" /> Publish Project
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
            </button>
        </div>
        
        <div className="p-6 space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-200 mb-4">
                This will publish your project to the Community Hub. You can set a different public name here.
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 flex items-center gap-2">
                    <Type className="w-3 h-3" /> Public Project Name
                </label>
                <input 
                    type="text" 
                    value={publicName}
                    onChange={(e) => setPublicName(e.target.value)}
                    placeholder="e.g. My Awesome Portfolio"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 flex items-center gap-2">
                    <AlignLeft className="w-3 h-3" /> Description
                </label>
                <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description..."
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-all h-20 resize-none"
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 flex items-center gap-2">
                    <Tag className="w-3 h-3" /> Tags (Max 4)
                </label>
                <input 
                    type="text" 
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="react, tailwind, portfolio, game"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                />
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <button 
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={handlePublish}
                    disabled={!description.trim() || isSubmitting || !publicName.trim()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50"
                >
                    {isSubmitting ? 'Publishing...' : 'Publish Now'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PublishModal;