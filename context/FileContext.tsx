
import React, { createContext, useContext, useState, useEffect } from 'react';
import { File, Project, FileContextType, Message, CommunityProject } from '../types';
import { useAuth } from './AuthContext';
import { db } from '../services/firebase';
import { ref, onValue, set, push, update, child, remove, get } from 'firebase/database';

const defaultTemplate: File[] = [
  {
    name: 'index.html',
    language: 'html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WAI Project</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0F1117] text-white flex flex-col items-center justify-center min-h-screen text-center p-6">
    <div class="max-w-md bg-[#1A1D24] p-10 rounded-[3rem] border border-white/5 shadow-2xl">
        <h1 class="text-6xl font-black text-blue-500 mb-4 tracking-tighter italic">HELO WORLD</h1>
        <div class="h-1 w-20 bg-blue-500 mx-auto mb-6 rounded-full"></div>
        <p class="text-xl text-gray-400 font-bold uppercase tracking-widest opacity-80">Welcome to the Wajid Ali IDE</p>
    </div>
</body>
</html>`
  },
  {
    name: 'style.css',
    language: 'css',
    content: `body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #0F1117; }`
  },
  {
    name: 'script.js',
    language: 'javascript',
    content: `console.log('WAI Assistant Initialized');`
  }
];

const FileContext = createContext<FileContextType | undefined>(undefined);

export const FileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile } = useAuth();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [communityProjects, setCommunityProjects] = useState<CommunityProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      try {
        const localProjects = localStorage.getItem('guest_projects');
        if (localProjects) setProjects(JSON.parse(localProjects));
        else setProjects([]);
      } catch(e) { setProjects([]) }
      setLoading(false);
      return;
    }

    setLoading(true);
    const projectsRef = ref(db, `users/${user.uid}/projects`);
    const unsubscribe = onValue(projectsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const projectList = Object.values(data) as Project[];
        setProjects(projectList.sort((a, b) => b.lastModified - a.lastModified));
      } else {
        setProjects([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const commRef = ref(db, 'community_projects');
    const unsubscribe = onValue(commRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([key, val]: [string, any]) => ({
            ...val,
            id: key 
        })) as CommunityProject[];
        setCommunityProjects(list.sort((a, b) => b.timestamp - a.timestamp));
      } else {
        setCommunityProjects([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const files = activeProject?.files || [];
  const messages = activeProject?.messages || [];
  const selectedFile = files.find(f => f.name === selectedFileName) || null;

  const saveProject = async (project: Project) => {
     setProjects(prev => prev.map(p => p.id === project.id ? project : p));
     if (user) {
        await set(ref(db, `users/${user.uid}/projects/${project.id}`), project);
     } else {
        localStorage.setItem('guest_projects', JSON.stringify(projects.map(p => p.id === project.id ? project : p)));
     }
  };

  const createProject = async (name: string): Promise<string> => {
    const newId = user ? (push(child(ref(db), 'posts')).key || crypto.randomUUID()) : crypto.randomUUID();
    const newProject: Project = {
      id: newId,
      name,
      authorId: user ? user.uid : 'guest',
      files: [...defaultTemplate],
      messages: [],
      lastModified: Date.now(),
      isPublic: false,
      likes: 0
    };

    if (user) {
        setProjects(prev => [newProject, ...prev]);
        await set(ref(db, `users/${user.uid}/projects/${newId}`), newProject);
    } else {
        const updated = [newProject, ...projects];
        setProjects(updated);
        localStorage.setItem('guest_projects', JSON.stringify(updated));
    }

    setActiveProjectId(newProject.id);
    setSelectedFileName('index.html');
    return 'SUCCESS';
  };

  const publishProject = async (projectId: string, publicName: string, description: string, tags: string[]): Promise<boolean> => {
      if (!user || !userProfile) return false;
      const project = projects.find(p => p.id === projectId);
      if (!project) return false;
      
      const updatedLocal = { ...project, isPublic: true };
      await saveProject(updatedLocal);
      
      const publicId = (push(child(ref(db), 'community_projects')).key || projectId);
      const communityProject: CommunityProject = {
          id: publicId,
          originalProjectId: project.id,
          name: publicName,
          description,
          authorName: userProfile.name,
          authorId: user.uid,
          likes: 0,
          likedBy: {}, 
          files: project.files,
          timestamp: Date.now(),
          tags
      };
      await set(ref(db, `community_projects/${publicId}`), communityProject);

      const newPublishCount = (userProfile.projectsPublished || 0) + 1;
      let newUnlockCredits = userProfile.sourceCodeCredits || 0;
      
      if (newPublishCount % 5 === 0) {
          newUnlockCredits += 1;
      }

      await update(ref(db, `users/${user.uid}/profile`), {
          projectsPublished: newPublishCount,
          sourceCodeCredits: newUnlockCredits
      });

      return true;
  };

  const unpublishProject = async (projectId: string) => {
    if (!user) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    // 1. Find the community entry
    const commProj = communityProjects.find(cp => cp.originalProjectId === projectId);
    if (commProj) {
        await remove(ref(db, `community_projects/${commProj.id}`));
    }

    // 2. Update local status
    const updatedLocal = { ...project, isPublic: false };
    await saveProject(updatedLocal);
  };

  const cloneCommunityProject = async (project: CommunityProject): Promise<'SUCCESS' | 'REQUIRE_LOGIN' | 'NO_CREDITS'> => {
      if (!user || !userProfile) return 'REQUIRE_LOGIN';
      if (userProfile.sourceCodeCredits < 1) return 'NO_CREDITS';

      const newId = push(child(ref(db), 'posts')).key || crypto.randomUUID();
      const clonedProject: Project = {
          id: newId,
          name: `${project.name} (Clone)`, 
          authorId: user.uid,
          files: project.files,
          messages: [],
          lastModified: Date.now(),
          isPublic: false,
          likes: 0
      };

      setProjects(prev => [clonedProject, ...prev]);
      await set(ref(db, `users/${user.uid}/projects/${newId}`), clonedProject);
      await update(ref(db, `users/${user.uid}/profile`), { sourceCodeCredits: userProfile.sourceCodeCredits - 1 });

      setActiveProjectId(newId);
      setSelectedFileName('index.html');
      return 'SUCCESS';
  };

  const deductCredit = async () => true;

  const selectFile = (fileName: string) => setSelectedFileName(fileName);

  const deleteFile = (fileName: string) => {
      if (!activeProject) return;
      const newFiles = activeProject.files.filter(f => f.name !== fileName);
      saveProject({ ...activeProject, files: newFiles, lastModified: Date.now() });
      if (selectedFileName === fileName) setSelectedFileName(newFiles[0]?.name || null);
  };

  const addFile = (fileName: string, content: string = '') => {
      if (!activeProject) return;
      const existing = activeProject.files.find(f => f.name === fileName);
      if (existing) {
          updateFileContent(fileName, content);
          return;
      }
      let language = 'plaintext';
      if (fileName.endsWith('.html')) language = 'html';
      else if (fileName.endsWith('.css')) language = 'css';
      else if (fileName.endsWith('.js')) language = 'javascript';
      else if (fileName.endsWith('.json')) language = 'json';
      else if (fileName.match(/\.(jpg|jpeg|png|gif|svg)$/i)) language = 'image';

      const newFiles = [...activeProject.files, { name: fileName, content, language }];
      saveProject({ ...activeProject, files: newFiles, lastModified: Date.now() });
      setSelectedFileName(fileName);
  };

  const updateFileContent = (fileName: string, content: string) => {
      if (!activeProject) return;
      const updatedFiles = activeProject.files.map(f => f.name === fileName ? { ...f, content } : f);
      saveProject({ ...activeProject, files: updatedFiles, lastModified: Date.now() });
  };

  const addMessage = (message: Message) => {
      if (!activeProject) return;
      const newMessages = [...(activeProject.messages || []), message];
      saveProject({ ...activeProject, messages: newMessages });
  };

  const deleteProject = async (id: string) => {
      if (activeProjectId === id) setActiveProjectId(null);
      setProjects(prev => prev.filter(x => x.id !== id));
      if (user) await remove(ref(db, `users/${user.uid}/projects/${id}`));
      else localStorage.setItem('guest_projects', JSON.stringify(projects.filter(x => x.id !== id)));
  };

  const openProject = (id: string) => {
      setActiveProjectId(id);
      const p = projects.find(x => x.id === id);
      if (p && p.files.length > 0) setSelectedFileName(p.files[0].name);
  };

  const closeProject = () => setActiveProjectId(null);

  const renameProject = async (projectId: string, newName: string) => {
      const p = projects.find(x => x.id === projectId);
      if (p) await saveProject({ ...p, name: newName });
  };

  const renameFile = (old: string, next: string) => {
      if (!activeProject) return;
      const files = activeProject.files.map(f => f.name === old ? { ...f, name: next } : f);
      saveProject({ ...activeProject, files, lastModified: Date.now() });
      if (selectedFileName === old) setSelectedFileName(next);
  };

  const importFile = async (file: globalThis.File) => {
      const reader = new FileReader();
      reader.onload = (e) => addFile(file.name, e.target?.result as string);
      if (file.type.startsWith('image/')) reader.readAsDataURL(file);
      else reader.readAsText(file);
  };

  const toggleLike = async (id: string) => {
      if (!user) return;
      const p = communityProjects.find(x => x.id === id);
      if (!p) return;
      const isLiked = p.likedBy && p.likedBy[user.uid];
      const newLikes = isLiked ? (p.likes - 1) : (p.likes + 1);
      const updates: any = {};
      updates[`community_projects/${id}/likes`] = newLikes;
      updates[`community_projects/${id}/likedBy/${user.uid}`] = !isLiked;
      await update(ref(db), updates);
  };

  return (
    <FileContext.Provider value={{
      projects, communityProjects, userProfile, activeProjectId, files, messages, selectedFile, activeProject, loading,
      createProject, openProject, closeProject, deleteProject, renameProject, renamePublicProject: async () => {},
      publishProject, unpublishProject, cloneCommunityProject, toggleLike, deductCredit, saveProject,
      selectFile, updateFileContent, addFile, importFile, deleteFile, renameFile, addMessage, clearMessages: () => {}
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
