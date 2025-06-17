import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { WhatsappStore } from './types';
import { Lead } from '@shared/schema';

export const useWhatsappStore = create<WhatsappStore>()(
  immer((set, get) => ({
    // Initial state
    isWhatsappOpen: false,
    selectedLeadForWhatsapp: null,
    connectionStatus: { status: 'checking' },

    // Actions
    openWhatsappChat: (lead: Lead) => {
      set((state) => {
        state.selectedLeadForWhatsapp = lead;
        state.isWhatsappOpen = true;
      });
    },

    closeWhatsappChat: () => {
      set((state) => {
        state.isWhatsappOpen = false;
        state.selectedLeadForWhatsapp = null;
      });
    },

    setConnectionStatus: (status) => {
      set((state) => {
        state.connectionStatus = status;
      });
    },

    refreshConnectionStatus: async () => {
      set((state) => {
        state.connectionStatus = { status: 'checking' };
      });

      try {
        const response = await fetch('/api/whatsapp/status');
        const data = await response.json();
        
        set((state) => {
          state.connectionStatus = {
            status: data.status,
            message: data.message,
            details: data.details
          };
        });
      } catch (error) {
        console.error('Error checking WhatsApp status:', error);
        set((state) => {
          state.connectionStatus = {
            status: 'error',
            message: 'Não foi possível verificar a conexão'
          };
        });
      }
    },
  }))
);