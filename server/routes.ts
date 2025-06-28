import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import { createServer, type Server } from "http";
// import { storage, type IStorage } from "./storage"; // storage is used by controllers, not directly here
// import { db } from "./db"; // Drizzle db instance - REMOVE
// Drizzle schema and ORM imports - REMOVE
// import {
//   leads, sessions, users, aulas, agendamentosRecorrentes, services,
//   insertLeadSchema, leadValidationSchema, whatsappMessageValidationSchema,
//   taskValidationSchema, taskCommentValidationSchema,
//   type Session, type Student, type WhatsappMessage
// } from "./schema";
// import * as schema from "./schema";
// import { eq, desc, and, or, like, isNull, isNotNull, count, sql as drizzleSql, inArray, gte, lte } from "drizzle-orm";
// import { sql } from 'drizzle-orm';

// import { randomUUID } from "crypto"; // Not used directly
// import { fromZodError } from "zod-validation-error"; // Not used directly
// import { setupAuth } from "./auth"; // Removed, Supabase handles auth
// import { logAuditEvent, AuditEventType, getRecentAuditLogs } from "./audit-log"; // Used by controllers
// import {
//   sendWhatsAppMessage,
//   sendWhatsAppTemplate,
//   checkWhatsAppConnection,
//   formatPhoneNumber,
//   sendWhatsAppImage,
//   getWhatsAppQRCode,
//   checkMessageStatus,
//   saveConfigSettings,
//   getConfigSettings
// } from "./whatsapp-service"; // Used by controllers
// import { getWeatherByCity, checkWeatherService } from "./weather-service"; // Used by controllers
// import { log } from "./vite"; // Not used directly
// import bcrypt from 'bcrypt'; // Not used directly, Supabase handles passwords

// Import new user router and middlewares
import userRouter from "./routes/user.routes";
import leadRouter from "./routes/lead.routes"; // Import lead router
import taskRouter from "./routes/task.routes"; // Import task router
import whatsappRouter from "./routes/whatsapp.routes"; // Import whatsapp router
import auditLogRouter from "./routes/auditLog.routes"; // Import auditLog router
import weatherRouter from "./routes/weather.routes"; // Import weather router
import statsRouter from "./routes/stats.routes"; // Import stats router
import { isAuthenticated, isAdmin, jwtAuthMiddlewareGlobal } from "./middlewares/auth.middleware.js"; // Import middlewares
import { addUserNamesToTasks } from "./utils/task.utils"; // Import addUserNamesToTasks

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply global JWT middleware to try to authenticate user from token
  app.use(jwtAuthMiddlewareGlobal);

  // Authentication routes (e.g., /api/user) will be handled by userRouter or a new authRouter if needed.
  // Supabase handles direct login/registration, so no /api/login, /api/register, /api/logout here.

  // User routes, including fetching current user info
  console.log("Registering route: /api/users");
  app.use("/api/users", userRouter);
  console.log("Registering route: /api/leads");
  app.use("/api/leads", leadRouter); // Use lead router
  console.log("Registering route: /api/tasks");
  app.use("/api/tasks", taskRouter); // Use task router
  console.log("Registering route: /api/whatsapp");
  app.use("/api/whatsapp", whatsappRouter); // Use whatsapp router
  console.log("Registering route: /api/audit-logs");
  app.use("/api/audit-logs", auditLogRouter); // Use auditLog router
  console.log("Registering route: /api/weather");
  app.use("/api/weather", weatherRouter); // Use weather router
  console.log("Registering route: /api/stats");
  app.use("/api/stats", statsRouter); // Use stats router
  
  const httpServer = createServer(app);

  return httpServer;
}
