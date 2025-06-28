import { Router } from 'express';
import { isAuthenticated, isAdmin } from '../middlewares/auth.middleware';
import {
  getLeadMessages,
  updateMessageStatus,
  deleteMessage,
  getRecentMessagesPerLead,
  getWhatsappStatus,
  getWhatsappConfig,
  saveWhatsappConfig,
  getQRCode,
  checkApiMessageStatus,
  sendTextMessage,
  sendImageMessage,
  sendTemplateMessage,
  handleWebhook, // POST webhook
  verifyWebhook,    // GET webhook verification
  // Novos controladores
  sendDocumentMessage,
  sendAudioMessage,
  sendVideoMessage,
  getWhatsappGroups,
  createWhatsappGroup,
  getWhatsappContacts
} from '../controllers/whatsapp.controller';

const router = Router();

// Helper to wrap async route handlers and forward errors to Express
function asyncHandler(fn: any) {
  return function (req: any, res: any, next: any) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Webhook routes (NO AUTH)
router.post('/webhook', asyncHandler(handleWebhook));
router.get('/webhook', asyncHandler(verifyWebhook)); // For Meta webhook verification

// Configuration routes (Admin only)
router.get('/config', isAuthenticated, isAdmin, asyncHandler(getWhatsappConfig));
router.post('/config', isAuthenticated, isAdmin, asyncHandler(saveWhatsappConfig));

// General WhatsApp status and QR code (Authenticated users)
router.get('/status', isAuthenticated, asyncHandler(getWhatsappStatus));
router.get('/qrcode', isAuthenticated, asyncHandler(getQRCode));

// Message sending and management (Authenticated users)
router.post('/send', isAuthenticated, asyncHandler(sendTextMessage));
router.post('/send-image', isAuthenticated, asyncHandler(sendImageMessage));
router.post('/template', isAuthenticated, asyncHandler(sendTemplateMessage));

// Novas rotas para envio de diferentes tipos de mídia
router.post('/send-document', isAuthenticated, asyncHandler(sendDocumentMessage));
router.post('/send-audio', isAuthenticated, asyncHandler(sendAudioMessage));
router.post('/send-video', isAuthenticated, asyncHandler(sendVideoMessage));

// Rotas para gerenciamento de grupos
router.get('/groups', isAuthenticated, asyncHandler(getWhatsappGroups));
router.post('/groups', isAuthenticated, asyncHandler(createWhatsappGroup));

// Rota para obter contatos
router.get('/contacts', isAuthenticated, asyncHandler(getWhatsappContacts));

router.get('/recent-messages', isAuthenticated, asyncHandler(getRecentMessagesPerLead));
router.get('/lead/:leadId', isAuthenticated, asyncHandler(getLeadMessages));
// Note: a previous route was /api/whatsapp/lead/:id - this consolidates to /lead/:leadId

router.patch('/messages/:id/status', isAuthenticated, asyncHandler(updateMessageStatus));
router.delete('/messages/:id', isAuthenticated, asyncHandler(deleteMessage));
router.get('/message-status/:messageId', isAuthenticated, asyncHandler(checkApiMessageStatus));


export default router;