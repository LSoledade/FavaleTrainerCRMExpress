import { Lead, Task, TaskComment, InsertLead } from '@shared/schema';

// Lead Store Types
export interface LeadState {
  selectedLead: Lead | null;
  isDialogOpen: boolean;
  selectedLeadIds: number[];
}

export interface LeadActions {
  setSelectedLead: (lead: Lead | null) => void;
  setIsDialogOpen: (isOpen: boolean) => void;
  setSelectedLeadIds: (ids: number[]) => void;
  createLead: (lead: InsertLead) => Promise<void>;
  updateLead: (id: number, lead: Partial<InsertLead>) => Promise<void>;
  deleteLead: (id: number) => Promise<void>;
  updateLeadsInBatch: (ids: number[], updates: Partial<InsertLead>) => Promise<number>;
  deleteLeadsInBatch: (ids: number[]) => Promise<number>;
}

export type LeadStore = LeadState & LeadActions;

// Task Store Types
export interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

export interface TaskActions {
  setTasks: (tasks: Task[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchTasks: () => Promise<void>;
  fetchTaskById: (id: number) => Promise<Task | undefined>;
  createTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "comments">) => Promise<Task>;
  updateTask: (id: number, task: Partial<Task>) => Promise<Task>;
  deleteTask: (id: number) => Promise<boolean>;
  addComment: (taskId: number, content: string) => Promise<TaskComment>;
  addTaskComment: (taskId: number, comment: Partial<TaskComment>) => Promise<TaskComment>;
  deleteTaskComment: (commentId: number) => Promise<boolean>;
}

export type TaskStore = TaskState & TaskActions;

// WhatsApp Store Types
export interface WhatsappConnectionStatus {
  status: 'connected' | 'disconnected' | 'checking' | 'error';
  message?: string;
  details?: {
    name?: string;
    phone?: string;
    quality?: string;
    [key: string]: any;
  };
}

export interface WhatsappState {
  isWhatsappOpen: boolean;
  selectedLeadForWhatsapp: Lead | null;
  connectionStatus: WhatsappConnectionStatus;
}

export interface WhatsappActions {
  openWhatsappChat: (lead: Lead) => void;
  closeWhatsappChat: () => void;
  setConnectionStatus: (status: WhatsappConnectionStatus) => void;
  refreshConnectionStatus: () => void;
}

export type WhatsappStore = WhatsappState & WhatsappActions;