import React, { useState } from 'react';
import { useFile } from '../context/FileContext';
import { Plus, Folder, Trash2, Clock, Code2, Zap, Layout } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { projects, createProject, openProject, deleteProject } = useFile();
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      createProject(newProjectName.trim());
      setNewProjectName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1117] text-gray-200 font-sans selection:bg-blue-500/30">
        {/* Background Gradients */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px]"></div>
        </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-white/5 pb-8">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                        <Code2 className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">Wajid Ali Web Builder</h1>
                </div>
                <p className="text-lg text-gray-400 max-w-2xl">
                    Your AI-powered development environment. Build, edit, and preview web applications with intelligent code generation.
                </p>
            </div>
            
            <button 
                onClick={() => setIsCreating(true)}
                className="group relative inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
            >
                <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                <span>New Project</span>
            </button>
        </header>

        {/* Modal */}
        {isCreating && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200 p-4">
                <form onSubmit={handleCreate} className="bg-[#1A1D24] border border-white/10 p-8 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    <h3 className="text-2xl font-bold text-white mb-2">Create New Project</h3>
                    <p className="text-gray-400 mb-6 text-sm">Give your project a name to get started.</p>
                    
                    <input 
                        autoFocus
                        type="text" 
                        value={newProjectName}
                        onChange={e => setNewProjectName(e.target.value)}
                        placeholder="e.g. Portfolio Site"
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all mb-6 placeholder:text-gray-600"
                    />
                    
                    <div className="flex justify-end gap-3">
                        <button 
                            type="button"
                            onClick={() => setIsCreating(false)}
                            className="px-5 py-2.5 text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={!newProjectName.trim()}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/20"
                        >
                            Create Project
                        </button>
                    </div>
                </form>
            </div>
        )}

        {/* Project Grid */}
        {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/10 rounded-3xl bg-white/5">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <Folder className="w-10 h-10 text-gray-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">No projects yet</h2>
                <p className="text-gray-500 max-w-md text-center mb-8">
                    Create your first project to experience the power of AI-driven web development.
                </p>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="text-blue-400 hover:text-blue-300 font-medium border-b border-blue-400/30 hover:border-blue-300 transition-all pb-0.5"
                >
                    Start a new project
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                    <div 
                        key={project.id}
                        onClick={() => openProject(project.id)}
                        className="group relative bg-[#1A1D24] border border-white/5 rounded-2xl p-6 cursor-pointer hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300 overflow-hidden"
                    >
                        {/* Hover Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="relative z-10 flex justify-between items-start mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#252830] to-[#1E2028] flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-300">
                                <Layout className="w-6 h-6 text-blue-400" />
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete Project"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors truncate">
                                {project.name}
                            </h3>
                            <p className="text-sm text-gray-500 mb-6 line-clamp-2">
                                Last edited on {new Date(project.lastModified).toLocaleDateString()}
                            </p>
                            
                            <div className="flex items-center gap-4 border-t border-white/5 pt-4">
                                <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 px-2.5 py-1 rounded-full">
                                    <Clock className="w-3 h-3" />
                                    <span>{new Date(project.lastModified).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 px-2.5 py-1 rounded-full">
                                    <Zap className="w-3 h-3 text-yellow-500" />
                                    <span>{project.files.length} Files</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;