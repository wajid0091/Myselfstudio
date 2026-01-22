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
    <title>New Project</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white flex flex-col items-center justify-center min-h-screen text-center">
    <h1 class="text-5xl font-bold text-blue-500 mb-4">Hello World</h1>
    <p class="text-xl text-gray-400">Welcome to MYSELF IDE</p>
</body>
</html>`
  },
  {
    name: 'style.css',
    language: 'css',
    content: `body { margin: 0; }`
  },
  {
    name: 'script.js',
    language: 'javascript',
    content: `console.log('Initialized');`
  },
  {
    name: '_redirects',
    language: 'plaintext',
    content: `/* /index.html 200`
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

  // --- FETCH PROJECTS ---
  useEffect(() => {
    if (!user) {
      // GUEST MODE: Load from LocalStorage
      try {
        const localProjects = localStorage.getItem('guest_projects');
        if (localProjects) setProjects(JSON.parse(localProjects));
        else setProjects([]);
      } catch(e) { setProjects([]) }
      setLoading(false);
      return;
    }

    // AUTH MODE: Load from Firebase
    setLoading(true);
    const projectsRef = ref(db, `users/${user.uid}/projects`);
    const unsubscribe = onValue(projectsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const projectList = Object.values(data) as Project[];
        // Merge with current state to avoid UI flicker if local state is ahead
        setProjects(prev => {
            // Simple sort by modification time
            return projectList.sort((a, b) => b.lastModified - a.lastModified);
        });
      } else {
        setProjects([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Sync Guest Projects to LocalStorage
  useEffect(() => {
      if (!user) {
          localStorage.setItem('guest_projects', JSON.stringify(projects));
      }
  }, [projects, user]);

  // --- FETCH COMMUNITY PROJECTS (Available to All) ---
  useEffect(() => {
    const commRef = ref(db, 'community_projects');
    const unsubscribe = onValue(commRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Map keys to IDs if not present
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

  // Derived state
  const activeProject = projects.find(p => p.id === activeProjectId);
  const files = activeProject?.files || [];
  const messages = activeProject?.messages || [];
  const selectedFile = files.find(f => f.name === selectedFileName) || null;

  // --- ACTIONS ---

  const saveProject = async (project: Project) => {
     // 1. Optimistic Update (Immediate UI Feedback)
     setProjects(prev => prev.map(p => p.id === project.id ? project : p));

     // 2. Persist to Database
     if (user) {
        await set(ref(db, `users/${user.uid}/projects/${project.id}`), project);
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
        // Optimistic update for creation is tricky with lists, but we can do it
        setProjects(prev => [newProject, ...prev]);
        await set(ref(db, `users/${user.uid}/projects/${newId}`), newProject);
        
        if (userProfile) {
            await update(ref(db, `users/${user.uid}/profile`), {
                projectsCreated: (userProfile.projectsCreated || 0) + 1
            });
        }
    } else {
        setProjects(prev => [newProject, ...prev]);
    }

    setActiveProjectId(newProject.id);
    setSelectedFileName('index.html');
    return 'SUCCESS';
  };

  // RENAME LOCAL PROJECT
  const renameProject = async (projectId: string, newName: string) => {
      const project = projects.find(p => p.id === projectId);
      if (project) {
          const updated = { ...project, name: newName, lastModified: Date.now() };
          await saveProject(updated);
      }
  };

  // RENAME PUBLIC PROJECT (Only Author)
  const renamePublicProject = async (publicProjectId: string, newName: string) => {
      if(!user) return;
      await update(ref(db, `community_projects/${publicProjectId}`), {
          name: newName
      });
  };

  const openProject = (id: string) => {
      setActiveProjectId(id);
      const project = projects.find(p => p.id === id);
      if (project && project.files.length > 0) {
          setSelectedFileName(project.files[0].name);
      }
  };

  const closeProject = () => {
      setActiveProjectId(null);
      setSelectedFileName(null);
  };

  // DELETE LOCAL ONLY
  const deleteProject = async (id: string) => {
      if (activeProjectId === id) closeProject();
      
      // Optimistic delete
      setProjects(prev => prev.filter(p => p.id !== id));

      if (user) {
          await remove(ref(db, `users/${user.uid}/projects/${id}`));
      }
  };

  // PUBLISH PROJECT
  const publishProject = async (projectId: string, publicName: string, description: string, tags: string[]): Promise<boolean> => {
      if (!user || !userProfile) return false;

      const project = projects.find(p => p.id === projectId);
      if (!project) return false;

      // 1. Mark Local as Public (But keep its local name)
      const updatedLocal = { ...project, isPublic: true };
      await saveProject(updatedLocal);

      // 2. Create Community Entry
      const existingPublic = communityProjects.find(cp => cp.originalProjectId === projectId && cp.authorId === user.uid);
      const publicId = existingPublic ? existingPublic.id : (push(child(ref(db), 'community_projects')).key || projectId);

      const communityProject: CommunityProject = {
          id: publicId,
          originalProjectId: project.id,
          name: publicName,
          description,
          authorName: userProfile.name,
          authorId: user.uid,
          likes: existingPublic ? existingPublic.likes : 0,
          likedBy: existingPublic?.likedBy || {}, 
          files: project.files,
          timestamp: Date.now(),
          tags
      };

      await set(ref(db, `community_projects/${publicId}`), communityProject);
      
      if (!existingPublic) {
          await update(ref(db, `users/${user.uid}/profile`), {
              projectsPublished: (userProfile.projectsPublished || 0) + 1
          });
      }

      return true;
  };

  const unpublishProject = async (publicProjectId: string) => {
      if (!user) return;
      await remove(ref(db, `community_projects/${publicProjectId}`));
      
      const publicProj = communityProjects.find(p => p.id === publicProjectId);
      if(publicProj) {
          const localProj = projects.find(p => p.id === publicProj.originalProjectId);
          if(localProj) {
               // Update local without isPublic flag
               const updated = { ...localProj, isPublic: false };
               await saveProject(updated);
          }
      }
  };

  const cloneCommunityProject = async (project: CommunityProject): Promise<'SUCCESS' | 'REQUIRE_LOGIN' | 'NO_CREDITS'> => {
      if (!user) return 'REQUIRE_LOGIN';
      
      if (!userProfile || userProfile.sourceCodeCredits <= 0) {
          if(!userProfile?.isAdmin) return 'NO_CREDITS';
      }

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

      // Optimistic Add
      setProjects(prev => [clonedProject, ...prev]);
      await set(ref(db, `users/${user.uid}/projects/${newId}`), clonedProject);
      
      if(!userProfile?.isAdmin) {
          await update(ref(db, `users/${user.uid}/profile`), {
              sourceCodeCredits: (userProfile.sourceCodeCredits || 0) - 1
          });
      }

      setActiveProjectId(newId);
      setSelectedFileName('index.html');
      return 'SUCCESS';
  };

  const toggleLike = async (publicProjectId: string) => {
      if (!user) return;
      const project = communityProjects.find(p => p.id === publicProjectId);
      if (!project) return;

      const isLiked = project.likedBy && project.likedBy[user.uid];
      const newLikes = isLiked ? (project.likes - 1) : (project.likes + 1);
      
      const updates: any = {};
      updates[`community_projects/${publicProjectId}/likes`] = newLikes;
      updates[`community_projects/${publicProjectId}/likedBy/${user.uid}`] = !isLiked;
      
      await update(ref(db), updates);
  };

  const deductCredit = async () => {
      if (user && userProfile && !userProfile.isAdmin) {
          await update(ref(db, `users/${user.uid}/profile`), {
              credits: Math.max(0, userProfile.credits - 1)
          });
          return true;
      }
      return false;
  };

  // --- FILE OPERATIONS ---
  const selectFile = (fileName: string) => setSelectedFileName(fileName);

  const updateFileContent = (fileName: string, content: string) => {
      if (!activeProject) return;
      
      // Ensure we are working with the latest active project state
      const updatedFiles = activeProject.files.map(f => 
          f.name === fileName ? { ...f, content } : f
      );
      
      saveProject({ ...activeProject, files: updatedFiles, lastModified: Date.now() });
  };

  const addFile = (fileName: string, content: string = '') => {
      if (!activeProject) return;
      if (activeProject.files.some(f => f.name === fileName)) return;

      let language = 'plaintext';
      if (fileName.endsWith('.html')) language = 'html';
      else if (fileName.endsWith('.css')) language = 'css';
      else if (fileName.endsWith('.js')) language = 'javascript';
      else if (fileName.endsWith('.json')) language = 'json';
      // Basic detection for others
      else if (fileName.match(/\.(jpg|jpeg|png|gif|svg)$/)) language = 'image';

      const newFiles = [...activeProject.files, { name: fileName, content, language }];
      saveProject({ ...activeProject, files: newFiles, lastModified: Date.now() });
      setSelectedFileName(fileName);
  };

  const importFile = async (file: globalThis.File) => {
      if (!activeProject) return;
      
      let content = '';
      let language = 'plaintext';

      if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
              const result = e.target?.result as string;
              // Add file with detected language
              const newFiles = [...activeProject.files, { name: file.name, content: result, language: 'image' }];
              saveProject({...activeProject, files: newFiles, lastModified: Date.now()});
          };
          reader.readAsDataURL(file);
          return;
      }

      content = await file.text();
      addFile(file.name, content);
  };

  const deleteFile = (fileName: string) => {
      if (!activeProject) return;
      const newFiles = activeProject.files.filter(f => f.name !== fileName);
      saveProject({ ...activeProject, files: newFiles, lastModified: Date.now() });
      if (selectedFileName === fileName) setSelectedFileName(newFiles[0]?.name || null);
  };

  const renameFile = (oldName: string, newName: string) => {
      if (!activeProject) return;
      const newFiles = activeProject.files.map(f => f.name === oldName ? { ...f, name: newName } : f);
      saveProject({ ...activeProject, files: newFiles, lastModified: Date.now() });
      if (selectedFileName === oldName) setSelectedFileName(newName);
  };

  const addMessage = (message: Message) => {
      if (!activeProject) return;
      const newMessages = [...(activeProject.messages || []), message];
      saveProject({ ...activeProject, messages: newMessages });
  };

  const clearMessages = () => {
      if (!activeProject) return;
      saveProject({ ...activeProject, messages: [] });
  };

  return (
    <FileContext.Provider value={{
      projects,
      communityProjects,
      userProfile,
      activeProjectId,
      files,
      messages,
      selectedFile,
      loading,
      createProject,
      openProject,
      closeProject,
      deleteProject,
      renameProject,
      renamePublicProject,
      publishProject,
      unpublishProject,
      cloneCommunityProject,
      toggleLike,
      deductCredit,
      selectFile,
      updateFileContent,
      addFile,
      importFile,
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