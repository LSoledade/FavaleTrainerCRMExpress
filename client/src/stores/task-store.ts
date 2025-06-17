import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { TaskStore, TaskWithComments } from './types';
import { Task, TaskComment } from '@shared/schema';
import { toast } from '@/hooks/use-toast';

export const useTaskStore = create<TaskStore>()(
  immer((set, get) => ({
    // Initial state
    tasks: [],
    loading: false,
    error: null,

    // Actions
    setTasks: (tasks: TaskWithComments[]) => {
      set((state) => {
        state.tasks = tasks;
      });
    },

    setLoading: (loading: boolean) => {
      set((state) => {
        state.loading = loading;
      });
    },

    setError: (error: string | null) => {
      set((state) => {
        state.error = error;
      });
    },

    fetchTasks: async () => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) {
          throw new Error(`Erro ao buscar tarefas: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Converter datas de string para Date
        const processedTasks = data.map((task: any) => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          comments: task.comments?.map((comment: any) => ({
            ...comment,
            createdAt: new Date(comment.createdAt),
            updatedAt: new Date(comment.updatedAt),
          })),
        }));
        
        set((state) => {
          state.tasks = processedTasks;
          state.loading = false;
        });
      } catch (err) {
        console.error("Erro ao carregar tarefas:", err);
        set((state) => {
          state.error = "Erro ao carregar tarefas";
          state.loading = false;
        });
        
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar as tarefas.",
        });
      }
    },

    fetchTaskById: async (id: number) => {
      try {
        const response = await fetch(`/api/tasks/${id}`);
        if (!response.ok) {
          throw new Error(`Erro ao buscar tarefa: ${response.status}`);
        }
        
        const task = await response.json();
        
        // Converter datas de string para Date
        const processedTask = {
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          comments: task.comments?.map((comment: any) => ({
            ...comment,
            createdAt: new Date(comment.createdAt),
            updatedAt: new Date(comment.updatedAt),
          })),
        };
        
        return processedTask;
      } catch (err) {
        console.error("Erro ao carregar detalhes da tarefa:", err);
        set((state) => {
          state.error = "Erro ao carregar detalhes da tarefa";
        });
        
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os detalhes da tarefa.",
        });
        
        return undefined;
      }
    },

    createTask: async (task: Omit<TaskWithComments, "id" | "createdAt" | "updatedAt" | "comments">) => {
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(task),
        });

        if (!response.ok) {
          throw new Error(`Erro ao criar tarefa: ${response.status}`);
        }

        const newTask = await response.json();
        const processedTask = {
          ...newTask,
          dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
          createdAt: new Date(newTask.createdAt),
          updatedAt: new Date(newTask.updatedAt),
          comments: [],
        };

        set((state) => {
          state.tasks.push(processedTask);
        });

        toast({
          title: "Sucesso",
          description: "Tarefa criada com sucesso.",
        });

        return processedTask;
      } catch (err) {
        console.error("Erro ao criar tarefa:", err);
        set((state) => {
          state.error = "Erro ao criar tarefa";
        });
        
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível criar a tarefa.",
        });
        
        throw err;
      }
    },

    updateTask: async (id: number, task: Partial<TaskWithComments>) => {
      try {
        const response = await fetch(`/api/tasks/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(task),
        });

        if (!response.ok) {
          throw new Error(`Erro ao atualizar tarefa: ${response.status}`);
        }

        const updatedTask = await response.json();
        const processedTask = {
          ...updatedTask,
          dueDate: updatedTask.dueDate ? new Date(updatedTask.dueDate) : undefined,
          createdAt: new Date(updatedTask.createdAt),
          updatedAt: new Date(updatedTask.updatedAt),
          comments: updatedTask.comments?.map((comment: any) => ({
            ...comment,
            createdAt: new Date(comment.createdAt),
            updatedAt: new Date(comment.updatedAt),
          })) || [],
        };

        set((state) => {
          const index = state.tasks.findIndex(t => t.id === id);
          if (index !== -1) {
            state.tasks[index] = processedTask;
          }
        });

        toast({
          title: "Sucesso",
          description: "Tarefa atualizada com sucesso.",
        });

        return processedTask;
      } catch (err) {
        console.error("Erro ao atualizar tarefa:", err);
        set((state) => {
          state.error = "Erro ao atualizar tarefa";
        });
        
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível atualizar a tarefa.",
        });
        
        throw err;
      }
    },

    deleteTask: async (id: number) => {
      try {
        const response = await fetch(`/api/tasks/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`Erro ao excluir tarefa: ${response.status}`);
        }

        set((state) => {
          state.tasks = state.tasks.filter(t => t.id !== id);
        });

        toast({
          title: "Sucesso",
          description: "Tarefa excluída com sucesso.",
        });

        return true;
      } catch (err) {
        console.error("Erro ao excluir tarefa:", err);
        set((state) => {
          state.error = "Erro ao excluir tarefa";
        });
        
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível excluir a tarefa.",
        });
        
        return false;
      }
    },

    addComment: async (taskId: number, content: string) => {
      return get().addTaskComment(taskId, { content });
    },

    addTaskComment: async (taskId: number, comment: Partial<TaskComment>) => {
      try {
        const response = await fetch(`/api/tasks/${taskId}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(comment),
        });

        if (!response.ok) {
          throw new Error(`Erro ao adicionar comentário: ${response.status}`);
        }

        const newComment = await response.json();
        const processedComment = {
          ...newComment,
          createdAt: new Date(newComment.createdAt),
          updatedAt: new Date(newComment.updatedAt),
        };

        set((state) => {
          const task = state.tasks.find(t => t.id === taskId) as TaskWithComments;
          if (task) {
            if (!task.comments) task.comments = [];
            task.comments.push(processedComment);
          }
        });

        toast({
          title: "Sucesso",
          description: "Comentário adicionado com sucesso.",
        });

        return processedComment;
      } catch (err) {
        console.error("Erro ao adicionar comentário:", err);
        set((state) => {
          state.error = "Erro ao adicionar comentário";
        });
        
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível adicionar o comentário.",
        });
        
        throw err;
      }
    },

    deleteTaskComment: async (commentId: number) => {
      try {
        const response = await fetch(`/api/comments/${commentId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`Erro ao excluir comentário: ${response.status}`);
        }

        set((state) => {
          state.tasks.forEach((task: TaskWithComments) => {
            if (task.comments) {
              task.comments = task.comments.filter((c: TaskComment) => c.id !== commentId);
            }
          });
        });

        toast({
          title: "Sucesso",
          description: "Comentário excluído com sucesso.",
        });

        return true;
      } catch (err) {
        console.error("Erro ao excluir comentário:", err);
        set((state) => {
          state.error = "Erro ao excluir comentário";
        });
        
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível excluir o comentário.",
        });
        
        return false;
      }
    },
  }))
);