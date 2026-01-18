import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2, ChevronDown, ChevronUp, Paperclip, X, Code, Download, Copy, PlusCircle, Bot, Sparkles } from 'lucide-react';
import { useFile } from '../context/FileContext';
import { useSettings } from '../context/SettingsContext';
import { generateCode } from '../services/gemini';
import { Message, GeneratedFile } from '../types';

interface ChatInterfaceProps {
  isOpen: boolean;
  onToggle: () => void;
}

const MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3.0 Flash (Fast)' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro (Smart)' },
];

const ChatInterface: React.FC<ChatInterfaceProps> = ({ isOpen, onToggle }) => {
  const { messages, addMessage, addFile, files, updateFileContent } = useFile();
  const { settings, updateSettings } = useSettings();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to correctly calculate new scrollHeight
      textareaRef.current.style.height = 'auto';
      // Set new height based on content, capped at ~150px (approx 5-6 lines)
      const newHeight = Math.min(textareaRef.current.scrollHeight, 150);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setAttachedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleApplyFile = (file: GeneratedFile) => {
    if (files.some(f => f.name === file.name)) {
        updateFileContent(file.name, file.content);
    } else {
        addFile(file.name, file.content);
    }
  };

  const handleCopyCode = (content: string) => {
    navigator.clipboard.writeText(content);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedImage) || isLoading) return;

    const userMsg: Message = { 
      role: 'user', 
      content: input + (attachedImage ? ' [Image Attached]' : ''), 
      timestamp: Date.now() 
    };
    
    // Add user message to state
    addMessage(userMsg);
    
    const currentInput = input;
    const currentImage = attachedImage;

    // Clear input immediately
    setInput('');
    setAttachedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    // Reset height explicitly
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }
    
    setIsLoading(true);

    try {
      const { text, files: modifications } = await generateCode(
        currentInput, 
        files, 
        settings, 
        currentImage || undefined
      );
      
      const generatedFiles: GeneratedFile[] = Object.entries(modifications).map(([name, content]) => {
         let language = 'plaintext';
         if (name.endsWith('.html')) language = 'html';
         if (name.endsWith('.css')) language = 'css';
         if (name.endsWith('.js')) language = 'javascript';
         return { name, content, language };
      });

      const aiMsg: Message = {
        role: 'model',
        content: text || (generatedFiles.length > 0 ? "Here is the code you requested:" : "I analyzed your request."),
        timestamp: Date.now(),
        generatedFiles: generatedFiles
      };
      
      // Add AI response to state
      addMessage(aiMsg);

    } catch (error: any) {
      console.error(error);
      addMessage({
        role: 'model',
        content: "Sorry, I encountered an error generating the code. Please try again.",
        timestamp: Date.now()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col bg-[#1A1D24] border-t border-ide-border transition-all duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] h-full w-full`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 bg-[#252830] border-b border-white/5 cursor-pointer hover:bg-[#2A2D36] transition-colors select-none shrink-0"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
           <div className={`p-1.5 rounded-lg ${isOpen ? 'bg-blue-600/20 text-blue-400' : 'bg-white/5 text-gray-400'}`}>
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
           </div>
           <div>
               <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                   AI Assistant <Sparkles className="w-3 h-3 text-blue-400" />
               </h3>
           </div>
        </div>
        
        {isOpen && (
            <div className="flex items-center gap-3">
                 {/* Model Selector */}
                 <div onClick={e => e.stopPropagation()} className="relative">
                     <select 
                        value={settings.selectedModel} 
                        onChange={(e) => updateSettings({ selectedModel: e.target.value })}
                        className="bg-[#0F1117] text-xs text-gray-300 border border-white/10 rounded-md px-2 py-1 outline-none focus:border-blue-500 cursor-pointer"
                     >
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
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth pb-20">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-60 space-y-4">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center ring-1 ring-blue-500/20">
                        <Bot className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-gray-300 font-medium">How can I help you today?</p>
                        <p className="text-xs text-gray-500 mt-1">Ask me to generate code or just chat in Urdu/English.</p>
                    </div>
                </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                
                {/* Text Bubble */}
                <div className={`max-w-[90%] md:max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-md ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-sm' 
                    : 'bg-[#252830] text-gray-100 border border-white/5 rounded-tl-sm'
                }`}>
                  <ReactMarkdown 
                    className="prose prose-invert prose-p:my-1 prose-headings:my-2 prose-code:text-blue-300"
                    components={{
                        code: ({node, ...props}) => <code className="bg-black/30 rounded px-1.5 py-0.5 font-mono text-xs" {...props} />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* Generated Files Cards */}
                {msg.role === 'model' && msg.generatedFiles && msg.generatedFiles.length > 0 && (
                    <div className="mt-4 w-full max-w-[90%] md:max-w-[80%] grid gap-4 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Generated Files</div>
                        {msg.generatedFiles.map((file, fIdx) => (
                            <div key={fIdx} className="bg-[#1E2028] border border-white/10 rounded-xl overflow-hidden shadow-lg group hover:border-blue-500/30 transition-colors">
                                {/* File Header */}
                                <div className="flex items-center justify-between px-4 py-3 bg-[#252830] border-b border-white/5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 bg-blue-500/10 rounded-md">
                                            <Code className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-bold text-gray-200">{file.name}</span>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wide">{file.language}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleCopyCode(file.content)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Copy">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDownloadFile(file)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Download">
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                {/* Code Preview */}
                                <div className="bg-[#0F1117] p-4 overflow-x-auto max-h-48 text-xs font-mono text-gray-400 custom-scrollbar">
                                    <pre>{file.content.slice(0, 300)}{file.content.length > 300 ? '...' : ''}</pre>
                                </div>
                                {/* Footer Action */}
                                <div className="p-3 bg-[#252830] border-t border-white/5">
                                    <button 
                                        onClick={() => handleApplyFile(file)}
                                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-xs font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98]"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                        Add to Editor
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
              </div>
            ))}
            
            {isLoading && (
                <div className="flex justify-start animate-pulse">
                    <div className="bg-[#252830] border border-white/10 px-5 py-3 rounded-2xl rounded-tl-sm flex items-center gap-3 text-gray-400 text-sm shadow-md">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        <span>Thinking...</span>
                    </div>
                </div>
            )}
          </div>

          <div className="p-4 bg-[#252830] border-t border-white/5 shrink-0">
            {attachedImage && (
              <div className="relative inline-block mb-3 group">
                <img src={attachedImage} alt="Attachment" className="h-20 w-auto rounded-lg border border-blue-500/30 shadow-lg" />
                <button 
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative flex items-end gap-3">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors mb-0.5"
                title="Attach Image"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <div className="relative flex-1 group">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  rows={1}
                  placeholder="Ask in English or Urdu... (Press Enter for new line)"
                  className="w-full bg-[#1A1D24] text-white rounded-xl pl-5 pr-14 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-white/10 placeholder:text-gray-500 transition-all shadow-inner resize-none overflow-y-auto max-h-[150px] custom-scrollbar leading-relaxed"
                />
                <button 
                  type="submit" 
                  disabled={isLoading || (!input.trim() && !attachedImage)}
                  className="absolute right-2 bottom-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:bg-transparent disabled:text-gray-500 transition-all shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatInterface;