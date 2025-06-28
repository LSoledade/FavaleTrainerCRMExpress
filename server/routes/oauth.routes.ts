import { Router } from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware';
import {
  getGoogleAuthUrl,
  handleGoogleCallback,
  getTokenStatus,
  revokeGoogleAccess
} from '../controllers/oauth.controller';

const router = Router();

// Helper to wrap async route handlers and forward errors to Express
function asyncHandler(fn: any) {
  return function (req: any, res: any, next: any) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Todas as rotas OAuth2 precisam de autenticação
router.use(isAuthenticated);

// Gerar URL de autorização do Google
router.get('/google/auth-url', asyncHandler(getGoogleAuthUrl));

// Callback do Google OAuth2
router.get('/google/callback', asyncHandler(handleGoogleCallback));

// Status dos tokens
router.get('/google/status', asyncHandler(getTokenStatus));

// Revogar acesso
router.delete('/google/revoke', asyncHandler(revokeGoogleAccess));

export default router;
