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

  // Sync local state when selected file changes or file content updates from AI
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
    
    // Listen for selection changes
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
      editorRef.current.trigger('source', 'selectAll', null);
      setIsAllSelected(true);
    }
  };

  const clearContent = () => {
    if (editorRef.current && selectedFile) {
        const confirmClear = window.confirm("Are you sure you want to clear this file?");
        if (confirmClear) {
            handleEditorChange('');
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
                {isAllSelected && <span className="text-[10px] text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">ALL SELECTED</span>}
            </div>
            
            <div className="flex items-center gap-2 bg-[#1e1e1e] p-1 rounded-lg border border-[#333]">
                <button 
                  onClick={selectAll} 
                  className={`p-1.5 rounded-md transition-all ${isAllSelected ? 'text-green-400 bg-green-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`} 
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
                <button onClick={clearContent} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all" title="Clear File">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>

      <Editor
        height="100%"
        theme="vs-dark"
        path={selectedFile.name}
        language={selectedFile.language}
        value={content}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          fontLigatures: true,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          padding: { top: 20, bottom: 20 },
          lineHeight: 22,
          renderLineHighlight: 'all',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on'
        }}
      />
    </div>
  );
};

export default EditorWindow;