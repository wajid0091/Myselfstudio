import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { X, Save, Shield, Info, MousePointer2, ArrowLeft, Key, ExternalLink } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettings();
  const [activeView, setActiveView] = useState<'main' | 'privacy' | 'about'>('main');

  if (!isOpen) return null;

  const renderHeader = (title: string) => (
      <div className="flex items-center justify-between p-4 border-b border-ide-border bg-[#1E2028]">
          <div className="flex items-center gap-2">
            {activeView !== 'main' && (
                <button onClick={() => setActiveView('main')} className="text-gray-400 hover:text-white">
                    <ArrowLeft className="w-5 h-5" />
                </button>
            )}
            <h2 className="text-lg font-semibold text-white">{title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
      </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-ide-panel w-full max-w-md rounded-xl shadow-2xl border border-ide-border animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {activeView === 'main' ? (
             <>
                {renderHeader('App Settings')}
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar bg-[#16181D]">
                  
                  {/* Personal API Key (BYOK) */}
                  <div className="space-y-2">
                      <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                              <Key className="w-3 h-3 text-yellow-500" /> Personal Gemini API Key
                          </label>
                          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline flex items-center gap-1">
                              Get Key <ExternalLink className="w-2 h-2" />
                          </a>
                      </div>
                      <input 
                        type="password"
                        value={settings.googleApiKey || ''}
                        onChange={e => updateSettings({ googleApiKey: e.target.value })}
                        placeholder="Paste your API key here..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all font-mono"
                      />
                      <p className="text-[10px] text-gray-500">If left empty, the system's default key will be used (if available).</p>
                  </div>

                  <div className="h-px bg-white/5 my-2"></div>

                  <div className="space-y-3">
                      <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-3">
                              <MousePointer2 className="w-5 h-5 text-blue-400" />
                              <div>
                                  <span className="text-gray-200 text-sm font-bold block">PC Cursor Effect</span>
                                  <span className="text-xs text-gray-500">Show a mouse cursor on touch devices</span>
                              </div>
                          </div>
                          <input type="checkbox" 
                            checked={settings.enableCustomCursor} 
                            onChange={e => updateSettings({enableCustomCursor: e.target.checked})}
                            className="w-5 h-5 rounded border-gray-600 bg-ide-bg text-blue-500 focus:ring-blue-500"
                          />
                      </label>

                       <button onClick={() => setActiveView('privacy')} className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-left group">
                          <div className="flex items-center gap-3"><Shield className="w-5 h-5 text-green-400" /><span className="text-gray-200 text-sm font-bold">Privacy Policy</span></div>
                          <div className="text-gray-500 group-hover:text-white">&rarr;</div>
                      </button>

                      <button onClick={() => setActiveView('about')} className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-left group">
                          <div className="flex items-center gap-3"><Info className="w-5 h-5 text-purple-400" /><span className="text-gray-200 text-sm font-bold">About App</span></div>
                          <div className="text-gray-500 group-hover:text-white">&rarr;</div>
                      </button>
                  </div>
                </div>
                
                <div className="p-4 border-t border-ide-border flex justify-end bg-[#1E2028]">
                    <button 
                        onClick={onClose}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-900/20 transition-colors"
                    >
                        <Save className="w-4 h-4" /> Save & Close
                    </button>
                </div>
             </>
        ) : activeView === 'privacy' ? (
            <>
                {renderHeader('Privacy Policy')}
                <div className="p-6 bg-[#16181D] text-gray-300 text-sm space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <p>Your privacy is important. We only store your project data on Google Firebase to ensure you can access it anywhere. Your API keys are stored locally in your browser unless you choose to save them to your account.</p>
                </div>
            </>
        ) : (
             <>
                {renderHeader('About App')}
                <div className="p-8 bg-[#16181D] text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Info className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-white font-bold text-2xl">MYSELF IDE</h3>
                    <p className="text-gray-400 text-sm">Version 2.5.1</p>
                    <p className="text-gray-500 text-xs">Developed by Wajid Ali</p>
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;