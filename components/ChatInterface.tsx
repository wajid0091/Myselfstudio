
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Send, Loader2, ChevronDown, ChevronUp, Paperclip, X, Sparkles, 
  FileCode2, Eye, Maximize2, ShieldCheck, Zap, Image as ImageIcon, FileText,
  ArrowRight, Code2, Check
} from 'lucide-react';
import { useFile } from '../context/FileContext';
import { useSettings } from '../context/SettingsContext';
import { generateCode } from '../services/gemini';
import { uploadImageToImgBB } from '../services/imgbb';
import { Message, GeneratedFile, Suggestion } from '../types';
import { db } from '../services/firebase';
import { ref, onValue } from 'firebase/database';

interface ChatInterfaceProps {
  isOpen: boolean;
  onToggle: () => void;
}

const MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (WAI)' },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash' },
  { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro' },
];

const ChatInterface: React.FC<ChatInterfaceProps> = ({ isOpen, onToggle }) => {
  const { files, messages, addMessage, addFile } = useFile();
  const { settings, updateSettings } = useSettings();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
  const [appliedFiles, setAppliedFiles] = useState<Record<string, boolean>>({}); 
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{name: string, type: string, url?: string}[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const suggRef = ref(db, 'system_settings/suggestions');
    const unsub = onValue(suggRef, (snapshot) => {
        if(snapshot.exists()) {
            const data = snapshot.val();
            const list = Object.entries(data).map(([id, val]: [string, any]) => ({...val, id})) as Suggestion[];
            setSuggestions(list.sort((a, b) => (a.order || 0) - (b.order || 0)));
        }
    });

    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
    return () => unsub();
  }, [messages, loading]);

  const handleApply = (msgId: number, fileName: string, content: string) => {
      addFile(fileName, content);
      const key = `${msgId}-${fileName}`;
      setAppliedFiles(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
          setAppliedFiles(prev => ({ ...prev, [key]: false }));
      }, 3000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (!selectedFiles) return;
      setIsUploading(true);
      const filesArray = Array.from(selectedFiles) as unknown as globalThis.File[];
      
      for (const file of filesArray) {
          if (file.type.startsWith('image/')) {
              const url = await uploadImageToImgBB(file);
              if (url) {
                  setAttachedFiles(prev => [...prev, { name: file.name, type: 'image', url }]);
                  addFile(file.name, url);
              }
          } else {
              const text = await file.text();
              setAttachedFiles(prev => [...prev, { name: file.name, type: 'text' }]);
              addFile(file.name, text);
          }
      }
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (e?: React.FormEvent, customPrompt?: string, displayLabel?: string) => {
    if (e) e.preventDefault();
    const finalInput = customPrompt || input;
    if (!finalInput.trim() && attachedFiles.length === 0 || loading) return;

    const userDisplayMessage = displayLabel || finalInput;
    addMessage({ role: 'user', content: userDisplayMessage, timestamp: Date.now() });
    
    setInput('');
    setAttachedFiles([]);
    setLoading(true);

    try {
      const response = await generateCode(finalInput, files, settings, [], messages, true);
      const aiFiles: GeneratedFile[] = Object.entries(response.files).map(([name, content]) => ({
          name, content,
          language: name.endsWith('.html') ? 'html' : name.endsWith('.css') ? 'css' : (name.endsWith('.js') ? 'javascript' : 'plaintext')
      }));
      addMessage({ role: 'model', content: response.text, timestamp: Date.now(), generatedFiles: aiFiles });
    } catch (err: any) {
      addMessage({ role: 'model', content: `### ❌ WAI Error\n${err.message}`, timestamp: Date.now() });
    } finally {
      setLoading(false);
    }
  };

  const containerClasses = isFullScreen 
    ? 'fixed inset-0 z-[100] bg-[#16181D] flex flex-col' 
    : `flex flex-col bg-[#16181D] h-full overflow-hidden transition-all duration-300 shadow-2xl relative z-[50] ${isOpen ? 'flex-1' : 'h-12'}`;

  return (
    <div className={containerClasses}>
      {/* Clickable Header Area - Height synchronized to h-12 to match App.tsx */}
      <div 
        className="h-12 bg-[#1E2028] border-b border-white/5 flex items-center justify-between px-5 cursor-pointer shrink-0" 
        onClick={isFullScreen ? undefined : onToggle}
      >
        <div className="flex items-center gap-3">
          <Sparkles className={`w-4 h-4 text-indigo-400 ${loading ? 'animate-pulse' : ''}`} />
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-white uppercase italic tracking-widest leading-none">WAI Assistant</span>
            <span className="text-[7px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{settings.selectedModel || 'Gemini 3 Flash'}</span>
          </div>
        </div>
        <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
            {(isOpen || isFullScreen) && (
                <>
                    <select value={settings.selectedModel} onChange={e => updateSettings({ selectedModel: e.target.value })} className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[8px] text-gray-400 font-bold uppercase outline-none">
                        {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-1.5 text-gray-400 hover:text-white transition-colors"><Maximize2 className="w-4 h-4" /></button>
                </>
            )}
            {!isFullScreen && (
                <button onClick={onToggle} className="p-2 text-gray-400 hover:text-white transition-all">
                    {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                </button>
            )}
        </div>
      </div>

      {(isOpen || isFullScreen) && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#16181D] custom-scrollbar scroll-smooth">
            {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-5">
                    <div className="w-16 h-16 bg-indigo-600/10 rounded-[2rem] flex items-center justify-center border border-indigo-500/20 shadow-xl">
                        <Code2 className="w-8 h-8 text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">WAI Assistant Engine</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed mt-2 opacity-60">Ready to build something amazing? <br/> Just ask Wajid Ali's AI Architect.</p>
                    </div>
                </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                <div className={`relative max-w-[90%] rounded-[1.2rem] p-4 shadow-xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-[#1E2028] text-gray-200 border border-white/5 rounded-bl-none'}`}>
                  <div className="prose prose-invert prose-sm max-w-none break-words text-sm leading-relaxed"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                </div>
                {msg.generatedFiles?.map(file => (
                    <div key={file.name} className="w-full max-w-[95%] mt-4 bg-[#1E2028] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between p-3.5 bg-white/5">
                            <span className="text-[9px] font-mono font-black text-indigo-400 flex items-center gap-2 truncate uppercase"><FileCode2 className="w-3.5 h-3.5" /> {file.name}</span>
                            <div className="flex gap-2">
                                <button onClick={() => setExpandedFiles(prev => ({...prev, [`${i}-${file.name}`]: !prev[`${i}-${file.name}`]}))} className="p-1.5 text-gray-500 hover:text-white transition-colors"><Eye className="w-4 h-4" /></button>
                                <button 
                                    onClick={() => handleApply(i, file.name, file.content)} 
                                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all flex items-center gap-1 ${
                                        appliedFiles[`${i}-${file.name}`] 
                                        ? 'bg-green-600 text-white' 
                                        : 'bg-indigo-600 text-white hover:bg-indigo-500'
                                    }`}
                                >
                                    {appliedFiles[`${i}-${file.name}`] ? <><Check className="w-3 h-3" /> Applied</> : 'Apply'}
                                </button>
                            </div>
                        </div>
                        {expandedFiles[`${i}-${file.name}`] && <pre className="p-4 text-[9px] font-mono text-gray-300 bg-black/40 overflow-x-auto border-t border-white/5 leading-relaxed">{file.content}</pre>}
                    </div>
                ))}
              </div>
            ))}
            {loading && (
                <div className="flex flex-col items-start gap-2">
                    <div className="bg-[#1E2028] text-indigo-400 rounded-xl p-3.5 border border-white/5 text-[9px] font-black uppercase animate-pulse inline-block shadow-lg">
                         <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-2" />
                         Thinking...
                    </div>
                </div>
            )}
          </div>

          <div className="p-4 bg-[#1E2028] border-t border-white/5 shrink-0 z-20">
             {!loading && suggestions.length > 0 && (
                <div className="flex overflow-x-auto gap-3 mb-4 pb-1 scrollbar-hide">
                    {suggestions.map((s) => (
                        <button key={s.id} onClick={() => handleSend(undefined, s.prompt, s.label)} className="shrink-0 px-5 py-2.5 bg-indigo-600/10 border border-indigo-500/20 rounded-full text-[8px] font-black text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 uppercase tracking-widest whitespace-nowrap shadow-md">
                            <Zap className="w-3 h-3" /> {s.label}
                        </button>
                    ))}
                </div>
             )}

             <form onSubmit={handleSend} className="relative bg-[#16181D] border border-white/10 rounded-2xl overflow-hidden shadow-2xl focus-within:border-indigo-500/50 transition-all mb-2">
                <div className="flex items-end">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3.5 text-gray-500 hover:text-indigo-400 transition-colors">
                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                    </button>
                    <textarea 
                        value={input} 
                        onChange={e => setInput(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} 
                        placeholder="Type your request..." 
                        className="flex-1 bg-transparent text-gray-100 py-4 text-sm focus:outline-none resize-none min-h-[50px] custom-scrollbar" 
                        rows={1} 
                    />
                    <button type="submit" disabled={!input.trim() && attachedFiles.length === 0 || loading} className="p-3.5 text-indigo-500 disabled:text-gray-800 hover:scale-110 active:scale-95 transition-all">
                        <Send className="w-5 h-5" />
                    </button>
                </div>
             </form>
             <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
          </div>
        </>
      )}
    </div>
  );
};

export default ChatInterface;
