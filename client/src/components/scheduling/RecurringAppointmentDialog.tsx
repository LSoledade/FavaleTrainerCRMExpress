import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, User, Clock, MapPin, DollarSign, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Lead {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

interface Service {
  id: number;
  name: string;
  description?: string;
  duration: number;
  price: number;
}

interface Professor {
  id: number;
  name: string;
  email: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface DaySchedule {
  dayOfWeek: number;
  selected: boolean;
  timeSlots: TimeSlot[];
  availableProfessors: Professor[];
  selectedProfessors: number[];
}

interface RecurringAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const WEEKDAYS = [
  { value: 1, label: 'Segunda-feira', short: 'SEG' },
  { value: 2, label: 'Terça-feira', short: 'TER' },
  { value: 3, label: 'Quarta-feira', short: 'QUA' },
  { value: 4, label: 'Quinta-feira', short: 'QUI' },
  { value: 5, label: 'Sexta-feira', short: 'SEX' },
  { value: 6, label: 'Sábado', short: 'SAB' },
  { value: 0, label: 'Domingo', short: 'DOM' }
];

export function RecurringAppointmentDialog({ isOpen, onClose }: RecurringAppointmentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [location, setLocation] = useState('');
  const [value, setValue] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(
    WEEKDAYS.map(day => ({
      dayOfWeek: day.value,
      selected: false,
      timeSlots: [],
      availableProfessors: [],
      selectedProfessors: []
    }))
  );
  const [showNewStudentForm, setShowNewStudentForm] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');

  // Fetch data
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
    enabled: isOpen
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['/api/services'],
    enabled: isOpen
  });

  const { data: professors = [] } = useQuery<Professor[]>({
    queryKey: ['/api/users/professors'],
    enabled: isOpen
  });

  // Create new student mutation
  const createStudentMutation = useMutation({
    mutationFn: (studentData: { name: string; email?: string; phone?: string }) =>
      apiRequest('/api/leads', {
        method: 'POST',
        body: JSON.stringify({
          ...studentData,
          status: 'ativo',
          source: 'agendamento_recorrente',
          entryDate: new Date().toISOString()
        })
      }),
    onSuccess: (newStudent) => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      setSelectedStudentId(newStudent.id);
      setShowNewStudentForm(false);
      setNewStudentName('');
      setNewStudentEmail('');
      setNewStudentPhone('');
      toast({
        title: "Aluno criado",
        description: "Novo aluno adicionado com sucesso."
      });
    }
  });

  // Create recurring appointment mutation
  const createRecurringMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/appointments/recurring', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Agendamento criado",
        description: "Agendamento recorrente criado com sucesso!"
      });
      handleClose();
    }
  });

  // Handle day selection
  const handleDayToggle = (dayIndex: number) => {
    setWeeklySchedule(prev => 
      prev.map((day, idx) => 
        idx === dayIndex 
          ? { ...day, selected: !day.selected, timeSlots: [], selectedProfessors: [] }
          : day
      )
    );
  };

  // Add time slot to a day
  const addTimeSlot = (dayIndex: number) => {
    setWeeklySchedule(prev => 
      prev.map((day, idx) => 
        idx === dayIndex 
          ? { 
              ...day, 
              timeSlots: [...day.timeSlots, { startTime: '09:00', endTime: '10:00' }] 
            }
          : day
      )
    );
  };

  // Update time slot
  const updateTimeSlot = (dayIndex: number, slotIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setWeeklySchedule(prev => 
      prev.map((day, idx) => 
        idx === dayIndex 
          ? {
              ...day,
              timeSlots: day.timeSlots.map((slot, sIdx) =>
                sIdx === slotIndex ? { ...slot, [field]: value } : slot
              )
            }
          : day
      )
    );
    
    // Check availability when time changes
    checkAvailability(dayIndex, slotIndex);
  };

  // Remove time slot
  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    setWeeklySchedule(prev => 
      prev.map((day, idx) => 
        idx === dayIndex 
          ? {
              ...day,
              timeSlots: day.timeSlots.filter((_, sIdx) => sIdx !== slotIndex),
              selectedProfessors: []
            }
          : day
      )
    );
  };

  // Check professor availability
  const checkAvailability = async (dayIndex: number, slotIndex: number) => {
    const day = weeklySchedule[dayIndex];
    const slot = day.timeSlots[slotIndex];
    
    if (!slot || !startDate) return;

    // Calculate end date (3 months from start date)
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 3);

    const availableProfessors = [];
    
    for (const professor of professors) {
      try {
        const response = await apiRequest('/api/professors/availability', {
          method: 'POST',
          body: JSON.stringify({
            professorId: professor.id,
            dayOfWeek: day.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            startDate: start.toISOString(),
            endDate: end.toISOString()
          })
        });
        
        if (response.available) {
          availableProfessors.push(professor);
        }
      } catch (error) {
        console.error('Error checking availability for professor', professor.id, error);
      }
    }

    setWeeklySchedule(prev => 
      prev.map((day, idx) => 
        idx === dayIndex 
          ? { ...day, availableProfessors, selectedProfessors: [] }
          : day
      )
    );
  };

  // Handle professor selection
  const handleProfessorToggle = (dayIndex: number, professorId: number) => {
    setWeeklySchedule(prev => 
      prev.map((day, idx) => 
        idx === dayIndex 
          ? {
              ...day,
              selectedProfessors: day.selectedProfessors.includes(professorId)
                ? day.selectedProfessors.filter(id => id !== professorId)
                : [...day.selectedProfessors, professorId]
            }
          : day
      )
    );
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!selectedStudentId || !selectedServiceId || !startDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha aluno, serviço e data de início.",
        variant: "destructive"
      });
      return;
    }

    const selectedDays = weeklySchedule.filter(day => day.selected && day.timeSlots.length > 0);
    
    if (selectedDays.length === 0) {
      toast({
        title: "Selecione dias",
        description: "Selecione pelo menos um dia da semana com horários.",
        variant: "destructive"
      });
      return;
    }

    // Validate that all selected days have professors selected
    const daysWithoutProfessors = selectedDays.filter(day => day.selectedProfessors.length === 0);
    if (daysWithoutProfessors.length > 0) {
      toast({
        title: "Selecione professores",
        description: "Todos os dias selecionados devem ter pelo menos um professor.",
        variant: "destructive"
      });
      return;
    }

    const student = leads.find(lead => lead.id === selectedStudentId);
    const service = services.find(s => s.id === selectedServiceId);

    createRecurringMutation.mutate({
      studentName: student?.name,
      service: service?.name,
      location,
      value,
      notes,
      startDate,
      endDate: new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 3)).toISOString(),
      weeklySchedule: selectedDays.map(day => ({
        dayOfWeek: day.dayOfWeek,
        professorsSchedule: day.selectedProfessors.map(profId => ({
          professorId: profId,
          timeSlots: day.timeSlots
        }))
      }))
    });
  };

  const handleClose = () => {
    setSelectedStudentId(null);
    setSelectedServiceId(null);
    setStartDate('');
    setLocation('');
    setValue(0);
    setNotes('');
    setWeeklySchedule(WEEKDAYS.map(day => ({
      dayOfWeek: day.value,
      selected: false,
      timeSlots: [],
      availableProfessors: [],
      selectedProfessors: []
    })));
    setShowNewStudentForm(false);
    setNewStudentName('');
    setNewStudentEmail('');
    setNewStudentPhone('');
    onClose();
  };

  const selectedService = services.find(s => s.id === selectedServiceId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Agendar Serviço Recorrente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Aluno
            </Label>
            <div className="flex gap-2">
              <Select value={selectedStudentId?.toString() || ''} onValueChange={(value) => setSelectedStudentId(Number(value))}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione um aluno" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id.toString()}>
                      {lead.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={() => setShowNewStudentForm(true)}
                className="px-3"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* New Student Form */}
          {showNewStudentForm && (
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Novo Aluno</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Nome *</Label>
                  <Input
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Nome do aluno"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newStudentEmail}
                    onChange={(e) => setNewStudentEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={newStudentPhone}
                    onChange={(e) => setNewStudentPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => createStudentMutation.mutate({
                      name: newStudentName,
                      email: newStudentEmail || undefined,
                      phone: newStudentPhone || undefined
                    })}
                    disabled={!newStudentName || createStudentMutation.isPending}
                  >
                    Criar Aluno
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowNewStudentForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Service Selection */}
          <div className="space-y-2">
            <Label>Serviço</Label>
            <Select value={selectedServiceId?.toString() || ''} onValueChange={(value) => setSelectedServiceId(Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.name} - {service.duration}min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Local
              </Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Local do atendimento"
              />
            </div>

            {/* Value */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valor (R$)
              </Label>
              <Input
                type="number"
                value={value / 100}
                onChange={(e) => setValue(Math.round(Number(e.target.value) * 100))}
                placeholder={selectedService ? (selectedService.price / 100).toFixed(2) : "0.00"}
                step="0.01"
              />
            </div>
          </div>

          {/* Weekly Schedule */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Programação Semanal</Label>
            
            {WEEKDAYS.map((weekday, dayIndex) => {
              const daySchedule = weeklySchedule[dayIndex];
              
              return (
                <Card key={weekday.value} className={daySchedule.selected ? 'border-pink-500' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={daySchedule.selected}
                        onCheckedChange={() => handleDayToggle(dayIndex)}
                      />
                      <CardTitle className="text-base">{weekday.label}</CardTitle>
                    </div>
                  </CardHeader>
                  
                  {daySchedule.selected && (
                    <CardContent className="space-y-4">
                      {/* Time Slots */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Horários
                          </Label>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => addTimeSlot(dayIndex)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar Horário
                          </Button>
                        </div>
                        
                        {daySchedule.timeSlots.map((slot, slotIndex) => (
                          <div key={slotIndex} className="flex items-center gap-2 p-2 border rounded">
                            <Input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'startTime', e.target.value)}
                              className="w-24"
                            />
                            <span>até</span>
                            <Input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'endTime', e.target.value)}
                              className="w-24"
                            />
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                            >
                              Remover
                            </Button>
                          </div>
                        ))}
                      </div>

                      {/* Available Professors */}
                      {daySchedule.timeSlots.length > 0 && (
                        <div className="space-y-2">
                          <Label>Professores Disponíveis</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {daySchedule.availableProfessors.map((professor) => (
                              <div key={professor.id} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={daySchedule.selectedProfessors.includes(professor.id)}
                                  onCheckedChange={() => handleProfessorToggle(dayIndex, professor.id)}
                                />
                                <span className="text-sm">{professor.name}</span>
                              </div>
                            ))}
                            {professors.filter(p => !daySchedule.availableProfessors.some(ap => ap.id === p.id)).map((professor) => (
                              <div key={professor.id} className="flex items-center space-x-2 opacity-50">
                                <Checkbox disabled />
                                <span className="text-sm text-gray-400">{professor.name} (Indisponível)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Observações
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createRecurringMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {createRecurringMutation.isPending ? 'Criando...' : 'Criar Agendamentos'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}