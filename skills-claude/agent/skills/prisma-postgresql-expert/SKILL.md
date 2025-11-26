---
name: prisma-postgresql-expert
description: Build type-safe database layers with Prisma ORM and PostgreSQL. Design schemas for waitlist applications, implement CRUD operations, analytics queries, migrations, connection pooling, and error handling following 2025 best practices.
when_to_use: Database schema design, type-safe queries, waitlist data storage, analytics aggregations, migrations, PostgreSQL optimization, Next.js database integration
version: 1.0.0
languages: typescript, sql, postgresql, prisma
---

# Prisma ORM with PostgreSQL Expert

**Type safety prevents runtime errors.** Prisma generates TypeScript types from your schema, catching query errors at compile time. Never write raw SQL unless absolutely necessary.

## When NOT to Use

- Simple key-value storage (use Redis)
- Real-time sync requirements (use Firebase/Supabase realtime)
- Graph-heavy data (use Neo4j)
- Projects requiring raw SQL optimization control
- Legacy databases with unconventional naming (migration costly)

## Anti-Rationalizations

| Rationalization | Counter |
|-----------------|---------|
| "I'll add indexes later" | No. Add `@@index` from day 1. Missing indexes on 1M rows = 100x slower queries. |
| "Raw SQL is faster" | No. Prisma generates optimized SQL. Raw SQL loses type safety. Only use for complex aggregations. |
| "I'll skip validation, Prisma handles it" | No. Validate with Zod BEFORE Prisma. Database errors are cryptic. |
| "One Prisma instance is fine" | No. Use singleton pattern in Next.js. Hot reload creates connection leaks. |
| "I'll handle duplicates in app code" | No. Use `@unique` constraint. Database enforces integrity, not application. |
| "Migrations can wait until production" | No. Run `migrate dev` immediately. Schema drift causes deployment failures. |

## Prerequisites

Must have:
1. Node.js 18+
2. PostgreSQL database (local or cloud)
3. TypeScript project
4. Basic SQL understanding

Setup:
```bash
npm install prisma @prisma/client
npx prisma init --datasource-provider postgresql
```

## Workflow

### 1. Configure Database Connection

**.env file:**
```env
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"

# For serverless (Vercel) - use connection pooling
DATABASE_URL="postgresql://user:password@host:5432/db?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/db"
```

**schema.prisma:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // For migrations in serverless
}
```

### 2. Design Waitlist Schema

**Complete Waitlist Schema:**

```prisma
// prisma/schema.prisma

model WaitlistSignup {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  company       String?

  // Tracking
  source        String?  // utm_source
  referrer      String?  // referring URL
  referralCode  String?  @unique

  // Status
  status        SignupStatus @default(PENDING)
  position      Int      @default(autoincrement())

  // Metadata
  ipAddress     String?
  userAgent     String?
  metadata      Json?    // Flexible additional data

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  invitedAt     DateTime?

  // Relations
  referrals     Referral[] @relation("Referrer")
  analytics     SignupAnalytics?

  // Indexes for common queries
  @@index([email])
  @@index([status])
  @@index([createdAt])
  @@index([source])
  @@map("waitlist_signups")
}

model Referral {
  id            String   @id @default(cuid())
  referrerId    String
  referredEmail String
  status        ReferralStatus @default(PENDING)
  createdAt     DateTime @default(now())
  convertedAt   DateTime?

  referrer      WaitlistSignup @relation("Referrer", fields: [referrerId], references: [id], onDelete: Cascade)

  @@unique([referrerId, referredEmail])
  @@index([referrerId])
  @@map("referrals")
}

model SignupAnalytics {
  id            String   @id @default(cuid())
  signupId      String   @unique

  // UTM tracking
  utmSource     String?
  utmMedium     String?
  utmCampaign   String?
  utmTerm       String?
  utmContent    String?

  // Engagement
  pageViews     Int      @default(0)
  emailOpens    Int      @default(0)
  emailClicks   Int      @default(0)

  lastActivityAt DateTime @default(now())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  signup        WaitlistSignup @relation(fields: [signupId], references: [id], onDelete: Cascade)

  @@index([utmSource])
  @@index([utmCampaign])
  @@map("signup_analytics")
}

enum SignupStatus {
  PENDING
  APPROVED
  INVITED
  CONVERTED
  REJECTED
}

enum ReferralStatus {
  PENDING
  COMPLETED
  EXPIRED
}
```

### 3. Run Migrations

**Development (creates migration + applies):**
```bash
npx prisma migrate dev --name init_waitlist
```

**Production (applies only):**
```bash
npx prisma migrate deploy
```

**Prototyping (no migration file):**
```bash
npx prisma db push
```

**Generate client after schema changes:**
```bash
npx prisma generate
```

### 4. Create Singleton Client for Next.js

**CRITICAL: Prevent connection leaks during hot reload.**

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
```

### 5. Implement CRUD Operations

**Create Signup:**

```typescript
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function createSignup(data: {
  email: string
  name?: string
  source?: string
}) {
  try {
    const signup = await prisma.waitlistSignup.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name,
        source: data.source,
        status: 'PENDING',
      },
    })

    return { success: true, data: signup }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return { success: false, error: 'Email already registered' }
      }
    }
    throw error
  }
}
```

**Create with Nested Analytics:**

```typescript
export async function createSignupWithAnalytics(
  email: string,
  utmParams: { source?: string; campaign?: string; medium?: string }
) {
  const signup = await prisma.waitlistSignup.create({
    data: {
      email: email.toLowerCase(),
      source: utmParams.source,
      analytics: {
        create: {
          utmSource: utmParams.source,
          utmCampaign: utmParams.campaign,
          utmMedium: utmParams.medium,
        }
      }
    },
    include: {
      analytics: true
    }
  })

  return signup
}
```

**Read Operations:**

```typescript
// Find by email
export async function getSignupByEmail(email: string) {
  return await prisma.waitlistSignup.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      analytics: true,
      referrals: true,
    }
  })
}

// Paginated list
export async function getSignups(page: number = 1, limit: number = 50) {
  const skip = (page - 1) * limit

  const [signups, total] = await Promise.all([
    prisma.waitlistSignup.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true,
      }
    }),
    prisma.waitlistSignup.count()
  ])

  return {
    data: signups,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

// Filter by status
export async function getPendingSignups() {
  return await prisma.waitlistSignup.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
  })
}
```

**Update Operations:**

```typescript
// Update status
export async function updateSignupStatus(
  id: string,
  status: 'APPROVED' | 'INVITED' | 'REJECTED'
) {
  return await prisma.waitlistSignup.update({
    where: { id },
    data: {
      status,
      invitedAt: status === 'INVITED' ? new Date() : undefined,
    }
  })
}

// Bulk update
export async function approveSignups(ids: string[]) {
  return await prisma.waitlistSignup.updateMany({
    where: {
      id: { in: ids },
      status: 'PENDING',
    },
    data: { status: 'APPROVED' }
  })
}
```

**Delete Operations:**

```typescript
// Soft delete pattern (add deletedAt field)
export async function softDeleteSignup(id: string) {
  return await prisma.waitlistSignup.update({
    where: { id },
    data: { status: 'REJECTED' }
  })
}

// Hard delete
export async function deleteSignup(email: string) {
  return await prisma.waitlistSignup.delete({
    where: { email }
  })
}
```

### 6. Implement Analytics Queries

**Basic Counts:**

```typescript
export async function getWaitlistStats() {
  const [total, pending, approved, invited] = await Promise.all([
    prisma.waitlistSignup.count(),
    prisma.waitlistSignup.count({ where: { status: 'PENDING' } }),
    prisma.waitlistSignup.count({ where: { status: 'APPROVED' } }),
    prisma.waitlistSignup.count({ where: { status: 'INVITED' } }),
  ])

  return { total, pending, approved, invited }
}
```

**Group By Referral Source:**

```typescript
export async function getSignupsBySource() {
  const stats = await prisma.waitlistSignup.groupBy({
    by: ['source'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  })

  return stats.map(item => ({
    source: item.source || 'Direct',
    count: item._count.id,
  }))
}
```

**Signups Over Time (Raw SQL for date grouping):**

```typescript
export async function getSignupsOverTime(days: number = 30) {
  const result = await prisma.$queryRaw<
    { date: Date; count: bigint }[]
  >`
    SELECT
      DATE("createdAt") as date,
      COUNT(*) as count
    FROM "waitlist_signups"
    WHERE "createdAt" >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `

  return result.map(item => ({
    date: item.date.toISOString().split('T')[0],
    count: Number(item.count),
  }))
}
```

**Growth Metrics:**

```typescript
export async function getGrowthMetrics() {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const [thisWeek, lastWeek, today] = await Promise.all([
    prisma.waitlistSignup.count({
      where: { createdAt: { gte: weekAgo } }
    }),
    prisma.waitlistSignup.count({
      where: {
        createdAt: { gte: twoWeeksAgo, lt: weekAgo }
      }
    }),
    prisma.waitlistSignup.count({
      where: {
        createdAt: { gte: new Date(now.setHours(0, 0, 0, 0)) }
      }
    })
  ])

  const growth = lastWeek === 0
    ? 100
    : Math.round(((thisWeek - lastWeek) / lastWeek) * 100)

  return { thisWeek, lastWeek, today, growth }
}
```

### 7. Handle Errors Properly

**Prisma Error Codes:**

| Code | Meaning | Handle |
|------|---------|--------|
| P2002 | Unique constraint violation | Email already exists |
| P2025 | Record not found | Return 404 |
| P2003 | Foreign key constraint | Related record missing |
| P1001 | Can't reach database | Connection error |
| P1002 | Database timeout | Retry or fail |

**Error Handler:**

```typescript
import { Prisma } from '@prisma/client'

export function handlePrismaError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return {
          error: 'A record with this value already exists',
          code: 'DUPLICATE',
          status: 409
        }
      case 'P2025':
        return {
          error: 'Record not found',
          code: 'NOT_FOUND',
          status: 404
        }
      case 'P2003':
        return {
          error: 'Related record does not exist',
          code: 'RELATION_ERROR',
          status: 400
        }
      default:
        return {
          error: 'Database error',
          code: error.code,
          status: 500
        }
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      error: 'Invalid data provided',
      code: 'VALIDATION_ERROR',
      status: 400
    }
  }

  throw error
}
```

**Usage in Server Action:**

```typescript
'use server'

import { prisma } from '@/lib/prisma'
import { handlePrismaError } from '@/lib/errors'

export async function createSignup(formData: FormData) {
  const email = formData.get('email') as string

  try {
    const signup = await prisma.waitlistSignup.create({
      data: { email }
    })
    return { success: true, data: signup }
  } catch (error) {
    const handled = handlePrismaError(error)
    return { success: false, ...handled }
  }
}
```

### 8. Optimize for Production

**Connection Pooling (Serverless):**

```env
# Use PgBouncer or Prisma Accelerate
DATABASE_URL="postgresql://user:pass@host:6543/db?pgbouncer=true&connection_limit=10"
DIRECT_URL="postgresql://user:pass@host:5432/db"
```

**Select Only Needed Fields:**

```typescript
// Bad: Fetches all fields
const signups = await prisma.waitlistSignup.findMany()

// Good: Select only what you need
const signups = await prisma.waitlistSignup.findMany({
  select: {
    id: true,
    email: true,
    createdAt: true,
  }
})
```

**Add Indexes for Query Patterns:**

```prisma
model WaitlistSignup {
  // ... fields

  @@index([status])           // Filter by status
  @@index([createdAt])        // Sort by date
  @@index([source])           // Group by source
  @@index([status, createdAt]) // Combined filter + sort
}
```

## Checklist

Before deploying:

### Schema
- [ ] All fields have appropriate types
- [ ] `@unique` on email and other unique fields
- [ ] `@default` values set where appropriate
- [ ] `@@index` on frequently queried fields
- [ ] Foreign keys use `onDelete: Cascade` where appropriate
- [ ] Enums used for status fields

### Migrations
- [ ] `npx prisma migrate dev` run locally
- [ ] Migration files committed to git
- [ ] `npx prisma migrate deploy` in CI/CD pipeline
- [ ] Rollback plan documented

### Client
- [ ] Singleton pattern implemented for Next.js
- [ ] Connection pooling configured for serverless
- [ ] Error handling for all Prisma operations
- [ ] Logging configured (dev vs production)

### Queries
- [ ] `select` used to limit returned fields
- [ ] `Promise.all` for parallel queries
- [ ] Pagination implemented for list queries
- [ ] Raw SQL only for complex aggregations

### Security
- [ ] Input validation with Zod before Prisma
- [ ] No user input in raw SQL (SQL injection)
- [ ] Sensitive fields excluded from selects
- [ ] Environment variables for connection strings

## Common Mistakes to Avoid

**DON'T:**
- Create new PrismaClient() in every file (connection leak)
- Skip validation before database operations
- Use `findFirst` when you mean `findUnique`
- Forget to run `prisma generate` after schema changes
- Use raw SQL for simple queries
- Ignore error codes (P2002 means duplicate!)

**DO:**
- Use singleton pattern in Next.js/serverless
- Validate with Zod, then use Prisma
- Add indexes for your query patterns
- Handle Prisma errors explicitly
- Use transactions for related operations
- Test migrations on staging first
