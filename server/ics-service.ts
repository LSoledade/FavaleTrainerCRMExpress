/**
 * Serviço para importação e exportação de arquivos .ics
 * Gerencia eventos de calendário separados por professor
 */

import ical from 'ical-generator';
import * as nodeIcal from 'node-ical';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import { aulas, agendamentosRecorrentes, users, leads } from '../shared/schema';
import { eq, and, between } from 'drizzle-orm';

export interface ICSEvent {
  uid: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  rrule?: string;
  organizer?: {
    name: string;
    email: string;
  };
  attendees?: Array<{
    name: string;
    email: string;
  }>;
}

export interface RecurrencePattern {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval?: number;
  until?: Date;
  count?: number;
  byday?: string[];
}

export interface ImportAnalysis {
  totalEvents: number;
  recurringEvents: number;
  singleEvents: number;
  potentialConflicts: Array<{
    event: ICSEvent;
    conflictType: 'time_overlap' | 'duplicate';
    existingClass?: any;
  }>;
  eventsToImport: ICSEvent[];
}

/**
 * Gera arquivo .ics para um professor específico
 */
export async function generateProfessorICS(
  professorId: number,
  startDate: Date,
  endDate: Date
): Promise<string> {
  try {
    // Buscar dados do professor
    const professor = await db.select()
      .from(users)
      .where(eq(users.id, professorId))
      .limit(1);

    if (professor.length === 0) {
      throw new Error('Professor não encontrado');
    }

    const professorData = professor[0];

    // Buscar aulas do professor no período
    const aulasProfessor = await db.select({
      aula: aulas,
      student: leads,
      professor: users
    })
      .from(aulas)
      .leftJoin(leads, eq(aulas.studentId, leads.id))
      .leftJoin(users, eq(aulas.professorId, users.id))
      .where(
        and(
          eq(aulas.professorId, professorId),
          between(aulas.startTime, startDate, endDate)
        )
      );

    // Buscar agendamentos recorrentes do professor
    const agendamentosRecorrentesProfessor = await db.select({
      agendamento: agendamentosRecorrentes,
      student: leads,
      professor: users
    })
      .from(agendamentosRecorrentes)
      .leftJoin(leads, eq(agendamentosRecorrentes.studentId, leads.id))
      .leftJoin(users, eq(agendamentosRecorrentes.professorId, users.id))
      .where(
        and(
          eq(agendamentosRecorrentes.professorId, professorId),
          eq(agendamentosRecorrentes.active, true)
        )
      );

    // Criar o calendário
    const calendar = ical({
      name: `Agenda - ${professorData.name || professorData.username}`,
      description: `Calendário de aulas do professor ${professorData.name || professorData.username}`,
      timezone: 'America/Sao_Paulo',
      prodId: {
        company: 'Favale Pink',
        product: 'CRM Personal Training',
        language: 'PT-BR'
      }
    });

    // Adicionar aulas individuais
    aulasProfessor.forEach(({ aula, student }) => {
      calendar.createEvent({
        uid: `aula-${aula.id}@favalepink.com`,
        start: aula.startTime,
        end: aula.endTime,
        summary: `${aula.service} - ${student?.name || 'Aluno'}`,
        description: [
          `Aluno: ${student?.name || 'Não especificado'}`,
          `Serviço: ${aula.service}`,
          `Valor: R$ ${(aula.value / 100).toFixed(2)}`,
          `Status: ${getStatusDescription(aula.status)}`,
          aula.notes ? `Observações: ${aula.notes}` : ''
        ].filter(Boolean).join('\n'),
        location: aula.location,
        organizer: {
          name: professorData.name || professorData.username,
          email: professorData.email || `${professorData.username}@favalepink.com`
        }
      });
    });

    // Adicionar agendamentos recorrentes
    agendamentosRecorrentesProfessor.forEach(({ agendamento, student }) => {
      const regras = agendamento.regras as any;
      
      // Calcular duração padrão se não especificada
      const duration = regras.duration || 60; // 60 minutos padrão
      const endTime = new Date(agendamento.startDate.getTime() + duration * 60 * 1000);

      calendar.createEvent({
        start: agendamento.startDate,
        end: endTime,
        summary: `${agendamento.service} - ${student?.name || 'Aluno'} (Recorrente)`,
        description: [
          `Aluno: ${student?.name || 'Não especificado'}`,
          `Serviço: ${agendamento.service}`,
          `Valor: R$ ${(agendamento.value / 100).toFixed(2)}`,
          `Padrão: ${getRecurrenceDescription(regras)}`,
          agendamento.notes ? `Observações: ${agendamento.notes}` : ''
        ].filter(Boolean).join('\n'),
        location: agendamento.location,
        organizer: {
          name: professorData.name || professorData.username,
          email: professorData.email || `${professorData.username}@favalepink.com`
        }
      });
    });

    return calendar.toString();
  } catch (error) {
    console.error('Erro ao gerar arquivo ICS:', error);
    throw new Error(`Falha ao gerar calendário: ${error}`);
  }
}

/**
 * Analisa um arquivo .ics importado
 */
export async function analyzeICSFile(
  icsContent: string,
  professorId: number
): Promise<ImportAnalysis> {
  try {
    const events = nodeIcal.parseICS(icsContent);
    const analysis: ImportAnalysis = {
      totalEvents: 0,
      recurringEvents: 0,
      singleEvents: 0,
      potentialConflicts: [],
      eventsToImport: []
    };

    // Buscar aulas existentes do professor para detectar conflitos
    const existingClasses = await db.select()
      .from(aulas)
      .where(eq(aulas.professorId, professorId));

    for (const key in events) {
      const event = events[key];
      
      if (event.type !== 'VEVENT') continue;

      analysis.totalEvents++;

      const icsEvent: ICSEvent = {
        uid: event.uid || uuidv4(),
        summary: event.summary || 'Evento Importado',
        description: event.description || '',
        start: new Date(event.start),
        end: new Date(event.end),
        location: event.location || '',
        rrule: event.rrule?.toString(),
        organizer: event.organizer ? {
          name: event.organizer.params?.CN || '',
          email: event.organizer.val || ''
        } : undefined,
        attendees: event.attendee ? (Array.isArray(event.attendee) ? event.attendee : [event.attendee]).map(att => ({
          name: att.params?.CN || '',
          email: att.val || ''
        })) : []
      };

      // Verificar se é recorrente
      if (event.rrule) {
        analysis.recurringEvents++;
      } else {
        analysis.singleEvents++;
      }

      // Verificar conflitos de horário
      const conflicts = existingClasses.filter(existingClass => {
        const existingStart = new Date(existingClass.startTime);
        const existingEnd = new Date(existingClass.endTime);
        
        return (
          (icsEvent.start >= existingStart && icsEvent.start < existingEnd) ||
          (icsEvent.end > existingStart && icsEvent.end <= existingEnd) ||
          (icsEvent.start <= existingStart && icsEvent.end >= existingEnd)
        );
      });

      if (conflicts.length > 0) {
        analysis.potentialConflicts.push({
          event: icsEvent,
          conflictType: 'time_overlap',
          existingClass: conflicts[0]
        });
      }

      analysis.eventsToImport.push(icsEvent);
    }

    return analysis;
  } catch (error) {
    console.error('Erro ao analisar arquivo ICS:', error);
    throw new Error(`Falha ao analisar arquivo: ${error}`);
  }
}

/**
 * Importa eventos de um arquivo .ics para o banco de dados
 */
export async function importICSEvents(
  eventsToImport: ICSEvent[],
  professorId: number,
  studentMapping: Record<string, number>, // Mapeamento nome/email -> studentId
  defaultStudentId: number
): Promise<{
  imported: number;
  errors: Array<{ event: ICSEvent; error: string }>;
}> {
  const result = {
    imported: 0,
    errors: [] as Array<{ event: ICSEvent; error: string }>
  };

  for (const event of eventsToImport) {
    try {
      // Determinar o ID do aluno
      let studentId = defaultStudentId;
      
      if (event.attendees && event.attendees.length > 0) {
        const attendee = event.attendees[0];
        const mappedStudentId = studentMapping[attendee.email] || studentMapping[attendee.name];
        if (mappedStudentId) {
          studentId = mappedStudentId;
        }
      }

      if (event.rrule) {
        // Evento recorrente - criar agendamento recorrente
        const regras = parseRRule(event.rrule);
        
        const [agendamento] = await db.insert(agendamentosRecorrentes)
          .values({
            professorId,
            studentId,
            location: event.location || '',
            value: 0, // Valor padrão, pode ser editado depois
            service: event.summary,
            notes: event.description || `Importado de ICS - UID: ${event.uid}`,
            regras,
            startDate: event.start,
            endDate: regras.until || null,
            maxOccurrences: regras.count || null,
            active: true
          })
          .returning();

        result.imported++;
      } else {
        // Evento único - criar aula
        const [aula] = await db.insert(aulas)
          .values({
            professorId,
            studentId,
            startTime: event.start,
            endTime: event.end,
            location: event.location || '',
            value: 0, // Valor padrão, pode ser editado depois
            service: event.summary,
            notes: event.description || `Importado de ICS - UID: ${event.uid}`,
            status: 'agendado' as any
          })
          .returning();

        result.imported++;
      }
    } catch (error) {
      result.errors.push({
        event,
        error: `Erro ao importar evento: ${error}`
      });
    }
  }

  return result;
}

/**
 * Converte RRule string em objeto de regras
 */
function parseRRule(rruleString: string): any {
  const rules: any = {
    type: 'weekly',
    interval: 1
  };

  const parts = rruleString.split(';');
  
  for (const part of parts) {
    const [key, value] = part.split('=');
    
    switch (key) {
      case 'FREQ':
        rules.type = value.toLowerCase();
        break;
      case 'INTERVAL':
        rules.interval = parseInt(value);
        break;
      case 'UNTIL':
        rules.until = new Date(value);
        break;
      case 'COUNT':
        rules.count = parseInt(value);
        break;
      case 'BYDAY':
        const dayMap: Record<string, string> = {
          'SU': 'sunday',
          'MO': 'monday',
          'TU': 'tuesday',
          'WE': 'wednesday',
          'TH': 'thursday',
          'FR': 'friday',
          'SA': 'saturday'
        };
        rules.weekDays = value.split(',').map(day => dayMap[day]).filter(Boolean);
        break;
    }
  }

  return rules;
}

/**
 * Obter descrição do status em português
 */
function getStatusDescription(status: string): string {
  const statusMap: Record<string, string> = {
    'agendado': 'Agendado',
    'confirmado': 'Confirmado',
    'concluido': 'Concluído',
    'cancelado': 'Cancelado',
    'remarcado': 'Remarcado',
    'no_show': 'Faltou'
  };
  return statusMap[status] || status;
}

/**
 * Obter descrição da recorrência
 */
function getRecurrenceDescription(regras: any): string {
  if (regras.type === 'weekly' && regras.weekDays) {
    const dayNames = regras.weekDays.map((day: string) => {
      const dayMap: Record<string, string> = {
        'sunday': 'Dom',
        'monday': 'Seg',
        'tuesday': 'Ter',
        'wednesday': 'Qua',
        'thursday': 'Qui',
        'friday': 'Sex',
        'saturday': 'Sáb'
      };
      return dayMap[day] || day;
    }).join(', ');
    
    return `Semanal (${dayNames})`;
  } else if (regras.type === 'daily') {
    return `Diário (a cada ${regras.interval || 1} dia${regras.interval > 1 ? 's' : ''})`;
  } else if (regras.type === 'monthly') {
    return `Mensal (a cada ${regras.interval || 1} mês${regras.interval > 1 ? 'es' : ''})`;
  }
  
  return 'Personalizado';
}