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

type SignupFormValues = {
  name: string;
  email: string;
  password: string;
};

export default function SignupPage() {
  const router = useRouter();
  const { signup, user, loading } = useAuth();
  useRedirectIfAuthenticated(user, loading);

  const { values, errors, isSubmitting, handleChange, handleSubmit } = useAuthForm<SignupFormValues>({
    initialValues: { name: '', email: '', password: '' },
    validate: (fields) => {
      const next: Record<string, string> = {};
      if (!fields.name.trim()) next.name = 'Name is required';
      else if (fields.name.length > 100) next.name = 'Name must be 100 characters or less';
      if (!fields.email.trim()) next.email = 'Email is required';
      else if (!isEmail(fields.email)) next.email = 'Enter a valid email';
      if (!fields.password) next.password = 'Password is required';
      else if (fields.password.length < 8) next.password = 'Password must be at least 8 characters';
      else if (fields.password.length > 128) next.password = 'Password must be 128 characters or less';
      return next;
    },
    onSubmit: async (fields) => {
      try {
        await signup(fields.email.trim(), fields.password, fields.name.trim());
        router.replace('/tasks');
      } catch (err) {
        throw new Error(err instanceof ApiClientError ? err.message : 'Unable to sign up. Please try again.');
      }
    },
  });

  if (loading || user) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="mb-2 text-3xl font-semibold">Create your account</h1>
        <p className="mb-6 text-sm text-muted-foreground">Sign up to start managing tasks.</p>
        <AuthForm formType="signup" values={values} errors={errors} isSubmitting={isSubmitting} onChange={handleChange} onSubmit={handleSubmit} />
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
