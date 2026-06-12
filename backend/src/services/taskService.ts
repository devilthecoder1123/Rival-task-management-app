import { Prisma, TaskPriority } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import type { CreateTaskInput, UpdateTaskInput, ListTasksQuery } from '../validators/task';

interface ActorContext {
  userId: string;
  role: 'USER' | 'ADMIN';
}




const PRIORITY_ORDER: Record<TaskPriority, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

export const createTask = async (actor: ActorContext, input: CreateTaskInput) => {
  return prisma.task.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate ?? null,
      userId: actor.userId,
    },
  });
};

export const listTasks = async (actor: ActorContext, query: ListTasksQuery) => {
  const where: Prisma.TaskWhereInput = {
    
    ...(actor.role === 'ADMIN' ? {} : { userId: actor.userId }),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? { title: { contains: query.search, mode: 'insensitive' as const } }
      : {}),
  };

  const skip = (query.page - 1) * query.pageSize;
  const take = query.pageSize;

  
  
  
  let tasks;
  let total: number;

  if (query.sortBy === 'priority') {
    
    
    
    const [all, count] = await Promise.all([
      prisma.task.findMany({ where, orderBy: { createdAt: 'desc' } }),
      prisma.task.count({ where }),
    ]);
    const sorted = all.sort((a, b) => {
      const diff = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
      return query.sortOrder === 'asc' ? -diff : diff;
    });
    tasks = sorted.slice(skip, skip + take);
    total = count;
  } else {
    const orderBy: Prisma.TaskOrderByWithRelationInput[] = [
      { [query.sortBy]: query.sortOrder },
      { id: 'asc' },
    ];
    [tasks, total] = await Promise.all([
      prisma.task.findMany({ where, orderBy, skip, take }),
      prisma.task.count({ where }),
    ]);
  }

  return {
    data: tasks,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
};

export const getTask = async (actor: ActorContext, id: string) => {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new NotFoundError('Task not found');
  if (actor.role !== 'ADMIN' && task.userId !== actor.userId) {
    
    throw new NotFoundError('Task not found');
  }
  return task;
};

export const updateTask = async (actor: ActorContext, id: string, input: UpdateTaskInput) => {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Task not found');
  if (actor.role !== 'ADMIN' && existing.userId !== actor.userId) {
    throw new NotFoundError('Task not found');
  }
  return prisma.task.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
    },
  });
};

export const deleteTask = async (actor: ActorContext, id: string) => {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Task not found');
  if (actor.role !== 'ADMIN' && existing.userId !== actor.userId) {
    throw new NotFoundError('Task not found');
  }
  await prisma.task.delete({ where: { id } });
};


export const assertOwnership = (actor: ActorContext, ownerId: string) => {
  if (actor.role !== 'ADMIN' && actor.userId !== ownerId) {
    throw new ForbiddenError();
  }
};
