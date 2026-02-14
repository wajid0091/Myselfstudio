
export interface File {
  name: string;
  content: string;
  language: string;
}

export interface Project {
  id: string;
  name: string;
  authorId: string;
  files: File[];
  messages: Message[]; 
  lastModified: number;
  isPublic?: boolean; 
  likes?: number;
  tags?: string[];
  firebaseConfig?: string; // Per-project Firebase Config
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  company?: string;
  country?: string;
  phone?: string;
  plan: string;
  planExpiry?: number;
  credits: number;
  sourceCodeCredits: number;
  projectsPublished: number;
  lastLoginDate: string; 
  avatar?: string;
  projectsCreated: number;
  isAdmin?: boolean;
  isBanned?: boolean;
  features?: string[];
  referredBy?: string | null;
}

export interface GeneratedFile {
  name: string;
  content: string;
  language: string;
}

export interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  generatedFiles?: GeneratedFile[]; 
}

// New Model Interface
export interface AIModel {
    id: string;
    name: string;
    provider: 'gemini' | 'openrouter';
    modelId: string; // The actual string sent to API (e.g. "gemini-2.0-flash" or "anthropic/claude-3")
    apiKey?: string; // Optional: Only for user custom keys
    isCustom?: boolean; // True if added by user
}

export interface Settings {
  enableTailwind: boolean;
  enableBootstrap: boolean;
  enableAdminPanel: boolean;
  enableSEO: boolean;
  enablePWA: boolean;
  enableFirebaseRules: boolean;
  enableCustomCursor: boolean;
  enableMobileResponsive: boolean;
  enableDesktopResponsive: boolean;
  customDomain: string;
  firebaseConfig: string;
  
  // Model Management
  selectedModelId: string; // Just the ID reference
  userGeminiModels: AIModel[]; // User added keys
  imgBBApiKey?: string;
}

export interface Suggestion {
    id: string;
    label: string;
    prompt: string;
    order: number;
}

export interface FileContextType {
  projects: Project[];
  communityProjects: CommunityProject[]; 
  userProfile: UserProfile | null;              
  activeProjectId: string | null;
  files: File[];
  messages: Message[]; 
  selectedFile: File | null;
  activeProject: Project | undefined; // Exposed for direct access
  loading: boolean;
  createProject: (name: string) => Promise<string>; 
  openProject: (id: string) => void;
  closeProject: () => void;
  deleteProject: (id: string) => Promise<void>;
  saveProject: (project: Project) => Promise<void>; // Exposed for settings updates
  renameProject: (projectId: string, newName: string) => Promise<void>;
  renamePublicProject: (publicProjectId: string, newName: string) => Promise<void>;
  publishProject: (projectId: string, publicName: string, description: string, tags: string[]) => Promise<boolean>; 
  unpublishProject: (projectId: string) => Promise<void>; 
  cloneCommunityProject: (project: CommunityProject) => Promise<'SUCCESS' | 'REQUIRE_LOGIN' | 'NO_CREDITS'>; 
  toggleLike: (projectId: string) => void; 
  deductCredit: () => Promise<boolean>; 
  selectFile: (fileName: string) => void;
  updateFileContent: (fileName: string, content: string) => void;
  addFile: (fileName: string, content?: string) => void;
  importFile: (file: globalThis.File) => void;
  deleteFile: (fileName: string) => void;
  renameFile: (oldName: string, newName: string) => void;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
}

export interface SettingsContextType {
  settings: Settings;
  adminModels: AIModel[]; // Models loaded from Firebase (OpenRouter)
  updateSettings: (newSettings: Partial<Settings>) => void;
  addUserModel: (name: string, apiKey: string) => void;
  removeUserModel: (id: string) => void;
}

export interface AuthContextType {
  user: any;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkDailyCredits: () => Promise<void>; 
}

export interface CommunityProject {
  id: string;
  originalProjectId: string;
  name: string;
  description: string;
  authorName: string;
  authorId: string;
  likes: number;
  likedBy: Record<string, boolean>;
  files: File[];
  timestamp: number;
  tags: string[];
}

export interface PaymentMethod {
  id: string;
  name: string;
  title: string;
  details: string;
  isEnabled: boolean;
  region: 'PK' | 'INTL';
}

export interface PlanConfig {
  name: string;
  price: number;
  duration: number;
  dailyCredits: number;
  copyCredits: number;
  features: string[];
  allowedModels?: string[]; // IDs of adminModels allowed in this plan
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  plan: string;
  amount: string;
  method: string;
  transactionId: string;
  screenshot: string;
  status: string;
  timestamp: number;
}

export interface CreatorApplication {
  id: string;
  userId: string;
  name: string;
  email: string;
  platform: string;
  followers: string;
  experience: string;
  country: string;
  profileLink: string;
  status: 'pending' | 'approved' | 'rejected';
}
