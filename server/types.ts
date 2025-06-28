// This file will contain type definitions previously inferred from Drizzle schema
// These should ideally match the structure of your Supabase tables.

// Base timestamp and ID types
export type SerialId = number;
export type Timestamp = string; // Or Date, depending on how you handle dates

// User/Professor (Supabase existing type is SupabaseUser in storage.ts)
// We might not need to redefine User/InsertUser here if SupabaseUser suffices
// and professor-specific fields are handled via app_metadata or a separate 'profiles' table.

// Lead
export type Lead = {
  id: SerialId;
  entryDate: Timestamp | Date;
  name: string;
  email: string;
  phone: string;
  state: string;
  campaign: string;
  tags: string[];
  source: string; // "Favale" or "Pink"
  status: string; // "Lead" or "Aluno"
  notes?: string | null;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
};

export type InsertLead = {
  entryDate?: Timestamp | Date;
  name: string;
  email: string;
  phone: string;
  state: string;
  campaign?: string;
  tags?: string[];
  source: string;
  status: string;
  notes?: string | null;
};

// Trainer (if a separate table from Supabase Auth users)
export type Trainer = {
  id: SerialId;
  name: string;
  email: string;
  phone?: string | null;
  specialties?: string[] | null;
  source: string; // "Favale", "Pink", ou "FavalePink"
  active: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
};

export type InsertTrainer = {
  name: string;
  email: string;
  phone?: string | null;
  specialties?: string[] | null;
  source: string;
  active?: boolean;
};

// Student (if a separate table)
export type Student = {
  id: SerialId;
  leadId?: SerialId | null; // Reference to Lead
  address?: string | null;
  preferences?: string | null;
  source: string; // "Favale" or "Pink"
  active: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  // Include fields from Lead if you flatten student info
  name?: string;
  email?: string;
  phone?: string;
};

export type InsertStudent = {
  leadId?: SerialId | null;
  address?: string | null;
  preferences?: string | null;
  source: string;
  active?: boolean;
};

// Session
export type Session = {
  id: SerialId;
  startTime: Timestamp | Date;
  endTime: Timestamp | Date;
  leadId: SerialId; // Reference to Lead/Student
  trainerId: string; // Reference to Trainer (Supabase User ID - UUID string)
  location: string;
  value?: number | null; // Assuming value was from Drizzle schema, might not be in Supabase direct table
  service?: string | null; // Assuming service was from Drizzle schema
  notes?: string | null;
  status: string; // agendado, concluído, cancelado, remarcado
  source: string; // "Favale", "Pink", "FavalePink"
  // Recurrence fields (if still used and not part of new scheduling system exclusively)
  recurrenceType?: string | null;
  recurrenceInterval?: number | null;
  recurrenceWeekDays?: string[] | null;
  recurrenceEndType?: string | null;
  recurrenceEndDate?: Timestamp | Date | null;
  recurrenceEndCount?: number | null;
  recurrenceGroupId?: string | null;
  isRecurrenceParent?: boolean | null;
  parentSessionId?: SerialId | null;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
};

export type InsertSession = {
  startTime: Timestamp | Date;
  endTime: Timestamp | Date;
  leadId: SerialId;
  trainerId: string; // Supabase User ID
  location: string;
  value?: number | null;
  service?: string | null;
  notes?: string | null;
  status?: string;
  source: string;
  recurrenceType?: string | null;
  recurrenceInterval?: number | null;
  recurrenceWeekDays?: string[] | null;
  recurrenceEndType?: string | null;
  recurrenceEndDate?: Timestamp | Date | null;
  recurrenceEndCount?: number | null;
  recurrenceGroupId?: string | null;
  isRecurrenceParent?: boolean | null;
  parentSessionId?: SerialId | null;
};

// SessionHistory
export type SessionHistory = {
  id: SerialId;
  sessionId: SerialId;
  changedAt: Timestamp | Date;
  changeType: string;
  userId: string; // Supabase User ID
  oldValue?: any | null; // JSONB
  newValue?: any | null; // JSONB
};

export type InsertSessionHistory = {
  sessionId: SerialId;
  changeType: string;
  userId: string; // Supabase User ID
  oldValue?: any | null;
  newValue?: any | null;
};

// Task
export type Task = {
  id: SerialId;
  title: string;
  description?: string | null;
  assignedById: string; // Supabase User ID
  assignedToId: string; // Supabase User ID
  dueDate?: Timestamp | Date | null;
  priority: string; // low, medium, high
  status: string; // pending, in_progress, completed, cancelled
  relatedLeadId?: SerialId | null; // Reference to Lead
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  // For display purposes, not part of DB table usually
  assignedToName?: string;
  assignedByName?: string;
};

export type InsertTask = {
  title: string;
  description?: string | null;
  assignedById: string; // Supabase User ID
  assignedToId: string; // Supabase User ID
  dueDate?: Timestamp | Date | null;
  priority?: string;
  status?: string;
  relatedLeadId?: SerialId | null;
};

// TaskComment
export type TaskComment = {
  id: SerialId;
  taskId: SerialId;
  userId: string; // Supabase User ID
  content: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  // For display
  userName?: string;
};

export type InsertTaskComment = {
  taskId: SerialId;
  userId: string; // Supabase User ID
  content: string;
};

// WhatsappMessage
export type WhatsappMessage = {
  id: SerialId;
  leadId: SerialId;
  direction: "incoming" | "outgoing";
  content: string;
  status: string; // "sent", "delivered", "read", "failed", "pending", "received"
  timestamp: Timestamp | Date;
  mediaUrl?: string | null;
  mediaType?: "image" | "audio" | "video" | "document" | null;
  messageId?: string | null; // Message ID from WhatsApp API
};

export type InsertWhatsappMessage = {
  leadId: SerialId;
  direction: "incoming" | "outgoing";
  content: string;
  status: string;
  timestamp?: Timestamp | Date;
  mediaUrl?: string | null;
  mediaType?: "image" | "audio" | "video" | "document" | null;
  messageId?: string | null;
};

// WhatsappSettings
export type WhatsappSettings = {
  id: SerialId;
  apiUrl: string;
  apiToken: string;
  apiInstance: string;
  updatedAt: Timestamp | Date;
};

export type InsertWhatsappSettings = {
  id?: SerialId; // Optional if upserting and ID is known
  apiUrl: string;
  apiToken: string;
  apiInstance: string;
};

// AgendamentoRecorrente (New Scheduling System)
export type AgendamentoRecorrente = {
  id: SerialId;
  professorId: string; // Supabase User ID
  studentId: SerialId; // Lead ID
  location: string;
  value: number;
  service: string;
  notes?: string | null;
  regras: any; // JSONB with recurrence rules
  startDate: Timestamp | Date;
  endDate?: Timestamp | Date | null;
  maxOccurrences?: number | null;
  active: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
};

export type InsertAgendamentoRecorrente = {
  professorId: string; // Supabase User ID
  studentId: SerialId; // Lead ID
  location: string;
  value: number;
  service: string;
  notes?: string | null;
  regras: any;
  startDate: Timestamp | Date;
  endDate?: Timestamp | Date | null;
  maxOccurrences?: number | null;
  active?: boolean;
};

// Aula (New Scheduling System)
export type Aula = {
  id: SerialId;
  agendamentoRecorrenteId?: SerialId | null;
  professorId: string; // Supabase User ID
  studentId: SerialId; // Lead ID
  startTime: Timestamp | Date;
  endTime: Timestamp | Date;
  location: string;
  value: number;
  service: string;
  notes?: string | null;
  status: "agendado" | "em_andamento" | "concluido" | "cancelado" | "remarcado";
  isModified: boolean;
  originalStartTime?: Timestamp | Date | null;
  originalEndTime?: Timestamp | Date | null;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
};

export type InsertAula = {
  agendamentoRecorrenteId?: SerialId | null;
  professorId: string; // Supabase User ID
  studentId: SerialId; // Lead ID
  startTime: Timestamp | Date;
  endTime: Timestamp | Date;
  location: string;
  value: number;
  service: string;
  notes?: string | null;
  status?: "agendado" | "em_andamento" | "concluido" | "cancelado" | "remarcado";
  isModified?: boolean;
  originalStartTime?: Timestamp | Date | null;
  originalEndTime?: Timestamp | Date | null;
};

// GoogleToken (if needed, though storage methods use object literals)
export type GoogleToken = {
  user_id: string; // Supabase User ID
  access_token: string;
  refresh_token?: string | null;
  expiry_date: Timestamp | Date; // Stored as ISO string, used as number (timestamp)
  updated_at: Timestamp | Date;
};

// Service (if you have a services table)
export type Service = {
  id: SerialId;
  name: string;
  description?: string | null;
  duration: number; // Duração em minutos
  price: number; // Preço em centavos
  active: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
};

export type InsertService = {
  name: string;
  description?: string | null;
  duration: number;
  price: number;
  active?: boolean;
};

// Supabase User (already defined in storage.ts, but can be here for consistency)
export type SupabaseUser = {
  id: string; // UUID
  email?: string;
  app_metadata?: { role?: string; roles?: string[]; [key: string]: any };
  user_metadata?: { [key: string]: any };
  // Add other fields from auth.users if commonly accessed
  [key: string]: any;
};
