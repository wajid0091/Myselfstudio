import React, { useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useFile } from '../context/FileContext';
import { X, Save, Search, Smartphone, Database, Lock, Shield, Image, Palette, Layout, Key, Sparkles, Sliders, Monitor, Globe } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ProjectSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettings();
  const { userProfile } = useFile();

  const hasAccess = (featureKey: string) => {
      if (userProfile?.isAdmin) return true;
      if (!userProfile) return false;
      return userProfile.features?.includes(featureKey);
  };

  const FEATURES_LIST = [
      { label: "Mobile Responsive", key: "enableMobileResponsive", icon: <Smartphone className="w-4 h-4 text-pink-400" />, featureKey: "enableResponsive" },
      { label: "Desktop Responsive", key: "enableDesktopResponsive", icon: <Monitor className="w-4 h-4 text-cyan-400" />, featureKey: "enableResponsive" },
      { label: "Tailwind CSS", key: "enableTailwind", icon: <Palette className="w-4 h-4 text-blue-400" />, featureKey: "enableTailwind", isFree: true },
      { label: "Bootstrap 5", key: "enableBootstrap", icon: <Layout className="w-4 h-4 text-purple-400" />, featureKey: "enableBootstrap", isFree: true },
      { label: "Generate Admin Panel", key: "enableAdminPanel", icon: <Shield className="w-4 h-4 text-red-400" />, featureKey: "enableAdminPanel" },
      { label: "SEO Optimization", key: "enableSEO", icon: <Search className="w-4 h-4 text-green-400" />, featureKey: "enableSEO" },
      { label: "PWA Support", key: "enablePWA", icon: <Globe className="w-4 h-4 text-yellow-400" />, featureKey: "enablePWA" },
      { label: "Firebase Rules", key: "enableFirebaseRules", icon: <Database className="w-4 h-4 text-indigo-400" />, featureKey: "enableFirebaseRules" },
  ];

  const sortedFeatures = useMemo(() => {
      return [...FEATURES_LIST].sort((a, b) => {
          const aAccess = a.isFree || hasAccess(a.featureKey);
          const bAccess = b.isFree || hasAccess(b.featureKey);
          return Number(bAccess) - Number(aAccess);
      });
  }, [userProfile]);

  if (!isOpen) return null;

  const renderToggle = (item: any) => {
      const isLocked = !item.isFree && !hasAccess(item.featureKey);
      
      return (
        <label key={item.key} className={`flex items-center gap-3 p-3 bg-[#1A1D24] border border-white/5 rounded-lg transition-all ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-blue-500/30'}`}>
            <input 
                type="checkbox"
                disabled={isLocked}
                checked={!!settings[item.key as keyof typeof settings]}
                onChange={(e) => updateSettings({ [item.key]: e.target.checked })}
                className={`w-4 h-4 rounded border-gray-600 bg-ide-bg focus:ring-0 ${isLocked ? 'text-gray-500' : 'text-blue-500'}`}
            />
            <div className="flex flex-col flex-1">
                <span className="text-sm text-gray-300 transition-colors flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">{item.icon} {item.label}</div>
                    {isLocked && <Lock className="w-3 h-3 text-yellow-500" />}
                </span>
            </div>
        </label>
      );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#252526] w-full max-w-md rounded-xl shadow-2xl border border-[#333] animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-4 border-b border-[#333] shrink-0 bg-[#1E2028]">
          <h2 className="text-lg font-semibold text-white">Project Configuration</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-[#16181D]">
            <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Sliders className="w-3 h-3" /> Advanced AI Settings
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {sortedFeatures.map(item => renderToggle(item))}
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                     <div>
                         <label className="text-[11px] font-bold text-gray-500 block mb-1.5 flex items-center gap-2">
                            <Image className="w-3 h-3" /> ImgBB API Key {(!hasAccess('enableImgBB') && !userProfile?.isAdmin) && <Lock className="w-3 h-3 text-yellow-500" />}
                         </label>
                         <input
                            type="text"
                            disabled={!hasAccess('enableImgBB')}
                            value={settings.imgBBApiKey || ''}
                            onChange={(e) => updateSettings({ imgBBApiKey: e.target.value })}
                            placeholder="Enter ImgBB Key for Image Uploads"
                            className={`w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500 ${!hasAccess('enableImgBB') && 'opacity-50 cursor-not-allowed'}`}
                        />
                     </div>

                     <div>
                        <label className="text-[11px] font-bold text-gray-500 block mb-1.5 flex items-center gap-2">
                            <Database className="w-3 h-3" /> Firebase SDK Config
                        </label>
                        <textarea
                            value={settings.firebaseConfig}
                            onChange={(e) => updateSettings({ firebaseConfig: e.target.value })}
                            placeholder="// Paste firebaseConfig object here..."
                            className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-gray-300 font-mono focus:outline-none focus:border-blue-500 resize-none"
                        />
                    </div>
                </div>
            </div>

        </div>
        
        <div className="p-4 border-t border-[#333] flex justify-end shrink-0 bg-[#1E2028]">
            <button 
                onClick={onClose}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-900/20 transition-colors"
            >
                <Save className="w-4 h-4" /> Save Configuration
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectSettingsModal;