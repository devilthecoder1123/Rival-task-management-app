import { Prisma, TaskPriority } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import type { CreateTaskInput, UpdateTaskInput, ListTasksQuery } from '../validators/task';

interface ActorContext {
  userId: string;
  role: 'USER' | 'ADMIN';
}

// Priority order map (HIGH > MEDIUM > LOW) for "priority" sorting.
// Prisma sorts enums alphabetically by default which doesn't match our intent,
// so for priority sorting we'll use an in-memory ordering via raw SQL CASE.
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
    // Admins can see everyone's tasks; regular users only their own.
    ...(actor.role === 'ADMIN' ? {} : { userId: actor.userId }),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? { title: { contains: query.search, mode: 'insensitive' as const } }
      : {}),
  };

  const skip = (query.page - 1) * query.pageSize;
  const take = query.pageSize;

  // For "priority", we need a custom order (HIGH > MEDIUM > LOW). For
  // everything else, a normal Prisma orderBy is fine. Sort by id as a
  // tiebreaker so pagination stays stable when fields are equal.
  let tasks;
  let total: number;

  if (query.sortBy === 'priority') {
    // Fetch all matching ids first then sort in-memory with proper priority weighting.
    // This is acceptable because pageSize is capped at 100; if you expect huge
    // datasets, swap this for a raw SQL ORDER BY CASE.
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
    // Don't leak existence: 404, not 403.
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

// Defensive: keep this around in case we need to enforce ownership independently
export const assertOwnership = (actor: ActorContext, ownerId: string) => {
  if (actor.role !== 'ADMIN' && actor.userId !== ownerId) {
    throw new ForbiddenError();
  }
};
