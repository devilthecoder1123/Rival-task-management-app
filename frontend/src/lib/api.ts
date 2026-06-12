import * as authApi from '@/lib/api/auth';
import * as taskApi from '@/lib/api/tasks';
export { ApiClientError } from '@/lib/api/client';

export const api = {
  ...authApi,
  ...taskApi,
};
