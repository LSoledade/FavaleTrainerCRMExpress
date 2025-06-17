import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { LeadStore } from './types';
import { Lead, InsertLead } from '@shared/schema';

export const useLeadStore = create<LeadStore>()(
  immer((set, get) => ({
    // Initial state
    selectedLead: null,
    isDialogOpen: false,
    selectedLeadIds: [],

    // Actions
    setSelectedLead: (lead: Lead | null) => {
      set((state) => {
        state.selectedLead = lead;
      });
    },

    setIsDialogOpen: (isOpen: boolean) => {
      set((state) => {
        state.isDialogOpen = isOpen;
      });
    },

    setSelectedLeadIds: (ids: number[]) => {
      set((state) => {
        state.selectedLeadIds = ids;
      });
    },

    createLead: async (lead: InsertLead) => {
      try {
        await apiRequest("POST", "/api/leads", lead);
        
        // Invalidate queries using the query client
        await queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        
        toast({
          title: "Sucesso",
          description: "Lead criado com sucesso",
        });
        
        set((state) => {
          state.isDialogOpen = false;
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao criar lead",
          variant: "destructive",
        });
        console.error("Error creating lead:", error);
      }
    },

    updateLead: async (id: number, lead: Partial<InsertLead>) => {
      try {
        await apiRequest<Lead>("PATCH", `/api/leads/${id}`, lead);
        
        // Invalidate queries
        await queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        
        toast({
          title: "Sucesso",
          description: "Lead atualizado com sucesso",
        });
        
        set((state) => {
          state.isDialogOpen = false;
          state.selectedLead = null;
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao atualizar lead",
          variant: "destructive",
        });
        console.error("Error updating lead:", error);
      }
    },

    deleteLead: async (id: number) => {
      try {
        await apiRequest<void>("DELETE", `/api/leads/${id}`);
        
        // Invalidate queries
        await queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        
        toast({
          title: "Sucesso",
          description: "Lead excluído com sucesso",
        });
        
        set((state) => {
          state.selectedLead = null;
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao excluir lead",
          variant: "destructive",
        });
        console.error("Error deleting lead:", error);
      }
    },

    updateLeadsInBatch: async (ids: number[], updates: Partial<InsertLead>): Promise<number> => {
      try {
        const response = await apiRequest<{ updatedCount: number }>("POST", "/api/leads/batch/update", { ids, updates });
        
        // Invalidate queries
        await queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        
        const updatedCount = response.updatedCount || 0;
        
        toast({
          title: "Sucesso",
          description: `${updatedCount} leads atualizados com sucesso`,
        });
        
        set((state) => {
          state.selectedLeadIds = [];
        });
        
        return updatedCount;
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao atualizar leads em lote",
          variant: "destructive",
        });
        console.error("Error updating leads in batch:", error);
        return 0;
      }
    },

    deleteLeadsInBatch: async (ids: number[]): Promise<number> => {
      try {
        const response = await apiRequest<{ deletedCount: number }>("POST", "/api/leads/batch/delete", { ids });
        
        // Invalidate queries
        await queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        
        const deletedCount = response.deletedCount || 0;
        
        toast({
          title: "Sucesso",
          description: `${deletedCount} leads excluídos com sucesso`,
        });
        
        set((state) => {
          state.selectedLeadIds = [];
        });
        
        return deletedCount;
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao excluir leads em lote",
          variant: "destructive",
        });
        console.error("Error deleting leads in batch:", error);
        return 0;
      }
    },
  }))
);