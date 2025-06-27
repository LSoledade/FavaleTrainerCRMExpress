/**
 * Serviço simplificado para importação e exportação de arquivos .ics
 * Foca na funcionalidade principal sem problemas de compatibilidade
 */

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
 * Gera conteúdo .ics manualmente para um professor específico
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

    // Gerar conteúdo ICS manualmente
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Favale Pink//CRM Personal Training//PT-BR',
      `X-WR-CALNAME:Agenda - ${professorData.name || professorData.username}`,
      'X-WR-TIMEZONE:America/Sao_Paulo',
      'CALSCALE:GREGORIAN'
    ].join('\r\n');

    // Adicionar aulas individuais
    aulasProfessor.forEach(({ aula, student }) => {
      const startTime = formatDateToICS(aula.startTime);
      const endTime = formatDateToICS(aula.endTime);
      
      icsContent += '\r\n' + [
        'BEGIN:VEVENT',
        `UID:aula-${aula.id}@favalepink.com`,
        `DTSTART:${startTime}`,
        `DTEND:${endTime}`,
        `SUMMARY:${escapeICSText(aula.service)} - ${escapeICSText(student?.name || 'Aluno')}`,
        `DESCRIPTION:${escapeICSText([
          `Aluno: ${student?.name || 'Não especificado'}`,
          `Serviço: ${aula.service}`,
          `Valor: R$ ${(aula.value / 100).toFixed(2)}`,
          `Status: ${getStatusDescription(aula.status)}`,
          aula.notes ? `Observações: ${aula.notes}` : ''
        ].filter(Boolean).join('\\n'))}`,
        `LOCATION:${escapeICSText(aula.location)}`,
        `ORGANIZER;CN=${escapeICSText(professorData.name || professorData.username)}:MAILTO:${professorData.email || `${professorData.username}@favalepink.com`}`,
        student?.email ? `ATTENDEE;CN=${escapeICSText(student.name)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION:MAILTO:${student.email}` : '',
        `CREATED:${formatDateToICS(new Date())}`,
        `LAST-MODIFIED:${formatDateToICS(aula.updatedAt)}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      ].filter(Boolean).join('\r\n');
    });

    // Adicionar agendamentos recorrentes
    agendamentosRecorrentesProfessor.forEach(({ agendamento, student }) => {
      const regras = agendamento.regras as any;
      const duration = regras.duration || 60; // 60 minutos padrão
      const endTime = new Date(agendamento.startDate.getTime() + duration * 60 * 1000);
      
      const startTime = formatDateToICS(agendamento.startDate);
      const endTimeFormatted = formatDateToICS(endTime);
      
      let rrule = '';
      if (regras.type === 'weekly' && regras.weekDays) {
        const byDay = regras.weekDays.map((day: string) => {
          const dayMap: Record<string, string> = {
            'sunday': 'SU',
            'monday': 'MO',
            'tuesday': 'TU',
            'wednesday': 'WE',
            'thursday': 'TH',
            'friday': 'FR',
            'saturday': 'SA'
          };
          return dayMap[day] || '';
        }).filter(Boolean).join(',');

        rrule = `FREQ=WEEKLY;INTERVAL=${regras.interval || 1};BYDAY=${byDay}`;
      } else if (regras.type === 'daily') {
        rrule = `FREQ=DAILY;INTERVAL=${regras.interval || 1}`;
      } else if (regras.type === 'monthly') {
        rrule = `FREQ=MONTHLY;INTERVAL=${regras.interval || 1}`;
      }

      if (agendamento.endDate) {
        const until = formatDateToICS(agendamento.endDate);
        rrule += `;UNTIL=${until}`;
      } else if (agendamento.maxOccurrences) {
        rrule += `;COUNT=${agendamento.maxOccurrences}`;
      }
      
      icsContent += '\r\n' + [
        'BEGIN:VEVENT',
        `UID:agendamento-recorrente-${agendamento.id}@favalepink.com`,
        `DTSTART:${startTime}`,
        `DTEND:${endTimeFormatted}`,
        `SUMMARY:${escapeICSText(agendamento.service)} - ${escapeICSText(student?.name || 'Aluno')} (Recorrente)`,
        `DESCRIPTION:${escapeICSText([
          `Aluno: ${student?.name || 'Não especificado'}`,
          `Serviço: ${agendamento.service}`,
          `Valor: R$ ${(agendamento.value / 100).toFixed(2)}`,
          `Padrão: ${getRecurrenceDescription(regras)}`,
          agendamento.notes ? `Observações: ${agendamento.notes}` : ''
        ].filter(Boolean).join('\\n'))}`,
        `LOCATION:${escapeICSText(agendamento.location)}`,
        rrule ? `RRULE:${rrule}` : '',
        `ORGANIZER;CN=${escapeICSText(professorData.name || professorData.username)}:MAILTO:${professorData.email || `${professorData.username}@favalepink.com`}`,
        student?.email ? `ATTENDEE;CN=${escapeICSText(student.name)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION:MAILTO:${student.email}` : '',
        `CREATED:${formatDateToICS(new Date())}`,
        `LAST-MODIFIED:${formatDateToICS(agendamento.updatedAt)}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      ].filter(Boolean).join('\r\n');
    });

    icsContent += '\r\nEND:VCALENDAR';

    return icsContent;
  } catch (error) {
    console.error('Erro ao gerar arquivo ICS:', error);
    throw new Error(`Falha ao gerar calendário: ${error}`);
  }
}

/**
 * Analisa um arquivo .ics importado usando regex simples
 */
export async function analyzeICSFile(
  icsContent: string,
  professorId: number
): Promise<ImportAnalysis> {
  try {
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

    // Parse simples dos eventos usando regex
    const eventBlocks = icsContent.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];

    for (const eventBlock of eventBlocks) {
      analysis.totalEvents++;

      const uid = extractICSProperty(eventBlock, 'UID') || uuidv4();
      const summary = extractICSProperty(eventBlock, 'SUMMARY') || 'Evento Importado';
      const description = extractICSProperty(eventBlock, 'DESCRIPTION') || '';
      const location = extractICSProperty(eventBlock, 'LOCATION') || '';
      const dtstart = extractICSProperty(eventBlock, 'DTSTART');
      const dtend = extractICSProperty(eventBlock, 'DTEND');
      const rrule = extractICSProperty(eventBlock, 'RRULE');

      if (!dtstart || !dtend) continue;

      const icsEvent: ICSEvent = {
        uid,
        summary: unescapeICSText(summary),
        description: unescapeICSText(description),
        start: parseICSDate(dtstart),
        end: parseICSDate(dtend),
        location: unescapeICSText(location),
        rrule: rrule || undefined
      };

      // Verificar se é recorrente
      if (rrule) {
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
  studentMapping: Record<string, number>,
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
        
        await db.insert(agendamentosRecorrentes)
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
          });

        result.imported++;
      } else {
        // Evento único - criar aula
        await db.insert(aulas)
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
          });

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

// Funções utilitárias
function formatDateToICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function parseICSDate(dateStr: string): Date {
  // Remove timezone info if present
  const cleanDate = dateStr.replace(/[TZ]/g, '').replace(/[-:]/g, '');
  const year = parseInt(cleanDate.substr(0, 4));
  const month = parseInt(cleanDate.substr(4, 2)) - 1;
  const day = parseInt(cleanDate.substr(6, 2));
  const hour = parseInt(cleanDate.substr(8, 2)) || 0;
  const minute = parseInt(cleanDate.substr(10, 2)) || 0;
  const second = parseInt(cleanDate.substr(12, 2)) || 0;
  
  return new Date(year, month, day, hour, minute, second);
}

function extractICSProperty(eventBlock: string, property: string): string | null {
  const regex = new RegExp(`^${property}[^:]*:(.*)$`, 'm');
  const match = eventBlock.match(regex);
  return match ? match[1].trim() : null;
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

function unescapeICSText(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

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
        rules.until = parseICSDate(value);
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