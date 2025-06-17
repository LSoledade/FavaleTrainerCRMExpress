import React, { useState, useMemo } from 'react';
import { Scheduler } from '@progress/kendo-react-scheduler';
import { IntlProvider, loadMessages } from '@progress/kendo-react-intl';
import '@progress/kendo-theme-default/dist/all.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarPlus, Filter, Users } from 'lucide-react';
import { SessionReport } from './SessionReport';

// Configuração de localização para português brasileiro
loadMessages({
  'pt-BR': {
    scheduler: {
      'today': 'Hoje',
      'day': 'Dia',
      'week': 'Semana',
      'workWeek': 'Semana de Trabalho',
      'month': 'Mês',
      'agenda': 'Agenda',
      'date': 'Data',
      'time': 'Hora',
      'event': 'Evento',
      'allDay': 'Dia inteiro',
      'deleteTitle': 'Excluir evento',
      'deleteMessage': 'Tem certeza que deseja excluir este evento?',
      'editTitle': 'Editar evento',
      'newEvent': 'Novo evento',
      'showFullDay': 'Mostrar dia completo',
      'showWorkDay': 'Mostrar horário comercial'
    }
  }
}, 'pt-BR');

interface KendoSchedulerProps {
  onNewSession?: () => void;
}

interface SessionData {
  id: number;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  isAllDay?: boolean;
  sessionData?: any;
}

export function KendoScheduler({ onNewSession }: KendoSchedulerProps) {
  const [view, setView] = useState('week');
  const [date, setDate] = useState(new Date());
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SessionData | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar dados
  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ['/api/sessions'],
  });

  const { data: trainers = [] } = useQuery({
    queryKey: ['/api/trainers'],
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['/api/leads'],
  });

  // Mutations para CRUD de sessões
  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; startTime?: string; endTime?: string }) => {
      const response = await fetch(`/api/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao atualizar sessão');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      toast({
        title: 'Sessão atualizada',
        description: 'A sessão foi atualizada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar sessão',
        description: error.message || 'Ocorreu um erro inesperado.',
      });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/sessions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao excluir sessão');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      toast({
        title: 'Sessão excluída',
        description: 'A sessão foi excluída com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir sessão',
        description: error.message || 'Ocorreu um erro inesperado.',
      });
    },
  });

  // Converter sessões para o formato do Kendo Scheduler
  const schedulerData = useMemo(() => {
    if (!Array.isArray(sessions)) return [];
    
    return sessions.map((session: any) => {
      const trainer = Array.isArray(trainers) ? trainers.find((t: any) => t.id === session.trainerId) : null;
      const lead = Array.isArray(leads) ? leads.find((l: any) => l.id === session.leadId) : null;
      
      const startDate = parseISO(session.startTime);
      const endDate = parseISO(session.endTime);

      return {
        id: session.id,
        title: `${lead?.name || 'Cliente'} - ${trainer?.name || 'Professor'}`,
        description: `Local: ${session.location}\nValor: R$ ${(session.price / 100).toFixed(2)}`,
        start: startDate,
        end: endDate,
        isAllDay: false,
        recurrenceRule: session.recurrenceRule || undefined,
        recurrenceId: session.recurrenceId || undefined,
        recurrenceException: session.recurrenceException || undefined,
        sessionData: {
          ...session,
          trainerName: trainer?.name,
          studentName: lead?.name,
          source: session.source,
          status: session.status,
        }
      };
    });
  }, [sessions, trainers, leads]);

  // Handler para mudança de data/hora do evento
  const handleDataChange = (event: any) => {
    const updatedEvents = event.value;
    const updatedEvent = updatedEvents.find((item: any) => item.id === selectedEvent?.id);
    
    if (updatedEvent) {
      updateSessionMutation.mutate({
        id: updatedEvent.id as number,
        startTime: updatedEvent.start.toISOString(),
        endTime: updatedEvent.end.toISOString(),
      });
    }
  };

  // Handler para excluir evento
  const handleDataRemove = (event: any) => {
    const eventToRemove = event.value;
    deleteSessionMutation.mutate(eventToRemove.id as number);
  };

  // Handler para adicionar novo evento
  const handleDataAdd = () => {
    setShowNewSessionForm(true);
  };

  // Handler para editar evento
  const handleDataEdit = (event: any) => {
    setSelectedEvent(event.value);
  };

  // Configurações do Scheduler
  const schedulerProps = {
    data: schedulerData,
    onDataChange: handleDataChange,
    onDataRemove: handleDataRemove,
    onDataAdd: handleDataAdd,
    onDataEdit: handleDataEdit,
    defaultDate: date,
    onNavigationAction: ({ value }: { value: Date }) => setDate(value),
    view: view,
    onViewChange: ({ value }: { value: string }) => setView(value),
    editable: true,
    height: 600,
    timezone: 'America/Sao_Paulo',
    workDayStart: '06:00',
    workDayEnd: '22:00',
    workWeekStart: 1, // Segunda-feira
    workWeekEnd: 6, // Sábado
  };

  // Função para obter cor baseada no status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
      case 'agendado':
        return 'bg-blue-500';
      case 'completed':
      case 'concluído':
        return 'bg-green-500';
      case 'cancelled':
      case 'cancelado':
        return 'bg-red-500';
      case 'no-show':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Template customizado para eventos
  const eventTemplate = (props: any) => {
    const { dataItem } = props;
    const sessionData = dataItem.sessionData;
    
    return (
      <div className={`${getStatusColor(sessionData.status)} text-white p-2 rounded text-xs`}>
        <div className="font-medium truncate">{dataItem.title}</div>
        <div className="truncate opacity-90">{sessionData.source}</div>
        <div className="truncate opacity-75">
          {format(dataItem.start, 'HH:mm')} - {format(dataItem.end, 'HH:mm')}
        </div>
      </div>
    );
  };

  if (isLoadingSessions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando agendamentos...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <IntlProvider locale="pt-BR">
      <div className="space-y-6">
        {/* Header com controles */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Agendamentos
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie suas sessões de treinamento
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setShowNewSessionForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <CalendarPlus className="h-4 w-4 mr-2" />
              Nova Sessão
            </Button>
          </div>
        </div>

        {/* Tabs principais */}
        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Calendário</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Relatórios</span>
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Gestão</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <Card>
              <CardContent className="p-0">
                <Scheduler
                  {...schedulerProps}
                  item={eventTemplate}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <SessionReport />
          </TabsContent>

          <TabsContent value="management">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Agendamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {Array.isArray(sessions) ? sessions.filter((s: any) => s.status === 'scheduled' || s.status === 'agendado').length : 0}
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">Sessões Agendadas</div>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {Array.isArray(sessions) ? sessions.filter((s: any) => s.status === 'completed' || s.status === 'concluído').length : 0}
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">Sessões Concluídas</div>
                    </div>
                    
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {Array.isArray(sessions) ? sessions.filter((s: any) => s.status === 'cancelled' || s.status === 'cancelado').length : 0}
                      </div>
                      <div className="text-sm text-red-600 dark:text-red-400">Sessões Canceladas</div>
                    </div>
                  </div>
                  
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <p>Ferramentas de gestão avançada em desenvolvimento</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal para nova sessão */}
        {showNewSessionForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Nova Sessão</h2>
                  <Button
                    variant="ghost"
                    onClick={() => setShowNewSessionForm(false)}
                  >
                    ✕
                  </Button>
                </div>
                <div className="text-center py-8">
                  <p className="text-gray-500">Formulário de nova sessão em desenvolvimento</p>
                  <Button 
                    onClick={() => setShowNewSessionForm(false)}
                    className="mt-4"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </IntlProvider>
  );
}