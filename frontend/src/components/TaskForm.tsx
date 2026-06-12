'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { toDateInputValue } from '@/lib/date';
import { isValidDate } from '@/lib/validation';
import type { Task, TaskPriority, TaskStatus } from '@/types';

export type TaskFormValues = {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
};

interface Props {
  initial?: Task;
  submitLabel: string;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  onCancel?: () => void;
}

interface FormErrors {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  root?: string;
}

const statusOptions: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
const priorityOptions: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH'];

export function TaskForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<TaskFormValues>({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    status: (initial?.status ?? 'PENDING') as TaskStatus,
    priority: (initial?.priority ?? 'MEDIUM') as TaskPriority,
    dueDate: toDateInputValue(initial?.dueDate),
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (currentValues: TaskFormValues) => {
    const next: FormErrors = {};

    if (!currentValues.title.trim()) {
      next.title = 'Title is required';
    } else if (currentValues.title.length > 200) {
      next.title = 'Title must be 200 characters or less';
    }

    if (currentValues.description && currentValues.description.length > 2000) {
      next.description = 'Description must be 2000 characters or less';
    }

    if (!statusOptions.includes(currentValues.status)) {
      next.status = 'Choose a valid status';
    }

    if (!priorityOptions.includes(currentValues.priority)) {
      next.priority = 'Choose a valid priority';
    }

    if (currentValues.dueDate && !isValidDate(currentValues.dueDate)) {
      next.dueDate = 'Enter a valid due date';
    }

    return next;
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    setValues((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: undefined,
      root: undefined,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    try {
      await onSubmit(values);
    } catch (err) {
      setErrors({
        root: err instanceof Error ? err.message : 'Something went wrong',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'PENDING'
                  ? 'Pending'
                  : option === 'IN_PROGRESS'
                  ? 'In progress'
                  : 'Completed'}
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
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
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
          <button
            type="button"
            className="btn btn-secondary w-full sm:w-auto"
            onClick={onCancel}
          >
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
