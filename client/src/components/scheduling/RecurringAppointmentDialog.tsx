import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Clock, MapPin, Calendar, User, DollarSign } from "lucide-react";
import { IProfessor } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface ProfessorSchedule {
  professorId: number;
  professor: IProfessor;
  timeSlots: TimeSlot[];
  isAvailable: boolean;
}

interface DaySchedule {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  dayName: string;
  selected: boolean;
  professorsSchedule: ProfessorSchedule[];
}

interface RecurringAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  professors: IProfessor[];
}

const DAYS_OF_WEEK = [
  { value: 1, name: 'Segunda-feira' },
  { value: 2, name: 'Terça-feira' },
  { value: 3, name: 'Quarta-feira' },
  { value: 4, name: 'Quinta-feira' },
  { value: 5, name: 'Sexta-feira' },
  { value: 6, name: 'Sábado' },
  { value: 0, name: 'Domingo' },
];

const SERVICES = [
  'Personal Training',
  'Pilates',
  'Yoga',
  'Fisioterapia',
  'Crossfit',
  'Aeróbica',
  'Musculação',
  'Natação'
];

export default function RecurringAppointmentDialog({
  isOpen,
  onClose,
  professors
}: RecurringAppointmentDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [studentName, setStudentName] = useState('');
  const [service, setService] = useState('');
  const [location, setLocation] = useState('');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Schedule state
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>([]);

  // Initialize weekly schedule
  useEffect(() => {
    const initialSchedule: DaySchedule[] = DAYS_OF_WEEK.map(day => ({
      dayOfWeek: day.value,
      dayName: day.name,
      selected: false,
      professorsSchedule: professors.map(professor => ({
        professorId: professor.id,
        professor,
        timeSlots: [],
        isAvailable: true
      }))
    }));
    setWeeklySchedule(initialSchedule);
  }, [professors]);

  // Check professor availability for specific day and time
  const checkProfessorAvailability = useCallback(async (
    professorId: number, 
    dayOfWeek: number, 
    startTime: string, 
    endTime: string
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/professors/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professorId,
          dayOfWeek,
          startTime,
          endTime,
          startDate,
          endDate
        })
      });
      
      if (!response.ok) return false;
      const data = await response.json();
      return data.available;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  }, [startDate, endDate]);

  // Toggle day selection
  const toggleDay = useCallback((dayIndex: number) => {
    setWeeklySchedule(prev => prev.map((day, index) => 
      index === dayIndex ? { ...day, selected: !day.selected } : day
    ));
  }, []);

  // Add time slot to a specific professor on a specific day
  const addTimeSlot = useCallback((dayIndex: number, professorIndex: number) => {
    setWeeklySchedule(prev => prev.map((day, dIndex) => {
      if (dIndex !== dayIndex) return day;
      
      return {
        ...day,
        professorsSchedule: day.professorsSchedule.map((profSched, pIndex) => {
          if (pIndex !== professorIndex) return profSched;
          
          return {
            ...profSched,
            timeSlots: [
              ...profSched.timeSlots,
              { startTime: '09:00', endTime: '10:00' }
            ]
          };
        })
      };
    }));
  }, []);

  // Remove time slot
  const removeTimeSlot = useCallback((dayIndex: number, professorIndex: number, slotIndex: number) => {
    setWeeklySchedule(prev => prev.map((day, dIndex) => {
      if (dIndex !== dayIndex) return day;
      
      return {
        ...day,
        professorsSchedule: day.professorsSchedule.map((profSched, pIndex) => {
          if (pIndex !== professorIndex) return profSched;
          
          return {
            ...profSched,
            timeSlots: profSched.timeSlots.filter((_, sIndex) => sIndex !== slotIndex)
          };
        })
      };
    }));
  }, []);

  // Update time slot
  const updateTimeSlot = useCallback(async (
    dayIndex: number, 
    professorIndex: number, 
    slotIndex: number, 
    field: 'startTime' | 'endTime', 
    value: string
  ) => {
    setWeeklySchedule(prev => prev.map((day, dIndex) => {
      if (dIndex !== dayIndex) return day;
      
      return {
        ...day,
        professorsSchedule: day.professorsSchedule.map((profSched, pIndex) => {
          if (pIndex !== professorIndex) return profSched;
          
          const updatedSlots = profSched.timeSlots.map((slot, sIndex) => {
            if (sIndex !== slotIndex) return slot;
            return { ...slot, [field]: value };
          });

          return { ...profSched, timeSlots: updatedSlots };
        })
      };
    }));

    // Check availability after updating time
    const day = weeklySchedule[dayIndex];
    const profSchedule = day.professorsSchedule[professorIndex];
    const slot = profSchedule.timeSlots[slotIndex];
    
    if (slot && startDate && endDate) {
      const newSlot = { ...slot, [field]: value };
      const isAvailable = await checkProfessorAvailability(
        profSchedule.professorId,
        day.dayOfWeek,
        newSlot.startTime,
        newSlot.endTime
      );

      setWeeklySchedule(prev => prev.map((day, dIndex) => {
        if (dIndex !== dayIndex) return day;
        
        return {
          ...day,
          professorsSchedule: day.professorsSchedule.map((profSched, pIndex) => {
            if (pIndex !== professorIndex) return profSched;
            return { ...profSched, isAvailable };
          })
        };
      }));
    }
  }, [weeklySchedule, checkProfessorAvailability, startDate, endDate]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!studentName || !service || !startDate || !endDate) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const selectedDays = weeklySchedule.filter(day => day.selected);
    if (selectedDays.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um dia da semana",
        variant: "destructive"
      });
      return;
    }

    // Validate that each selected day has at least one professor with time slots
    for (const day of selectedDays) {
      const hasScheduledProfessors = day.professorsSchedule.some(
        prof => prof.timeSlots.length > 0
      );
      
      if (!hasScheduledProfessors) {
        toast({
          title: "Erro",
          description: `Adicione pelo menos um horário para ${day.dayName}`,
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);

    try {
      const recurringData = {
        studentName,
        service,
        location,
        value: value ? parseFloat(value) : 0,
        notes,
        startDate,
        endDate,
        weeklySchedule: selectedDays.map(day => ({
          dayOfWeek: day.dayOfWeek,
          professorsSchedule: day.professorsSchedule
            .filter(prof => prof.timeSlots.length > 0)
            .map(prof => ({
              professorId: prof.professorId,
              timeSlots: prof.timeSlots
            }))
        }))
      };

      const response = await fetch('/api/appointments/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recurringData)
      });

      if (!response.ok) {
        throw new Error('Erro ao criar agendamento recorrente');
      }

      toast({
        title: "Sucesso",
        description: "Agendamento recorrente criado com sucesso!"
      });

      onClose();
    } catch (error) {
      console.error('Error creating recurring appointment:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar agendamento recorrente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [studentName, service, location, value, notes, startDate, endDate, weeklySchedule, toast, onClose]);

  // Reset form
  const resetForm = useCallback(() => {
    setStudentName('');
    setService('');
    setLocation('');
    setValue('');
    setNotes('');
    setStartDate('');
    setEndDate('');
    setWeeklySchedule(prev => prev.map(day => ({
      ...day,
      selected: false,
      professorsSchedule: day.professorsSchedule.map(prof => ({
        ...prof,
        timeSlots: [],
        isAvailable: true
      }))
    })));
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agendar Serviço Recorrente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="studentName">Nome do Aluno *</Label>
                  <Input
                    id="studentName"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Digite o nome do aluno"
                  />
                </div>
                
                <div>
                  <Label htmlFor="service">Serviço *</Label>
                  <Select value={service} onValueChange={setService}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICES.map(serviceOption => (
                        <SelectItem key={serviceOption} value={serviceOption}>
                          {serviceOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">Local</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Endereço ou local do atendimento"
                  />
                </div>

                <div>
                  <Label htmlFor="value">Valor (R$)</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="startDate">Data de Início *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">Data de Fim *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações sobre o agendamento..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Weekly Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Programação Semanal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {weeklySchedule.map((day, dayIndex) => (
                <div key={day.dayOfWeek} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Checkbox
                      checked={day.selected}
                      onCheckedChange={() => toggleDay(dayIndex)}
                    />
                    <Label className="text-lg font-medium cursor-pointer" onClick={() => toggleDay(dayIndex)}>
                      {day.dayName}
                    </Label>
                  </div>

                  {day.selected && (
                    <div className="space-y-4 ml-6">
                      {day.professorsSchedule.map((profSchedule, profIndex) => (
                        <div key={profSchedule.professorId} className="border-l-2 border-pink-200 pl-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium">{profSchedule.professor.name}</span>
                              {!profSchedule.isAvailable && (
                                <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                                  Indisponível
                                </Badge>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addTimeSlot(dayIndex, profIndex)}
                              disabled={!profSchedule.isAvailable}
                              className={!profSchedule.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Adicionar Horário
                            </Button>
                          </div>

                          <div className="space-y-2">
                            {profSchedule.timeSlots.map((slot, slotIndex) => (
                              <div key={slotIndex} className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <Input
                                  type="time"
                                  value={slot.startTime}
                                  onChange={(e) => updateTimeSlot(dayIndex, profIndex, slotIndex, 'startTime', e.target.value)}
                                  className="w-32"
                                />
                                <span>até</span>
                                <Input
                                  type="time"
                                  value={slot.endTime}
                                  onChange={(e) => updateTimeSlot(dayIndex, profIndex, slotIndex, 'endTime', e.target.value)}
                                  className="w-32"
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeTimeSlot(dayIndex, profIndex, slotIndex)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Criando...' : 'Criar Agendamento Recorrente'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}