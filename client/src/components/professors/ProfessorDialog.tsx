import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { X, Plus, Minus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { IProfessor } from "@/types";

// Form validation schema
const professorFormSchema = z.object({
  username: z.string().min(1, "Nome de usuário é obrigatório"),
  password: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  active: z.boolean().default(true),
});

type ProfessorFormData = z.infer<typeof professorFormSchema>;

interface ProfessorDialogProps {
  professor?: IProfessor | null;
  open: boolean;
  onClose: () => void;
}

export function ProfessorDialog({ professor, open, onClose }: ProfessorDialogProps) {
  const [newSpecialty, setNewSpecialty] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProfessorFormData>({
    resolver: zodResolver(professorFormSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
      phone: "",
      specialties: [],
      active: true,
    },
  });

  // Reset form when professor changes
  useEffect(() => {
    if (professor) {
      form.reset({
        username: professor.username,
        password: "", // Don't pre-fill password for security
        name: professor.name || "",
        email: professor.email || "",
        phone: professor.phone || "",
        specialties: professor.specialties || [],
        active: professor.active,
      });
    } else {
      form.reset({
        username: "",
        password: "",
        name: "",
        email: "",
        phone: "",
        specialties: [],
        active: true,
      });
    }
  }, [professor, form]);

  // Create professor mutation
  const createProfessorMutation = useMutation({
    mutationFn: async (data: ProfessorFormData) => {
      const response = await fetch("/api/users/professors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          role: "professor",
          // Remove empty email to avoid validation errors
          email: data.email || undefined,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar professor");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/professors"] });
      toast({
        title: "Professor criado",
        description: "Professor criado com sucesso",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar professor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update professor mutation
  const updateProfessorMutation = useMutation({
    mutationFn: async (data: ProfessorFormData) => {
      const response = await fetch(`/api/users/professors/${professor!.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          // Remove empty email to avoid validation errors
          email: data.email || undefined,
          // Only include password if it was provided
          ...(data.password ? { password: data.password } : {}),
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao atualizar professor");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/professors"] });
      toast({
        title: "Professor atualizado",
        description: "Professor atualizado com sucesso",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar professor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfessorFormData) => {
    if (professor) {
      updateProfessorMutation.mutate(data);
    } else {
      createProfessorMutation.mutate(data);
    }
  };

  const addSpecialty = () => {
    if (newSpecialty.trim()) {
      const currentSpecialties = form.getValues("specialties") || [];
      if (!currentSpecialties.includes(newSpecialty.trim())) {
        form.setValue("specialties", [...currentSpecialties, newSpecialty.trim()]);
      }
      setNewSpecialty("");
    }
  };

  const removeSpecialty = (specialtyToRemove: string) => {
    const currentSpecialties = form.getValues("specialties") || [];
    form.setValue(
      "specialties",
      currentSpecialties.filter((s) => s !== specialtyToRemove)
    );
  };

  const isPending = createProfessorMutation.isPending || updateProfessorMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {professor ? "Editar Professor" : "Novo Professor"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Username */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome de Usuário *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Digite o nome de usuário" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Senha {professor ? "(deixe em branco para manter atual)" : "*"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Digite a senha"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Digite o nome completo" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="Digite o e-mail" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Digite o telefone" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Specialties */}
            <FormField
              control={form.control}
              name="specialties"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialidades</FormLabel>
                  <div className="space-y-3">
                    {/* Current specialties */}
                    <div className="flex flex-wrap gap-2">
                      {(field.value || []).map((specialty) => (
                        <Badge key={specialty} variant="secondary" className="flex items-center gap-2">
                          {specialty}
                          <button
                            type="button"
                            onClick={() => removeSpecialty(specialty)}
                            className="ml-1 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Add new specialty */}
                    <div className="flex gap-2">
                      <Input
                        value={newSpecialty}
                        onChange={(e) => setNewSpecialty(e.target.value)}
                        placeholder="Digite uma especialidade"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSpecialty();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={addSpecialty}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active */}
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Professor Ativo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Professores ativos podem ser atribuídos a aulas
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

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Salvando..."
                  : professor
                  ? "Atualizar"
                  : "Criar"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}