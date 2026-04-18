# @fox-finance/prisma

Shared Prisma client and database migration utilities for fox-finance apps.

## Installation

This is an internal workspace package. It's automatically available to other packages in the monorepo.

## Usage

### Prisma Client

```typescript
import { prisma } from "@fox-finance/prisma";

const users = await prisma.user.findMany();
```

### ETL Migration

```typescript
import { migrate } from "@fox-finance/prisma/migrate";

await migrate();
```

## Development

```bash
# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate:dev

# Build the package
pnpm build

# Run ETL migration
pnpm migrate:etl
```
