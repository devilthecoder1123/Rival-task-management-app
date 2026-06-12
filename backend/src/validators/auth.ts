const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ValidationErrorDetail = {
  path: string;
  message: string;
};

type ValidationSchema<T> = {
  parse(input: unknown): T;
};

const createValidationError = (details: ValidationErrorDetail[]) => {
  const error = new Error('Validation failed');
  (error as any).details = details;
  return error;
};

const requireString = (value: unknown, field: string): string => {
  if (typeof value !== 'string') {
    throw createValidationError([{ path: field, message: `${field} must be a string` }]);
  }
  return value;
};

const requireNonEmptyString = (value: unknown, field: string): string => {
  const raw = requireString(value, field).trim();
  if (raw.length === 0) {
    throw createValidationError([{ path: field, message: `${field} is required` }]);
  }
  return raw;
};

const requireEmail = (value: unknown, field: string): string => {
  const raw = requireNonEmptyString(value, field);
  if (!EMAIL_REGEX.test(raw)) {
    throw createValidationError([{ path: field, message: 'Invalid email address' }]);
  }
  return raw;
};

const requirePassword = (value: unknown, field: string): string => {
  const raw = requireString(value, field);
  if (raw.length < 8) {
    throw createValidationError([
      { path: field, message: 'Password must be at least 8 characters' },
    ]);
  }
  if (raw.length > 128) {
    throw createValidationError([{ path: field, message: 'Password is too long' }]);
  }
  return raw;
};

export interface SignupInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const signupSchema: ValidationSchema<SignupInput> = {
  parse(input: unknown) {
    if (typeof input !== 'object' || input === null) {
      throw createValidationError([{ path: 'body', message: 'Request body must be an object' }]);
    }

    const body = input as Record<string, unknown>;

    return {
      email: requireEmail(body.email, 'email'),
      password: requirePassword(body.password, 'password'),
      name: requireNonEmptyString(body.name, 'name'),
    };
  },
};

export const loginSchema: ValidationSchema<LoginInput> = {
  parse(input: unknown) {
    if (typeof input !== 'object' || input === null) {
      throw createValidationError([{ path: 'body', message: 'Request body must be an object' }]);
    }

    const body = input as Record<string, unknown>;

    return {
      email: requireEmail(body.email, 'email'),
      password: requireNonEmptyString(body.password, 'password'),
    };
  },
};
