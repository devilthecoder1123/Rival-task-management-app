import type { Request, Response } from 'express';
import * as taskService from '../services/taskService';
import { UnauthorizedError } from '../utils/errors';

const actorFromReq = (req: Request) => {
  if (!req.user) throw new UnauthorizedError();
  return { userId: req.user.userId, role: req.user.role };
};

export const createTask = async (req: Request, res: Response): Promise<void> => {
  const task = await taskService.createTask(actorFromReq(req), req.body);
  res.status(201).json({ task });
};

export const listTasks = async (req: Request, res: Response): Promise<void> => {
  
  const result = await taskService.listTasks(actorFromReq(req), req.query as never);
  res.json(result);
};

export const getTask = async (req: Request, res: Response): Promise<void> => {
  const task = await taskService.getTask(actorFromReq(req), req.params.id);
  res.json({ task });
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
  const task = await taskService.updateTask(actorFromReq(req), req.params.id, req.body);
  res.json({ task });
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  await taskService.deleteTask(actorFromReq(req), req.params.id);
  res.status(204).end();
};
