import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage, type IStorage } from "./storage";
import { db } from "./db";
import { 
  leads, sessions, users, aulas, agendamentosRecorrentes, services,
  insertLeadSchema, leadValidationSchema, whatsappMessageValidationSchema,
  taskValidationSchema, taskCommentValidationSchema,
  type Session, type Student, type WhatsappMessage
} from "./schema";
import * as schema from "./schema";
import { eq, desc, and, or, like, isNull, isNotNull, count, sql as drizzleSql, inArray, gte, lte } from "drizzle-orm";
import { randomUUID } from "crypto";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";
import { logAuditEvent, AuditEventType, getRecentAuditLogs } from "./audit-log";
import { 
  sendWhatsAppMessage, 
  sendWhatsAppTemplate, 
  checkWhatsAppConnection, 
  formatPhoneNumber, 
  sendWhatsAppImage,
  getWhatsAppQRCode,
  checkMessageStatus,
  saveConfigSettings,
  getConfigSettings
} from "./whatsapp-service";
import { getWeatherByCity, checkWeatherService } from "./weather-service";
import { log } from "./vite";
import { sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';

// Import new user router and middlewares
import userRouter from "./routes/user.routes";
import leadRouter from "./routes/lead.routes"; // Import lead router
import taskRouter from "./routes/task.routes"; // Import task router
import whatsappRouter from "./routes/whatsapp.routes"; // Import whatsapp router
import auditLogRouter from "./routes/auditLog.routes"; // Import auditLog router
import weatherRouter from "./routes/weather.routes"; // Import weather router
import schedulingRouter from "./routes/scheduling.routes"; // Import scheduling router
import statsRouter from "./routes/stats.routes"; // Import stats router
import { isAuthenticated, isAdmin } from "./middlewares/auth.middleware"; // Import middlewares
import { addUserNamesToTasks } from "./utils/task.utils"; // Import addUserNamesToTasks

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes and middleware
  setupAuth(app);

   Use the new routers
   app.use("/api/users", userRouter);
   app.use("/api/leads", leadRouter); // Use lead router
   app.use("/api/tasks", taskRouter); // Use task router
   app.use("/api/whatsapp", whatsappRouter); // Use whatsapp router
   app.use("/api/audit-logs", auditLogRouter); // Use auditLog router
   app.use("/api/weather", weatherRouter); // Use weather router
   app.use("/api/scheduling", schedulingRouter); // Use old scheduling router
   app.use("/api/stats", statsRouter); // Use stats router
  
  const httpServer = createServer(app);

  return httpServer;
}
