import { Router } from 'express';
import * as taskController from '../controllers/taskController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdSchema,
  listTasksQuerySchema,
} from '../validators/task';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// All task routes require authentication.
router.use(requireAuth);

router.get('/', validate(listTasksQuerySchema, 'query'), asyncHandler(taskController.listTasks));
router.post('/', validate(createTaskSchema), asyncHandler(taskController.createTask));
router.get('/:id', validate(taskIdSchema, 'params'), asyncHandler(taskController.getTask));
router.patch(
  '/:id',
  validate(taskIdSchema, 'params'),
  validate(updateTaskSchema),
  asyncHandler(taskController.updateTask),
);
router.delete('/:id', validate(taskIdSchema, 'params'), asyncHandler(taskController.deleteTask));

export default router;
