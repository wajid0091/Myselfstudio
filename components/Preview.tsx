import React, { useEffect, useRef, useState } from 'react';
import { useFile } from '../context/FileContext';
import { useSettings } from '../context/SettingsContext';
import { RefreshCw, ArrowLeft } from 'lucide-react';

interface PreviewProps {
  className?: string;
  onClose?: () => void;
  isFullScreen?: boolean;
}

const Preview: React.FC<PreviewProps> = ({ className = "", onClose, isFullScreen = false }) => {
  const { files } = useFile();
  const { settings } = useSettings();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0); // Force re-render

  const generateDoc = () => {
    const htmlFile = files.find(f => f.name.endsWith('.html'));
    if (!htmlFile) return '<div style="color:white; font-family:sans-serif; padding:20px;">No index.html found</div>';

    let html = htmlFile.content;
    
    // Inject CSS
    const cssFiles = files.filter(f => f.name.endsWith('.css'));
    const styles = cssFiles.map(f => `<style>${f.content}</style>`).join('\n');
    
    // Inject JS
    const jsFiles = files.filter(f => f.name.endsWith('.js'));
    const scripts = jsFiles.map(f => `<script>${f.content}</script>`).join('\n');

    // Error Suppression Script for Iframe
    const suppressionScript = `
    <script>
      (function() {
        const resizeObserverLoopErr = /ResizeObserver loop completed with undelivered notifications|ResizeObserver loop limit exceeded/;
        const originalError = console.error;
        console.error = function(...args) {
          if (args.some(arg => {
            const msg = arg instanceof Error ? arg.message : arg;
            return typeof msg === 'string' && resizeObserverLoopErr.test(msg);
          })) { return; }
          originalError.apply(console, args);
        };
        window.addEventListener('error', (e) => {
          if (resizeObserverLoopErr.test(e.message)) {
            e.stopImmediatePropagation();
            e.preventDefault();
          }
        });
      })();
    </script>
    `;

    // Inject external libraries (Tailwind/Bootstrap)
    let headExtras = '';
    if (settings.enableTailwind) {
      headExtras += '<script src="https://cdn.tailwindcss.com"></script>';
    }
    if (settings.enableBootstrap) {
      headExtras += '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">';
      headExtras += '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>';
    }

    // Inject content into HTML
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${suppressionScript}\n${headExtras}\n${styles}\n</head>`);
    } else {
      html = `<head>${suppressionScript}\n${headExtras}\n${styles}</head>${html}`;
    }

    if (html.includes('</body>')) {
      html = html.replace('</body>', `${scripts}\n</body>`);
    } else {
      html += `${scripts}`;
    }

    return html;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.srcdoc = generateDoc();
      }
    }, 500); // Debounce updates

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, settings]);

  const reload = () => {
    setKey(prev => prev + 1);
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Browser-like Header */}
      <div className="h-10 bg-[#eef1f5] flex items-center justify-between px-4 border-b border-gray-300 shrink-0">
        <div className="flex items-center gap-4">
            {/* Window Controls (Mac Style) */}
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E]"></div>
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]"></div>
                <div className="w-3 h-3 rounded-full bg-[#28C840] border border-[#1AAB29]"></div>
            </div>

            {/* Back Button (Only visible if full screen / closable) */}
            {isFullScreen && onClose && (
                <button 
                    onClick={onClose}
                    className="flex items-center gap-1.5 text-gray-600 hover:text-black px-2 py-1 rounded-md hover:bg-gray-200 transition-colors text-xs font-bold"
                    title="Go Back"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                </button>
            )}
        </div>

        {/* Address Bar Simulation (Visual only) */}
        <div className="flex-1 mx-4 max-w-2xl">
             <div className="bg-white border border-gray-300 rounded-md px-3 py-1 flex items-center justify-center text-xs text-gray-500">
                <span className="opacity-50">localhost:3000/preview</span>
             </div>
        </div>

        <button onClick={reload} className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-200 rounded-md transition-colors">
            <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 relative bg-white w-full">
        <iframe
          key={key}
          ref={iframeRef}
          title="Preview"
          sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
          className="absolute inset-0 w-full h-full border-none"
        />
      </div>
    </div>
  );
};

export default Preview;