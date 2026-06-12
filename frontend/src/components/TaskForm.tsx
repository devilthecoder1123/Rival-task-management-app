'use client';

import { useTaskForm, type TaskFormValues } from '@/hooks/useTaskForm';
import { PRIORITY_LABELS, PRIORITY_OPTIONS, STATUS_LABELS, STATUS_OPTIONS } from '@/constants/task';
import type { Task } from '@/types';

export type { TaskFormValues } from '@/hooks/useTaskForm';

interface Props {
  initial?: Task;
  submitLabel: string;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  onCancel?: () => void;
}

export function TaskForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const { values, errors, isSubmitting, handleChange, handleSubmit } = useTaskForm({
    initial,
    onSubmit,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <label className="label" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          name="title"
          className="input"
          value={values.title}
          onChange={handleChange}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && (
          <p id="title-error" className="mt-2 text-sm text-danger">
            {errors.title}
          </p>
        )}
      </div>

      <div>
        <label className="label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="input min-h-[120px]"
          value={values.description ?? ''}
          onChange={handleChange}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
        {errors.description && (
          <p id="description-error" className="mt-2 text-sm text-danger">
            {errors.description}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="input"
            value={values.status}
            onChange={handleChange}
            aria-invalid={!!errors.status}
            aria-describedby={errors.status ? 'status-error' : undefined}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {STATUS_LABELS[option]}
              </option>
            ))}
          </select>
          {errors.status && (
            <p id="status-error" className="mt-2 text-sm text-danger">
              {errors.status}
            </p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="priority">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            className="input"
            value={values.priority}
            onChange={handleChange}
            aria-invalid={!!errors.priority}
            aria-describedby={errors.priority ? 'priority-error' : undefined}
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {PRIORITY_LABELS[option]}
              </option>
            ))}
          </select>
          {errors.priority && (
            <p id="priority-error" className="mt-2 text-sm text-danger">
              {errors.priority}
            </p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="dueDate">
            Due date
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            className="input"
            value={values.dueDate ?? ''}
            onChange={handleChange}
            aria-invalid={!!errors.dueDate}
            aria-describedby={errors.dueDate ? 'dueDate-error' : undefined}
          />
          {errors.dueDate && (
            <p id="dueDate-error" className="mt-2 text-sm text-danger">
              {errors.dueDate}
            </p>
          )}
        </div>
      </div>

      {errors.root && (
        <div className="rounded-2xl bg-danger/10 p-4 text-sm text-danger">{errors.root}</div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <button type="button" className="btn btn-secondary w-full sm:w-auto" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
