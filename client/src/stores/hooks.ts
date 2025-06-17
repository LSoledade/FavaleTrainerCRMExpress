import { useAuth } from '@/hooks/use-auth';
import { useLeadStore } from './lead-store';
import { useTaskStore } from './task-store';
import { useWhatsappStore } from './whatsapp-store';

// Enhanced hooks with computed values for better performance
export const useLeadStoreEnhanced = () => {
  const store = useLeadStore();
  
  return {
    ...store,
    // Computed values that would otherwise trigger re-renders
    hasSelectedLeads: store.selectedLeadIds.length > 0,
    selectedLeadsCount: store.selectedLeadIds.length,
  };
};

export const useTaskStoreEnhanced = () => {
  const store = useTaskStore();
  const { user } = useAuth();
  
  const currentUserId = user?.id || 0;
  
  // Computed values for task filtering
  const myTasks = store.tasks.filter(task => 
    task.assignedToId === currentUserId && task.status !== "completed"
  );
  
  const assignedTasks = store.tasks.filter(task => 
    task.assignedById === currentUserId && task.status !== "completed"
  );
  
  const completedTasks = store.tasks.filter(task => 
    (task.assignedToId === currentUserId || task.assignedById === currentUserId) && 
    task.status === "completed"
  );
  
  return {
    ...store,
    myTasks,
    assignedTasks,
    completedTasks,
  };
};

export const useWhatsappStoreEnhanced = () => {
  const store = useWhatsappStore();
  
  return {
    ...store,
    // Computed connection state
    isConnected: store.connectionStatus.status === 'connected',
    isDisconnected: store.connectionStatus.status === 'disconnected',
    isChecking: store.connectionStatus.status === 'checking',
    hasError: store.connectionStatus.status === 'error',
  };
};