
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
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  company?: string;
  country?: string;
  phone?: string;
  plan: string; // Changed from fixed union type to string to support dynamic plans
  planExpiry?: number; // Timestamp when plan expires
  credits: number; // AI Credits
  sourceCodeCredits: number; // Credits to clone/copy other projects
  lastLoginDate: string; 
  avatar?: string;
  projectsCreated: number;
  projectsPublished: number;
  referralCode?: string;
  referredBy?: string;
  isAdmin?: boolean; // New field for Super Admin
  isCreator?: boolean; // New field for Approved Creators
  isBanned?: boolean; // New field to Block users
  features?: string[]; // Dynamic features allowed for this user (e.g. ['enableSEO', 'enablePWA'])
}

export interface CreatorApplication {
  id: string;
  userId: string;
  name: string;
  email: string;
  country: string;
  phone: string;
  experience: 'Junior' | 'Senior' | 'Expert';
  platform: 'TikTok' | 'YouTube' | 'Facebook' | 'Instagram' | 'LinkedIn';
  followers: string;
  profileLink: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  plan: string;
  amount: string;
  method: string; // EasyPaisa, USDT, etc.
  transactionId: string; // User entered ID
  screenshot?: string; // Base64
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}

export interface CommunityProject {
  id: string;
  originalProjectId: string;
  name: string; // This is the PUBLIC Name
  description: string;
  authorName: string;
  authorId: string;
  likes: number;
  likedBy: Record<string, boolean>;
  files: File[];
  timestamp: number;
  tags: string[];
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

export interface Settings {
  enableTailwind: boolean;
  enableBootstrap: boolean;
  enableAdminPanel: boolean;
  enableSEO: boolean;
  enablePWA: boolean;
  enableFirebaseRules: boolean;
  enableCustomCursor: boolean;
  // NEW FEATURES
  enableSecureMode: boolean; // Multi-page split
  enableMobileResponsive: boolean;
  enableDesktopResponsive: boolean;
  
  customDomain: string;
  firebaseConfig: string; 
  selectedModel: string;
  imgBBApiKey?: string; // New field for custom Image API Key
  googleApiKey?: string; // New field for User's Own Gemini API Key
}

// System Settings Types (Managed by Admin)
export interface PlanConfig {
    name: string;
    price: number;
    duration: number; // Duration in months (0 for lifetime/free)
    dailyCredits: number;
    copyCredits: number;
    features: string[]; // e.g. ['enableSEO', 'enablePWA']
}

export interface PaymentMethod {
    id: string;
    name: string; // e.g., EasyPaisa or USDT (TRC20)
    title: string; // e.g., Account Title or Network Name
    details: string; // e.g., Account Number or Wallet Address
    region: 'PK' | 'INTL'; // PK for local, INTL for Crypto/Global
    isEnabled: boolean;
}

export interface FileContextType {
  projects: Project[];
  communityProjects: CommunityProject[]; 
  userProfile: UserProfile | null;              
  activeProjectId: string | null;
  files: File[];
  messages: Message[]; 
  selectedFile: File | null;
  loading: boolean;
  
  createProject: (name: string) => Promise<string>; 
  openProject: (id: string) => void;
  closeProject: () => void;
  deleteProject: (id: string) => Promise<void>;
  publishProject: (projectId: string, publicName: string, description: string, tags: string[]) => Promise<boolean>; 
  unpublishProject: (originalProjectId: string) => Promise<void>; 
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
  updateSettings: (newSettings: Partial<Settings>) => void;
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
