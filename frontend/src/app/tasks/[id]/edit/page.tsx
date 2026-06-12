'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRedirectIfUnauthenticated } from '@/hooks/useAuthGuard';
import { useTaskDetail } from '@/hooks/useTaskDetail';
import { api, ApiClientError } from '@/lib/api';
import { TaskForm, type TaskFormValues } from '@/components/TaskForm';
import { LoadingSpinner, ErrorState } from '@/components/States';

export default function EditTaskPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  useRedirectIfUnauthenticated(user, loading);

  const { task, loading: taskLoading, error, fetchTask } = useTaskDetail(params.id, user);

  const onSubmit = async (values: TaskFormValues) => {
    if (!task) return;

    try {
      await api.updateTask(task.id, {
        title: values.title,
        description: values.description || null,
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
      });
      router.push(`/tasks/${task.id}`);
    } catch (err) {
      throw new Error(err instanceof ApiClientError ? err.message : 'Could not update task.');
    }
  };

  if (loading || taskLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchTask} />;
  if (!task) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit task</h1>
        <Link href={`/tasks/${task.id}`} className="btn btn-secondary">
          ← Back
        </Link>
      </div>
      <div className="card">
        <TaskForm
          initial={task}
          submitLabel="Save changes"
          onSubmit={onSubmit}
          onCancel={() => router.push(`/tasks/${task.id}`)}
        />
      </div>
    </div>
  );
}
