
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, z } from 'zod'; // Import z

// Helper function to parse date strings or Date objects
const datePreprocess = (arg: any) => {
  if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
  return arg; // Let Zod handle other types / undefined
};

// Lead Validation Schemas
export const baseInsertLeadSchema = z.object({
  entryDate: z.preprocess(datePreprocess, z.date()).optional(),
  name: z.string().min(1, "O nome é obrigatório"),
  email: z.string().min(1, "O e-mail é obrigatório").email("E-mail inválido"),
  phone: z.string().min(1, "O telefone é obrigatório"),
  state: z.string().min(1, "O estado é obrigatório"),
  campaign: z.string().default("Importação em Lote"),
  tags: z.array(z.string()).optional().default([]),
  source: z.string().min(1, "A origem é obrigatória"), // "Favale" or "Pink"
  status: z.string().min(1, "O status é obrigatório"), // "Lead" or "Aluno"
  notes: z.string().optional().nullable(),
});

export const leadValidationSchema = baseInsertLeadSchema.extend({
  // entryDate specific transformations for brazilian format if needed, or keep simple
   entryDate: z.union([
    z.string().transform(val => { // Allow DD/MM/YYYY or other parsable date strings
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
        const [day, month, year] = val.split('/');
        return new Date(`${year}-${month}-${day}T00:00:00Z`); // Ensure parsing as specific time if needed
      }
      const parsedDate = new Date(val);
      return isNaN(parsedDate.getTime()) ? val : parsedDate; // Return original string if unparsable to let Zod catch it
    }),
    z.date()
  ]).refine(value => value instanceof Date && !isNaN(value.getTime()), {
    message: "Data de entrada precisa ser uma data válida"
  }).optional(), // Make it optional as base already has it
});


// Professor Validation (subset of User, specific for professor creation/update)
// Note: Supabase handles user creation and password hashing.
// This schema is for validating data specific to a professor profile/role.
export const professorValidationSchema = z.object({
  email: z.string().min(1, "O e-mail é obrigatório").email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres").optional(), // Optional on update
  name: z.string().min(1, "O nome é obrigatório"),
  phone: z.string().optional().nullable(),
  specialties: z.array(z.string()).optional().nullable(),
  // role: z.enum(["admin", "professor"]).default("professor"), // Role is handled by Supabase app_metadata
  active: z.boolean().default(true).optional(),
});

// Trainer Validation (if 'trainers' is a separate table)
export const trainerValidationSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  email: z.string().min(1, "O e-mail é obrigatório").email("E-mail inválido"),
  phone: z.string().optional().nullable(),
  specialties: z.array(z.string()).optional().nullable(),
  source: z.enum(["Favale", "Pink", "FavalePink"]),
  active: z.boolean().optional().default(true),
});

// Student Validation (if 'students' is a separate table)
export const studentValidationSchema = z.object({
  leadId: z.number().int().positive("ID do lead inválido").optional().nullable(),
  address: z.string().optional().nullable(),
  preferences: z.string().optional().nullable(),
  source: z.string().min(1, "A origem é obrigatória"),
  active: z.boolean().optional().default(true),
});

// Session Validation
export const sessionBaseValidationSchema = z.object({
  startTime: z.preprocess(datePreprocess, z.date({ errorMap: () => ({ message: "Horário de início precisa ser uma data válida" }) })),
  endTime: z.preprocess(datePreprocess, z.date({ errorMap: () => ({ message: "Horário de término precisa ser uma data válida" }) })),
  leadId: z.number().int().positive("ID do aluno inválido"), // Assuming leadId is still numeric
  trainerId: z.string().uuid("ID do professor inválido"), // Assuming trainerId is a Supabase User UUID
  location: z.string().min(1, "O local é obrigatório"),
  value: z.number().int().positive("O valor deve ser maior que zero").optional().nullable(),
  service: z.string().min(1, "O serviço é obrigatório").optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["agendado", "concluído", "cancelado", "remarcado"]),
  source: z.enum(["Favale", "Pink", "FavalePink"]),
  // Recurrence fields (simplified for this example, expand as needed)
  recurrenceType: z.enum(["none", "daily", "weekly", "monthly", "yearly", "custom"]).default("none").optional().nullable(),
  // ... other recurrence fields
});

export const sessionValidationSchema = sessionBaseValidationSchema.refine(
  data => data.endTime > data.startTime,
  {
    message: "O horário de término deve ser posterior ao horário de início",
    path: ["endTime"],
  }
);

// WhatsApp Message Validation
export const whatsappMessageValidationSchema = z.object({
  leadId: z.number().int().positive("ID do lead inválido"),
  direction: z.enum(["incoming", "outgoing"]),
  content: z.string().min(1, "O conteúdo da mensagem é obrigatório"),
  status: z.enum(["pending", "sent", "delivered", "read", "failed", "received"]),
  mediaUrl: z.string().url("URL de mídia inválida").optional().nullable(),
  mediaType: z.enum(["image", "audio", "video", "document"]).optional().nullable(),
  messageId: z.string().optional().nullable(),
});

// Task Validation
export const taskValidationSchema = z.object({
  title: z.string().min(1, "O título é obrigatório"),
  description: z.string().optional().nullable(),
  assignedById: z.string().uuid("ID do usuário que atribuiu a tarefa inválido"), // Supabase User ID
  assignedToId: z.string().uuid("ID do usuário atribuído inválido"), // Supabase User ID
  dueDate: z.preprocess(datePreprocess, z.date().nullable()).optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  status: z.enum(["backlog", "pending", "in_progress", "completed", "cancelled"]).default("pending"),
  relatedLeadId: z.number().int().positive("ID do lead inválido").optional().nullable(),
});

// Task Comment Validation
export const taskCommentValidationSchema = z.object({
  taskId: z.number().int().positive("ID da tarefa inválido"),
  userId: z.string().uuid("ID do usuário inválido"), // Supabase User ID
  content: z.string().min(1, "O conteúdo é obrigatório"),
});

// AgendamentoRecorrente Validation (New Scheduling System)
export const agendamentoRecorrenteValidationSchema = z.object({
  professorId: z.string().uuid("ID do professor inválido"), // Supabase User ID
  studentId: z.number().int().positive("ID do aluno inválido"), // Lead ID
  location: z.string().min(1, "O local é obrigatório"),
  value: z.number().int().positive("O valor deve ser maior que zero"),
  service: z.string().min(1, "O serviço é obrigatório"),
  notes: z.string().optional().nullable(),
  regras: z.record(z.any()), // JSON with recurrence rules
  startDate: z.preprocess(datePreprocess, z.date({ errorMap: () => ({ message: "Data de início precisa ser uma data válida" }) })),
  endDate: z.preprocess(datePreprocess, z.date().nullable()).optional(),
  maxOccurrences: z.number().int().positive("Número máximo de ocorrências deve ser positivo").optional().nullable(),
  active: z.boolean().default(true).optional(),
});

// Aula Validation (New Scheduling System)
export const aulaValidationSchemaBase = z.object({
  agendamentoRecorrenteId: z.number().int().positive("ID do agendamento recorrente inválido").optional().nullable(),
  professorId: z.string().uuid("ID do professor inválido"), // Supabase User ID
  studentId: z.number().int().positive("ID do aluno inválido"), // Lead ID
  startTime: z.preprocess(datePreprocess, z.date({ errorMap: () => ({ message: "Horário de início precisa ser uma data válida" }) })),
  endTime: z.preprocess(datePreprocess, z.date({ errorMap: () => ({ message: "Horário de término precisa ser uma data válida" }) })),
  location: z.string().min(1, "O local é obrigatório"),
  value: z.number().int().positive("O valor deve ser maior que zero"),
  service: z.string().min(1, "O serviço é obrigatório"),
  notes: z.string().optional().nullable(),
  status: z.enum(["agendado", "em_andamento", "concluido", "cancelado", "remarcado"]).default("agendado"),
  isModified: z.boolean().default(false).optional(),
  originalStartTime: z.preprocess(datePreprocess, z.date().nullable()).optional(),
  originalEndTime: z.preprocess(datePreprocess, z.date().nullable()).optional(),
});

export const aulaValidationSchema = aulaValidationSchemaBase.refine(
  data => data.endTime > data.startTime,
  {
    message: "O horário de término deve ser posterior ao horário de início",
    path: ["endTime"],
  }
);


// Middleware functions (already existed)
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Dados inválidos',
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Parâmetros inválidos',
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Query parameters inválidos',
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};
