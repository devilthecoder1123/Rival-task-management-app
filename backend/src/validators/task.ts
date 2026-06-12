type ValidationErrorDetail = {
  path: string;
  message: string;
};

type ValidationSchema<T> = {
  parse(input: unknown): T;
};

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type SortField = 'createdAt' | 'dueDate' | 'priority' | 'title';
export type SortOrder = 'asc' | 'desc';

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
}

export interface ListTasksQuery {
  status?: TaskStatus;
  search?: string;
  sortBy: SortField;
  sortOrder: SortOrder;
  page: number;
  pageSize: number;
}

const createValidationError = (details: ValidationErrorDetail[]) => {
  const error = new Error('Validation failed');
  (error as any).details = details;
  return error;
};

const isString = (value: unknown): value is string => typeof value === 'string';

const normalizeString = (value: unknown): string => {
  if (!isString(value)) {
    throw createValidationError([{ path: 'value', message: 'Value must be a string' }]);
  }
  return value.trim();
};

const requireString = (value: unknown, path: string): string => {
  if (!isString(value) || value.trim().length === 0) {
    throw createValidationError([{ path, message: `${path} is required` }]);
  }
  return value.trim();
};

const requireStringLength = (value: unknown, path: string, min: number, max: number): string => {
  const result = requireString(value, path);
  if (result.length < min) {
    throw createValidationError([{ path, message: `${path} must be at least ${min} characters` }]);
  }
  if (result.length > max) {
    throw createValidationError([{ path, message: `${path} must be at most ${max} characters` }]);
  }
  return result;
};

const requireEnum = <T extends string>(
  value: unknown,
  path: string,
  options: readonly T[],
  defaultValue: T,
): T => {
  if (value === undefined) return defaultValue;
  if (isString(value) && options.includes(value as T)) {
    return value as T;
  }
  throw createValidationError([
    { path, message: `${path} must be one of: ${options.join(', ')}` },
  ]);
};

const parseOptionalNullableString = (
  value: unknown,
  path: string,
  maxLength: number,
): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!isString(value)) {
    throw createValidationError([{ path, message: `${path} must be a string or null` }]);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (trimmed.length > maxLength) {
    throw createValidationError([{ path, message: `${path} must be at most ${maxLength} characters` }]);
  }
  return trimmed;
};

const parseDateValue = (value: unknown, path: string): Date | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!isString(value) || value.trim().length === 0) {
    throw createValidationError([
      { path, message: `${path} must be a valid date string or null` },
    ]);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createValidationError([
      { path, message: `${path} must be a valid date` },
    ]);
  }
  return date;
};

const parseUuid = (value: unknown, path: string): string => {
  const raw = requireString(value, path);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(raw)) {
    throw createValidationError([{ path, message: 'Invalid task id' }]);
  }
  return raw;
};

const parseQueryValue = (value: unknown): string | undefined => {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value[0];
  if (isString(value)) return value;
  return undefined;
};

const parseIntegerQuery = (
  rawValue: unknown,
  path: string,
  defaultValue: number,
  min: number,
  max?: number,
): number => {
  const value = parseQueryValue(rawValue);
  if (value === undefined) return defaultValue;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || (max !== undefined && parsed > max)) {
    throw createValidationError([
      { path, message: `${path} must be an integer between ${min} and ${max ?? '∞'}` },
    ]);
  }
  return parsed;
};

const validStatuses: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
const validPriorities: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH'];
const validSortFields: SortField[] = ['createdAt', 'dueDate', 'priority', 'title'];
const validSortOrders: SortOrder[] = ['asc', 'desc'];

export const createTaskSchema: ValidationSchema<CreateTaskInput> = {
  parse(input: unknown) {
    if (typeof input !== 'object' || input === null) {
      throw createValidationError([{ path: 'body', message: 'Request body must be an object' }]);
    }

    const body = input as Record<string, unknown>;

    return {
      title: requireStringLength(body.title, 'title', 1, 200),
      description: parseOptionalNullableString(body.description, 'description', 2000),
      status: requireEnum(body.status, 'status', validStatuses, 'PENDING'),
      priority: requireEnum(body.priority, 'priority', validPriorities, 'MEDIUM'),
      dueDate: parseDateValue(body.dueDate, 'dueDate'),
    };
  },
};

export const updateTaskSchema: ValidationSchema<UpdateTaskInput> = {
  parse(input: unknown) {
    if (typeof input !== 'object' || input === null) {
      throw createValidationError([{ path: 'body', message: 'Request body must be an object' }]);
    }

    const body = input as Record<string, unknown>;
    const parsed: UpdateTaskInput = {};

    if (body.title !== undefined) {
      parsed.title = requireStringLength(body.title, 'title', 1, 200);
    }

    if (body.description !== undefined) {
      parsed.description = parseOptionalNullableString(body.description, 'description', 2000);
    }

    if (body.status !== undefined) {
      parsed.status = requireEnum(body.status, 'status', validStatuses, 'PENDING');
    }

    if (body.priority !== undefined) {
      parsed.priority = requireEnum(body.priority, 'priority', validPriorities, 'MEDIUM');
    }

    if (body.dueDate !== undefined) {
      parsed.dueDate = parseDateValue(body.dueDate, 'dueDate');
    }

    if (Object.keys(parsed).length === 0) {
      throw createValidationError([{ path: 'body', message: 'At least one field is required' }]);
    }

    return parsed;
  },
};

export const taskIdSchema: ValidationSchema<{ id: string }> = {
  parse(input: unknown) {
    if (typeof input !== 'object' || input === null) {
      throw createValidationError([{ path: 'params', message: 'Route parameters must be an object' }]);
    }

    const params = input as Record<string, unknown>;
    return { id: parseUuid(params.id, 'id') };
  },
};

export const listTasksQuerySchema: ValidationSchema<ListTasksQuery> = {
  parse(input: unknown) {
    if (typeof input !== 'object' || input === null) {
      throw createValidationError([{ path: 'query', message: 'Query must be an object' }]);
    }

    const query = input as Record<string, unknown>;

    const statusValue = parseQueryValue(query.status);
    const searchValue = parseQueryValue(query.search);
    const sortByValue = parseQueryValue(query.sortBy);
    const sortOrderValue = parseQueryValue(query.sortOrder);

    const status = statusValue === undefined ? undefined : requireEnum(statusValue, 'status', validStatuses, 'PENDING');
    const search = searchValue === undefined ? undefined : searchValue.trim();
    if (search !== undefined && (search.length === 0 || search.length > 200)) {
      throw createValidationError([
        { path: 'search', message: 'search must be between 1 and 200 characters' },
      ]);
    }

    const sortBy = sortByValue === undefined ? 'createdAt' : requireEnum(sortByValue, 'sortBy', validSortFields, 'createdAt');
    const sortOrder = sortOrderValue === undefined ? 'desc' : requireEnum(sortOrderValue, 'sortOrder', validSortOrders, 'desc');

    return {
      status,
      search,
      sortBy,
      sortOrder,
      page: parseIntegerQuery(query.page, 'page', 1, 1),
      pageSize: parseIntegerQuery(query.pageSize, 'pageSize', 10, 1, 100),
    };
  },
};
