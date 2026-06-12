const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export class ApiClientError extends Error {
  status: number;
  code: string;
  details?: Array<{ path: string; message: string }>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Array<{ path: string; message: string }>,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = (data as { error?: { code?: string; message?: string; details?: unknown } }).error;
    throw new ApiClientError(
      res.status,
      error?.code ?? 'UNKNOWN',
      error?.message ?? 'Request failed',
      error?.details as Array<{ path: string; message: string }> | undefined,
    );
  }

  return data as T;
}
