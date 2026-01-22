import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { X, Save, Shield, Info, MousePointer2, ArrowLeft, Key } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettings();
  const [activeView, setActiveView] = useState<'main' | 'privacy' | 'about'>('main');

  if (!isOpen) return null;

  const renderHeader = (title: string) => (
      <div className="flex items-center justify-between p-4 border-b border-ide-border">
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

  const renderPrivacy = () => (
      <div className="p-6 text-gray-300 text-sm space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <h3 className="text-white font-bold text-lg">Privacy Policy</h3>
          <p>Effective Date: October 2023</p>
          <p>Welcome to MYSELF IDE. We are committed to protecting your privacy and ensuring you have a positive experience.</p>
          
          <h4 className="font-bold text-white mt-4">1. Information We Collect</h4>
          <ul className="list-disc pl-5 space-y-1">
              <li><strong>Personal Information:</strong> Name, Email, Phone (for verification).</li>
              <li><strong>Project Data:</strong> Code files are stored securely on Google Firebase.</li>
          </ul>

          <h4 className="font-bold text-white mt-4">2. How We Use Information</h4>
          <ul className="list-disc pl-5 space-y-1">
              <li>Provide and maintain services.</li>
              <li>Process transactions for plans.</li>
          </ul>

          <h4 className="font-bold text-white mt-4">3. Contact</h4>
          <p>Contact: <span className="text-blue-400">mbhia78@gmail.com</span></p>
      </div>
  );

  const renderAbout = () => (
      <div className="p-6 text-gray-300 text-sm space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
               <Info className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-white font-bold text-2xl">MYSELF IDE</h3>
          <p className="opacity-70 font-mono text-xs mb-4">Version 2.5.0</p>
          
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-6 text-left">
              <p><strong>MYSELF IDE</strong> is an AI-powered cloud development environment. Build, edit, and deploy directly from your browser.</p>
          </div>

          <div className="pt-4 border-t border-white/5">
              <p className="text-xs text-gray-500 mb-2">Developed by</p>
              <p className="text-white font-bold">Wajid Ali</p>
          </div>
      </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-ide-panel w-full max-w-md rounded-xl shadow-2xl border border-ide-border animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {activeView === 'main' ? (
             <>
                {renderHeader('App Settings')}
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  
                  {/* General Settings */}
                  <div className="space-y-3">
                      
                      {/* API KEY SECTION */}
                      <div className="bg-gradient-to-br from-blue-900/10 to-purple-900/10 p-4 rounded-xl border border-blue-500/20 mb-4">
                           <h3 className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                              <Key className="w-3 h-3" /> Custom Gemini API Key
                           </h3>
                           <p className="text-[10px] text-gray-400 mb-2">
                              Enter your own key to remove credit limits. This key will be saved permanently for all projects.
                           </p>
                           <div className="relative">
                              <input
                                  type="password"
                                  value={settings.googleApiKey || ''}
                                  onChange={(e) => updateSettings({ googleApiKey: e.target.value })}
                                  placeholder="Paste AIzaSy... here"
                                  className="w-full bg-[#1A1D24] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-600"
                              />
                           </div>
                      </div>

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
                
                <div className="p-4 border-t border-ide-border flex justify-end">
                    <button 
                        onClick={onClose}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-900/20 transition-colors"
                    >
                        <Save className="w-4 h-4" /> Save
                    </button>
                </div>
             </>
        ) : activeView === 'privacy' ? (
            <>
                {renderHeader('Privacy Policy')}
                {renderPrivacy()}
            </>
        ) : (
             <>
                {renderHeader('About App')}
                {renderAbout()}
            </>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;