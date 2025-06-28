import { Router } from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware'; // Assuming all lead routes require authentication
import {
  importLeadsBatch,
  updateLeadsBatch,
  deleteLeadsBatch,
  getAllLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead
} from '../controllers/lead.controller';

const router = Router();

// Helper to wrap async route handlers and forward errors to Express
function asyncHandler(fn: any) {
  return function (req: any, res: any, next: any) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Apply authentication middleware to all lead routes
router.use(isAuthenticated);

// Batch operations
console.log('Registering route: POST /batch/import');
router.post('/batch/import', asyncHandler(importLeadsBatch));
console.log('Registering route: POST /batch/update');
router.post('/batch/update', asyncHandler(updateLeadsBatch));
console.log('Registering route: POST /batch/delete');
router.post('/batch/delete', asyncHandler(deleteLeadsBatch));

// Standard CRUD operations
console.log('Registering route: GET /');
router.get('/', asyncHandler(getAllLeads));
console.log('Registering route: POST /');
router.post('/', asyncHandler(createLead));
console.log('Registering route: GET /:id');
router.get('/:id', asyncHandler(getLeadById));
console.log('Registering route: PATCH /:id');
router.patch('/:id', asyncHandler(updateLead));
console.log('Registering route: DELETE /:id');
router.delete('/:id', asyncHandler(deleteLead));

export default router;