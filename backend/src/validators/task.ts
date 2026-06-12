import { z } from 'zod';

export const TaskStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']);
export const TaskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);

const dueDateSchema = z
  .union([z.string().datetime({ offset: true }), z.string().date(), z.null()])
  .optional()
  .transform((v) => (v ? new Date(v) : v === null ? null : undefined));

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  status: TaskStatusEnum.default('PENDING'),
  priority: TaskPriorityEnum.default('MEDIUM'),
  dueDate: dueDateSchema,
});

export const updateTaskSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    status: TaskStatusEnum.optional(),
    priority: TaskPriorityEnum.optional(),
    dueDate: dueDateSchema,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const taskIdSchema = z.object({
  id: z.string().uuid('Invalid task id'),
});

const sortFieldSchema = z.enum(['createdAt', 'dueDate', 'priority', 'title']);
const sortOrderSchema = z.enum(['asc', 'desc']);

export const listTasksQuerySchema = z.object({
  status: TaskStatusEnum.optional(),
  search: z.string().trim().min(1).max(200).optional(),
  sortBy: sortFieldSchema.default('createdAt'),
  sortOrder: sortOrderSchema.default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
