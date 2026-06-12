import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useRedirectIfAuthenticated(user: unknown, loading: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/tasks');
    }
  }, [user, loading, router]);
}

export function useRedirectIfUnauthenticated(user: unknown, loading: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);
}
