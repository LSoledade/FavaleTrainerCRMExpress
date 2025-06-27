import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, momentLocalizer, Event, View } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Plus, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MultiDateAppointmentDialog from "@/components/scheduling/MultiDateAppointmentDialog";
import type { IAula, IProfessor } from "@/types";

// Setup moment localizer for react-big-calendar
const localizer = momentLocalizer(moment);

// Configure moment to Portuguese
moment.locale('pt-br', {
  months: 'Janeiro_Fevereiro_Março_Abril_Maio_Junho_Julho_Agosto_Setembro_Outubro_Novembro_Dezembro'.split('_'),
  monthsShort: 'Jan_Fev_Mar_Abr_Mai_Jun_Jul_Ago_Set_Out_Nov_Dez'.split('_'),
  weekdays: 'Domingo_Segunda_Terça_Quarta_Quinta_Sexta_Sábado'.split('_'),
  weekdaysShort: 'Dom_Seg_Ter_Qua_Qui_Sex_Sáb'.split('_'),
  weekdaysMin: 'Do_Se_Te_Qu_Qu_Se_Sá'.split('_'),
});

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>("month");
  const [selectedEvent, setSelectedEvent] = useState<IAula | null>(null);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [isNewRecurrenceFormOpen, setIsNewRecurrenceFormOpen] = useState(false);
  const [filterProfessor, setFilterProfessor] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate date range for queries
  const dateRange = useMemo(() => {
    let startOfPeriod: moment.Moment;
    let endOfPeriod: moment.Moment;

    switch (currentView) {
      case 'month':
        startOfPeriod = moment(currentDate).startOf('month');
        endOfPeriod = moment(currentDate).endOf('month');
        break;
      case 'week':
      case 'work_week':
        startOfPeriod = moment(currentDate).startOf('week');
        endOfPeriod = moment(currentDate).endOf('week');
        break;
      case 'day':
        startOfPeriod = moment(currentDate).startOf('day');
        endOfPeriod = moment(currentDate).endOf('day');
        break;
      default:
        startOfPeriod = moment(currentDate).startOf('month');
        endOfPeriod = moment(currentDate).endOf('month');
    }

    const start = startOfPeriod.subtract(1, 'week').toDate();
    const end = endOfPeriod.add(1, 'week').toDate();
    return { start, end };
  }, [currentDate, currentView]);

  // Fetch classes/events
  const { data: aulas = [], isLoading: isLoadingAulas, error: aulasError, refetch } = useQuery({
    queryKey: ["/api/appointments", dateRange],
    queryFn: async () => {
      const response = await fetch("/api/appointments");
      return response.json();
    },
  });

  // Fetch professors for filter
  const { data: professors = [] } = useQuery({
    queryKey: ["/api/users/professors"],
    select: (data) => data as IProfessor[]
  });

  // Transform aulas for react-big-calendar
  const events: Event[] = useMemo(() => {
    return aulas.map((aula: IAula) => ({
      id: aula.id,
      title: aula.title,
      start: new Date(aula.startTime),
      end: new Date(aula.endTime),
      resource: aula,
    }));
  }, [aulas]);

  // Event style getter for color coding
  const eventStyleGetter = useCallback((event: Event) => {
    const aula = event.resource as IAula;
    let backgroundColor = '#3174ad'; // default blue
    
    switch (aula.status) {
      case 'agendado':
        backgroundColor = '#3b82f6'; // blue
        break;
      case 'em_andamento':
        backgroundColor = '#f59e0b'; // amber
        break;
      case 'concluido':
        backgroundColor = '#10b981'; // green
        break;
      case 'cancelado':
        backgroundColor = '#ef4444'; // red
        break;
      case 'remarcado':
        backgroundColor = '#8b5cf6'; // purple
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: aula.status === 'cancelado' ? 0.6 : 0.9,
        color: 'white',
        border: 'none',
        display: 'block'
      }
    };
  }, []);

  // Handle event selection
  const handleSelectEvent = useCallback((event: Event) => {
    setSelectedEvent(event.resource as IAula);
    setIsAppointmentDialogOpen(true);
  }, []);

  // Handle navigation
  const handleNavigate = useCallback((newDate: Date) => {
    setCurrentDate(newDate);
  }, []);

  // Handle view change
  const handleViewChange = useCallback((view: View) => {
    setCurrentView(view);
  }, []);

  // Custom messages for Portuguese
  const messages = {
    allDay: 'Dia inteiro',
    previous: 'Anterior',
    next: 'Próximo',
    today: 'Hoje',
    month: 'Mês',
    week: 'Semana',
    day: 'Dia',
    agenda: 'Agenda',
    date: 'Data',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'Não há eventos neste período.',
    showMore: (total: number) => `+ ${total} mais`,
  };

  if (aulasError) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">Erro ao carregar calendário: {aulasError.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendário de Aulas</h1>
            <p className="text-muted-foreground">
              Gerencie agendamentos e aulas recorrentes
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsNewRecurrenceFormOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Recorrência
            </Button>
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/new-scheduling/classes"] })}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Filtrar por Professor</label>
                <Select value={filterProfessor} onValueChange={setFilterProfessor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os professores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os professores</SelectItem>
                    {professors.map((professor) => (
                      <SelectItem key={professor.id} value={professor.id.toString()}>
                        {professor.name || professor.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Filtrar por Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="agendado">Agendado</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="remarcado">Remarcado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Aulas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aulas.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agendadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {aulas.filter((a: IAula) => a.status === 'agendado').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {aulas.filter((a: IAula) => a.status === 'em_andamento').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {aulas.filter((a: IAula) => a.status === 'concluido').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <Card>
          <CardContent className="p-6">
            {isLoadingAulas ? (
              <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div style={{ height: '600px' }}>
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: '100%' }}
                  onSelectEvent={handleSelectEvent}
                  onNavigate={handleNavigate}
                  onView={handleViewChange}
                  view={currentView}
                  date={currentDate}
                  eventPropGetter={eventStyleGetter}
                  messages={messages}
                  popup
                  tooltipAccessor={(event) => {
                    const aula = event.resource as IAula;
                    return `${aula.title} - ${aula.status}`;
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Legenda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm">Agendado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-500 rounded"></div>
                <span className="text-sm">Em Andamento</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm">Concluído</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded opacity-60"></div>
                <span className="text-sm">Cancelado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-sm">Remarcado</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Multi-Date Appointment Dialog */}
      <MultiDateAppointmentDialog
        isOpen={isAppointmentDialogOpen || isNewRecurrenceFormOpen}
        onClose={() => {
          setIsAppointmentDialogOpen(false);
          setIsNewRecurrenceFormOpen(false);
          setSelectedEvent(null);
        }}
        selectedDate={selectedEvent?.start ? new Date(selectedEvent.start) : new Date()}
        onSuccess={() => {
          // Refresh the calendar data
          refetch();
        }}
      />
    </div>
  );
}