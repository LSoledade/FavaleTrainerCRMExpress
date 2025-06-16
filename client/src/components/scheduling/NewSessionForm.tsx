import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Loader2, Check, ChevronsUpDown, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

// Schema para validação do formulário
const sessionFormSchema = z.object({
  source: z.enum(["Favale", "Pink", "FavalePink"], {
    required_error: "A origem é obrigatória.",
  }),
  studentId: z.string().min(1, "Um aluno deve ser selecionado."),
  trainerId: z.string().min(1, "Um professor deve ser selecionado."),
  date: z.date({
    required_error: "A data é obrigatória.",
  }),
  startTime: z.string({
    required_error: "O horário de início é obrigatório.",
  }),
  endTime: z.string({
    required_error: "O horário de término é obrigatório.",
  }),
  location: z.string().min(1, "O local é obrigatório."),
  value: z.string().min(1, "O valor é obrigatório."),
  service: z.string().min(1, "O tipo de serviço é obrigatório."),
  isOneTime: z.boolean().default(false),
  weeklyFrequency: z.string().optional(),
  weekDays: z.array(z.string()).optional(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  // Validação de horários
  const startTime = new Date(`2024-01-01T${data.startTime}`);
  const endTime = new Date(`2024-01-01T${data.endTime}`);
  
  if (endTime <= startTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "O horário de término deve ser posterior ao horário de início",
      path: ["endTime"],
    });
  }

  // Validação para sessões não avulsas
  if (!data.isOneTime) {
    if (!data.weeklyFrequency || parseInt(data.weeklyFrequency) < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Frequência semanal é obrigatória para sessões recorrentes",
        path: ["weeklyFrequency"],
      });
    }
    
    if (!data.weekDays || data.weekDays.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione pelo menos um dia da semana",
        path: ["weekDays"],
      });
    }
  }
});

type SessionFormValues = z.infer<typeof sessionFormSchema>;

interface Student {
  id: number;
  name: string;
  email: string;
  tags: string[];
}

interface Trainer {
  id: number;
  name: string;
  email: string;
  source: string;
  active: boolean;
}

interface Conflict {
  type: 'trainer_busy' | 'overlap';
  message: string;
  suggestion?: string;
}

interface SessionFormProps {
  defaultValues?: Partial<SessionFormValues>;
  sessionId?: number;
  onSuccess: () => void;
}

const WEEK_DAYS = [
  { value: "Segunda", label: "Segunda-feira" },
  { value: "Terça", label: "Terça-feira" },
  { value: "Quarta", label: "Quarta-feira" },
  { value: "Quinta", label: "Quinta-feira" },
  { value: "Sexta", label: "Sexta-feira" },
  { value: "Sábado", label: "Sábado" },
  { value: "Domingo", label: "Domingo" },
];

const TIME_SLOTS = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", 
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", 
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"
];

export function NewSessionForm({ defaultValues, sessionId, onSuccess }: SessionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [studentOpen, setStudentOpen] = useState(false);
  const [trainerOpen, setTrainerOpen] = useState(false);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const { toast } = useToast();

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      date: new Date(),
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      value: '',
      service: 'Personal Training',
      isOneTime: false,
      weeklyFrequency: '2',
      weekDays: [],
      notes: '',
      ...defaultValues,
    },
  });

  // Buscar alunos (leads com tag "aluno")
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['/api/leads'],
    select: (leads: any[]) => leads.filter(lead => 
      lead.tags?.includes('aluno') || lead.status === 'Aluno'
    ).map(lead => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      tags: lead.tags || []
    }))
  });

  // Buscar professores
  const { data: allTrainers = [] } = useQuery<Trainer[]>({
    queryKey: ['/api/trainers']
  });

  // Filtrar professores por origem
  const selectedSource = form.watch('source');
  const filteredTrainers = selectedSource 
    ? allTrainers.filter(trainer => 
        trainer.active && 
        (selectedSource === 'FavalePink' || trainer.source === selectedSource)
      )
    : [];

  // Verificar conflitos em tempo real
  const checkConflicts = async (trainerId: string, date: Date, startTime: string, endTime: string) => {
    if (!trainerId || !date || !startTime || !endTime) return;
    
    setIsCheckingConflicts(true);
    try {
      const response = await apiRequest('POST', '/api/sessions/check-conflicts', {
        trainerId: parseInt(trainerId),
        date: format(date, 'yyyy-MM-dd'),
        startTime,
        endTime
      });
      
      setConflicts(response.conflicts || []);
    } catch (error) {
      console.error('Erro ao verificar conflitos:', error);
      setConflicts([]);
    } finally {
      setIsCheckingConflicts(false);
    }
  };

  // Monitorar mudanças para verificar conflitos
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (values.trainerId && values.date && values.startTime && values.endTime) {
        const timeout = setTimeout(() => {
          checkConflicts(values.trainerId!, values.date!, values.startTime!, values.endTime!);
        }, 500); // Debounce
        
        return () => clearTimeout(timeout);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const onSubmit = async (values: SessionFormValues) => {
    if (conflicts.length > 0) {
      toast({
        title: 'Conflitos detectados',
        description: 'Resolva os conflitos antes de agendar a sessão.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const startDateTime = new Date(`${format(values.date, 'yyyy-MM-dd')}T${values.startTime}`);
      const endDateTime = new Date(`${format(values.date, 'yyyy-MM-dd')}T${values.endTime}`);
      
      const sessionData = {
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        leadId: parseInt(values.studentId),
        trainerId: parseInt(values.trainerId),
        location: values.location,
        value: Math.round(parseFloat(values.value) * 100), // Converter para centavos
        service: values.service,
        isOneTime: values.isOneTime,
        weeklyFrequency: values.isOneTime ? null : parseInt(values.weeklyFrequency || '1'),
        weekDays: values.isOneTime ? [] : values.weekDays,
        notes: values.notes,
        status: 'agendado',
        source: values.source,
        recurrenceGroupId: values.isOneTime ? null : crypto.randomUUID(),
      };

      if (sessionId) {
        await apiRequest('PATCH', `/api/sessions/${sessionId}`, sessionData);
        toast({
          title: 'Sessão atualizada',
          description: 'A sessão foi atualizada com sucesso!',
        });
      } else {
        await apiRequest('POST', '/api/sessions', sessionData);
        toast({
          title: 'Sessão agendada',
          description: 'A sessão foi agendada com sucesso!',
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar sessão:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a sessão. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedStudent = students.find(s => s.id.toString() === form.watch('studentId'));
  const selectedTrainer = filteredTrainers.find(t => t.id.toString() === form.watch('trainerId'));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Origem */}
        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Origem *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Favale">Favale</SelectItem>
                  <SelectItem value="Pink">Pink</SelectItem>
                  <SelectItem value="FavalePink">FavalePink</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Aluno */}
        <FormField
          control={form.control}
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aluno *</FormLabel>
              <Popover open={studentOpen} onOpenChange={setStudentOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={studentOpen}
                      className="justify-between"
                    >
                      {selectedStudent
                        ? selectedStudent.name
                        : "Selecione um aluno..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Command>
                    <CommandInput placeholder="Buscar aluno..." />
                    <CommandList>
                      <CommandEmpty>Nenhum aluno encontrado.</CommandEmpty>
                      <CommandGroup>
                        {students.map((student) => (
                          <CommandItem
                            key={student.id}
                            value={`${student.name} ${student.email}`}
                            onSelect={() => {
                              form.setValue('studentId', student.id.toString());
                              setStudentOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedStudent?.id === student.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-sm text-gray-500">{student.email}</div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Professor */}
        <FormField
          control={form.control}
          name="trainerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Professor *</FormLabel>
              <Popover open={trainerOpen} onOpenChange={setTrainerOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={trainerOpen}
                      className="justify-between"
                      disabled={!selectedSource}
                    >
                      {selectedTrainer
                        ? selectedTrainer.name
                        : selectedSource 
                          ? "Selecione um professor..."
                          : "Primeiro selecione uma origem"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Command>
                    <CommandInput placeholder="Buscar professor..." />
                    <CommandList>
                      <CommandEmpty>Nenhum professor encontrado.</CommandEmpty>
                      <CommandGroup>
                        {filteredTrainers.map((trainer) => (
                          <CommandItem
                            key={trainer.id}
                            value={trainer.name}
                            onSelect={() => {
                              form.setValue('trainerId', trainer.id.toString());
                              setTrainerOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedTrainer?.id === trainer.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div>
                              <div className="font-medium">{trainer.name}</div>
                              <div className="text-sm text-gray-500">{trainer.source}</div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Data e Horários */}
        <div className="grid grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Início *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Horário" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Término *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Horário" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Verificação de Conflitos */}
        {isCheckingConflicts && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Clock className="h-4 w-4 animate-spin" />
            Verificando disponibilidade...
          </div>
        )}

        {conflicts.length > 0 && (
          <div className="space-y-2">
            {conflicts.map((conflict, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800">{conflict.message}</p>
                  {conflict.suggestion && (
                    <p className="text-sm text-red-600 mt-1">{conflict.suggestion}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Local, Valor e Serviço */}
        <div className="grid grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Local *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Studio Favale" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$) *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ex: 150.00" 
                    type="number" 
                    step="0.01" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="service"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serviço *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Personal Training" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Sessão Avulsa */}
        <FormField
          control={form.control}
          name="isOneTime"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Sessão Avulsa
                </FormLabel>
                <div className="text-sm text-muted-foreground">
                  Marque se esta é uma sessão única (não recorrente)
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Configurações de Recorrência */}
        {!form.watch('isOneTime') && (
          <div className="space-y-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <h3 className="text-sm font-medium">Configurações de Recorrência</h3>
            
            <FormField
              control={form.control}
              name="weeklyFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequência Semanal *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Quantas vezes por semana" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7].map((freq) => (
                        <SelectItem key={freq} value={freq.toString()}>
                          {freq} {freq === 1 ? 'vez' : 'vezes'} por semana
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weekDays"
              render={() => (
                <FormItem>
                  <FormLabel>Dias da Semana *</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {WEEK_DAYS.map((day) => (
                      <FormField
                        key={day.value}
                        control={form.control}
                        name="weekDays"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={day.value}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(day.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value || [], day.value])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== day.value
                                          ) || []
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {day.label}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Observações */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações adicionais sobre a sessão..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botões */}
        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            disabled={isLoading || conflicts.length > 0}
            className="bg-[#ff9810] hover:bg-[#ff9810]/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {sessionId ? 'Atualizar' : 'Agendar'} Sessão
          </Button>
        </div>
      </form>
    </Form>
  );
}