import { Router } from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { checkStatus, getWeather } from '../controllers/weather.controller';

const router = Router();

// Apply authentication middleware to weather routes
router.use(isAuthenticated);

// Helper to wrap async route handlers and forward errors to Express
function asyncHandler(fn: any) {
  return function (req: any, res: any, next: any) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Weather routes
router.get('/status', asyncHandler(checkStatus));
router.get('/:city', asyncHandler(getWeather));

export default router;