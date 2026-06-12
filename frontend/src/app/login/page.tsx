'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRedirectIfAuthenticated } from '@/hooks/useAuthGuard';
import { useAuthForm } from '@/hooks/useAuthForm';
import { AuthForm } from '@/components/AuthForm';
import { isEmail } from '@/lib/validation';
import { ApiClientError } from '@/lib/api';
import { LoadingSpinner } from '@/components/States';

type LoginFormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading } = useAuth();
  useRedirectIfAuthenticated(user, loading);

  const { values, errors, isSubmitting, handleChange, handleSubmit } = useAuthForm<LoginFormValues>({
    initialValues: { email: '', password: '' },
    validate: (fields) => {
      const next: Record<string, string> = {};
      if (!fields.email.trim()) next.email = 'Email is required';
      else if (!isEmail(fields.email)) next.email = 'Enter a valid email';
      if (!fields.password) next.password = 'Password is required';
      return next;
    },
    onSubmit: async (fields) => {
      try {
        await login(fields.email.trim(), fields.password);
        router.replace('/tasks');
      } catch (err) {
        throw new Error(err instanceof ApiClientError ? err.message : 'Unable to log in. Please try again.');
      }
    },
  });

  if (loading || user) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="mb-2 text-3xl font-semibold">Welcome back</h1>
        <p className="mb-6 text-sm text-muted-foreground">Log in to access your tasks.</p>
        <AuthForm formType="login" values={values} errors={errors} isSubmitting={isSubmitting} onChange={handleChange} onSubmit={handleSubmit} />
        <p className="mt-5 text-center text-sm text-muted-foreground">
          New here?{' '}
          <Link href="/signup" className="text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
