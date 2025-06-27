import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage, type IStorage } from "./storage";
import { db } from "./db";
import { 
  leads, sessions,
  insertLeadSchema, leadValidationSchema, whatsappMessageValidationSchema,
  taskValidationSchema, taskCommentValidationSchema,
  type Session, type Student, type WhatsappMessage
} from "@shared/schema";
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

// Import new user router and middlewares
import userRouter from "./routes/user.routes";
import leadRouter from "./routes/lead.routes"; // Import lead router
import taskRouter from "./routes/task.routes"; // Import task router
import whatsappRouter from "./routes/whatsapp.routes"; // Import whatsapp router
import auditLogRouter from "./routes/auditLog.routes"; // Import auditLog router
import weatherRouter from "./routes/weather.routes"; // Import weather router
import schedulingRouter from "./routes/scheduling.routes"; // Import scheduling router
import newSchedulingRouter from "./routes/scheduling.routes"; // Import new scheduling router
import statsRouter from "./routes/stats.routes"; // Import stats router
import { isAuthenticated, isAdmin } from "./middlewares/auth.middleware"; // Import middlewares
import { addUserNamesToTasks } from "./utils/task.utils"; // Import addUserNamesToTasks
// Remover integração Google Calendar
// import oauthRoutes from './routes/oauth.routes';

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes and middleware
  setupAuth(app);

  // Use the new routers
  app.use("/api/users", userRouter);
  app.use("/api/leads", leadRouter); // Use lead router
  app.use("/api/tasks", taskRouter); // Use task router
  app.use("/api/whatsapp", whatsappRouter); // Use whatsapp router
  app.use("/api/audit-logs", auditLogRouter); // Use auditLog router
  app.use("/api/weather", weatherRouter); // Use weather router
  app.use("/api/scheduling", schedulingRouter); // Use old scheduling router
  app.use("/api/new-scheduling", newSchedulingRouter); // Use new scheduling router
  app.use("/api/stats", statsRouter); // Use stats router
  // Remover integração Google Calendar
  // app.use('/api/oauth', oauthRoutes);

  // Get all sessions
  app.get('/api/sessions', async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT 
          id,
          start_time as "startTime",
          end_time as "endTime", 
          location,
          source,
          notes,
          status,
          lead_id as "leadId",
          trainer_id as "trainerId",
          value,
          service,
          recurrence_type as "recurrenceType",
          recurrence_interval as "recurrenceInterval",
          recurrence_week_days as "recurrenceWeekDays",
          recurrence_end_type as "recurrenceEndType",
          recurrence_end_date as "recurrenceEndDate",
          recurrence_end_count as "recurrenceEndCount",
          recurrence_group_id as "recurrenceGroupId",
          is_recurrence_parent as "isRecurrenceParent",
          parent_session_id as "parentSessionId"
        FROM sessions 
        ORDER BY start_time ASC
      `);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar sessões:', error);
      res.status(500).json({ message: "Erro ao buscar sessões" });
    }
  });

  // Get all trainers
  app.get('/api/trainers', async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT id, name, email, specialties, source
        FROM trainers 
        ORDER BY name ASC
      `);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar professores:', error);
      res.status(500).json({ message: "Erro ao buscar professores" });
    }
  });

  // Create new session with recurrence support
  app.post('/api/sessions', async (req, res) => {
    try {
      const { 
        startTime, 
        endTime, 
        location, 
        source, 
        leadId, 
        trainerId, 
        notes, 
        status,
        value,
        service,
        recurrenceType,
        recurrenceInterval,
        recurrenceWeekDays,
        recurrenceEndType,
        recurrenceEndDate,
        recurrenceEndCount
      } = req.body;

      if (recurrenceType === 'none') {
        // Single session
        const result = await db.execute(sql`
          INSERT INTO sessions (
            start_time, end_time, location, source, lead_id, trainer_id, 
            notes, status, value, service, recurrence_type
          )
          VALUES (
            ${startTime}, ${endTime}, ${location}, ${source}, ${leadId}, ${trainerId}, 
            ${notes || null}, ${status || 'agendado'}, ${value}, ${service}, ${recurrenceType}
          )
          RETURNING id
        `);
        
        return res.json({ 
          id: result.rows[0].id, 
          message: 'Sessão criada com sucesso',
          recurring: false,
          count: 1
        });
      }

      // Generate recurring sessions
      const recurrenceGroupId = randomUUID();
      const sessions = [];
      const baseStartTime = new Date(startTime);
      const baseEndTime = new Date(endTime);
      let currentDate = new Date(baseStartTime);
      
      // Determine end condition
      const maxSessions = recurrenceEndType === 'count' ? recurrenceEndCount : 100;
      const endDate = recurrenceEndType === 'date' ? new Date(recurrenceEndDate) : null;
      
      let sessionCount = 0;
      
      while (sessionCount < maxSessions) {
        // Check if we've reached the end date
        if (endDate && currentDate > endDate) {
          break;
        }

        // For weekly recurrence, check if current day matches selected days
        if (recurrenceType === 'weekly') {
          const dayNames = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
          const currentDayName = dayNames[currentDate.getDay()];
          
          if (recurrenceWeekDays && recurrenceWeekDays.includes(currentDayName)) {
            const sessionStart = new Date(currentDate);
            sessionStart.setHours(baseStartTime.getHours(), baseStartTime.getMinutes(), 0, 0);
            
            const sessionEnd = new Date(currentDate);
            sessionEnd.setHours(baseEndTime.getHours(), baseEndTime.getMinutes(), 0, 0);
            
            sessions.push({
              startTime: sessionStart.toISOString(),
              endTime: sessionEnd.toISOString(),
              isParent: sessions.length === 0
            });
          }
          
          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
          
          // After checking 7 days, jump by interval weeks
          if (currentDate.getDay() === baseStartTime.getDay()) {
            currentDate.setDate(currentDate.getDate() + (7 * (recurrenceInterval - 1)));
          }
        } else if (recurrenceType === 'daily') {
          const sessionStart = new Date(currentDate);
          sessionStart.setHours(baseStartTime.getHours(), baseStartTime.getMinutes(), 0, 0);
          
          const sessionEnd = new Date(currentDate);
          sessionEnd.setHours(baseEndTime.getHours(), baseEndTime.getMinutes(), 0, 0);
          
          sessions.push({
            startTime: sessionStart.toISOString(),
            endTime: sessionEnd.toISOString(),
            isParent: sessions.length === 0
          });
          
          currentDate.setDate(currentDate.getDate() + recurrenceInterval);
        } else if (recurrenceType === 'monthly') {
          const sessionStart = new Date(currentDate);
          sessionStart.setHours(baseStartTime.getHours(), baseStartTime.getMinutes(), 0, 0);
          
          const sessionEnd = new Date(currentDate);
          sessionEnd.setHours(baseEndTime.getHours(), baseEndTime.getMinutes(), 0, 0);
          
          sessions.push({
            startTime: sessionStart.toISOString(),
            endTime: sessionEnd.toISOString(),
            isParent: sessions.length === 0
          });
          
          currentDate.setMonth(currentDate.getMonth() + recurrenceInterval);
        }
        
        sessionCount++;
        
        // Safety check to prevent infinite loops
        if (sessionCount > 365) break;
      }

      // Insert all sessions using SQL
      let parentSessionId = null;
      const insertedSessions = [];

      for (const session of sessions) {
        const result = await db.execute(sql`
          INSERT INTO sessions (
            start_time, end_time, location, source, lead_id, trainer_id, 
            notes, status, value, service, recurrence_type, recurrence_interval,
            recurrence_week_days, recurrence_end_type, recurrence_end_date, 
            recurrence_end_count, recurrence_group_id, is_recurrence_parent,
            parent_session_id
          )
          VALUES (
            ${session.startTime}, ${session.endTime}, ${location}, ${source}, 
            ${leadId}, ${trainerId}, ${notes}, ${status || 'agendado'}, 
            ${value}, ${service}, ${recurrenceType}, ${recurrenceInterval},
            ${recurrenceWeekDays ? JSON.stringify(recurrenceWeekDays) : null}, ${recurrenceEndType}, ${recurrenceEndDate}, 
            ${recurrenceEndCount}, ${recurrenceGroupId}, ${session.isParent},
            ${parentSessionId}
          )
          RETURNING id
        `);
        
        const sessionId = result.rows[0].id;
        insertedSessions.push(sessionId);
        
        if (session.isParent) {
          parentSessionId = sessionId;
        }
      }

      res.json({ 
        message: 'Sessões criadas com sucesso',
        recurring: true,
        count: insertedSessions.length,
        parentId: parentSessionId,
        groupId: recurrenceGroupId
      });
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      res.status(500).json({ message: "Erro ao criar sessão" });
    }
  });

  // Update session
  app.patch('/api/sessions/:id', async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const updates = req.body;
      
      // Build dynamic update query
      const updateFields = [];
      const values = [];
      
      if (updates.startTime) {
        updateFields.push('start_time = $' + (values.length + 1));
        values.push(updates.startTime);
      }
      if (updates.endTime) {
        updateFields.push('end_time = $' + (values.length + 1));
        values.push(updates.endTime);
      }
      if (updates.location) {
        updateFields.push('location = $' + (values.length + 1));
        values.push(updates.location);
      }
      if (updates.status) {
        updateFields.push('status = $' + (values.length + 1));
        values.push(updates.status);
      }
      if (updates.notes !== undefined) {
        updateFields.push('notes = $' + (values.length + 1));
        values.push(updates.notes);
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({ message: 'Nenhum campo para atualizar' });
      }
      
      updateFields.push('updated_at = NOW()');
      values.push(sessionId);
      
      const query = `UPDATE sessions SET ${updateFields.join(', ')} WHERE id = $${values.length}`;
      
      await db.execute(sql.raw(query, values));
      
      res.json({ message: 'Sessão atualizada com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error);
      res.status(500).json({ message: "Erro ao atualizar sessão" });
    }
  });

  // Get all leads
  app.get('/api/leads', async (req, res) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar leads" });
    }
  });

  // Get lead by ID
  app.get('/api/leads/:id', async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const lead = await storage.getLead(leadId);

      if (!lead) {
        return res.status(404).json({ message: "Lead não encontrado" });
      }

      res.json(lead);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar lead" });
    }
  });

  // Create new lead
  app.post('/api/leads', async (req, res) => {
    try {
      console.log('Recebendo dados para criar lead:', req.body);

      // Primeiro validamos com o schema que aceita data como string (para validar formato)
      const validationResult = leadValidationSchema.safeParse(req.body);

      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        console.error('Erro de validação:', validationError.message);
        return res.status(400).json({ message: validationError.message });
      }

      console.log('Dados validados:', validationResult.data);

      // Garantir que entryDate seja um objeto Date antes de enviar para o banco
      const leadToInsert = {
        ...validationResult.data,
        entryDate: validationResult.data.entryDate instanceof Date 
          ? validationResult.data.entryDate 
          : new Date(validationResult.data.entryDate)
      };

      console.log('Dados convertidos para inserção:', leadToInsert);
      const newLead = await storage.createLead(leadToInsert);

      // Registrar evento de criação de lead
      logAuditEvent(AuditEventType.LEAD_CREATED, req, {
        leadId: newLead.id,
        name: newLead.name,
        source: newLead.source,
        status: newLead.status
      });

      res.status(201).json(newLead);
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      res.status(500).json({ message: "Erro ao criar lead", details: String(error) });
    }
  });

  // Update lead
  app.patch('/api/leads/:id', async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      console.log('Atualizando lead:', req.body);

      // Validar os dados recebidos
      const validationResult = leadValidationSchema.partial().safeParse(req.body);

      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        console.error('Erro de validação na atualização:', validationError.message);
        return res.status(400).json({ message: validationError.message });
      }

      // Preparar os dados para atualização
      let dataToUpdate = validationResult.data;

      // Se entryDate for uma string, converter para Date
      if (dataToUpdate.entryDate && typeof dataToUpdate.entryDate === 'string') {
        try {
          dataToUpdate = {
            ...dataToUpdate,
            entryDate: new Date(dataToUpdate.entryDate)
          };
        } catch (e) {
          console.error('Erro ao converter data:', e);
          return res.status(400).json({ message: "Formato de data inválido" });
        }
      }

      console.log('Dados para atualização:', dataToUpdate);
      const updatedLead = await storage.updateLead(leadId, dataToUpdate);

      if (!updatedLead) {
        return res.status(404).json({ message: "Lead não encontrado" });
      }

      // Registrar evento de atualização de lead
      logAuditEvent(AuditEventType.LEAD_UPDATED, req, {
        leadId: updatedLead.id,
        name: updatedLead.name,
        updatedFields: Object.keys(dataToUpdate),
        statusChange: dataToUpdate.status ? `${updatedLead.status !== dataToUpdate.status ? 'De ' + updatedLead.status + ' para ' + dataToUpdate.status : 'Sem alteração'}` : undefined
      });

      res.json(updatedLead);
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      res.status(500).json({ message: "Erro ao atualizar lead", details: String(error) });
    }
  });

  // Delete lead
  app.delete('/api/leads/:id', async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);

      // Obter informações do lead antes de excluir (para o log de auditoria)
      const leadToDelete = await storage.getLead(leadId);

      if (!leadToDelete) {
        return res.status(404).json({ message: "Lead não encontrado" });
      }

      const success = await storage.deleteLead(leadId);

      if (!success) {
        return res.status(404).json({ message: "Lead não encontrado" });
      }

      // Registrar evento de exclusão de lead
      logAuditEvent(AuditEventType.LEAD_DELETED, req, {
        leadId: leadId,
        name: leadToDelete.name,
        email: leadToDelete.email,
        source: leadToDelete.source,
        status: leadToDelete.status
      });

      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar lead:', error);
      res.status(500).json({ message: "Erro ao deletar lead" });
    }
  });

  // Get all trainers
  app.get('/api/trainers', async (req, res) => {
    try {
      const trainersResult = await db.execute(sql`
        SELECT id, name, email, source, active, specialties, phone
        FROM trainers 
        WHERE active = true
        ORDER BY source, name
      `);
      
      res.json(trainersResult.rows);
    } catch (error) {
      console.error('Erro ao buscar professores:', error);
      res.status(500).json({ message: "Erro ao buscar professores" });
    }
  });

  // Check session conflicts
  app.post('/api/sessions/check-conflicts', async (req, res) => {
    try {
      const { trainerId, date, startTime, endTime } = req.body;
      
      if (!trainerId || !date || !startTime || !endTime) {
        return res.status(400).json({ message: "Parâmetros obrigatórios não fornecidos" });
      }

      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(`${date}T${endTime}`);
      
      // Adicionar 15 minutos de tolerância
      const toleranceStart = new Date(startDateTime.getTime() - 15 * 60000);
      const toleranceEnd = new Date(endDateTime.getTime() + 15 * 60000);

      // Verificar conflitos com sessões existentes
      const conflictsResult = await db.execute(sql`
        SELECT s.*, l.name as student_name
        FROM sessions s
        JOIN leads l ON s.lead_id = l.id
        WHERE s.trainer_id = ${trainerId}
        AND s.status = 'agendado'
        AND DATE(s.start_time) = ${date}
        AND (
          (s.start_time BETWEEN ${toleranceStart.toISOString()} AND ${toleranceEnd.toISOString()})
          OR 
          (s.end_time BETWEEN ${toleranceStart.toISOString()} AND ${toleranceEnd.toISOString()})
          OR
          (s.start_time <= ${startDateTime.toISOString()} AND s.end_time >= ${endDateTime.toISOString()})
        )
      `);

      const conflicts = [];
      
      if (conflictsResult.rows.length > 0) {
        for (const conflict of conflictsResult.rows) {
          const conflictRow = conflict as any;
          conflicts.push({
            type: 'trainer_busy',
            message: `Professor já tem sessão agendada com ${conflictRow.student_name} das ${new Date(conflictRow.start_time as string).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às ${new Date(conflictRow.end_time as string).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
            suggestion: 'Considere agendar 15 minutos antes ou depois do horário conflitante.'
          });
        }
      }

      // Sugerir horários alternativos se houver conflitos
      if (conflicts.length > 0) {
        const suggestedTimes = [];
        const timeSlots = [
          "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", 
          "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
          "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", 
          "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
          "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"
        ];

        // Verificar horários disponíveis
        for (const slot of timeSlots.slice(0, 5)) { // Limitar a 5 sugestões
          const slotStart = new Date(`${date}T${slot}`);
          const slotEnd = new Date(slotStart.getTime() + (endDateTime.getTime() - startDateTime.getTime()));
          
          const slotConflictResult = await db.execute(sql`
            SELECT COUNT(*) as count
            FROM sessions s
            WHERE s.trainer_id = ${trainerId}
            AND s.status = 'agendado'
            AND DATE(s.start_time) = ${date}
            AND (
              (s.start_time BETWEEN ${slotStart.toISOString()} AND ${slotEnd.toISOString()})
              OR 
              (s.end_time BETWEEN ${slotStart.toISOString()} AND ${slotEnd.toISOString()})
              OR
              (s.start_time <= ${slotStart.toISOString()} AND s.end_time >= ${slotEnd.toISOString()})
            )
          `);

          if (parseInt((slotConflictResult.rows[0] as any).count) === 0) {
            suggestedTimes.push({
              start: slot,
              end: slotEnd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            });
          }
        }

        if (suggestedTimes.length > 0) {
          conflicts.push({
            type: 'suggestion',
            message: `Horários disponíveis: ${suggestedTimes.map(t => `${t.start}-${t.end}`).join(', ')}`,
          });
        }
      }

      res.json({ conflicts });
    } catch (error) {
      console.error('Erro ao verificar conflitos:', error);
      res.status(500).json({ message: "Erro ao verificar conflitos" });
    }
  });

  // Get all sessions
  app.get('/api/sessions', async (req, res) => {
    try {
      const sessions = await storage.getSessions();
      res.json(sessions);
    } catch (error) {
      console.error('Erro ao buscar sessões:', error);
      res.status(500).json({ message: "Erro ao buscar sessões" });
    }
  });

  // Create new session
  app.post('/api/sessions', async (req, res) => {
    try {
      const sessionData = {
        ...req.body,
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime)
      };
      
      // Gerar sessões recorrentes se necessário
      if (!sessionData.isOneTime && sessionData.weeklyFrequency && sessionData.weekDays) {
        const recurrenceGroupId = sessionData.recurrenceGroupId || crypto.randomUUID();
        const sessions = [];
        
        // Gerar sessões para as próximas 4 semanas
        for (let week = 0; week < 4; week++) {
          for (const dayName of sessionData.weekDays) {
            const dayIndex = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].indexOf(dayName);
            const sessionDate = new Date(sessionData.startTime);
            sessionDate.setDate(sessionDate.getDate() + (week * 7) + (dayIndex - sessionDate.getDay()));
            
            const endDate = new Date(sessionData.endTime);
            endDate.setDate(endDate.getDate() + (week * 7) + (dayIndex - endDate.getDay()));
            
            const session = await storage.createSession({
              ...sessionData,
              startTime: sessionDate,
              endTime: endDate,
              recurrenceGroupId,
              parentSessionId: week === 0 ? null : sessions[0]?.id || null
            });
            
            sessions.push(session);
          }
        }
        
        res.status(201).json({ sessions, message: `${sessions.length} sessões criadas com sucesso` });
      } else {
        // Sessão avulsa
        const session = await storage.createSession(sessionData);
        res.status(201).json(session);
      }
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      res.status(500).json({ message: "Erro ao criar sessão" });
    }
  });

  // Update session
  app.patch('/api/sessions/:id', async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedSession = await storage.updateSession(sessionId, updates);
      
      if (!updatedSession) {
        return res.status(404).json({ message: "Sessão não encontrada" });
      }
      
      res.json(updatedSession);
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error);
      res.status(500).json({ message: "Erro ao atualizar sessão" });
    }
  });

  // Delete session
  app.delete('/api/sessions/:id', async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const deleted = await storage.deleteSession(sessionId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Sessão não encontrada" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar sessão:', error);
      res.status(500).json({ message: "Erro ao deletar sessão" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}