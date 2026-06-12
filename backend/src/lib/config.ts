import 'dotenv/config';

interface Config {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  FRONTEND_URL: string;
  COOKIE_SECURE: boolean;
}

type ValidationDetail = {
  field: string;
  message: string;
};

const ENVIRONMENT_VALUES = ['development', 'production', 'test'] as const;

const createValidationError = (details: ValidationDetail[]) => {
  const error = new Error('Invalid environment variables');
  (error as any).details = details;
  return error;
};

const ensureString = (value: string | undefined, field: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw createValidationError([{ field, message: `${field} is required` }]);
  }
  return value.trim();
};

const ensureEnum = <T extends string>(
  value: string | undefined,
  field: string,
  options: readonly T[],
  defaultValue: T,
): T => {
  if (value === undefined) return defaultValue;
  if (options.includes(value as T)) return value as T;
  throw createValidationError([
    { field, message: `${field} must be one of: ${options.join(', ')}` },
  ]);
};

const ensureNumber = (value: string | undefined, field: string, defaultValue: number): number => {
  if (value === undefined) return defaultValue;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createValidationError([{ field, message: `${field} must be a positive integer` }]);
  }
  return parsed;
};

const ensureMinLength = (value: string | undefined, field: string, minLength: number): string => {
  const sanitized = ensureString(value, field);
  if (sanitized.length < minLength) {
    throw createValidationError([
      { field, message: `${field} must be at least ${minLength} characters` },
    ]);
  }
  return sanitized;
};

const parseBoolean = (value: string | undefined): boolean => value === 'true';

const parseConfig = (): Config => {
  const env = process.env;

  const nodeEnv = ensureEnum(env.NODE_ENV, 'NODE_ENV', ENVIRONMENT_VALUES, 'development');
  const port = ensureNumber(env.PORT, 'PORT', 4000);
  const databaseUrl = ensureString(env.DATABASE_URL, 'DATABASE_URL');
  const jwtSecret = ensureMinLength(env.JWT_SECRET, 'JWT_SECRET', 16);
  const jwtExpiresIn = env.JWT_EXPIRES_IN?.trim() || '7d';
  const frontendUrl = env.FRONTEND_URL?.trim() || 'http://localhost:3000';
  const cookieSecure = parseBoolean(env.COOKIE_SECURE);

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: jwtExpiresIn,
    FRONTEND_URL: frontendUrl,
    COOKIE_SECURE: cookieSecure,
  };
};

let config: Config;

try {
  config = parseConfig();
} catch (err) {
  console.error('❌ Invalid environment variables:');
  console.error((err as any).details ?? err);
  process.exit(1);
}

export { config };
