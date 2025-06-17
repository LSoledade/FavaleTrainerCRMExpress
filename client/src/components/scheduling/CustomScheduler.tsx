import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, addDays, startOfWeek, endOfWeek, isSameDay, isSameWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CalendarPlus, Filter, Users, ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { SessionReport } from './SessionReport';
import { cn } from '@/lib/utils';

interface SessionEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  source: string;
  status: string;
  studentName: string;
  trainerName: string;
  location: string;
  price: number;
}

export function CustomScheduler() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('week');
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar dados
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['/api/sessions'],
  });

  const { data: trainers = [] } = useQuery({
    queryKey: ['/api/trainers'],
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['/api/leads'],
  });

  // Converter sessões para eventos
  const events = useMemo(() => {
    if (!Array.isArray(sessions)) return [];
    
    return sessions.map((session: any) => {
      const trainer = Array.isArray(trainers) ? trainers.find((t: any) => t.id === session.trainerId) : null;
      const lead = Array.isArray(leads) ? leads.find((l: any) => l.id === session.leadId) : null;
      
      return {
        id: session.id,
        title: `${lead?.name || 'Cliente'} - ${trainer?.name || 'Professor'}`,
        start: parseISO(session.startTime),
        end: parseISO(session.endTime),
        source: session.source,
        status: session.status,
        studentName: lead?.name || 'Cliente',
        trainerName: trainer?.name || 'Professor',
        location: session.location,
        price: session.price
      } as SessionEvent;
    });
  }, [sessions, trainers, leads]);

  // Funções de navegação
  const navigatePrevious = () => {
    if (view === 'month') {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    } else if (view === 'week') {
      setCurrentDate(prev => addDays(prev, -7));
    } else {
      setCurrentDate(prev => addDays(prev, -1));
    }
  };

  const navigateNext = () => {
    if (view === 'month') {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    } else if (view === 'week') {
      setCurrentDate(prev => addDays(prev, 7));
    } else {
      setCurrentDate(prev => addDays(prev, 1));
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // Função para obter cor baseada no status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
      case 'agendado':
        return 'bg-blue-500 border-blue-600';
      case 'completed':
      case 'concluído':
        return 'bg-green-500 border-green-600';
      case 'cancelled':
      case 'cancelado':
        return 'bg-red-500 border-red-600';
      case 'no-show':
        return 'bg-amber-500 border-amber-600';
      default:
        return 'bg-gray-500 border-gray-600';
    }
  };

  // Componente de evento
  const EventComponent = ({ event }: { event: SessionEvent }) => (
    <div
      className={cn(
        'p-2 rounded text-white text-xs mb-1 cursor-pointer hover:opacity-80 transition-opacity',
        getStatusColor(event.status)
      )}
      title={`${event.title}\n${format(event.start, 'HH:mm')} - ${format(event.end, 'HH:mm')}\nLocal: ${event.location}`}
    >
      <div className="font-medium truncate">{event.studentName}</div>
      <div className="truncate opacity-90">{format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}</div>
      <div className="truncate opacity-75">{event.source}</div>
    </div>
  );

  // Renderizar visualização semanal
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { locale: ptBR });
    const weekEnd = endOfWeek(currentDate, { locale: ptBR });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6h às 21h

    return (
      <div className="flex flex-col h-full">
        {/* Header dos dias */}
        <div className="grid grid-cols-8 border-b">
          <div className="p-4 border-r"></div>
          {days.map(day => (
            <div key={day.toISOString()} className="p-4 text-center border-r">
              <div className="font-medium">{format(day, 'EEE', { locale: ptBR })}</div>
              <div className={cn(
                'text-2xl',
                isSameDay(day, new Date()) ? 'text-blue-600 font-bold' : ''
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Grade de horários */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-8 min-h-full">
            {/* Coluna de horários */}
            <div className="border-r">
              {hours.map(hour => (
                <div key={hour} className="h-16 p-2 border-b text-sm text-gray-500">
                  {hour.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Colunas dos dias */}
            {days.map(day => (
              <div key={day.toISOString()} className="border-r">
                {hours.map(hour => {
                  const dayEvents = events.filter(event => 
                    isSameDay(event.start, day) && 
                    event.start.getHours() === hour
                  );

                  return (
                    <div key={hour} className="h-16 p-1 border-b relative">
                      {dayEvents.map(event => (
                        <EventComponent key={event.id} event={event} />
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Renderizar visualização mensal
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { locale: ptBR });
    const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="grid grid-cols-7 gap-1 h-full">
        {/* Header dos dias da semana */}
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="p-2 text-center font-medium text-gray-600 bg-gray-50">
            {day}
          </div>
        ))}

        {/* Dias do mês */}
        {days.map(day => {
          const dayEvents = events.filter(event => isSameDay(event.start, day));
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[120px] p-1 border border-gray-200',
                !isCurrentMonth && 'bg-gray-50 text-gray-400',
                isToday && 'bg-blue-50 border-blue-300'
              )}
            >
              <div className={cn(
                'text-sm font-medium mb-1',
                isToday && 'text-blue-600'
              )}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <EventComponent key={event.id} event={event} />
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{dayEvents.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Renderizar visualização diária
  const renderDayView = () => {
    const hours = Array.from({ length: 16 }, (_, i) => i + 6);
    const dayEvents = events.filter(event => isSameDay(event.start, currentDate));

    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b text-center">
          <div className="text-xl font-bold">
            {format(currentDate, 'EEEE, d MMMM yyyy', { locale: ptBR })}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {hours.map(hour => {
            const hourEvents = dayEvents.filter(event => event.start.getHours() === hour);

            return (
              <div key={hour} className="flex border-b min-h-[60px]">
                <div className="w-20 p-2 border-r text-sm text-gray-500">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 p-2">
                  {hourEvents.map(event => (
                    <EventComponent key={event.id} event={event} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) {
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
            <Calendar className="h-4 w-4" />
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
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {/* Navegação */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={navigatePrevious}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={navigateToday}>
                    Hoje
                  </Button>
                  <Button variant="outline" size="sm" onClick={navigateNext}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <h2 className="text-lg font-semibold ml-4">
                    {view === 'month' && format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                    {view === 'week' && `${format(startOfWeek(currentDate, { locale: ptBR }), 'd MMM')} - ${format(endOfWeek(currentDate, { locale: ptBR }), 'd MMM yyyy', { locale: ptBR })}`}
                    {view === 'day' && format(currentDate, 'd MMMM yyyy', { locale: ptBR })}
                  </h2>
                </div>

                {/* Seletor de visualização */}
                <div className="flex gap-1">
                  <Button 
                    variant={view === 'day' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setView('day')}
                  >
                    Dia
                  </Button>
                  <Button 
                    variant={view === 'week' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setView('week')}
                  >
                    Semana
                  </Button>
                  <Button 
                    variant={view === 'month' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setView('month')}
                  >
                    Mês
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px]">
                {view === 'month' && renderMonthView()}
                {view === 'week' && renderWeekView()}
                {view === 'day' && renderDayView()}
              </div>
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
                      {events.filter(e => e.status === 'scheduled' || e.status === 'agendado').length}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">Sessões Agendadas</div>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {events.filter(e => e.status === 'completed' || e.status === 'concluído').length}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">Sessões Concluídas</div>
                  </div>
                  
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {events.filter(e => e.status === 'cancelled' || e.status === 'cancelado').length}
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
  );
}