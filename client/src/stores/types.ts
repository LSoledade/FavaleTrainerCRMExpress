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
export interface TaskWithComments extends Task {
  comments?: TaskComment[];
}

export interface TaskState {
  tasks: TaskWithComments[];
  loading: boolean;
  error: string | null;
}

export interface TaskActions {
  setTasks: (tasks: TaskWithComments[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchTasks: () => Promise<void>;
  fetchTaskById: (id: number) => Promise<TaskWithComments | undefined>;
  createTask: (task: Omit<TaskWithComments, "id" | "createdAt" | "updatedAt" | "comments">) => Promise<TaskWithComments>;
  updateTask: (id: number, task: Partial<TaskWithComments>) => Promise<TaskWithComments>;
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