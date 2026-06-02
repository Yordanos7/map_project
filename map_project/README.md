# map_project

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Next.js, Express, TRPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **Express** - Fast, unopinionated web framework
- **tRPC** - End-to-end type-safe APIs
- **Node.js** - Runtime environment
- **Prisma** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
npm install
```

## Database Setup

This project uses PostgreSQL with Prisma.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/server/.env` file with your PostgreSQL connection details.

3. Apply the schema to your database:

```bash
npm run db:push
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/ui`.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/web/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@map_project/ui/components/button";
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/web`.

## Project Structure

```
map_project/
├── apps/
│   ├── web/         # Frontend application (Next.js)
│   └── server/      # Backend API (Express, TRPC)
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
│   ├── api/         # API layer / business logic
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

- `npm run dev`: Start all applications in development mode
- `npm run build`: Build all applications
- `npm run dev:web`: Start only the web application
- `npm run dev:server`: Start only the server
- `npm run check-types`: Check TypeScript types across all apps
- `npm run db:push`: Push schema changes to database
- `npm run db:generate`: Generate database client/types
- `npm run db:migrate`: Run database migrations
- `npm run db:studio`: Open database studio UI

## Vercel Deployment

This repository is a monorepo with two deployable apps:

- `apps/web` — Next.js frontend
- `apps/server` — Express/TRPC backend

### Recommended deployment setup

1. Create one Vercel project for `apps/web` and set the project root to `apps/web`.
2. Create a second Vercel project for `apps/server` and set the project root to `apps/server`.
3. In the `apps/server` project, add environment variables:
   - `DATABASE_URL` — your PostgreSQL connection string
   - `BETTER_AUTH_SECRET` — a random secret (minimum 32 characters)
   - `BETTER_AUTH_URL` — the backend Vercel URL, e.g. `https://my-server.vercel.app`
   - `CORS_ORIGIN` — the frontend Vercel URL, e.g. `https://my-web.vercel.app`
4. In the `apps/web` project, add:
   - `NEXT_PUBLIC_SERVER_URL` — the backend Vercel URL, e.g. `https://my-server.vercel.app`

### Notes

- `apps/server/vercel.json` is included so Vercel can deploy the backend as a Node function.
- The frontend uses `NEXT_PUBLIC_SERVER_URL` to call the API and to make auth requests.
- The backend requires `CORS_ORIGIN` to allow requests from the deployed frontend domain.
