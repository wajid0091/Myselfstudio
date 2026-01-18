import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { File, Project, FileContextType, Message } from '../types';

const defaultTemplate: File[] = [
  {
    name: 'index.html',
    language: 'html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>Hello World</h1>
    <p>Start building something amazing!</p>
  </div>
  <script src="script.js"></script>
</body>
</html>`
  },
  {
    name: 'style.css',
    language: 'css',
    content: `body {
  font-family: system-ui, -apple-system, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
  background-color: #f0f2f5;
  color: #333;
}

.container {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

h1 {
  color: #2563eb;
  margin-bottom: 0.5rem;
}`
  },
  {
    name: 'script.js',
    language: 'javascript',
    content: `console.log('Application started');`
  }
];

const FileContext = createContext<FileContextType | undefined>(undefined);

export const FileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('wajid_web_builder_projects');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load projects", e);
      return [];
    }
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  // Persist projects whenever they change
  useEffect(() => {
    localStorage.setItem('wajid_web_builder_projects', JSON.stringify(projects));
  }, [projects]);

  // Derived state for the active project
  const activeProject = projects.find(p => p.id === activeProjectId);
  const files = activeProject?.files || [];
  const messages = activeProject?.messages || [];
  const selectedFile = files.find(f => f.name === selectedFileName) || null;

  const createProject = (name: string) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      files: [...defaultTemplate],
      messages: [],
      lastModified: Date.now()
    };
    setProjects(prev => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    setSelectedFileName('index.html');
  };

  const openProject = (id: string) => {
    setActiveProjectId(id);
    const project = projects.find(p => p.id === id);
    if (project && project.files.length > 0) {
      // Keep previously selected file if possible, else default to first
      setSelectedFileName(project.files[0].name);
    }
  };

  const closeProject = () => {
    setActiveProjectId(null);
    setSelectedFileName(null);
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) {
      closeProject();
    }
  };

  const updateProjectFiles = (projectId: string, newFiles: File[]) => {
    setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
            return { ...p, files: newFiles, lastModified: Date.now() };
        }
        return p;
    }));
  };

  const selectFile = (fileName: string) => setSelectedFileName(fileName);

  const updateFileContent = (fileName: string, content: string) => {
    if (!activeProjectId) return;
    const newFiles = files.map(f => f.name === fileName ? { ...f, content } : f);
    updateProjectFiles(activeProjectId, newFiles);
  };

  const addFile = (fileName: string, content: string = '') => {
    if (!activeProjectId) return;
    if (files.some(f => f.name === fileName)) return; // Prevent duplicates
    
    let language = 'plaintext';
    if (fileName.endsWith('.html')) language = 'html';
    else if (fileName.endsWith('.css')) language = 'css';
    else if (fileName.endsWith('.js')) language = 'javascript';
    else if (fileName.endsWith('.json')) language = 'json';

    const newFile: File = { name: fileName, content, language };
    updateProjectFiles(activeProjectId, [...files, newFile]);
    setSelectedFileName(fileName);
  };

  const deleteFile = (fileName: string) => {
    if (!activeProjectId) return;
    const newFiles = files.filter(f => f.name !== fileName);
    updateProjectFiles(activeProjectId, newFiles);
    if (selectedFileName === fileName) {
        setSelectedFileName(newFiles[0]?.name || null);
    }
  };

  const renameFile = (oldName: string, newName: string) => {
    if (!activeProjectId) return;
    if (files.some(f => f.name === newName)) return;

    const newFiles = files.map(f => {
        if (f.name === oldName) return { ...f, name: newName };
        return f;
    });
    updateProjectFiles(activeProjectId, newFiles);
    if (selectedFileName === oldName) setSelectedFileName(newName);
  };

  // Improved addMessage using functional state update
  // This ensures that we append to the most current state of the project
  const addMessage = useCallback((message: Message) => {
    setProjects(currentProjects => {
      // Find the project in the current state snapshot
      return currentProjects.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            messages: [...(p.messages || []), message],
            lastModified: Date.now()
          };
        }
        return p;
      });
    });
  }, [activeProjectId]);

  const clearMessages = () => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
            return { ...p, messages: [], lastModified: Date.now() };
        }
        return p;
    }));
  };

  return (
    <FileContext.Provider value={{
      projects,
      activeProjectId,
      files,
      messages,
      selectedFile,
      createProject,
      openProject,
      closeProject,
      deleteProject,
      selectFile,
      updateFileContent,
      addFile,
      deleteFile,
      renameFile,
      addMessage,
      clearMessages
    }}>
      {children}
    </FileContext.Provider>
  );
};

export const useFile = () => {
  const context = useContext(FileContext);
  if (!context) throw new Error("useFile must be used within a FileProvider");
  return context;
};