import React, { useEffect, useRef, useState } from 'react';
import { useFile } from '../context/FileContext';
import { useSettings } from '../context/SettingsContext';
import { RefreshCw, X, Maximize2, Minimize2 } from 'lucide-react';

interface PreviewProps {
  className?: string;
  onClose?: () => void;
  isFullScreen?: boolean;
}

const Preview: React.FC<PreviewProps> = ({ className = "", onClose, isFullScreen = false }) => {
  const { files, selectedFile } = useFile();
  const { settings } = useSettings();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0); // Force re-render
  const [currentPreviewFile, setCurrentPreviewFile] = useState<string>('index.html');

  useEffect(() => {
      if (selectedFile && selectedFile.name.endsWith('.html')) {
          setCurrentPreviewFile(selectedFile.name);
      } else if (!currentPreviewFile && files.some(f => f.name === 'index.html')) {
          setCurrentPreviewFile('index.html');
      }
  }, [selectedFile, files]);

  const generateDoc = () => {
    const htmlFile = files.find(f => f.name === currentPreviewFile) || files.find(f => f.name.endsWith('.html'));
    
    if (!htmlFile) return '<div style="color:#666; font-family:sans-serif; padding:40px; text-align:center;">No HTML file found. Create an index.html file.</div>';

    let html = htmlFile.content;
    
    // Inject CSS
    const cssFiles = files.filter(f => f.name.endsWith('.css'));
    const styles = cssFiles.map(f => `<style>${f.content}</style>`).join('\n');
    
    // Inject JS
    const jsFiles = files.filter(f => f.name.endsWith('.js'));
    const scripts = jsFiles.map(f => `<script>${f.content}</script>`).join('\n');

    // INJECT IMAGES/MEDIA
    files.forEach(file => {
        if (file.language === 'image' || file.language === 'video') {
             const regex = new RegExp(`src=["'](\.?\/?${file.name})["']`, 'g');
             html = html.replace(regex, `src="${file.content}"`);
             const cssRegex = new RegExp(`url\(["']?(\.?\/?${file.name})["']?\)`, 'g');
             html = html.replace(cssRegex, `url(${file.content})`);
        }
    });

    // Custom Cursor Script (Simulates PC mouse on Touch)
    let cursorScript = '';
    if (settings.enableCustomCursor) {
        cursorScript = `
        <style>
            * { cursor: none !important; }
            #fake-cursor {
                position: fixed;
                top: 0;
                left: 0;
                width: 20px;
                height: 20px;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='black' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z'/%3E%3Cpath d='M13 13l6 6'/%3E%3C/svg%3E");
                background-size: contain;
                background-repeat: no-repeat;
                pointer-events: none;
                z-index: 99999;
                transition: transform 0.05s linear;
            }
        </style>
        <script>
            (function() {
                const cursor = document.createElement('div');
                cursor.id = 'fake-cursor';
                document.body.appendChild(cursor);
                
                const updateCursor = (e) => {
                    const x = e.clientX || (e.touches ? e.touches[0].clientX : 0);
                    const y = e.clientY || (e.touches ? e.touches[0].clientY : 0);
                    cursor.style.transform = \`translate(\${x}px, \${y}px)\`;
                };

                window.addEventListener('mousemove', updateCursor);
                window.addEventListener('touchmove', updateCursor, {passive: true});
                window.addEventListener('touchstart', updateCursor, {passive: true});
                window.addEventListener('click', (e) => {
                    updateCursor(e);
                    cursor.style.transform += ' scale(0.8)';
                    setTimeout(() => cursor.style.transform = cursor.style.transform.replace(' scale(0.8)', ''), 100);
                });
            })();
        </script>
        `;
    }

    // Error Suppression
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
      })();
    </script>
    `;

    // Inject Frameworks
    let headExtras = '';
    if (settings.enableTailwind) {
      headExtras += '<script src="https://cdn.tailwindcss.com"></script>';
    }
    if (settings.enableBootstrap) {
      headExtras += '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">';
      headExtras += '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>';
    }

    // Assemble
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${suppressionScript}\n${headExtras}\n${styles}\n</head>`);
    } else {
      html = `<head>${suppressionScript}\n${headExtras}\n${styles}</head>${html}`;
    }

    if (html.includes('</body>')) {
      html = html.replace('</body>', `${cursorScript}\n${scripts}\n</body>`);
    } else {
      html += `${cursorScript}\n${scripts}`;
    }

    return html;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.srcdoc = generateDoc();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [files, settings, currentPreviewFile]);

  const reload = () => {
    setKey(prev => prev + 1);
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Browser-like Header (LuxeMarket Style) */}
      <div className="h-12 bg-white flex items-center justify-between px-5 border-b border-gray-100 shadow-sm shrink-0 z-10">
        
        {/* Mac-style Window Controls */}
        <div className="flex items-center gap-2 w-20">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57] shadow-sm"></div>
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-sm"></div>
            <div className="w-3 h-3 rounded-full bg-[#28C840] shadow-sm"></div>
        </div>

        {/* Address/Title */}
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <span className="text-xs font-semibold text-gray-500 tracking-wide font-mono">Running: {currentPreviewFile}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 w-20 justify-end">
            <button onClick={reload} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all" title="Reload">
                <RefreshCw className="w-4 h-4" />
            </button>
            
            {onClose && (
                <button 
                    onClick={onClose}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Close Preview"
                >
                    <X className="w-5 h-5" />
                </button>
            )}
        </div>
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