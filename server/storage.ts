// Removed Drizzle schema imports
// import {
//   leads, students, trainers, sessions, sessionHistory, whatsappMessages,
//   tasks, taskComments, // These are Drizzle schema objects
//   type Lead, type InsertLead, // These are Drizzle-generated types
//   // type User, type InsertUser, // Drizzle User types, replaced by SupabaseUser
//   type Student, type InsertStudent, // Drizzle-generated types
//   type Trainer, type InsertTrainer, // Drizzle-generated types
//   type Session, type InsertSession,
//   type SessionHistory, type InsertSessionHistory,
//   type WhatsappMessage, type InsertWhatsappMessage,
//   type Task, type InsertTask,
//   type TaskComment, type InsertTaskComment,
//   users,
//   sessionHistory as sessionHistoryTable,
//   whatsappSettings, InsertWhatsappSettings, WhatsappSettings,
//   // New scheduling system imports
//   agendamentosRecorrentes, aulas,
//   type AgendamentoRecorrente, type InsertAgendamentoRecorrente,
//   type Aula, type InsertAula
// } from "./schema"; // Drizzle schema, may need to be replaced or adapted

// Keep existing type imports that are used in method signatures for now.
// These will need to be defined elsewhere or adapted if Supabase schema differs.
import type {
  Lead, InsertLead,
  Student, InsertStudent,
  Trainer, InsertTrainer,
  Session, InsertSession,
  SessionHistory, InsertSessionHistory,
  WhatsappMessage, InsertWhatsappMessage,
  Task, InsertTask,
  TaskComment, InsertTaskComment,
  WhatsappSettings, InsertWhatsappSettings,
  AgendamentoRecorrente, InsertAgendamentoRecorrente,
  Aula, InsertAula
} from "./types"; // Updated import path

import { supabase } from "./supabase.js"; // Supabase client

// Define Supabase-specific types if needed, or use generic object/any for now and refine
// Example: Supabase User might be different from Drizzle User type
type SupabaseUser = {
  id: string; // UUID
  email?: string;
  app_metadata?: { role?: string; roles?: string[]; [key: string]: any };
  user_metadata?: { [key: string]: any };
  [key: string]: any;
};


// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User/Professor methods - will interact with Supabase Auth and potentially a 'profiles' table
  // IDs will be UUID strings from Supabase Auth
  getUserById(id: string): Promise<SupabaseUser | undefined>; // Changed id to string
  getUserByEmail(email: string): Promise<SupabaseUser | undefined>;
  // createUser, getAllUsers, deleteUser are more complex with Supabase Auth,
  // often handled by Supabase client SDK or Admin API directly, not via this storage layer.
  
  // Professor methods (users with role='professor' in Supabase)
  getAllProfessors(): Promise<SupabaseUser[]>; // Returns SupabaseUser
  createProfessor(professorData: Partial<SupabaseUser> & { email: string; password?: string }): Promise<SupabaseUser>; // Adjusted for Supabase
  updateProfessor(id: string, professorData: Partial<SupabaseUser>): Promise<SupabaseUser | undefined>; // id is string
  deleteProfessor(id: string): Promise<boolean>; // id is string
  hasScheduledClasses(professorId: string): Promise<boolean>; // professorId is string

  // Lead methods - will interact with a 'leads' table in Supabase
  getLeads(): Promise<Lead[]>; // Assuming Lead type can be reused or adapted
  getLead(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<boolean>;
  getLeadsBySource(source: string): Promise<Lead[]>;
  getLeadsByStatus(status: string): Promise<Lead[]>;
  getLeadsByCampaign(campaign: string): Promise<Lead[]>;
  getLeadsByState(state: string): Promise<Lead[]>;
  getLeadsByPhone(phone: string): Promise<Lead[]>;

  // Batch operations
  updateLeadsInBatch(ids: number[], updates: Partial<InsertLead>): Promise<number>;
  deleteLeadsInBatch(ids: number[]): Promise<number>;

  // WhatsApp methods
  getWhatsappMessages(leadId: number): Promise<WhatsappMessage[]>;
  getWhatsappMessageById(id: number): Promise<WhatsappMessage | undefined>;
  getWhatsappMessageByApiId(messageId: string): Promise<WhatsappMessage | undefined>;
  createWhatsappMessage(message: InsertWhatsappMessage): Promise<WhatsappMessage>;
  updateWhatsappMessageStatus(id: number, status: string): Promise<WhatsappMessage | undefined>;
  updateWhatsappMessageId(id: number, messageId: string): Promise<WhatsappMessage | undefined>;
  deleteWhatsappMessage(id: number): Promise<boolean>;

  // Trainer methods
  getTrainers(): Promise<Trainer[]>;
  getTrainer(id: number): Promise<Trainer | undefined>;
  createTrainer(trainer: InsertTrainer): Promise<Trainer>;
  updateTrainer(id: number, trainer: Partial<InsertTrainer>): Promise<Trainer | undefined>;
  deleteTrainer(id: number): Promise<boolean>;
  getActiveTrainers(): Promise<Trainer[]>;
  getTrainersBySpecialty(specialty: string): Promise<Trainer[]>;

  // Student methods
  getStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByLeadId(leadId: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  getActiveStudents(): Promise<Student[]>;
  getStudentsBySource(source: string): Promise<Student[]>;
  getStudentsWithLeadInfo(): Promise<(Student & { lead: Lead | null })[]>;

  // Session methods
  getSessions(): Promise<Session[]>;
  getSession(id: number): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: number, session: Partial<InsertSession>): Promise<Session | undefined>;
  deleteSession(id: number): Promise<boolean>;
  getSessionsByStudentId(studentId: number): Promise<Session[]>;
  getSessionsByTrainerId(trainerId: string): Promise<Session[]>; // Trainer ID is string (UUID)
  getSessionsByDateRange(startDate: Date, endDate: Date): Promise<Session[]>;
  getSessionsByStatus(status: string): Promise<Session[]>;
  getSessionsBySource(source: string): Promise<Session[]>;
  getSessionsWithDetails(): Promise<any[]>; // Retorna sessões com dados de alunos e professores
  getCompletedSessionsByStudent(studentId: number, startDate?: Date, endDate?: Date): Promise<Session[]>;

  // Session history methods
  createSessionHistory(history: InsertSessionHistory): Promise<SessionHistory>;
  getSessionHistoryBySessionId(sessionId: number): Promise<SessionHistory[]>;

  // Task methods
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  getTasksByAssignedToId(userId: string): Promise<Task[]>; // userId is string (Supabase UUID)
  getTasksByAssignedById(userId: string): Promise<Task[]>; // userId is string (Supabase UUID)
  getTasksByStatus(status: string): Promise<Task[]>;
  getTasksByRelatedLeadId(leadId: number): Promise<Task[]>;

  // Task comments methods
  getTaskCommentsByTaskId(taskId: number): Promise<TaskComment[]>;
  createTaskComment(comment: InsertTaskComment): Promise<TaskComment>;
  deleteTaskComment(id: number): Promise<boolean>;

  // WhatsApp Settings methods
  getWhatsappSettings(): Promise<WhatsappSettings | undefined>;
  saveWhatsappSettings(settings: InsertWhatsappSettings): Promise<WhatsappSettings>;

  // Google OAuth2 token management
  saveGoogleTokens(userId: string, tokens: { // userId is string (Supabase UUID)
    access_token: string;
    refresh_token?: string;
    expiry_date: number;
  }): Promise<void>;
  getGoogleTokens(userId: string): Promise<{ // userId is string (Supabase UUID)
    access_token: string;
    refresh_token?: string;
    expiry_date: number;
  } | null>;
  deleteGoogleTokens(userId: string): Promise<void>; // userId is string (Supabase UUID)

  // New Scheduling System methods
  // Agendamentos Recorrentes
  createAgendamentoRecorrente(agendamento: InsertAgendamentoRecorrente): Promise<AgendamentoRecorrente>;
  getAgendamentosRecorrentes(): Promise<AgendamentoRecorrente[]>;
  updateAgendamentoRecorrente(id: number, agendamento: Partial<InsertAgendamentoRecorrente>): Promise<AgendamentoRecorrente | undefined>;
  deleteAgendamentoRecorrente(id: number): Promise<boolean>;

  // Aulas (individual class instances)
  getAulas(filters?: any): Promise<Aula[]>;
  getAulaById(id: number): Promise<Aula | undefined>;
  createAula(aula: InsertAula): Promise<Aula>;
  createMultipleAulas(aulas: InsertAula[]): Promise<Aula[]>;
  updateAula(id: number, aula: Partial<InsertAula>): Promise<Aula | undefined>;
  deleteAula(id: number): Promise<boolean>;
  
  // Lead helpers
  getLeadById(id: number): Promise<Lead | undefined>; // Keep if useful, adapt to Supabase
  
  // Conflict checking for scheduling
  checkSchedulingConflicts(professorId: string, studentId: string, startTime: Date, endTime: Date, excludeAulaId?: number): Promise<any>; // ids are strings
}

export class SupabaseStorage implements IStorage {
  
  // User/Professor methods using Supabase Auth
  async getUserById(id: string): Promise<SupabaseUser | undefined> {
    console.warn(`[SupabaseStorage] getUserById: Fetching user ${id}. Ensure admin privileges if not current user.`);
    const { data, error } = await supabase.auth.admin.getUserById(id);
    if (error) {
      console.error(`[SupabaseStorage] Error fetching user by ID ${id}:`, error.message);
      return undefined;
    }
    return data.user as SupabaseUser;
  }

  async getUserByEmail(email: string): Promise<SupabaseUser | undefined> {
    console.warn("[SupabaseStorage] getUserByEmail: This method might be inefficient with Supabase admin API. Consider a 'profiles' table or alternative lookup.");
    // Supabase admin API does not offer direct email lookup. Listing and filtering is an option but inefficient.
    // This implementation is a placeholder for a more robust solution (e.g., a 'profiles' table).
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 10000 }); // High perPage, needs pagination for >10k users
    if (error) {
      console.error(`[SupabaseStorage] Error listing users by email ${email}:`, error.message);
      return undefined;
    }
    const user = data.users.find(u => u.email === email);
    return user as SupabaseUser | undefined;
  }

  async getAllProfessors(): Promise<SupabaseUser[]> {
    console.warn("[SupabaseStorage] getAllProfessors: Fetching all users and filtering. Consider a 'profiles' table with a 'role' column for efficiency.");
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (error) {
      console.error("[SupabaseStorage] Error fetching all users for getAllProfessors:", error.message);
      return [];
    }
    return data.users.filter(
      (user) => user.app_metadata?.role === 'professor' || user.app_metadata?.roles?.includes('professor')
    ) as SupabaseUser[];
  }

  async createProfessor(professorData: Partial<SupabaseUser> & { email: string; password?: string }): Promise<SupabaseUser> {
    console.log("[SupabaseStorage] Creating professor:", professorData.email);
    const { email, password, ...otherMetadata } = professorData;

    const app_metadata = { ...otherMetadata.app_metadata, role: 'professor', roles: ['professor'] };
    const user_metadata = { ...otherMetadata.user_metadata, name: professorData.name };


    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      app_metadata: app_metadata,
      user_metadata: user_metadata,
    });

    if (error) {
      console.error("[SupabaseStorage] Error creating professor:", error.message);
      throw new Error(`Failed to create professor: ${error.message}`);
    }
    return data.user as SupabaseUser;
  }

  async updateProfessor(id: string, professorData: Partial<SupabaseUser>): Promise<SupabaseUser | undefined> {
    console.log(`[SupabaseStorage] Updating professor ${id} with data:`, professorData);
    const updatePayload: any = {};
    // Ensure app_metadata preserves existing roles if not explicitly changed
    if (professorData.app_metadata) {
        updatePayload.app_metadata = { role: 'professor', roles: ['professor'], ...professorData.app_metadata};
    } else {
        updatePayload.app_metadata = { role: 'professor', roles: ['professor']};
    }
    if (professorData.user_metadata) updatePayload.user_metadata = professorData.user_metadata;
    if (professorData.password) updatePayload.password = professorData.password;
    if (professorData.email) updatePayload.email = professorData.email;

    const { data, error } = await supabase.auth.admin.updateUserById(id, updatePayload);

    if (error) {
      console.error(`[SupabaseStorage] Error updating professor ${id}:`, error.message);
      return undefined;
    }
    return data.user as SupabaseUser;
  }

  async deleteProfessor(id: string): Promise<boolean> {
    console.log(`[SupabaseStorage] Deleting professor ${id}`);
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) {
      console.error(`[SupabaseStorage] Error deleting professor ${id}:`, error.message);
      return false;
    }
    return true;
  }

  async hasScheduledClasses(professorId: string): Promise<boolean> {
    console.log(`[SupabaseStorage] Checking scheduled classes for professor ${professorId}`);
    const now = new Date().toISOString();
    // Assuming 'aulas' table and 'professor_id' (UUID string) column.
    // And that 'professor_id' in 'aulas' corresponds to Supabase Auth user ID.
    const { error, count } = await supabase
      .from('aulas')
      .select('id', { count: 'exact', head: true })
      .eq('professor_id', professorId)
      .gt('start_time', now)
      .neq('status', 'cancelado');

    if (error) {
      console.error("[SupabaseStorage] Error checking scheduled classes:", error.message);
      return false;
    }
    return (count || 0) > 0;
  }

  // Lead methods - using Supabase client for 'leads' table
  async getLeads(): Promise<Lead[]> {
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error("[SupabaseStorage] Error fetching leads:", error.message);
      throw error;
    }
    return data as Lead[];
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') {
      console.error(`[SupabaseStorage] Error fetching lead ${id}:`, error.message);
      throw error;
    }
    return data as Lead | undefined;
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const leadToInsert = { ...insertLead };
    if (leadToInsert.entryDate && !(leadToInsert.entryDate instanceof Date)) {
        // @ts-ignore
        leadToInsert.entryDate = new Date(leadToInsert.entryDate);
    }
    if (leadToInsert.entryDate instanceof Date) {
      // @ts-ignore
      leadToInsert.entryDate = leadToInsert.entryDate.toISOString();
    }

    const { data, error } = await supabase.from('leads').insert(leadToInsert as any).select().single();
    if (error) {
      console.error("[SupabaseStorage] Error creating lead:", error.message);
      throw error;
    }
    return data as Lead;
  }

  async updateLead(id: number, updates: Partial<InsertLead>): Promise<Lead | undefined> {
    const updatePayload = { ...updates, updated_at: new Date().toISOString() };
     if (updatePayload.entryDate && !(updatePayload.entryDate instanceof Date)) {
        // @ts-ignore
        updatePayload.entryDate = new Date(updatePayload.entryDate);
    }
    if (updatePayload.entryDate instanceof Date) {
      // @ts-ignore
      updatePayload.entryDate = updatePayload.entryDate.toISOString();
    }

    const { data, error } = await supabase.from('leads').update(updatePayload as any).eq('id', id).select().single();
    if (error) {
      console.error(`[SupabaseStorage] Error updating lead ${id}:`, error.message);
      if (error.code === 'PGRST204') return undefined;
      throw error;
    }
    return data as Lead | undefined;
  }

  async deleteLead(id: number): Promise<boolean> {
    // Consider cascade deletion for related entities (e.g., whatsapp_messages, students if lead is deleted)
    // This might be handled by database foreign key constraints with ON DELETE CASCADE.
    // If not, manual deletion of related records would be needed here or at service layer.
    const { error, count } = await supabase.from('leads').delete().eq('id', id);
    if (error) {
      console.error(`[SupabaseStorage] Error deleting lead ${id}:`, error.message);
      return false;
    }
    return (count !== null && count > 0) || count === null; // count can be null if returning 'minimal'
  }

  async getLeadsBySource(source: string): Promise<Lead[]> {
    const { data, error } = await supabase.from('leads').select('*').eq('source', source);
    if (error) throw error;
    return data as Lead[];
  }

  async getLeadsByStatus(status: string): Promise<Lead[]> {
    const { data, error } = await supabase.from('leads').select('*').eq('status', status);
    if (error) throw error;
    return data as Lead[];
  }

  async getLeadsByCampaign(campaign: string): Promise<Lead[]> {
    const { data, error } = await supabase.from('leads').select('*').eq('campaign', campaign);
    if (error) throw error;
    return data as Lead[];
  }

  async getLeadsByState(state: string): Promise<Lead[]> {
    const { data, error } = await supabase.from('leads').select('*').eq('state', state);
    if (error) throw error;
    return data as Lead[];
  }

  async getLeadsByPhone(phone: string): Promise<Lead[]> {
    const cleanPhone = phone.replace(/\D/g, '');
    const { data, error } = await supabase.from('leads').select('*').like('phone', `%${cleanPhone}%`);
    if (error) throw error;
    return data as Lead[];
  }

  async updateLeadsInBatch(ids: number[], updates: Partial<InsertLead>): Promise<number> {
    console.warn("[SupabaseStorage] updateLeadsInBatch: Performing individual updates. Consider an Edge Function or stored procedure for true batching.");
    let successCount = 0;
    const updatePayload = { ...updates, updated_at: new Date().toISOString() };
    // Supabase PostgREST does allow batch updates using `in` filter if the structure matches
    const { count, error } = await supabase.from('leads').update(updatePayload as any).in('id', ids);

    if (error) {
        console.error("[SupabaseStorage] Error in updateLeadsInBatch:", error.message);
        // Fallback to individual updates if batch fails or for more complex scenarios
        for (const id of ids) {
            const updated = await this.updateLead(id, updates); // updates, not updatePayload, as updateLead adds timestamp
            if (updated) successCount++;
        }
        return successCount;
    }
    return count || 0;
  }

  async deleteLeadsInBatch(ids: number[]): Promise<number> {
    console.warn("[SupabaseStorage] deleteLeadsInBatch: Consider an Edge Function or stored procedure for true batching with cascade effects.");
    const { count, error } = await supabase.from('leads').delete().in('id', ids);
    if (error) {
        console.error("[SupabaseStorage] Error in deleteLeadsInBatch:", error.message);
        let successCount = 0;
        for (const id of ids) {
            const deleted = await this.deleteLead(id);
            if (deleted) successCount++;
        }
        return successCount;
    }
    return count || 0;
  }

  // Trainer methods: Assuming 'trainers' is a table in Supabase.
  // IDs for trainers are assumed to be numeric serial IDs as per Drizzle schema.
  // If trainers become Supabase Auth users, their IDs would be UUID strings.
  async getTrainers(): Promise<Trainer[]> {
    const { data, error } = await supabase.from('trainers').select('*').order('name');
    if (error) throw error;
    return data as Trainer[];
  }

  async getTrainer(id: number): Promise<Trainer | undefined> {
    const { data, error } = await supabase.from('trainers').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as Trainer | undefined;
  }

  async createTrainer(insertTrainer: InsertTrainer): Promise<Trainer> {
    const { data, error } = await supabase.from('trainers').insert(insertTrainer as any).select().single();
    if (error) throw error;
    return data as Trainer;
  }

  async updateTrainer(id: number, updates: Partial<InsertTrainer>): Promise<Trainer | undefined> {
    const { data, error } = await supabase.from('trainers').update({ ...updates, updated_at: new Date().toISOString() } as any).eq('id', id).select().single();
    if (error && error.code !== 'PGRST204') throw error;
    return data as Trainer | undefined;
  }

  async deleteTrainer(id: number): Promise<boolean> {
    const { error, count } = await supabase.from('trainers').delete().eq('id', id);
    if (error) return false;
    return (count !== null && count > 0) || count === null;
  }

  async getActiveTrainers(): Promise<Trainer[]> {
    const { data, error } = await supabase.from('trainers').select('*').eq('active', true).order('name');
    if (error) throw error;
    return data as Trainer[];
  }

  async getTrainersBySpecialty(specialty: string): Promise<Trainer[]> {
    const { data, error } = await supabase.from('trainers').select('*').contains('specialties', [specialty]);
    if (error) throw error;
    return data as Trainer[];
  }


  // Student methods: Assuming 'students' table. Numeric IDs.
  async getStudents(): Promise<Student[]> {
    const { data, error } = await supabase.from('students').select('*').order('id');
    if (error) throw error;
    return data as Student[];
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const { data, error } = await supabase.from('students').select('*').eq('id', id).single();
     if (error && error.code !== 'PGRST116') throw error;
    return data as Student | undefined;
  }

  async getStudentByLeadId(leadId: number): Promise<Student | undefined> {
    const { data, error } = await supabase.from('students').select('*').eq('lead_id', leadId).maybeSingle(); // Use maybeSingle if it's possible for no student to exist for a lead
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is fine with maybeSingle if no row
    return data as Student | undefined;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const { data, error } = await supabase.from('students').insert(insertStudent as any).select().single();
    if (error) throw error;
    return data as Student;
  }

  async updateStudent(id: number, updates: Partial<InsertStudent>): Promise<Student | undefined> {
    const { data, error } = await supabase.from('students').update({ ...updates, updated_at: new Date().toISOString() } as any).eq('id', id).select().single();
    if (error && error.code !== 'PGRST204') throw error;
    return data as Student | undefined;
  }

  async deleteStudent(id: number): Promise<boolean> {
    const { error, count } = await supabase.from('students').delete().eq('id', id);
    if (error) return false;
    return (count !== null && count > 0) || count === null;
  }

  async getActiveStudents(): Promise<Student[]> {
    const { data, error } = await supabase.from('students').select('*').eq('active', true).order('id');
    if (error) throw error;
    return data as Student[];
  }

  async getStudentsBySource(source: string): Promise<Student[]> {
    const { data, error } = await supabase.from('students').select('*').eq('source', source);
    if (error) throw error;
    return data as Student[];
  }

  async getStudentsWithLeadInfo(): Promise<(Student & { lead: Lead | null })[]> {
    // Ensure 'leads' table is referenced correctly, assuming FK `lead_id` on `students` table.
    const { data: studentsData, error } = await supabase.from('students').select('*, lead:leads!inner(*)'); // !inner to ensure lead exists or filter out
    // Or '*, lead:leads(*)' if lead can be null and you want to keep the student record
    if (error) {
      console.error("[SupabaseStorage] Error in getStudentsWithLeadInfo:", error.message);
      throw error;
    }
    return studentsData as (Student & { lead: Lead | null })[];
  }

  // Session methods (assuming 'sessions' table). Numeric IDs for student/trainer if they are not Supabase Auth users.
  // If trainer_id refers to a Supabase Auth user, it should be string.
  async getSessions(): Promise<Session[]> {
    const { data, error } = await supabase.from('sessions').select('*').order('start_time', { ascending: false });
    if (error) throw error;
    return data as Session[];
  }

  async getSession(id: number): Promise<Session | undefined> {
    const { data, error } = await supabase.from('sessions').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as Session | undefined;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const { data, error } = await supabase.from('sessions').insert(insertSession as any).select().single();
    if (error) throw error;
    return data as Session;
  }

  async updateSession(id: number, updates: Partial<InsertSession>): Promise<Session | undefined> {
    const { data, error } = await supabase.from('sessions').update({ ...updates, updated_at: new Date().toISOString() } as any).eq('id', id).select().single();
     if (error && error.code !== 'PGRST204') throw error;
    return data as Session | undefined;
  }

  async deleteSession(id: number): Promise<boolean> {
    const { error, count } = await supabase.from('sessions').delete().eq('id', id);
    if (error) return false;
    return (count !== null && count > 0) || count === null;
  }

  async getSessionsByStudentId(studentId: number): Promise<Session[]> {
    // Assuming studentId in 'sessions' table is 'student_id' or 'lead_id'
    // The Drizzle schema used 'lead_id' for student reference in sessions.
    const { data, error } = await supabase.from('sessions').select('*').eq('lead_id', studentId).order('start_time', { ascending: false });
    if (error) throw error;
    return data as Session[];
  }

  async getSessionsByTrainerId(trainerId: string): Promise<Session[]> { // trainerId is now string (UUID for Supabase user)
     // Assuming trainer_id in 'sessions' table refers to Supabase Auth user ID.
     const { data, error } = await supabase.from('sessions').select('*').eq('trainer_id', trainerId).order('start_time', { ascending: false });
    if (error) throw error;
    return data as Session[];
  }

  async getSessionsByDateRange(startDate: Date, endDate: Date): Promise<Session[]> {
    const { data, error } = await supabase.from('sessions').select('*')
      .gte('start_time', startDate.toISOString())
      .lte('end_time', endDate.toISOString()) // Assuming range query should be start_time >= startDate AND end_time <= endDate
      .order('start_time', { ascending: true });
    if (error) throw error;
    return data as Session[];
  }

  async getSessionsByStatus(status: string): Promise<Session[]> {
    const { data, error } = await supabase.from('sessions').select('*').eq('status', status).order('start_time', { ascending: false });
    if (error) throw error;
    return data as Session[];
  }

  async getSessionsBySource(source: string): Promise<Session[]> {
     const { data, error } = await supabase.from('sessions').select('*').eq('source', source).order('start_time', { ascending: false });
    if (error) throw error;
    return data as Session[];
  }

  async getSessionsWithDetails(): Promise<any[]> {
    console.warn("[SupabaseStorage] getSessionsWithDetails: Using nested selects. Ensure FKs are set up correctly in Supabase for `students` and `trainers` references in the `sessions` table. Trainer ID might be UUID string if it refers to a Supabase Auth user.");
    // Assuming student_id (or lead_id) and trainer_id are FKs in 'sessions' table.
    // If trainer_id is a Supabase user UUID, the join to 'trainers' table might need adjustment or 'trainers' might be 'profiles'.
    // For this example, assuming 'trainers' table with numeric ID for join as per original Drizzle schema.
    // If 'trainer_id' in 'sessions' is a UUID string for Supabase user, then the join should be to a 'profiles' table or directly to user_metadata if simple.
    // For now, keeping the join structure as implied by original code.
    const { data, error } = await supabase.from('sessions').select(`
      *,
      student:students (id, source, address, lead:leads (name, email, phone)),
      trainer:users!sessions_trainer_id_fkey (id, name:raw->user_metadata->>name, email)
    `).order('start_time', { ascending: false });
    // Note: The trainer join assumes 'trainer_id' in 'sessions' is a UUID that refers to 'id' in 'auth.users'.
    // And that 'name' is in user_metadata. This needs to match actual Supabase schema.
    // If 'trainers' is a separate table with numeric IDs, the join would be: trainer:trainers(id, name, email)

    if (error) {
      console.error("[SupabaseStorage] Error in getSessionsWithDetails:", error.message);
      throw error;
    }
    return data.map((s: any) => ({
        ...s,
        student: s.student ? { ...(s.student.lead || {}), ...s.student } : null, // flatten student and lead
        trainer: s.trainer // This will depend on the join structure
    }));
  }

  async getCompletedSessionsByStudent(studentId: number, startDate?: Date, endDate?: Date): Promise<Session[]> {
    let query = supabase.from('sessions').select('*')
      .eq('lead_id', studentId) // Assuming lead_id is the student reference
      .eq('status', 'concluido');
    if (startDate) query = query.gte('start_time', startDate.toISOString());
    if (endDate) query = query.lte('start_time', endDate.toISOString()); // Query by start_time within range
    query = query.order('start_time', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;
    return data as Session[];
  }

  // Session history methods (assuming 'session_history' table)
  // UserID in session_history might become a string if it refers to Supabase Auth user ID.
  async createSessionHistory(history: InsertSessionHistory): Promise<SessionHistory> {
    // Assuming history.userId is correctly typed (string for Supabase auth user, or number for old system user)
    const { data, error } = await supabase.from('session_history').insert(history as any).select().single();
    if (error) throw error;
    return data as SessionHistory;
  }

  async getSessionHistoryBySessionId(sessionId: number): Promise<SessionHistory[]> {
    const { data, error } = await supabase.from('session_history').select('*').eq('session_id', sessionId).order('changed_at', { ascending: false });
    if (error) throw error;
    return data as SessionHistory[];
  }

  // Task methods (assuming 'tasks' table)
  // assigned_to_id, assigned_by_id are now string (Supabase user UUIDs)
  async getTasks(): Promise<Task[]> {
    const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data as Task[];
  }

  async getTask(id: number): Promise<Task | undefined> {
    const { data, error } = await supabase.from('tasks').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as Task | undefined;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
     const taskToInsert = { ...insertTask };
     if (taskToInsert.due_date && !(taskToInsert.due_date instanceof Date)) {
        // @ts-ignore
        taskToInsert.due_date = new Date(taskToInsert.due_date);
    }
    if (taskToInsert.due_date instanceof Date) {
      // @ts-ignore
      taskToInsert.due_date = taskToInsert.due_date.toISOString();
    }
    // Ensure assigned_by_id and assigned_to_id are strings if they are UUIDs
    const { data, error } = await supabase.from('tasks').insert(taskToInsert as any).select().single();
    if (error) throw error;
    return data as Task;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const updatePayload = { ...updates, updated_at: new Date().toISOString() };
    if (updatePayload.due_date && !(updatePayload.due_date instanceof Date)) {
        // @ts-ignore
        updatePayload.due_date = new Date(updatePayload.due_date);
    }
    if (updatePayload.due_date instanceof Date) {
      // @ts-ignore
      updatePayload.due_date = updatePayload.due_date.toISOString();
    }
    const { data, error } = await supabase.from('tasks').update(updatePayload as any).eq('id', id).select().single();
    if (error && error.code !== 'PGRST204') throw error;
    return data as Task | undefined;
  }

  async deleteTask(id: number): Promise<boolean> {
    // Delete related task_comments first or use DB cascade if configured.
    await supabase.from('task_comments').delete().eq('task_id', id);
    const { error, count } = await supabase.from('tasks').delete().eq('id', id);
    if (error) return false;
    return (count !== null && count > 0) || count === null;
  }

  async getTasksByAssignedToId(userId: string): Promise<Task[]> {
    const { data, error } = await supabase.from('tasks').select('*').eq('assigned_to_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data as Task[];
  }

  async getTasksByAssignedById(userId: string): Promise<Task[]> {
    const { data, error } = await supabase.from('tasks').select('*').eq('assigned_by_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data as Task[];
  }

  async getTasksByStatus(status: string): Promise<Task[]> {
    const { data, error } = await supabase.from('tasks').select('*').eq('status', status).order('created_at', { ascending: false });
    if (error) throw error;
    return data as Task[];
  }

  async getTasksByRelatedLeadId(leadId: number): Promise<Task[]> {
    const { data, error } = await supabase.from('tasks').select('*').eq('related_lead_id', leadId).order('created_at', { ascending: false });
    if (error) throw error;
    return data as Task[];
  }

  // Task comments methods (assuming 'task_comments' table)
  // userId in task_comments might become a string if it refers to Supabase Auth user ID.
  async getTaskCommentsByTaskId(taskId: number): Promise<TaskComment[]> {
    // Assuming comment.userId is string if it refers to Supabase Auth user
    const { data, error } = await supabase.from('task_comments').select('*, user:users(id, name:raw->user_metadata->>name, email)') // Example join to get commenter name
                                    .eq('task_id', taskId).order('created_at', { ascending: true });
    if (error) throw error;
    return data as TaskComment[];
  }

  async createTaskComment(insertComment: InsertTaskComment): Promise<TaskComment> {
    // Ensure insertComment.userId is a string if it's a Supabase Auth user ID
    const { data, error } = await supabase.from('task_comments').insert(insertComment as any).select().single();
    if (error) throw error;
    return data as TaskComment;
  }

  async deleteTaskComment(id: number): Promise<boolean> {
    const { error, count } = await supabase.from('task_comments').delete().eq('id', id);
    if (error) return false;
    return (count !== null && count > 0) || count === null;
  }

  // WhatsApp methods (assuming 'whatsapp_messages' table) - Seem mostly fine
  async getWhatsappMessages(leadId: number): Promise<WhatsappMessage[]> {
    const { data, error } = await supabase.from('whatsapp_messages').select('*').eq('lead_id', leadId).order('timestamp', { ascending: true });
    if (error) throw error;
    return data as WhatsappMessage[];
  }

  async getWhatsappMessageById(id: number): Promise<WhatsappMessage | undefined> {
    const { data, error } = await supabase.from('whatsapp_messages').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as WhatsappMessage | undefined;
  }

  async getWhatsappMessageByApiId(messageId: string): Promise<WhatsappMessage | undefined> {
    const { data, error } = await supabase.from('whatsapp_messages').select('*').eq('message_id', messageId).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as WhatsappMessage | undefined;
  }

  async createWhatsappMessage(message: InsertWhatsappMessage): Promise<WhatsappMessage> {
    const { data, error } = await supabase.from('whatsapp_messages').insert(message as any).select().single();
    if (error) throw error;
    return data as WhatsappMessage;
  }

  async updateWhatsappMessageStatus(id: number, status: string): Promise<WhatsappMessage | undefined> {
    const { data, error } = await supabase.from('whatsapp_messages').update({ status }).eq('id', id).select().single();
    if (error && error.code !== 'PGRST204') throw error;
    return data as WhatsappMessage | undefined;
  }

  async updateWhatsappMessageId(id: number, messageId: string): Promise<WhatsappMessage | undefined> {
    const { data, error } = await supabase.from('whatsapp_messages').update({ message_id: messageId }).eq('id', id).select().single();
    if (error && error.code !== 'PGRST204') throw error;
    return data as WhatsappMessage | undefined;
  }

  async deleteWhatsappMessage(id: number): Promise<boolean> {
    const { error, count } = await supabase.from('whatsapp_messages').delete().eq('id', id);
    if (error) return false;
    return (count !== null && count > 0) || count === null;
  }

  // WhatsApp Settings methods (assuming 'whatsapp_settings' table) - Seem mostly fine
  async getWhatsappSettings(): Promise<WhatsappSettings | undefined> {
    const { data, error } = await supabase.from('whatsapp_settings').select('*').order('updated_at', { ascending: false }).limit(1).single();
    if (error && error.code !== 'PGRST116') {
        if (error.code === 'PGRST116') return undefined;
        throw error;
    }
    return data as WhatsappSettings | undefined;
  }

  async saveWhatsappSettings(settings: InsertWhatsappSettings): Promise<WhatsappSettings> {
    // Upsert based on a unique criteria, e.g. if there's a 'name' or if it's always one row.
    // If 'id' is serial and always new, then just insert. The Drizzle schema had serial id.
    // If we want to truly "save" (update existing or create new), we need a consistent key for onConflict.
    // For now, assuming upsert on 'id' if it's meaningful or just insert if 'id' is auto-generated and not passed in.
    // The provided code used upsert({onConflict: 'id'}), which implies id might be set or known.
    // If settings object includes an 'id' for an existing row:
    const { data, error } = await supabase.from('whatsapp_settings').upsert(settings as any, { onConflict: 'id' }).select().single();
    if (error) throw error;
    return data as WhatsappSettings;
  }

  // Google OAuth2 token management (assuming 'google_tokens' table)
  // userId is string (Supabase user UUID)
  async saveGoogleTokens(userId: string, tokens: { access_token: string; refresh_token?: string; expiry_date: number; }): Promise<void> {
    const payload = {
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: new Date(tokens.expiry_date).toISOString(),
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('google_tokens').upsert(payload, { onConflict: 'user_id' });
    if (error) {
      console.error("[SupabaseStorage] Error saving Google tokens:", error.message);
      throw error;
    }
  }

  async getGoogleTokens(userId: string): Promise<{ access_token: string; refresh_token?: string; expiry_date: number; } | null> {
    const { data, error } = await supabase.from('google_tokens').select('*').eq('user_id', userId).single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error("[SupabaseStorage] Error getting Google tokens:", error.message);
      throw error;
    }
    return data ? {
      access_token: data.access_token,
      refresh_token: data.refresh_token || undefined,
      expiry_date: new Date(data.expiry_date).getTime(),
    } : null;
  }

  async deleteGoogleTokens(userId: string): Promise<void> {
    const { error } = await supabase.from('google_tokens').delete().eq('user_id', userId);
     if (error) {
      console.error("[SupabaseStorage] Error deleting Google tokens:", error.message);
      throw error;
    }
  }

  // NEW SCHEDULING SYSTEM METHODS (aulas, agendamentos_recorrentes)
  // professorId and studentId might need to be string UUIDs if they reference Supabase Auth users or profiles linked to them.
  // The Drizzle schema had them as integers. This needs clarification based on actual Supabase schema.
  // For now, assume numeric IDs as per Drizzle schema for these tables, unless specified as string UUID.
  async createAgendamentoRecorrente(agendamento: InsertAgendamentoRecorrente): Promise<AgendamentoRecorrente> {
    // Ensure professor_id and student_id types match table schema (string UUID or number)
    const { data, error } = await supabase.from('agendamentos_recorrentes').insert(agendamento as any).select().single();
    if (error) throw error;
    return data as AgendamentoRecorrente;
  }

  async getAgendamentosRecorrentes(): Promise<AgendamentoRecorrente[]> {
    const { data, error } = await supabase.from('agendamentos_recorrentes').select('*');
    if (error) throw error;
    return data as AgendamentoRecorrente[];
  }

  async updateAgendamentoRecorrente(id: number, agendamento: Partial<InsertAgendamentoRecorrente>): Promise<AgendamentoRecorrente | undefined> {
    const { data, error } = await supabase.from('agendamentos_recorrentes').update({ ...agendamento, updated_at: new Date().toISOString() } as any).eq('id', id).select().single();
    if (error && error.code !== 'PGRST204') throw error;
    return data as AgendamentoRecorrente | undefined;
  }

  async deleteAgendamentoRecorrente(id: number): Promise<boolean> {
    const { error, count } = await supabase.from('agendamentos_recorrentes').delete().eq('id', id);
    if (error) return false;
    return (count !== null && count > 0) || count === null;
  }

  // Aulas methods
  // professor_id and student_id types need to match Supabase schema (string UUID or number)
  async getAulas(filters?: any): Promise<Aula[]> {
    let query = supabase.from('aulas').select('*');
    if (filters) {
      if (filters.startDate) query = query.gte('start_time', new Date(filters.startDate).toISOString());
      if (filters.endDate) query = query.lte('start_time', new Date(filters.endDate).toISOString());
      if (filters.professorId) query = query.eq('professor_id', filters.professorId); // professorId could be string UUID
      if (filters.studentId) query = query.eq('student_id', filters.studentId); // studentId could be number or string UUID
      if (filters.status) query = query.eq('status', filters.status);
    }
    query = query.order('start_time', { ascending: true });
    const { data, error } = await query;
    if (error) throw error;
    return data as Aula[];
  }

  async getAulaById(id: number): Promise<Aula | undefined> {
    const { data, error } = await supabase.from('aulas').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as Aula | undefined;
  }

  async createAula(aula: InsertAula): Promise<Aula> {
    const { data, error } = await supabase.from('aulas').insert(aula as any).select().single();
    if (error) throw error;
    return data as Aula;
  }

  async createMultipleAulas(aulasList: InsertAula[]): Promise<Aula[]> {
    const { data, error } = await supabase.from('aulas').insert(aulasList as any[]).select();
    if (error) throw error;
    return data as Aula[];
  }

  async updateAula(id: number, aula: Partial<InsertAula>): Promise<Aula | undefined> {
    const { data, error } = await supabase.from('aulas').update({ ...aula, updated_at: new Date().toISOString() } as any).eq('id', id).select().single();
    if (error && error.code !== 'PGRST204') throw error;
    return data as Aula | undefined;
  }

  async deleteAula(id: number): Promise<boolean> {
    const { error, count } = await supabase.from('aulas').delete().eq('id', id);
    if (error) return false;
    return (count !== null && count > 0) || count === null;
  }

  async getLeadById(id: number): Promise<Lead | undefined> {
    const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') {
        console.error(`[SupabaseStorage] Error fetching lead by ID ${id}:`, error.message);
        throw error;
    }
    return data as Lead | undefined;
  }

  async checkSchedulingConflicts(professorId: string, studentId: string, startTime: Date, endTime: Date, excludeAulaId?: number): Promise<any> {
    // Assuming professorId is UUID string. studentId could be number (lead_id) or string UUID if students are also users/profiles.
    // For this query, studentId is used in an OR clause, so its type must match the 'student_id' column in 'aulas'.
    // If 'student_id' in 'aulas' refers to a numeric lead ID, then studentId param should be number here.
    // For now, assuming studentId param is string and 'student_id' column in 'aulas' is also string, or it's handled by Supabase.
    let query = supabase.from('aulas').select('id, start_time, end_time, professor_id, student_id')
        .lt('start_time', endTime.toISOString())
        .gt('end_time', startTime.toISOString())
        .or(`professor_id.eq.${professorId},student_id.eq.${studentId}`)
        .neq('status', 'cancelado');

    if (excludeAulaId) {
        query = query.neq('id', excludeAulaId);
    }

    const { data: conflicts, error } = await query.limit(1);

    if (error) {
        console.error("[SupabaseStorage] Error checking scheduling conflicts:", error.message);
        return null;
    }
    return conflicts && conflicts.length > 0 ? conflicts[0] : null;
  }
}

// Initialize storage with Supabase client
export const storage = new SupabaseStorage();