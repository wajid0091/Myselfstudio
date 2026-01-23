
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Send, Loader2, ChevronDown, ChevronUp, Paperclip, X, Sparkles, 
  Wand2, FileText, Square, FileCode2, Copy, Check, Download,
  Eye, EyeOff, PlayCircle, Terminal, Maximize2, Minimize2, Globe, Search, ShieldCheck, ChevronRight
} from 'lucide-react';
import { useFile } from '../context/FileContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { generateCode } from '../services/gemini';
import { uploadImageToImgBB } from '../services/imgbb';
import { Message, GeneratedFile } from '../types';

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
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Expert)' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Fast)' },
  { id: 'gemini-2.5-flash-lite-latest', name: 'Gemini 2.5 Lite' },
];

const ChatInterface: React.FC<ChatInterfaceProps> = ({ isOpen, onToggle }) => {
  const { files, messages, addMessage, updateFileContent, addFile } = useFile();
  const { settings, updateSettings } = useSettings();
  const { userProfile } = useAuth();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth'
      });
    }
  }, [messages, loading]);

  const toggleFileView = (msgIndex: number, fileName: string) => {
    const key = `${msgIndex}-${fileName}`;
    setExpandedFiles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const applyFileToEditor = (fileName: string, content: string) => {
    const exists = files.find(f => f.name === fileName);
    if (exists) {
      updateFileContent(fileName, content);
    } else {
      addFile(fileName, content);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (!selectedFiles) return;
      setIsUploading(true);
      for (const file of Array.from(selectedFiles) as unknown as globalThis.File[]) {
          if (file.type.startsWith('image/')) {
              const url = await uploadImageToImgBB(file);
              if (url) setAttachments(prev => [...prev, { type: 'image', content: url, name: file.name }]);
          } else {
              const text = await file.text();
              setAttachments(prev => [...prev, { type: 'file', content: text, name: file.name }]);
          }
      }
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const stopGeneration = () => {
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          setLoading(false);
      }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;
    if (loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    const currentInput = input;
    const currentAttachments = [...attachments];
    setInput('');
    setAttachments([]);
    addMessage(userMessage);
    setLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      const response = await generateCode(
        currentInput,
        files,
        settings,
        currentAttachments,
        messages,
        true,
        abortControllerRef.current.signal
      );

      const aiFiles: GeneratedFile[] = Object.entries(response.files).map(([name, content]) => ({
          name,
          content,
          language: name.endsWith('.html') ? 'html' : name.endsWith('.css') ? 'css' : (name.endsWith('.js') ? 'javascript' : (name.endsWith('.xml') ? 'xml' : 'plaintext'))
      }));

      addMessage({
        role: 'model',
        content: response.text,
        timestamp: Date.now(),
        generatedFiles: aiFiles
      });

    } catch (err: any) {
      if (err.message !== "Aborted" && err.name !== "AbortError") {
          addMessage({
            role: 'model',
            content: `### ❌ Generation Failed\n\n${err.message}`,
            timestamp: Date.now()
          });
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const containerClasses = isFullScreen 
    ? 'fixed inset-0 z-[100] bg-[#16181D] flex flex-col' 
    : `flex flex-col bg-[#16181D] h-full overflow-hidden transition-all duration-300 ${isOpen ? 'flex-1 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]' : 'h-12 shrink-0'}`;

  return (
    <div className={containerClasses} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Header / Toggle Handle */}
      <div 
        className="h-12 bg-[#1E2028] border-b border-white/5 flex items-center justify-between px-4 cursor-pointer shrink-0 select-none z-50 sticky top-0" 
        onClick={isFullScreen ? undefined : onToggle}
      >
        <div className="flex items-center gap-3">
          <Sparkles className={`w-4 h-4 text-blue-400 ${loading ? 'animate-pulse' : ''}`} />
          <span className="text-sm font-bold text-gray-200">AI Code Assistant</span>
          {loading && <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />}
        </div>
        
        <div className="flex items-center gap-2">
             {(isOpen || isFullScreen) && (
                 <div className="flex items-center gap-2">
                    <select 
                        value={settings.selectedModel}
                        onChange={(e) => updateSettings({ selectedModel: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-black/40 border border-white/10 rounded-md px-2 py-1 text-[10px] text-gray-400 outline-none focus:border-blue-500 font-bold uppercase"
                    >
                        {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>

                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsFullScreen(!isFullScreen); }}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-all"
                    >
                        {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                 </div>
             )}
             
             {!isFullScreen && (
                <button className="text-gray-400 hover:text-white p-1">
                    {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                </button>
             )}
        </div>
      </div>

      {(isOpen || isFullScreen) && (
        <>
          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-gradient-to-b from-[#16181D] to-[#0F1117] custom-scrollbar">
            {messages.length === 0 && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 p-10">
                <Wand2 className="w-16 h-16 text-blue-400 mb-4" />
                <p className="text-lg font-bold">Describe your feature or bug</p>
                <p className="text-xs max-w-xs mt-2 italic text-gray-400">"Create a login page with a separate admin.html for dashboard management"</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                <div className={`group relative max-w-[92%] rounded-2xl p-4 shadow-xl ${
                  msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-[#1E2028] text-gray-200 border border-white/5 rounded-bl-none'
                }`}>
                  <div className="prose prose-invert prose-sm max-w-none break-words">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  {msg.role === 'user' && (
                    <button 
                      onClick={() => copyToClipboard(msg.content, `msg-${i}`)}
                      className="absolute -left-10 top-2 p-2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-all bg-[#1E2028] rounded-full border border-white/5 shadow-lg"
                    >
                      {copiedId === `msg-${i}` ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {msg.generatedFiles && msg.generatedFiles.length > 0 && (
                  <div className="w-full mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in duration-500">
                    {msg.generatedFiles.map((file, fIdx) => {
                      const isExpanded = expandedFiles[`${i}-${file.name}`];
                      return (
                        <div key={file.name} className={`bg-[#1E2028]/90 border border-white/5 rounded-2xl overflow-hidden shadow-2xl transition-all ${isExpanded ? 'md:col-span-2' : ''}`}>
                          <div className="flex items-center justify-between p-3 md:p-4 bg-white/5">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="p-2 bg-blue-500/10 rounded-lg shrink-0"><FileCode2 className="w-4 h-4 text-blue-400" /></div>
                              <span className="text-xs font-mono font-bold text-gray-300 truncate">{file.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button onClick={() => toggleFileView(i, file.name)} className="px-2 py-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all">
                                {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                              <button onClick={() => applyFileToEditor(file.name, file.content)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold uppercase transition-all shadow-lg shadow-blue-900/40">
                                Apply
                              </button>
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="relative group/code bg-black/40">
                              <pre className="p-5 text-[11px] font-mono text-gray-300 overflow-x-auto custom-scrollbar max-h-[400px]">
                                {file.content}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#1E2028] text-gray-400 rounded-2xl rounded-bl-none p-4 border border-white/5 flex items-center gap-4 shadow-xl">
                   <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                   </div>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400/80">Generating Workspace...</span>
                </div>
              </div>
            )}
          </div>

          {/* Prompt Input Area */}
          <div className="p-4 bg-[#1E2028] border-t border-white/5 shrink-0">
            <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSend} className="relative bg-[#16181D] border border-white/10 rounded-2xl overflow-hidden focus-within:border-blue-500/50 shadow-2xl transition-all">
                    <div className="flex items-end">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-4 text-gray-400 hover:text-blue-400">
                            {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Paperclip className="w-6 h-6" />}
                        </button>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder="Describe your requested changes..."
                            className="flex-1 bg-transparent text-gray-100 py-4 text-sm focus:outline-none resize-none max-h-48 min-h-[56px] custom-scrollbar"
                            rows={1}
                        />
                        <button type="submit" disabled={!input.trim() || loading} className="p-4 text-blue-500 hover:text-blue-400 disabled:text-gray-700 transition-all">
                            <Send className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Status Dropup */}
                    <div className="bg-black/30">
                        <div onClick={() => setShowStatus(!showStatus)} className="px-4 py-1.5 border-t border-white/5 flex items-center justify-between cursor-pointer group">
                             <div className="flex items-center gap-3">
                                 <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{userProfile?.credits || 0} Credits Left</span>
                                 <div className="flex gap-1">
                                    {settings.enableAdminPanel && <ShieldCheck className="w-3 h-3 text-purple-400" />}
                                    {settings.enableSEO && <Search className="w-3 h-3 text-green-500" />}
                                    {settings.enablePWA && <Globe className="w-3 h-3 text-blue-500" />}
                                 </div>
                             </div>
                             <div className="flex items-center gap-1.5 text-[9px] text-gray-600 font-bold uppercase">
                                 {showStatus ? 'Hide Features' : 'Show Features'}
                                 <ChevronUp className={`w-3 h-3 transition-transform ${showStatus ? 'rotate-180' : ''}`} />
                             </div>
                        </div>
                        {showStatus && (
                            <div className="px-4 py-3 border-t border-white/5 grid grid-cols-2 gap-3 animate-in slide-in-from-bottom-1">
                                <div className="text-[10px] text-gray-400 flex flex-col">
                                    <span className="font-bold text-white uppercase mb-1">Architecture</span>
                                    {settings.enableAdminPanel ? '• admin.html Active' : '• Isolated App Mode'}
                                    {settings.enableSEO ? '• SEO Files Enabled' : ''}
                                </div>
                                <div className="text-[10px] text-gray-400 flex flex-col text-right">
                                    <span className="font-bold text-white uppercase mb-1">Active Model</span>
                                    {settings.selectedModel}
                                </div>
                            </div>
                        )}
                    </div>
                </form>
                <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatInterface;
