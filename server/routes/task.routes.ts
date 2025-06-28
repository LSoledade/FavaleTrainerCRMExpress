import { Router } from 'express';
import { isAuthenticated, isAdmin } from '../middlewares/auth.middleware';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTasksByAssignedTo,
  getTasksByStatus,
  addTaskComment,
  deleteTaskComment
} from '../controllers/task.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Apply authentication middleware to all task routes
router.use(isAuthenticated);

// Debug logging to trace route registration
console.log('Registering route: GET /assigned-to/:userId');
router.get('/assigned-to/:userId', asyncHandler(getTasksByAssignedTo));
console.log('Registering route: GET /status/:status');
router.get('/status/:status', asyncHandler(getTasksByStatus));

// Task CRUD
console.log('Registering route: GET /');
router.get('/', asyncHandler(getAllTasks));
console.log('Registering route: POST /');
router.post('/', asyncHandler(createTask));
console.log('Registering route: GET /:id');
router.get('/:id', asyncHandler(getTaskById));
console.log('Registering route: PATCH /:id');
router.patch('/:id', asyncHandler(updateTask));
console.log('Registering route: DELETE /:id');
router.delete('/:id', isAdmin, asyncHandler(deleteTask)); // Only admins can delete tasks

// Task Comment routes
console.log('Registering route: POST /:id/comments');
router.post('/:id/comments', asyncHandler(addTaskComment));
console.log('Registering route: DELETE /comments/:id');
router.delete('/comments/:id', asyncHandler(deleteTaskComment)); // Note the path for deleting comments

export default router;