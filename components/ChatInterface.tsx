
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Send, Loader2, ChevronDown, ChevronUp, Paperclip, X, Sparkles, 
  FileCode2, Eye, Maximize2, Minimize2, ShieldCheck, Zap, Image as ImageIcon, FileText,
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
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (WAI)' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (WAI)' },
];

const ChatInterface: React.FC<ChatInterfaceProps> = ({ isOpen, onToggle }) => {
  const { files, messages, addMessage, addFile } = useFile();
  const { settings, updateSettings } = useSettings();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
  const [appliedFiles, setAppliedFiles] = useState<Record<string, boolean>>({}); // Success feedback state
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
    : `flex flex-col bg-[#16181D] h-full overflow-hidden transition-all duration-300 shadow-2xl ${isOpen ? 'flex-1' : 'h-12'}`;

  return (
    <div className={containerClasses}>
      <div className="h-12 bg-[#1E2028] border-b border-white/5 flex items-center justify-between px-4 cursor-pointer shrink-0" onClick={isFullScreen ? undefined : onToggle}>
        <div className="flex items-center gap-3">
          <Sparkles className={`w-4 h-4 text-indigo-400 ${loading ? 'animate-pulse' : ''}`} />
          <span className="text-xs font-black text-gray-200 uppercase italic tracking-tighter">WAI Assistant v3.0</span>
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            {(isOpen || isFullScreen) && (
                <>
                    <select value={settings.selectedModel} onChange={e => updateSettings({ selectedModel: e.target.value })} className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[9px] text-gray-400 font-bold uppercase outline-none">
                        {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-1.5 text-gray-400 hover:text-white transition-colors"><Maximize2 className="w-4 h-4" /></button>
                </>
            )}
            {!isFullScreen && (
                <button onClick={onToggle} className="text-gray-400 hover:text-white transition-transform duration-300">
                    {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                </button>
            )}
        </div>
      </div>

      {(isOpen || isFullScreen) && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#16181D] custom-scrollbar">
            {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <div className="w-16 h-16 bg-indigo-600/10 rounded-3xl flex items-center justify-center border border-indigo-500/20">
                        <Code2 className="w-8 h-8 text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Ready to build?</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed">WAI Assistant is ready to help you.</p>
                    </div>
                </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                <div className={`relative max-w-[90%] rounded-2xl p-4 shadow-xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none border border-white/10' : 'bg-[#1E2028] text-gray-200 border border-white/5 rounded-bl-none'}`}>
                  <div className="prose prose-invert prose-sm max-w-none break-words text-sm leading-relaxed"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                </div>
                {msg.generatedFiles?.map(file => (
                    <div key={file.name} className="w-full max-w-[95%] mt-3 bg-[#1E2028] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between p-3 bg-white/5">
                            <span className="text-xs font-mono font-bold text-indigo-400 flex items-center gap-2 truncate"><FileCode2 className="w-4 h-4" /> {file.name}</span>
                            <div className="flex gap-2">
                                <button onClick={() => setExpandedFiles(prev => ({...prev, [`${i}-${file.name}`]: !prev[`${i}-${file.name}`]}))} className="p-1.5 text-gray-400 hover:text-white transition-colors"><Eye className="w-4 h-4" /></button>
                                <button 
                                    onClick={() => handleApply(i, file.name, file.content)} 
                                    className={`px-3 py-1 rounded text-[10px] font-black uppercase transition-all flex items-center gap-1 ${
                                        appliedFiles[`${i}-${file.name}`] 
                                        ? 'bg-green-600 text-white scale-105' 
                                        : 'bg-indigo-600 text-white hover:bg-indigo-500'
                                    }`}
                                >
                                    {appliedFiles[`${i}-${file.name}`] ? <><Check className="w-3 h-3" /> Applied</> : 'Apply'}
                                </button>
                            </div>
                        </div>
                        {expandedFiles[`${i}-${file.name}`] && <pre className="p-4 text-[11px] font-mono text-gray-300 bg-black/40 overflow-x-auto border-t border-white/5">{file.content}</pre>}
                    </div>
                ))}
              </div>
            ))}
            {loading && (
                <div className="flex flex-col items-start gap-2">
                    <div className="bg-[#1E2028] text-indigo-400 rounded-2xl p-4 border border-white/5 text-[10px] font-black uppercase animate-pulse inline-block shadow-lg">
                         <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                         WAI is Thinking...
                    </div>
                </div>
            )}
          </div>

          <div className="p-4 bg-[#1E2028] border-t border-white/5 shrink-0 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
             {!loading && suggestions.length > 0 && (
                <div className="flex overflow-x-auto gap-2 mb-4 pb-2 scrollbar-hide">
                    {suggestions.map((s) => (
                        <button key={s.id} onClick={() => handleSend(undefined, s.prompt, s.label)} className="shrink-0 px-5 py-2.5 bg-indigo-600/10 border border-indigo-500/20 rounded-full text-[10px] font-black text-indigo-400 hover:bg-indigo-600 hover:text-white hover:scale-105 active:scale-95 transition-all flex items-center gap-2 uppercase tracking-widest whitespace-nowrap shadow-lg">
                            <Zap className="w-3.5 h-3.5" /> {s.label}
                        </button>
                    ))}
                </div>
             )}

             <form onSubmit={handleSend} className="relative bg-[#16181D] border border-white/10 rounded-2xl overflow-hidden shadow-2xl focus-within:border-indigo-500/50 transition-all">
                <div className="flex items-end">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-4 text-gray-400 hover:text-indigo-400 transition-colors">
                        {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Paperclip className="w-6 h-6" />}
                    </button>
                    <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} placeholder="Ask WAI to build something..." className="flex-1 bg-transparent text-gray-100 py-4 text-sm focus:outline-none resize-none min-h-[56px] custom-scrollbar" rows={1} />
                    <button type="submit" disabled={!input.trim() && attachedFiles.length === 0 || loading} className="p-4 text-indigo-500 disabled:text-gray-700 hover:scale-110 active:scale-95 transition-all"><Send className="w-6 h-6" /></button>
                </div>
                <div className="bg-black/40 px-4 py-2 border-t border-white/5 flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-indigo-500/60">
                    <span className="flex items-center gap-2"><Sparkles className="w-2.5 h-2.5" /> WAJID ALI IDE - WAI ENGINE</span>
                    <span className="text-gray-600 font-mono">{settings.selectedModel}</span>
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
