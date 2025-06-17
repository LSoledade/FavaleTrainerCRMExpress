import { useLeadStore } from './lead-store';
import { useTaskStore } from './task-store';
import { useWhatsappStore } from './whatsapp-store';

// Simple, stable selectors to prevent re-render loops
export const useLeadActions = () => {
  const setSelectedLead = useLeadStore(state => state.setSelectedLead);
  const setIsDialogOpen = useLeadStore(state => state.setIsDialogOpen);
  const setSelectedLeadIds = useLeadStore(state => state.setSelectedLeadIds);
  const createLead = useLeadStore(state => state.createLead);
  const updateLead = useLeadStore(state => state.updateLead);
  const deleteLead = useLeadStore(state => state.deleteLead);
  const updateLeadsInBatch = useLeadStore(state => state.updateLeadsInBatch);
  const deleteLeadsInBatch = useLeadStore(state => state.deleteLeadsInBatch);

  return {
    setSelectedLead,
    setIsDialogOpen,
    setSelectedLeadIds,
    createLead,
    updateLead,
    deleteLead,
    updateLeadsInBatch,
    deleteLeadsInBatch,
  };
};

export const useLeadSelection = () => {
  const selectedLead = useLeadStore(state => state.selectedLead);
  const selectedLeadIds = useLeadStore(state => state.selectedLeadIds);
  const isDialogOpen = useLeadStore(state => state.isDialogOpen);

  return {
    selectedLead,
    selectedLeadIds,
    isDialogOpen,
  };
};

export const useTaskActions = () => {
  const fetchTasks = useTaskStore(state => state.fetchTasks);
  const updateTask = useTaskStore(state => state.updateTask);
  
  return {
    fetchTasks,
    updateTask,
  };
};

export const useTaskData = () => {
  const tasks = useTaskStore(state => state.tasks);
  const loading = useTaskStore(state => state.loading);
  const error = useTaskStore(state => state.error);
  
  return {
    tasks,
    loading,
    error,
  };
};

export const useWhatsappActions = () => {
  const openWhatsappChat = useWhatsappStore(state => state.openWhatsappChat);
  const closeWhatsappChat = useWhatsappStore(state => state.closeWhatsappChat);
  
  return {
    openWhatsappChat,
    closeWhatsappChat,
  };
};

export const useWhatsappState = () => {
  const isWhatsappOpen = useWhatsappStore(state => state.isWhatsappOpen);
  const selectedLeadForWhatsapp = useWhatsappStore(state => state.selectedLeadForWhatsapp);
  const connectionStatus = useWhatsappStore(state => state.connectionStatus);
  
  return {
    isWhatsappOpen,
    selectedLeadForWhatsapp,
    connectionStatus,
  };
};