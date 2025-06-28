import { 
  leads, students, trainers, sessions, sessionHistory, whatsappMessages,
  tasks, taskComments, // These are Drizzle schema objects
  type Lead, type InsertLead, // These are Drizzle-generated types
  // type User, type InsertUser, // Drizzle User types, replaced by SupabaseUser
  type Student, type InsertStudent, // Drizzle-generated types
  type Trainer, type InsertTrainer, // Drizzle-generated types
  type Session, type InsertSession,
  type SessionHistory, type InsertSessionHistory,
  type WhatsappMessage, type InsertWhatsappMessage,
  type Task, type InsertTask,
  type TaskComment, type InsertTaskComment,
  users,
  sessionHistory as sessionHistoryTable,
  whatsappSettings, InsertWhatsappSettings, WhatsappSettings,
  // New scheduling system imports
  agendamentosRecorrentes, aulas,
  type AgendamentoRecorrente, type InsertAgendamentoRecorrente,
  type Aula, type InsertAula
} from "./schema"; // Drizzle schema, may need to be replaced or adapted
// import { db } from "./db"; // Drizzle db instance, will be replaced by Supabase client
import { supabase } from "./supabase.js"; // Supabase client
// import { eq, and, desc, asc, between, inArray, or, like, sql, SQL } from "drizzle-orm"; // Drizzle operators
// import { alias } from "drizzle-orm/pg-core"; // Drizzle alias

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
  getSessionsByTrainerId(trainerId: number): Promise<Session[]>;
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
  getTasksByAssignedToId(userId: number): Promise<Task[]>;
  getTasksByAssignedById(userId: number): Promise<Task[]>;
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
  saveGoogleTokens(userId: number, tokens: {
    access_token: string;
    refresh_token?: string;
    expiry_date: number;
  }): Promise<void>;
  getGoogleTokens(userId: number): Promise<{
    access_token: string;
    refresh_token?: string;
    expiry_date: number;
  } | null>;
  deleteGoogleTokens(userId: number): Promise<void>;

  // New Scheduling System methods
  // Agendamentos Recorrentes
  createAgendamentoRecorrente(agendamento: any): Promise<any>;
  getAgendamentosRecorrentes(): Promise<any[]>;
  updateAgendamentoRecorrente(id: number, agendamento: any): Promise<any>;
  deleteAgendamentoRecorrente(id: number): Promise<boolean>;

  // Aulas (individual class instances)
  getAulas(filters?: any): Promise<any[]>;
  getAulaById(id: number): Promise<any | undefined>;
  createAula(aula: any): Promise<any>;
  createMultipleAulas(aulas: any[]): Promise<any[]>;
  updateAula(id: number, aula: any): Promise<any>;
  deleteAula(id: number): Promise<boolean>;
  
  // Lead helpers
  getLeadById(id: number): Promise<Lead | undefined>; // Keep if useful, adapt to Supabase
  
  // Conflict checking for scheduling
  checkSchedulingConflicts(professorId: string, studentId: string, startTime: Date, endTime: Date, excludeAulaId?: number): Promise<any>; // ids are strings
}

export class SupabaseStorage implements IStorage {
  
  // User/Professor methods using Supabase Auth
  async getUserById(id: string): Promise<SupabaseUser | undefined> {
    // This typically requires admin privileges if fetching arbitrary users.
    // If fetching the currently authenticated user, client-side supabase.auth.getUser() is preferred.
    // For this backend context, assuming an admin-like capability or specific use case.
    console.warn(`[SupabaseStorage] getUserById: Fetching user ${id}. Ensure admin privileges if not current user.`);
    const { data, error } = await supabase.auth.admin.getUserById(id);
    if (error) {
      console.error(`[SupabaseStorage] Error fetching user by ID ${id}:`, error.message);
      return undefined;
    }
    return data.user as SupabaseUser;
  }

  async getUserByEmail(email: string): Promise<SupabaseUser | undefined> {
    // Supabase doesn't have a direct admin method to get user by email without listing all users.
    // This might need a profiles table or a more complex query if strictly needed on backend.
    // For now, this is a placeholder and might be inefficient or require a different approach.
    console.warn("[SupabaseStorage] getUserByEmail: This method might be inefficient with Supabase admin API.");
    const { data, error } = await supabase.auth.admin.listUsers({ email }); // Not a direct filter, check Supabase docs
     if (error) {
      console.error(`[SupabaseStorage] Error listing users by email ${email}:`, error.message);
      return undefined;
    }
    // This lists users, then we'd have to find the exact match.
    const user = data.users.find(u => u.email === email);
    return user as SupabaseUser | undefined;
  }

  async getAllProfessors(): Promise<SupabaseUser[]> {
    // Fetches all users and filters by a role in app_metadata.
    // This can be inefficient for a large number of users.
    // A 'profiles' table with a 'role' column queryable via PostgREST would be better.
    console.warn("[SupabaseStorage] getAllProfessors: Fetching all users and filtering. Consider a 'profiles' table for efficiency.");
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 }); // Adjust perPage as needed
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

    const app_metadata = { ...otherMetadata.app_metadata, role: 'professor' };
    if (otherMetadata.name) delete otherMetadata.name; // Assuming name goes to user_metadata or a profiles table

    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password, // Optional: if not provided, Supabase sends an invite
      email_confirm: true, // Or false, depending on flow
      app_metadata: app_metadata,
      user_metadata: { ...otherMetadata.user_metadata, name: professorData.name }, // Example: store name here
    });

    if (error) {
      console.error("[SupabaseStorage] Error creating professor:", error.message);
      throw new Error(`Failed to create professor: ${error.message}`);
    }
    return data.user as SupabaseUser;
  }

  async updateProfessor(id: string, professorData: Partial<SupabaseUser>): Promise<SupabaseUser | undefined> {
    console.log(`[SupabaseStorage] Updating professor ${id} with data:`, professorData);
    // app_metadata and user_metadata should be updated carefully.
    // Supabase merges, so provide only fields to change.
    const updatePayload: any = {};
    if (professorData.app_metadata) updatePayload.app_metadata = professorData.app_metadata;
    if (professorData.user_metadata) updatePayload.user_metadata = professorData.user_metadata;
    if (professorData.password) updatePayload.password = professorData.password; // For password changes
    if (professorData.email) updatePayload.email = professorData.email; // For email changes (triggers confirmation)


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
    // This needs to query the 'aulas' or 'sessions' table where professorId matches.
    // Assuming 'aulas' table and 'professorId' (UUID string) column.
    console.log(`[SupabaseStorage] Checking scheduled classes for professor ${professorId}`);
    const now = new Date().toISOString();
    const { data, error, count } = await supabase
      .from('aulas') // Replace 'aulas' with your actual table name for classes/sessions
      .select('id', { count: 'exact', head: true })
      .eq('professor_id', professorId) // Ensure column name is correct, e.g., professor_id
      .gt('start_time', now) // Assuming 'start_time' column
      .neq('status', 'cancelado'); // Assuming 'status' column

    if (error) {
      console.error("[SupabaseStorage] Error checking scheduled classes:", error.message);
      return false; // Or throw error, depending on desired behavior
    }
    return (count || 0) > 0;
    } catch (error) {
      console.error("Erro ao verificar aulas agendadas:", error);
      return false;
    }
  }

  // Lead methods - using Supabase client for 'leads' table
  async getLeads(): Promise<Lead[]> {
    const { data, error } = await supabase.from('leads').select('*');
    if (error) {
      console.error("[SupabaseStorage] Error fetching leads:", error.message);
      throw error;
    }
    return data as Lead[];
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') { // PGRST116: "Searched item was not found"
      console.error(`[SupabaseStorage] Error fetching lead ${id}:`, error.message);
      throw error;
    }
    return data as Lead | undefined;
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    // Ensure entryDate is correctly formatted if it's part of InsertLead
    const leadToInsert = { ...insertLead };
    if (leadToInsert.entryDate && !(leadToInsert.entryDate instanceof Date)) {
        leadToInsert.entryDate = new Date(leadToInsert.entryDate);
    }
    // Convert Date objects to ISO strings if your Supabase column expects timestamptz or date string
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
      // If the error is "No rows found", it means the lead doesn't exist, which can be treated as undefined.
      if (error.code === 'PGRST204') return undefined; // PGRST204: No Content (update/delete returned no rows)
      throw error;
    }
    return data as Lead | undefined;
  }

  async deleteLead(id: number): Promise<boolean> {
    // Consider related data, e.g., deleting associated whatsapp_messages if necessary
    // This might involve a transaction or multiple calls if RLS/policies don't handle cascades.
    // For now, just deleting the lead.
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) {
      console.error(`[SupabaseStorage] Error deleting lead ${id}:`, error.message);
      return false;
    }
    return true;
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
    // This might need a more sophisticated search, e.g., using textSearch or ilike for partial matches.
    // For exact match on a cleaned phone number (assuming phone column stores it cleaned):
    const { data, error } = await supabase.from('leads').select('*').like('phone', `%${cleanPhone}%`); // Basic partial match
    if (error) throw error;
    return data as Lead[];
  }

  // Batch operations might need to be re-evaluated. Supabase JS client doesn't support batch updates/deletes in one go like Drizzle's `inArray`.
  // You'd typically loop and perform individual operations, or use a Supabase Edge Function.
  async updateLeadsInBatch(ids: number[], updates: Partial<InsertLead>): Promise<number> {
    console.warn("[SupabaseStorage] updateLeadsInBatch: Performing individual updates. Consider Edge Function for true batching.");
    let successCount = 0;
    for (const id of ids) {
      const updated = await this.updateLead(id, updates);
      if (updated) successCount++;
    }
    return successCount;
  }

  async deleteLeadsInBatch(ids: number[]): Promise<number> {
    console.warn("[SupabaseStorage] deleteLeadsInBatch: Performing individual deletes. Consider Edge Function for true batching.");
    let successCount = 0;
    for (const id of ids) {
      const deleted = await this.deleteLead(id);
      if (deleted) successCount++;
    }
    return successCount;
  }

  // Trainer methods: Assuming 'trainers' is a table in Supabase.
  // If trainers are just users with a 'trainer' role, these methods would be similar to professor methods.
  // For this example, let's assume 'trainers' is a separate table like 'leads'.
  // The Trainer type would need to match the table structure.
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
    const { error } = await supabase.from('trainers').delete().eq('id', id);
    return !error;
  }

  async getActiveTrainers(): Promise<Trainer[]> {
    const { data, error } = await supabase.from('trainers').select('*').eq('active', true).order('name');
    if (error) throw error;
    return data as Trainer[];
  }

  async getTrainersBySpecialty(specialty: string): Promise<Trainer[]> {
    // Assuming 'specialties' is an array column (e.g., text[])
    const { data, error } = await supabase.from('trainers').select('*').contains('specialties', [specialty]);
    if (error) throw error;
    return data as Trainer[];
  }


  // Student methods: Assuming 'students' table.
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
    const { data, error } = await supabase.from('students').select('*').eq('lead_id', leadId).single();
    if (error && error.code !== 'PGRST116') throw error;
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
    const { error } = await supabase.from('students').delete().eq('id', id);
    return !error;
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
    // This requires a join. Supabase syntax for this is:
    // rpc call or a view, or fetching students then leads separately and merging.
    // Simple approach: fetch students, then for each student with lead_id, fetch lead. Less efficient.
    // Better: supabase.from('students').select('*, leads(*)') if FK is set up.
    const { data: studentsData, error } = await supabase.from('students').select('*, leads ( * )');
    if (error) {
      console.error("[SupabaseStorage] Error in getStudentsWithLeadInfo:", error.message);
      throw error;
    }
    // The result will have 'leads' nested if the relationship is defined in Supabase.
    // Adapt the return type and mapping accordingly.
    return studentsData as (Student & { lead: Lead | null })[];
  }

  // Session methods (assuming 'sessions' table)
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
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    return !error;
  }

  async getSessionsByStudentId(studentId: number): Promise<Session[]> {
    // Assuming studentId in 'sessions' table is 'student_id' or 'lead_id'
    const { data, error } = await supabase.from('sessions').select('*').eq('lead_id', studentId).order('start_time', { ascending: false });
    if (error) throw error;
    return data as Session[];
  }

  async getSessionsByTrainerId(trainerId: number): Promise<Session[]> { // trainerId might be string (UUID) now
     const { data, error } = await supabase.from('sessions').select('*').eq('trainer_id', trainerId).order('start_time', { ascending: false });
    if (error) throw error;
    return data as Session[];
  }

  async getSessionsByDateRange(startDate: Date, endDate: Date): Promise<Session[]> {
    const { data, error } = await supabase.from('sessions').select('*')
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString()) // or 'end_time' depending on logic for range
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
    // This is a complex join. Best handled by a Supabase View or RPC function, or multiple queries.
    // Example with client-side join (less efficient for large data):
    // 1. Fetch sessions
    // 2. For each session, fetch student (with lead) and trainer details.
    // OR, if FKs are set up: supabase.from('sessions').select('*, students(*, leads(*)), trainers(*)')
    console.warn("[SupabaseStorage] getSessionsWithDetails: Using nested selects. Consider a DB view or RPC for performance.");
    const { data, error } = await supabase.from('sessions').select(`
      id, start_time, end_time, location, notes, status, source, created_at, updated_at,
      student:students (id, source, address, lead:leads (name, email, phone)),
      trainer:trainers (id, name, email, phone, specialties)
    `).order('start_time', { ascending: false });

    if (error) {
      console.error("[SupabaseStorage] Error in getSessionsWithDetails:", error.message);
      throw error;
    }
    // Map to desired structure if needed, Supabase might return nested objects directly.
    return data.map((s: any) => ({
        ...s, // session fields
        student: s.students ? { ...s.students, ...s.students.leads } : null, // flatten student and lead
        trainer: s.trainers
    }));
  }

  async getCompletedSessionsByStudent(studentId: number, startDate?: Date, endDate?: Date): Promise<Session[]> {
    let query = supabase.from('sessions').select('*')
      .eq('lead_id', studentId)
      .eq('status', 'concluido');
    if (startDate) query = query.gte('start_time', startDate.toISOString());
    if (endDate) query = query.lte('start_time', endDate.toISOString());
    query = query.order('start_time', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;
    return data as Session[];
  }

  // Session history methods (assuming 'session_history' table)
  async createSessionHistory(history: InsertSessionHistory): Promise<SessionHistory> {
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
  // Note: assigned_to_id, assigned_by_id might become UUID strings if they refer to Supabase users.
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
    // Consider deleting related task_comments first or use DB cascade.
    await supabase.from('task_comments').delete().eq('task_id', id); // Example pre-delete
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    return !error;
  }

  async getTasksByAssignedToId(userId: string): Promise<Task[]> { // userId is UUID string
    const { data, error } = await supabase.from('tasks').select('*').eq('assigned_to_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data as Task[];
  }

  async getTasksByAssignedById(userId: string): Promise<Task[]> { // userId is UUID string
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
  async getTaskCommentsByTaskId(taskId: number): Promise<TaskComment[]> {
    const { data, error } = await supabase.from('task_comments').select('*').eq('task_id', taskId).order('created_at', { ascending: true });
    if (error) throw error;
    return data as TaskComment[];
  }

  async createTaskComment(insertComment: InsertTaskComment): Promise<TaskComment> {
    const { data, error } = await supabase.from('task_comments').insert(insertComment as any).select().single();
    if (error) throw error;
    return data as TaskComment;
  }

  async deleteTaskComment(id: number): Promise<boolean> {
    const { error } = await supabase.from('task_comments').delete().eq('id', id);
    return !error;
  }

  // WhatsApp methods (assuming 'whatsapp_messages' table)
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
    const { error } = await supabase.from('whatsapp_messages').delete().eq('id', id);
    return !error;
  }

  // WhatsApp Settings methods (assuming 'whatsapp_settings' table)
  async getWhatsappSettings(): Promise<WhatsappSettings | undefined> {
    const { data, error } = await supabase.from('whatsapp_settings').select('*').order('updated_at', { ascending: false }).limit(1).single();
    if (error && error.code !== 'PGRST116') { // Allow not found
        if (error.code === 'PGRST116') return undefined; // Explicitly return undefined if not found
        throw error;
    }
    return data as WhatsappSettings | undefined;
  }

  async saveWhatsappSettings(settings: InsertWhatsappSettings): Promise<WhatsappSettings> {
    // Upsert logic: try to update if a record exists, else insert.
    // Or, always insert a new one as Drizzle version did. For simplicity, let's try upsert.
    // This assumes 'id' is the primary key or a unique constraint for upsert.
    // If there's no single unique row to identify for upsert, always insert.
    const { data, error } = await supabase.from('whatsapp_settings').upsert(settings as any, { onConflict: 'id' }).select().single(); // Adjust onConflict as needed
    if (error) throw error;
    return data as WhatsappSettings;
  }

  // Google OAuth2 token management (assuming 'google_tokens' table)
  // userId here might be Supabase user UUID string.
  async saveGoogleTokens(userId: string, tokens: { access_token: string; refresh_token?: string; expiry_date: number; }): Promise<void> {
    const payload = {
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: new Date(tokens.expiry_date).toISOString(), // Ensure it's ISO string
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
      if (error.code === 'PGRST116') return null; // Not found
      console.error("[SupabaseStorage] Error getting Google tokens:", error.message);
      throw error;
    }
    return data ? {
      access_token: data.access_token,
      refresh_token: data.refresh_token || undefined,
      expiry_date: new Date(data.expiry_date).getTime(), // Convert ISO string back to timestamp number
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
  // These will also need to be converted to use Supabase client.
  // Example for one:
  async createAgendamentoRecorrente(agendamento: InsertAgendamentoRecorrente): Promise<AgendamentoRecorrente> {
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
    const { error } = await supabase.from('agendamentos_recorrentes').delete().eq('id', id);
    return !error;
  }

  // Aulas methods
  async getAulas(filters?: any): Promise<Aula[]> {
    let query = supabase.from('aulas').select('*');
    if (filters) {
      if (filters.startDate) query = query.gte('start_time', new Date(filters.startDate).toISOString());
      if (filters.endDate) query = query.lte('start_time', new Date(filters.endDate).toISOString()); // Assuming filter on start_time
      if (filters.professorId) query = query.eq('professor_id', filters.professorId); // Ensure correct column name
      if (filters.studentId) query = query.eq('student_id', filters.studentId); // Ensure correct column name
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
    const { error } = await supabase.from('aulas').delete().eq('id', id);
    return !error;
  }

  async getLeadById(id: number): Promise<Lead | undefined> { // Re-implementing with Supabase
    const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') {
        console.error(`[SupabaseStorage] Error fetching lead by ID ${id}:`, error.message);
        throw error;
    }
    return data as Lead | undefined;
  }

  async checkSchedulingConflicts(professorId: string, studentId: string, startTime: Date, endTime: Date, excludeAulaId?: number): Promise<any> {
    let query = supabase.from('aulas').select('id, start_time, end_time, professor_id, student_id')
        .lt('start_time', endTime.toISOString())
        .gt('end_time', startTime.toISOString()) // Check for overlapping time
        .or(`professor_id.eq.${professorId},student_id.eq.${studentId}`) // Same professor OR same student
        .neq('status', 'cancelado');

    if (excludeAulaId) {
        query = query.neq('id', excludeAulaId);
    }

    const { data: conflicts, error } = await query.limit(1);

    if (error) {
        console.error("[SupabaseStorage] Error checking scheduling conflicts:", error.message);
        return null; // Or throw
    }
    return conflicts && conflicts.length > 0 ? conflicts[0] : null;
  }
}

// Initialize storage with Supabase client
export const storage = new SupabaseStorage();