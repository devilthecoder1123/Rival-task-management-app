'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/States';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/tasks');
  }, [user, loading, router]);

  if (loading) return <LoadingSpinner />;
  if (user) return <LoadingSpinner label="Redirecting…" />;

  return (
    <div className="mx-auto max-w-4xl rounded-[28px] border border-border bg-white/95 p-10 shadow-xl">
      <div className="max-w-2xl">
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-slate-700">
          Task management
        </span>
        <h1 className="mt-6 text-5xl font-semibold tracking-tight text-slate-900">
          Stay focused on the work that matters.
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          Handle priorities, deadlines, and progress from one clean dashboard built for teams and individuals.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/signup" className="btn btn-primary">
            Start free trial
          </Link>
          <Link href="/login" className="btn btn-secondary">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
