'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { StatusBadge, PriorityBadge } from './Badges';
import { formatDate, isOverdue } from '@/lib/date';
import type { Task } from '@/types';

interface Props {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onDelete: (task: Task) => void;
  pending?: boolean; // shows a faint loading state for optimistic updates
}

export function TaskCard({ task, onToggleComplete, onDelete, pending }: Props) {
  const overdue = isOverdue(task.dueDate, task.status);
  const completed = task.status === 'COMPLETED';

  return (
    <article
      className={clsx(
        'card flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between',
        pending && 'opacity-60',
      )}
      data-testid="task-card"
    >
      <div className="flex flex-1 items-start gap-3">
        <input
          type="checkbox"
          checked={completed}
          onChange={() => onToggleComplete(task)}
          aria-label={completed ? 'Mark as pending' : 'Mark as complete'}
          className="mt-1 h-5 w-5 cursor-pointer rounded border-border accent-primary"
        />
        <div className="flex-1">
          <h3 className={clsx('font-semibold', completed && 'line-through text-muted-foreground')}>
            <Link href={`/tasks/${task.id}`} className="hover:underline">
              {task.title}
            </Link>
          </h3>
          {task.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{task.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            <span className={clsx('text-muted-foreground', overdue && 'text-danger font-medium')}>
              {task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No due date'}
              {overdue && ' (overdue)'}
            </span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link href={`/tasks/${task.id}/edit`} className="btn btn-secondary px-3 py-1.5">
          Edit
        </Link>
        <button
          type="button"
          className="btn btn-danger px-3 py-1.5"
          onClick={() => onDelete(task)}
          aria-label={`Delete ${task.title}`}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
