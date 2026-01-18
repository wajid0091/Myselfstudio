import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { X, Save } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettings();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-ide-panel w-full max-w-md rounded-lg shadow-2xl border border-ide-border">
        <div className="flex items-center justify-between p-4 border-b border-ide-border">
          <h2 className="text-lg font-semibold text-white">Project Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Frameworks */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">CSS Frameworks</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox"
                  checked={settings.enableTailwind}
                  onChange={(e) => updateSettings({ enableTailwind: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 bg-ide-bg text-blue-500 focus:ring-blue-500 focus:ring-offset-ide-panel"
                />
                <span className="text-gray-300 group-hover:text-white transition-colors">Enable Tailwind CSS</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox"
                  checked={settings.enableBootstrap}
                  onChange={(e) => updateSettings({ enableBootstrap: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 bg-ide-bg text-blue-500 focus:ring-blue-500 focus:ring-offset-ide-panel"
                />
                <span className="text-gray-300 group-hover:text-white transition-colors">Enable Bootstrap 5</span>
              </label>
            </div>
          </div>

          {/* Firebase */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Integrations</h3>
            <div className="space-y-2">
              <label className="block text-xs text-gray-500">Firebase SDK Configuration</label>
              <textarea
                value={settings.firebaseConfig}
                onChange={(e) => updateSettings({ firebaseConfig: e.target.value })}
                placeholder="// Paste firebaseConfig object or init code here..."
                className="w-full h-32 bg-ide-bg border border-ide-border rounded p-3 text-xs text-gray-300 font-mono focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-ide-border flex justify-end">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" /> Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
