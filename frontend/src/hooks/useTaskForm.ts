import { useCallback, useState } from 'react';
import { toDateInputValue } from '@/lib/date';
import { isValidDate } from '@/lib/validation';
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '@/constants/task';
import type { ChangeEvent, FormEvent } from 'react';
import type { Task, TaskPriority, TaskStatus } from '@/types';

export type TaskFormValues = {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
};

export type TaskFormErrors = Partial<Record<keyof TaskFormValues | 'root', string>>;

interface UseTaskFormOptions {
  initial?: Task;
  onSubmit: (values: TaskFormValues) => Promise<void>;
}

export function useTaskForm({ initial, onSubmit }: UseTaskFormOptions) {
  const [values, setValues] = useState<TaskFormValues>({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    status: (initial?.status ?? 'PENDING') as TaskStatus,
    priority: (initial?.priority ?? 'MEDIUM') as TaskPriority,
    dueDate: toDateInputValue(initial?.dueDate),
  });
  const [errors, setErrors] = useState<TaskFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = useCallback((currentValues: TaskFormValues) => {
    const next: TaskFormErrors = {};

    if (!currentValues.title.trim()) {
      next.title = 'Title is required';
    } else if (currentValues.title.length > 200) {
      next.title = 'Title must be 200 characters or less';
    }

    if (currentValues.description && currentValues.description.length > 2000) {
      next.description = 'Description must be 2000 characters or less';
    }

    if (!STATUS_OPTIONS.includes(currentValues.status)) {
      next.status = 'Choose a valid status';
    }

    if (!PRIORITY_OPTIONS.includes(currentValues.priority)) {
      next.priority = 'Choose a valid priority';
    }

    if (currentValues.dueDate && !isValidDate(currentValues.dueDate)) {
      next.dueDate = 'Enter a valid due date';
    }

    return next;
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined, root: undefined }));
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

  return { values, errors, isSubmitting, handleChange, handleSubmit };
}
