import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2, ChevronDown, ChevronUp, Paperclip, X, Download, PlusCircle, Sparkles, Wand2, FileText, Square, Shield, ShieldAlert, FileCode2, Key, Check, Copy } from 'lucide-react';
import { useFile } from '../context/FileContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { generateCode } from '../services/gemini';
import { uploadImageToImgBB } from '../services/imgbb';
import { Message, GeneratedFile } from '../types';
import AuthScreen from './AuthScreen';

interface ChatInterfaceProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface Attachment {
    type: 'image' | 'file';
    content: string;
    name: string;
}

const MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Newest)' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Logic)' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Stable)' },
];

const ChatInterface: React.FC<ChatInterfaceProps> = ({ isOpen, onToggle }) => {
  const { messages, addMessage, addFile, files, updateFileContent, deductCredit } = useFile();
  const { settings, updateSettings } = useSettings();
  const { user, userProfile } = useAuth();
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Track applied files to show visually
  const [appliedFiles, setAppliedFiles] = useState<Set<string>>(new Set());

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSafeMode, setIsSafeMode] = useState(true); 
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasCustomKey = settings.googleApiKey && settings.googleApiKey.length > 10;

  useEffect(() => {
    if (scrollRef.current && isOpen) {
      setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    }
  }, [messages, isOpen, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    const newAttachments: Attachment[] = [];
    try {
        for (let i = 0; i < e.target.files.length; i++) {
            const file = e.target.files[i];
            if (file.type.startsWith('image/')) {
                const url = await uploadImageToImgBB(file);
                if (url) newAttachments.push({ type: 'image', content: url, name: file.name });
            } else {
                const text = await file.text();
                newAttachments.push({ type: 'file', content: text, name: file.name });
            }
        }
        setAttachments(prev => [...prev, ...newAttachments]);
    } catch (e) {
        alert("Error processing files.");
    } finally {
        setIsUploading(false);
        if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleApplyFile = (file: GeneratedFile, msgIndex: number, fileIndex: number) => {
    // Robust logic to apply file content
    // Normalize names to handle case sensitivity issues (e.g., 'index.html' vs 'Index.html')
    const targetName = file.name.trim();
    const existingFile = files.find(f => f.name.toLowerCase() === targetName.toLowerCase());
    
    // If exact match found or case-insensitive match found, update it.
    if (existingFile) {
        updateFileContent(existingFile.name, file.content);
    } else {
        addFile(targetName, file.content);
    }
    
    // Mark as applied visually
    const key = `${msgIndex}-${fileIndex}`;
    setAppliedFiles(prev => new Set(prev).add(key));
  };

  const handleDownloadFile = (file: GeneratedFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyPrompt = (text: string, index: number) => {
      navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleStop = () => {
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
          setIsLoading(false);
          addMessage({ role: 'model', content: "🛑 Generation stopped.", timestamp: Date.now() });
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading || isUploading) return;

    if (!user) {
        setIsAuthModalOpen(true);
        return;
    }

    if (!userProfile || userProfile.credits <= 0) {
        if(!settings.googleApiKey) {
             alert("You have 0 Credits. Add your own API Key or upgrade.");
             return;
        }
    }

    if (!isOpen) onToggle();

    let displayContent = input;
    if (attachments.length > 0) {
        displayContent += `\n[Attachments: ${attachments.map(a => a.name).join(', ')}]`;
    }

    // 1. Add User Message Immediately (Optimistic UI)
    const userMsg: Message = { 
      role: 'user', 
      content: displayContent, 
      timestamp: Date.now() 
    };
    addMessage(userMsg);
    
    const currentInput = input;
    const currentAttachments = [...attachments]; 

    // Clear input immediately to avoid double submission or lag
    setInput('');
    setAttachments([]); 
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    
    setIsLoading(true);
    
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const { text, files: modifications } = await generateCode(
        currentInput, 
        files, 
        settings, 
        currentAttachments, 
        messages, 
        isSafeMode,
        controller.signal
      );
      
      if((text || Object.keys(modifications).length > 0) && !settings.googleApiKey) {
          await deductCredit();
      }

      const generatedFiles: GeneratedFile[] = Object.entries(modifications).map(([name, content]) => {
         let language = 'plaintext';
         if (name.endsWith('.html')) language = 'html';
         if (name.endsWith('.css')) language = 'css';
         if (name.endsWith('.js')) language = 'javascript';
         if (name.endsWith('.json')) language = 'json';
         return { name, content, language };
      });

      // 2. Add AI Message
      const aiMsg: Message = {
        role: 'model',
        content: text || "Code generated successfully.",
        timestamp: Date.now(),
        generatedFiles: generatedFiles
      };
      addMessage(aiMsg);

    } catch (error: any) {
      if (error.message === "Generation stopped by user.") return;
      console.error(error);
      addMessage({ role: 'model', content: "⚠️ " + error.message, timestamp: Date.now() });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <>
    <div className="flex flex-col h-full bg-[#16181D]">
      
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-2 bg-[#1A1D24] border-b border-white/5 cursor-pointer hover:bg-[#20232b] transition-colors select-none shrink-0"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
           <div className={`p-1.5 rounded-lg ${isOpen ? 'bg-blue-600/20 text-blue-400' : 'bg-white/5 text-gray-400'}`}>
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
           </div>
           <div>
               <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                   AI Code Assistant <Wand2 className="w-3 h-3 text-blue-400" />
               </h3>
           </div>
        </div>
        
        {isOpen && (
            <div className="flex items-center gap-2">
                 {/* Safe Mode */}
                 <div 
                    onClick={(e) => { e.stopPropagation(); setIsSafeMode(!isSafeMode); }}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded border cursor-pointer transition-all ${isSafeMode ? 'bg-green-500/10 border-green-500/30' : 'bg-[#0F1117] border-white/5'}`}
                    title={isSafeMode ? "Safe Mode ON: Preserves logic" : "Safe Mode OFF: Full rewrite"}
                 >
                    {isSafeMode ? <Shield className="w-3.5 h-3.5 text-green-400" /> : <ShieldAlert className="w-3.5 h-3.5 text-gray-500" />}
                 </div>

                 <div onClick={e => e.stopPropagation()} className="relative">
                     <select 
                        value={settings.selectedModel} 
                        onChange={(e) => updateSettings({ selectedModel: e.target.value })}
                        className={`bg-[#0F1117] text-[10px] font-medium border rounded px-1.5 py-1 outline-none focus:border-blue-500 cursor-pointer w-28 sm:w-auto ${hasCustomKey ? 'text-green-400 border-green-900/50' : 'text-blue-400 border-blue-900/30'}`}
                     >
                        {hasCustomKey && <option value={settings.selectedModel}>✨ Custom Key</option>}
                        {MODELS.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                     </select>
                 </div>
            </div>
        )}
      </div>

      {/* Messages */}
      {isOpen && (
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth bg-[#16181D]">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-60 space-y-4 pt-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center ring-1 ring-white/5">
                        <Sparkles className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-gray-300 font-bold text-lg">Gemini 3 Assistant</p>
                        <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                           Powered by Google's latest Gemini 3 models.
                        </p>
                    </div>
                </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group relative`}>
                
                {msg.role === 'user' && (
                    <button 
                        onClick={() => handleCopyPrompt(msg.content, idx)}
                        className={`absolute top-0 right-full mr-2 p-1.5 bg-[#252830] rounded-lg border border-white/5 transition-all shadow-sm z-10 ${copiedIndex === idx ? 'opacity-100 text-green-400' : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white'}`}
                        title="Copy Prompt"
                    >
                        {copiedIndex === idx ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                )}

                <div className={`max-w-[90%] md:max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-sm' 
                    : 'bg-[#252830] text-gray-200 border border-white/5 rounded-tl-sm'
                }`}>
                  <ReactMarkdown 
                    className="prose prose-invert prose-p:my-1 prose-headings:my-2 prose-code:text-blue-300 max-w-none"
                    components={{
                        code: ({node, ...props}) => <code className="bg-black/30 rounded px-1.5 py-0.5 font-mono text-xs" {...props} />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
                
                {msg.role === 'model' && msg.generatedFiles && msg.generatedFiles.length > 0 && (
                    <div className="mt-2 w-full max-w-[90%] md:max-w-[80%] grid gap-2 animate-in slide-in-from-bottom-2 duration-300">
                        {msg.generatedFiles.map((file, fIdx) => {
                            const isApplied = appliedFiles.has(`${idx}-${fIdx}`);
                            return (
                                <div key={fIdx} className={`bg-[#1E2028] border rounded-lg p-3 flex items-center justify-between transition-all shadow-sm group ${isApplied ? 'border-green-500/30 bg-green-500/5' : 'border-white/5 hover:border-blue-500/30'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-black/20 rounded flex items-center justify-center text-blue-400">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-xs font-bold transition-colors ${isApplied ? 'text-green-400' : 'text-gray-200 group-hover:text-blue-300'}`}>{file.name}</span>
                                            <span className="text-[10px] text-gray-500">
                                                {file.language.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleApplyFile(file, idx, fIdx)} 
                                            disabled={isApplied}
                                            className={`flex items-center gap-1 px-4 py-1.5 rounded text-[11px] font-bold transition-colors shadow-lg ${isApplied ? 'bg-green-500/20 text-green-400 cursor-default' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'}`}
                                        >
                                            {isApplied ? <Check className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />} 
                                            {isApplied ? 'Applied' : 'Apply'}
                                        </button>
                                        <button 
                                            onClick={() => handleDownloadFile(file)} 
                                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
              </div>
            ))}
            
            {isLoading && (
                <div className="flex justify-start animate-pulse">
                    <div className="bg-[#252830] border border-white/10 px-4 py-2 rounded-2xl rounded-tl-sm flex items-center gap-2 text-gray-400 text-xs shadow-md">
                        <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                        <span>Gemini 3 is thinking...</span>
                    </div>
                </div>
            )}
          </div>
      )}

      {/* Input */}
      <div className="p-3 bg-[#1A1D24] border-t border-white/5 shrink-0 z-50 sticky bottom-0 safe-pb">
            {isUploading && <div className="text-xs text-blue-400 mb-2 flex items-center gap-2 animate-pulse"><Loader2 className="w-3 h-3 animate-spin" /> Uploading attachments...</div>}
            
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 max-h-20 overflow-y-auto custom-scrollbar">
                  {attachments.map((att, idx) => (
                      <div key={idx} className="relative inline-flex items-center gap-2 p-1.5 pr-2 bg-[#252830] rounded-lg border border-white/10 group animate-in zoom-in-95">
                        {att.type === 'image' ? (
                             <img src={att.content} alt="Attached" className="h-6 w-6 rounded object-cover" />
                        ) : (
                             <div className="h-6 w-6 bg-blue-500/20 rounded flex items-center justify-center text-blue-400">
                                 <FileCode2 className="w-3 h-3" />
                             </div>
                        )}
                        <span className="text-[10px] font-bold text-gray-300 max-w-[80px] truncate">{att.name}</span>
                        <button onClick={() => removeAttachment(idx)} className="ml-1 p-0.5 bg-white/5 hover:bg-red-500 hover:text-white rounded-full transition-colors"><X className="w-3 h-3" /></button>
                      </div>
                  ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
              <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  multiple 
                  onChange={handleFileUpload} 
              />
              
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors mb-0.5"
              >
                  <Paperclip className="w-4 h-4" />
              </button>

              <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  rows={1}
                  placeholder={user ? "Describe the website..." : "Login to use AI..."}
                  className="w-full bg-[#0F1117] text-white rounded-lg pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 border border-white/10 placeholder:text-gray-600 transition-all resize-none overflow-y-auto max-h-[120px] scrollbar-hide"
                  onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                      }
                  }}
                />
                
                {isLoading ? (
                    <button type="button" onClick={handleStop} className="absolute right-2 bottom-1.5 p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-md shadow-lg shadow-red-900/20"><Square className="w-4 h-4 fill-current" /></button>
                ) : (
                    <button type="submit" disabled={isUploading || (!input.trim() && attachments.length === 0)} className="absolute right-2 bottom-1.5 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md disabled:opacity-50 disabled:bg-transparent disabled:text-gray-500 transition-all"><Send className="w-4 h-4" /></button>
                )}
              </div>
            </form>
      </div>
    </div>
    
    {isAuthModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="relative w-full max-w-md">
                 <button onClick={() => setIsAuthModalOpen(false)} className="absolute -top-10 right-0 text-white hover:text-gray-300 z-50"><X className="w-6 h-6" /></button>
                 <AuthScreen onSuccess={() => setIsAuthModalOpen(false)} />
             </div>
        </div>
    )}
    </>
  );
};

export default ChatInterface;