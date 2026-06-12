'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';

export function NavBar() {
  const { user, logout, loading } = useAuth();

  return (
    <header className="border-b border-border bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href={user ? '/tasks' : '/'} className="text-lg font-semibold tracking-tight text-slate-900">
          TaskApp
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {!loading && user && (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.name}
                {user.role === 'ADMIN' && (
                  <span className="ml-2 badge bg-slate-100 text-slate-900">Admin</span>
                )}
              </span>
              <button type="button" className="btn btn-secondary" onClick={logout}>
                Log out
              </button>
            </>
          )}
          {!loading && !user && (
            <>
              <Link href="/login" className="btn btn-secondary">
                Log in
              </Link>
              <Link href="/signup" className="btn btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
