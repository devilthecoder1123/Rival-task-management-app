# TaskApp — Full-Stack Task Management

A full-stack task management application built with Next.js, Express, Prisma, and PostgreSQL. Authenticated users can create, organize, search, sort, and filter tasks with priority, status, and due dates.

## Tech Stack

| Layer    | Choice |
| -------- | ------ |
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, React Hook Form + Zod |
| Backend  | Node.js, Express, TypeScript, Prisma ORM |
| Database | PostgreSQL 16 |
| Auth     | JWT in httpOnly cookies (with `Bearer` header fallback for API clients) |
| Testing  | Vitest (both ends), Testing Library (frontend) |
| Tooling  | Docker Compose, GitHub Actions |

## Project Layout

```
task-app/
├── backend/                Express + Prisma API
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── controllers/    HTTP handlers
│   │   ├── services/       Business logic (auth, tasks)
│   │   ├── routes/         Express routers
│   │   ├── middleware/     auth, validate, errorHandler
│   │   ├── validators/     Zod schemas
│   │   ├── lib/            prisma client, config
│   │   ├── utils/          errors, jwt, asyncHandler
│   │   ├── app.ts          Express app factory (exported for tests)
│   │   └── index.ts        Server entrypoint
│   ├── tests/              Vitest unit tests
│   └── Dockerfile
├── frontend/               Next.js 14 App Router
│   ├── src/
│   │   ├── app/            login, signup, tasks (list/new/[id]/edit)
│   │   ├── components/     TaskCard, TaskForm, FiltersBar, Pagination, …
│   │   ├── contexts/       Auth + Theme providers
│   │   ├── hooks/          useDebouncedValue
│   │   ├── lib/            api client, date helpers
│   │   └── types/
│   ├── tests/              Vitest + RTL
│   └── Dockerfile
├── .github/workflows/ci.yml
├── docker-compose.yml
└── README.md
```

## Quick Start — Docker (recommended)

One command brings up Postgres + backend + frontend:

```bash
git clone <repo-url> task-app && cd task-app
docker compose up --build
```

Then open **http://localhost:3000**. The backend runs `prisma migrate deploy` automatically on container start, so the schema is created on first boot.

To stop and wipe the DB volume:

```bash
docker compose down -v
```

## Quick Start — Local Development

### 1. PostgreSQL

Easiest option: run just Postgres via Docker.

```bash
docker compose up postgres -d
```

Or use your own local Postgres — just point `DATABASE_URL` at it.

### 2. Backend

```bash
cd backend
cp .env.example .env          # then edit JWT_SECRET, DATABASE_URL
npm install
npx prisma migrate dev        # creates tables, generates the Prisma client
npm run dev                   # listens on http://localhost:4000
```

### 3. Frontend

In a new terminal:

```bash
cd frontend
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm install
npm run dev                   # opens http://localhost:3000
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `NODE_ENV` | no | `development` \| `production` \| `test`. Default: `development`. |
| `PORT` | no | API port. Default: `4000`. |
| `DATABASE_URL` | **yes** | Postgres connection string. |
| `JWT_SECRET` | **yes** | At least 16 chars. Generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`. |
| `JWT_EXPIRES_IN` | no | E.g. `7d`, `1h`. Default: `7d`. |
| `FRONTEND_URL` | no | Allowed CORS origin. Default: `http://localhost:3000`. |
| `COOKIE_SECURE` | no | `true` in production behind HTTPS. Default: `false`. |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `NEXT_PUBLIC_API_URL` | **yes** | Backend base URL, including `/api`. Default: `http://localhost:4000/api`. |

## API Reference

All task routes require authentication. The JWT can be passed as either the `token` httpOnly cookie (default for browser clients) or an `Authorization: Bearer <jwt>` header.

### Auth

| Method | Endpoint | Body | Response |
| ------ | -------- | ---- | -------- |
| `POST` | `/api/auth/signup` | `{ name, email, password }` | `201` `{ user, token }` + sets cookie |
| `POST` | `/api/auth/login`  | `{ email, password }` | `200` `{ user, token }` + sets cookie |
| `POST` | `/api/auth/logout` | — | `204` + clears cookie |
| `GET`  | `/api/auth/me`     | — | `200` `{ user }` |

### Tasks

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `GET`    | `/api/tasks` | List tasks. Query: `status`, `search`, `sortBy`, `sortOrder`, `page`, `pageSize`. |
| `POST`   | `/api/tasks` | Create task. Body: `{ title, description?, status?, priority?, dueDate? }`. |
| `GET`    | `/api/tasks/:id` | Get one task. |
| `PATCH`  | `/api/tasks/:id` | Partial update. |
| `DELETE` | `/api/tasks/:id` | Delete. |

**Query parameters for `GET /api/tasks`:**

| Param | Values | Default |
| ----- | ------ | ------- |
| `status` | `PENDING` \| `IN_PROGRESS` \| `COMPLETED` | — |
| `search` | string — case-insensitive title match | — |
| `sortBy` | `createdAt` \| `dueDate` \| `priority` \| `title` | `createdAt` |
| `sortOrder` | `asc` \| `desc` | `desc` |
| `page` | integer ≥ 1 | `1` |
| `pageSize` | integer 1–100 | `10` |

Filtering, search, and sort all compose — e.g. `?status=PENDING&search=report&sortBy=dueDate&sortOrder=asc&page=2`.

### Error Format

All errors return a consistent envelope:

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed",
    "details": [{ "path": "title", "message": "Title is required" }]
  }
}
```

Status codes used: `200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, `500`.

### Quick curl Examples

```bash
# Sign up
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"name":"Alice","email":"alice@example.com","password":"hunter2!!"}'

# Create a task (using the cookie jar)
curl -X POST http://localhost:4000/api/tasks \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"title":"Write the report","priority":"HIGH","dueDate":"2025-12-31T00:00:00Z"}'

# List, sorted by due date ascending
curl -b cookies.txt 'http://localhost:4000/api/tasks?sortBy=dueDate&sortOrder=asc'
```

## Running Tests

### Backend

```bash
cd backend
npm test
```

Three test suites: validator schemas, JWT round-trip, and the error handler middleware. They don't require a database — pure unit tests that run fast in CI.

### Frontend

```bash
cd frontend
npm test
```

Three test suites: date utilities, the `Pagination` component (state + accessibility), and the `TaskCard` component (rendering + event handlers).

## CI

`.github/workflows/ci.yml` runs on every push and PR to `main`:

- Backend: install → `prisma generate` → `tsc --noEmit` build → `vitest`
- Frontend: install → `vitest` → `next build`

## Bonus Features Implemented

- ✅ **Role-based access** — `User.role` is `USER` or `ADMIN`. Admins see all users' tasks; regular users see only their own. Enforced at the service layer (not just middleware) so it can't be bypassed.
- ✅ **Optimistic UI** — toggling complete and deleting tasks update the UI immediately, with automatic rollback on failure (see `frontend/src/app/tasks/page.tsx`).
- ✅ **Dockerized setup** — `docker compose up` is the only command you need.
- ✅ **CI pipeline** — GitHub Actions runs both test suites and both builds.
- ✅ **Dark mode** — toggle in the nav bar, persisted to `localStorage`, respects `prefers-color-scheme` on first visit.

**Not implemented (with reasoning):**

- ❌ **Task attachments** — would require a file storage layer (S3 / local disk + multer). Skipped in favor of a clean core; can be added without schema changes by adding an `Attachment` model with `taskId`.
- ❌ **Activity log** — would need an `Activity` model plus middleware/hooks on every task mutation. Would have doubled the scope of the task service.

## Promoting a User to Admin

There's no admin signup endpoint by design (anyone could mint themselves admin). To promote a user, update the database directly:

```bash
cd backend
npx prisma studio
# Open users → set role = ADMIN
```

Or via SQL:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

## Architecture Notes & Trade-offs

**JWT in httpOnly cookies, not localStorage.** Cookies are not readable by JavaScript, which blocks the most common XSS-based token theft. The client also accepts `Authorization: Bearer` for non-browser callers (curl, integration tests). The trade-off: cookies need `SameSite` / CORS configuration, which is why `credentials: 'include'` and CORS `credentials: true` are wired up explicitly.

**Refresh keeps the user logged in.** On mount, the frontend calls `GET /api/auth/me`. The cookie travels with the request automatically, and if it's valid the session is rehydrated. No client-side token state needed.

**Ownership returns 404, not 403.** When a regular user requests someone else's task, the API responds `404 Not Found` instead of `403 Forbidden`. This prevents leaking the existence of resources to non-owners. Admins of course see everything.

**Validation lives in one place.** Zod schemas in `backend/src/validators` are the source of truth for shape and coercion. The same library is used on the frontend forms, so error semantics stay consistent.

**Priority sorting is special-cased.** Postgres would sort the `TaskPriority` enum alphabetically (`HIGH`, `LOW`, `MEDIUM`), which is not what users expect. The service layer applies a custom `HIGH > MEDIUM > LOW` ordering in memory. With `pageSize` capped at 100 this is fine; for very large datasets I'd swap it for a raw `ORDER BY CASE` clause in SQL.

**Optimistic UI with rollback.** Toggle-complete and delete update local state synchronously and snapshot the previous state. If the network call fails, the previous state is restored and the user sees an error. Delete refetches after success to keep pagination stable.

**Search is debounced (300ms).** A `useDebouncedValue` hook avoids hitting the API on every keystroke.

**Why Express over NestJS?** NestJS is great for larger teams but adds boilerplate (modules, decorators, dependency injection) that isn't worth it at this scale. Express + clear folder structure is more transparent for a code review.

**Why Prisma?** Type-safe queries from a single schema file, automatic migrations, and minimal boilerplate compared to TypeORM. The `User → Task` relation with `onDelete: Cascade` means deleting a user automatically removes their tasks.

**No global state library.** Local `useState` + context for auth/theme is enough for this app. Reaching for Redux/Zustand would be over-engineering. If the task list grows into a richer collaborative product, server-state caching (TanStack Query, SWR) is the next thing I'd add.

## Production Notes

- Set `COOKIE_SECURE=true` and serve over HTTPS so cookies get the `Secure` flag.
- Use a long random `JWT_SECRET` (the env validator requires 16+ chars but you should use 64+).
- Run `npx prisma migrate deploy` (not `dev`) at release time.
- Lock `FRONTEND_URL` to the actual deployed origin so CORS allows credentials only from there.

## License

MIT.
