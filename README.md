# Life Panel

A full-stack monorepo with a NestJS API and Next.js web dashboard, powered by Turborepo.

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `@repo/web`: a [Next.js](https://nextjs.org/) dashboard application
- `@repo/api`: a [NestJS](https://nestjs.com/) REST API
- `@repo/shared-types`: shared TypeScript types for API-Web communication
- `@repo/ui`: a stub React component library shared by both `web` and `docs` applications
- `@repo/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting
- [Biome](https://biomejs.dev/) for web app linting

### Build

To build all apps and packages, run the following command:

```sh
pnpm build
```

You can build a specific package by using a [filter](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters):

```sh
pnpm turbo build --filter=@repo/web
pnpm turbo build --filter=@repo/api
```

### Develop

To develop all apps and packages, run the following command:

```sh
pnpm dev
```

You can develop a specific package by using a [filter](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters):

```sh
pnpm turbo dev --filter=@repo/web
pnpm turbo dev --filter=@repo/api
```

### API Client

The web app includes an API client in `apps/web/src/lib/api-client.ts` that communicates with the NestJS backend. The client uses shared types from `@repo/shared-types` for type-safe API calls.

Available API modules:
- `authApi` - Authentication (login, register, logout, profile)
- `projectsApi` - Project CRUD
- `issuesApi` - Issue CRUD
- `notificationsApi` - Notification management
- `dashboardApi` - Dashboard statistics

### Environment Variables

**Web App** (`apps/web/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

**API** (`apps/api/.env`):
See `apps/api/.env.local.example` for Redis and rate limiting configuration.

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.dev/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.dev/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.dev/docs/reference/configuration)
- [CLI Usage](https://turborepo.dev/docs/reference/command-line-reference)
