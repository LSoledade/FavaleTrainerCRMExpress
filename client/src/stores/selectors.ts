import { useLeadStore } from './lead-store';
import { useTaskStore } from './task-store';
import { useWhatsappStore } from './whatsapp-store';

// Optimized selectors to prevent unnecessary re-renders
export const useLeadActions = () => useLeadStore(state => ({
  setSelectedLead: state.setSelectedLead,
  setIsDialogOpen: state.setIsDialogOpen,
  setSelectedLeadIds: state.setSelectedLeadIds,
  createLead: state.createLead,
  updateLead: state.updateLead,
  deleteLead: state.deleteLead,
  updateLeadsInBatch: state.updateLeadsInBatch,
  deleteLeadsInBatch: state.deleteLeadsInBatch,
}));

export const useLeadSelection = () => useLeadStore(state => ({
  selectedLead: state.selectedLead,
  selectedLeadIds: state.selectedLeadIds,
  isDialogOpen: state.isDialogOpen,
}));

export const useTaskActions = () => useTaskStore(state => ({
  fetchTasks: state.fetchTasks,
  fetchTaskById: state.fetchTaskById,
  createTask: state.createTask,
  updateTask: state.updateTask,
  deleteTask: state.deleteTask,
  addComment: state.addComment,
  addTaskComment: state.addTaskComment,
  deleteTaskComment: state.deleteTaskComment,
}));

export const useTaskData = () => useTaskStore(state => ({
  tasks: state.tasks,
  loading: state.loading,
  error: state.error,
}));

export const useWhatsappActions = () => useWhatsappStore(state => ({
  openWhatsappChat: state.openWhatsappChat,
  closeWhatsappChat: state.closeWhatsappChat,
  refreshConnectionStatus: state.refreshConnectionStatus,
}));

export const useWhatsappState = () => useWhatsappStore(state => ({
  isWhatsappOpen: state.isWhatsappOpen,
  selectedLeadForWhatsapp: state.selectedLeadForWhatsapp,
  connectionStatus: state.connectionStatus,
}));