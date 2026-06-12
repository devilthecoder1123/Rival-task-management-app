'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiClientError } from '@/lib/api';
import { TaskForm, type TaskFormValues } from '@/components/TaskForm';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/States';

export default function NewTaskPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const onSubmit = async (values: TaskFormValues) => {
    try {
      await api.createTask({
        title: values.title,
        description: values.description || null,
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
      });
      router.push('/tasks');
    } catch (err) {
      // Re-throw so the form can display the message via its setError('root').
      throw new Error(
        err instanceof ApiClientError ? err.message : 'Could not create task.',
      );
    }
  };

  if (loading || !user) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">New task</h1>
        <Link href="/tasks" className="btn btn-secondary">
          ← Back
        </Link>
      </div>
      <div className="card">
        <TaskForm
          submitLabel="Create task"
          onSubmit={onSubmit}
          onCancel={() => router.push('/tasks')}
        />
      </div>
    </div>
  );
}
