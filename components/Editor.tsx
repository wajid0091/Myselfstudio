import React, { useEffect, useState, useRef } from 'react';
import Editor, { OnMount } from "@monaco-editor/react";
import { useFile } from '../context/FileContext';
import { Copy, Clipboard, Trash2, CheckSquare, PanelLeft, Code2 } from 'lucide-react';

interface EditorWindowProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

const EditorWindow: React.FC<EditorWindowProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { selectedFile, updateFileContent } = useFile();
  const [content, setContent] = useState('');
  const [isAllSelected, setIsAllSelected] = useState(false);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  useEffect(() => {
    if (selectedFile) {
      setContent(selectedFile.content);
      setIsAllSelected(false);
    }
  }, [selectedFile, selectedFile?.content]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && selectedFile) {
      setContent(value);
      updateFileContent(selectedFile.name, value);
      setIsAllSelected(false);
    }
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define Custom Theme for "Sky Blue Curtain" Selection
    monaco.editor.defineTheme('wai-sky-blue', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
            'editor.background': '#1e1e1e',
            'editor.selectionBackground': '#38bdf860', 
            'editor.inactiveSelectionBackground': '#38bdf830',
            'editor.lineHighlightBackground': '#38bdf810',
        }
    });

    monaco.editor.setTheme('wai-sky-blue');
    
    editor.onDidChangeCursorSelection((e) => {
        const selection = editor.getSelection();
        const model = editor.getModel();
        if (selection && model) {
            const range = model.getFullModelRange();
            if (
                selection.startLineNumber === range.startLineNumber &&
                selection.startColumn === range.startColumn &&
                selection.endLineNumber === range.endLineNumber &&
                selection.endColumn === range.endColumn
            ) {
                setIsAllSelected(true);
            } else {
                setIsAllSelected(false);
            }
        }
    });
  };

  const copyToClipboard = () => {
    if (editorRef.current) {
      const value = editorRef.current.getValue();
      navigator.clipboard.writeText(value);
    }
  };

  const pasteFromClipboard = async () => {
    if (editorRef.current && monacoRef.current) {
      try {
        const text = await navigator.clipboard.readText();
        const selection = editorRef.current.getSelection();
        if (!selection) return;

        const range = new monacoRef.current.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
        );
        editorRef.current.executeEdits('toolbar', [{
            range: range,
            text: text,
            forceMoveMarkers: true
        }]);
      } catch (err) {
        console.error('Failed to read clipboard contents: ', err);
      }
    }
  };

  const selectAll = () => {
    if (editorRef.current) {
      editorRef.current.setSelection(editorRef.current.getModel().getFullModelRange());
      setIsAllSelected(true);
      editorRef.current.focus();
    }
  };

  const clearContent = () => {
    if (editorRef.current && selectedFile) {
        const confirmClear = window.confirm(`Are you sure you want to clear ALL content from ${selectedFile.name}?`);
        if (confirmClear) {
            handleEditorChange('');
            // Ensure editor focuses back
            editorRef.current.focus();
        }
    }
  };

  if (!selectedFile) {
    return (
      <div className="h-full flex flex-col w-full bg-[#1e1e1e]">
        {onToggleSidebar && (
            <div className="h-10 bg-[#252526] border-b border-[#333] flex items-center px-4">
                <button 
                    onClick={onToggleSidebar}
                    className={`p-1.5 rounded transition-colors mr-2 ${isSidebarOpen ? 'text-blue-500 bg-blue-500/10' : 'text-gray-400 hover:text-white'}`}
                    title="Toggle File Explorer"
                >
                    <PanelLeft className="w-5 h-5" />
                </button>
            </div>
        )}
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center">
                 <Code2 className="w-10 h-10 opacity-50" />
            </div>
            <p className="text-lg font-medium">Select a file to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#1e1e1e] overflow-hidden flex flex-col">
        {/* File Toolbar */}
        <div className="h-12 bg-[#252526] flex items-center justify-between px-4 border-b border-[#333] shrink-0">
            <div className="flex items-center gap-4">
                {onToggleSidebar && (
                    <button 
                        onClick={onToggleSidebar}
                        className={`p-1.5 rounded-md transition-all ${isSidebarOpen ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                        title="Toggle File Explorer"
                    >
                        <PanelLeft className="w-5 h-5" />
                    </button>
                )}
                <div className="flex flex-col">
                     <span className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                        {selectedFile.name}
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">{selectedFile.language}</span>
                </div>
                {isAllSelected && <span className="text-[10px] text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20 shadow-sm shadow-sky-500/20">ALL SELECTED</span>}
            </div>
            
            <div className="flex items-center gap-2 bg-[#1e1e1e] p-1 rounded-lg border border-[#333]">
                <button 
                  onClick={selectAll} 
                  className={`p-1.5 rounded-md transition-all ${isAllSelected ? 'text-sky-400 bg-sky-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`} 
                  title="Select All"
                >
                    <CheckSquare className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-[#333]"></div>
                <button onClick={copyToClipboard} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-all" title="Copy">
                    <Copy className="w-4 h-4" />
                </button>
                <button onClick={pasteFromClipboard} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-all" title="Paste">
                    <Clipboard className="w-4 h-4" />
                </button>
                 <div className="w-px h-4 bg-[#333]"></div>
                <button onClick={clearContent} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all" title="Clear File Content">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 relative">
            <Editor
                height="100%"
                language={selectedFile.language === 'javascript' ? 'javascript' : selectedFile.language === 'css' ? 'css' : selectedFile.language === 'html' ? 'html' : 'json'}
                value={content}
                theme="wai-sky-blue"
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: 'on', // FIXED: Prevents horizontal scrolling issues
                    padding: { top: 16, bottom: 16 },
                    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                    cursorBlinking: 'smooth',
                    smoothScrolling: true,
                    contextmenu: true,
                    // Optimization for large files
                    renderValidationDecorations: 'on',
                }}
            />
        </div>
    </div>
  );
};

export default EditorWindow;