import { Router } from 'express';
import { isAdmin } from '../middlewares/auth.middleware';
import { getAuditLogs } from '../controllers/auditLog.controller';

const router = Router();

// Helper to wrap async route handlers and forward errors to Express
function asyncHandler(fn: any) {
  return function (req: any, res: any, next: any) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Somente administradores podem acessar os logs de auditoria
router.get('/', isAdmin, asyncHandler(getAuditLogs));

export default router;