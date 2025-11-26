---
name: nextjs-14-app-router-expert
description: Build production-ready Next.js 14 applications using App Router, Server Components, Server Actions, and modern React patterns. Implement type-safe forms, data fetching, caching strategies, error boundaries, and SEO optimization following 2025 best practices.
when_to_use: Building full-stack React applications, implementing Server Components and Server Actions, form handling without API routes, SSR/SSG/ISR strategies, waitlist applications, landing pages, data-driven applications
version: 1.0.0
languages: typescript, javascript, react, nextjs
---

# Next.js 14 App Router Expert

**Server Components are the default. Client Components are the exception.** Build performant, SEO-friendly applications by rendering on the server and only shipping JavaScript when interactivity is required.

## When NOT to Use

- Static HTML sites with no React needed (use Astro or plain HTML)
- Simple SPAs without SEO requirements (use Vite + React)
- Projects requiring React 17 or earlier
- Teams unfamiliar with async/await patterns
- Applications requiring real-time updates everywhere (consider Remix)

## Anti-Rationalizations

| Rationalization | Counter |
|-----------------|---------|
| "I'll use 'use client' everywhere" | No. Server Components reduce bundle size by 40%+. Only use Client Components for interactivity. |
| "API routes are easier than Server Actions" | No. Server Actions provide type safety, automatic CSRF protection, and progressive enhancement. Use them. |
| "I'll add loading states later" | No. Create `loading.tsx` files NOW. Users see blank screens without them. |
| "Error handling can wait" | No. Add `error.tsx` boundaries from day 1. Unhandled errors crash entire routes. |
| "SEO metadata isn't important yet" | No. Use `generateMetadata` immediately. Changing URLs later breaks backlinks. |
| "I'll optimize caching later" | No. Set `revalidate` values from start. Wrong defaults cause stale data or performance issues. |

## Prerequisites

Must have:
1. Node.js 18.17+ (LTS recommended)
2. React 18+ understanding (hooks, Suspense)
3. TypeScript knowledge (recommended)
4. Understanding of async/await patterns

Check setup:
```bash
node -v  # Should be 18.17+
npx create-next-app@latest --typescript --app
```

## Workflow

### 1. Understand Server vs Client Components

**Server Components (Default):**
- Render on the server only
- No JavaScript shipped to client
- Can directly access databases, file systems, environment variables
- Cannot use hooks (useState, useEffect) or browser APIs

**Client Components:**
- Add `'use client'` directive at top of file
- Required for: useState, useEffect, onClick, onChange, browser APIs
- Ship JavaScript to client

**Decision Matrix:**
```
Server Component (default):
✅ Fetching data from database
✅ Accessing backend resources
✅ Keeping sensitive logic on server
✅ Large dependencies (keep off client)
✅ Static content rendering

Client Component ('use client'):
✅ onClick, onChange handlers
✅ useState, useEffect, useRef
✅ Browser APIs (localStorage, geolocation)
✅ Custom hooks with state
✅ Third-party client libraries
```

### 2. Structure Your Application

**App Router File Conventions:**

```
app/
├── layout.tsx           # Root layout (required)
├── page.tsx             # Home page (/)
├── loading.tsx          # Loading UI
├── error.tsx            # Error boundary
├── not-found.tsx        # 404 page
├── actions.ts           # Server Actions
├── globals.css          # Global styles
│
├── dashboard/
│   ├── layout.tsx       # Nested layout
│   ├── page.tsx         # /dashboard
│   ├── loading.tsx      # Dashboard loading
│   └── [id]/
│       └── page.tsx     # /dashboard/:id
│
├── api/
│   └── webhook/
│       └── route.ts     # API route (when needed)
│
└── admin/
    ├── layout.tsx       # Admin layout
    └── page.tsx         # /admin
```

**Root Layout (MANDATORY):**

```typescript
// app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'My App',
    template: '%s | My App'
  },
  description: 'Description for SEO',
  openGraph: {
    title: 'My App',
    description: 'Description for social sharing',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
```

### 3. Implement Server Components for Data Fetching

**Direct Database Access (No API Route Needed):**

```typescript
// app/page.tsx - Server Component
import { prisma } from '@/lib/prisma'

// Optional: Set revalidation
export const revalidate = 60 // Revalidate every 60 seconds

export default async function HomePage() {
  // Direct database query - runs on server only
  const signupCount = await prisma.waitlist.count()

  const recentSignups = await prisma.waitlist.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { email: true, createdAt: true }
  })

  return (
    <div>
      <h1>Join {signupCount.toLocaleString()} others</h1>
      <SignupForm /> {/* Client Component for interactivity */}
    </div>
  )
}
```

**Parallel Data Fetching:**

```typescript
// app/admin/page.tsx
async function getAnalytics() {
  // Run queries in parallel for performance
  const [total, today, sources] = await Promise.all([
    prisma.waitlist.count(),
    prisma.waitlist.count({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }
    }),
    prisma.waitlist.groupBy({
      by: ['source'],
      _count: true,
      orderBy: { _count: { source: 'desc' } }
    })
  ])

  return { total, today, sources }
}

export default async function AdminPage() {
  const analytics = await getAnalytics()

  return <Dashboard data={analytics} />
}
```

### 4. Implement Server Actions for Forms

**Server Action Definition:**

```typescript
// app/actions.ts
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const emailSchema = z.string().email('Invalid email address')

export async function submitWaitlist(prevState: any, formData: FormData) {
  const email = formData.get('email') as string

  // Validate
  const result = emailSchema.safeParse(email)
  if (!result.success) {
    return { error: result.error.errors[0].message }
  }

  try {
    // Check for duplicate
    const existing = await prisma.waitlist.findUnique({
      where: { email: result.data }
    })

    if (existing) {
      return { error: "You're already on the waitlist!" }
    }

    // Create signup
    await prisma.waitlist.create({
      data: {
        email: result.data,
        source: formData.get('utm_source') as string || null,
      }
    })

    // Revalidate to update counter
    revalidatePath('/')

    return { success: true, message: 'Successfully joined!' }
  } catch (error) {
    console.error('Signup error:', error)
    return { error: 'Something went wrong. Please try again.' }
  }
}
```

**Client Component with useFormState:**

```typescript
// components/SignupForm.tsx
'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { submitWaitlist } from '@/app/actions'
import { useEffect, useRef } from 'react'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 text-white py-3 rounded-lg disabled:opacity-50"
    >
      {pending ? 'Joining...' : 'Join Waitlist'}
    </button>
  )
}

export default function SignupForm() {
  const [state, formAction] = useFormState(submitWaitlist, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
    }
  }, [state?.success])

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input
        type="email"
        name="email"
        placeholder="your@email.com"
        required
        className="w-full px-4 py-3 border rounded-lg"
      />
      <SubmitButton />

      {state?.success && (
        <p className="text-green-600">{state.message}</p>
      )}
      {state?.error && (
        <p className="text-red-600">{state.error}</p>
      )}
    </form>
  )
}
```

### 5. Implement Loading and Error States

**Loading State (MANDATORY):**

```typescript
// app/loading.tsx
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  )
}
```

**Error Boundary (MANDATORY):**

```typescript
// app/error.tsx
'use client' // Error components must be Client Components

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <button
          onClick={reset}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
```

**Not Found Page:**

```typescript
// app/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-6xl font-bold mb-4">404</h2>
        <p className="mb-8">Page not found</p>
        <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg">
          Go home
        </Link>
      </div>
    </div>
  )
}
```

### 6. Implement Caching Strategies

**Static Generation (Default):**
```typescript
// Pages are static by default
export default async function Page() {
  const data = await fetch('https://api.example.com/data')
  return <div>{data}</div>
}
```

**Incremental Static Regeneration (ISR):**
```typescript
// Revalidate every 60 seconds
export const revalidate = 60

export default async function Page() {
  const data = await prisma.waitlist.count()
  return <div>{data}</div>
}
```

**Dynamic (No Caching):**
```typescript
export const dynamic = 'force-dynamic'

export default async function Page() {
  // Always fresh data
  const data = await prisma.waitlist.findMany()
  return <div>{data.length}</div>
}
```

**On-Demand Revalidation:**
```typescript
// app/actions.ts
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'

export async function createSignup(data: FormData) {
  await prisma.waitlist.create({ ... })

  // Revalidate specific path
  revalidatePath('/')

  // Or revalidate by tag
  revalidateTag('waitlist')
}
```

### 7. Dynamic Metadata for SEO

```typescript
// app/page.tsx
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const count = await prisma.waitlist.count()

  return {
    title: `Join ${count}+ People on Our Waitlist`,
    description: 'Be the first to know when we launch',
    openGraph: {
      title: `Join ${count}+ People on Our Waitlist`,
      description: 'Be the first to know when we launch',
      type: 'website',
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Join ${count}+ People on Our Waitlist`,
    },
  }
}

export default async function Page() {
  // ... page content
}
```

### 8. Streaming with Suspense

```typescript
// app/page.tsx
import { Suspense } from 'react'

async function SlowComponent() {
  const data = await fetch('https://slow-api.com/data', {
    next: { revalidate: 3600 }
  })
  return <div>{data}</div>
}

export default function Page() {
  return (
    <div>
      <h1>Welcome</h1> {/* Renders immediately */}

      <Suspense fallback={<p>Loading stats...</p>}>
        <SlowComponent /> {/* Streams in when ready */}
      </Suspense>
    </div>
  )
}
```

## Checklist

Before shipping:

### Structure
- [ ] Root layout.tsx with metadata configured
- [ ] All pages have loading.tsx files
- [ ] Error boundaries (error.tsx) at appropriate levels
- [ ] not-found.tsx for 404 handling
- [ ] Proper file naming conventions followed

### Components
- [ ] Server Components used by default
- [ ] 'use client' only where needed (interactivity)
- [ ] No useState/useEffect in Server Components
- [ ] Client Components are leaf nodes where possible

### Data Fetching
- [ ] Direct database queries in Server Components
- [ ] Promise.all() for parallel fetching
- [ ] Appropriate revalidate values set
- [ ] Suspense boundaries for streaming

### Forms
- [ ] Server Actions for mutations (not API routes)
- [ ] useFormState for form state management
- [ ] useFormStatus for pending states
- [ ] Input validation with Zod
- [ ] Error handling in Server Actions

### SEO
- [ ] generateMetadata for dynamic pages
- [ ] OpenGraph and Twitter cards configured
- [ ] Proper title templates set
- [ ] Canonical URLs configured

### Performance
- [ ] Images use next/image component
- [ ] Fonts use next/font
- [ ] No unnecessary 'use client' directives
- [ ] Bundle analyzer checked

## Common Mistakes to Avoid

**DON'T:**
- Put 'use client' at the top of every file
- Create API routes for simple database queries
- Forget loading and error states
- Import server-only code in Client Components
- Use useEffect for data fetching (use Server Components)
- Forget to revalidate after mutations

**DO:**
- Default to Server Components
- Use Server Actions for forms
- Create loading.tsx for every route segment
- Keep Client Components as leaf nodes
- Use Suspense for streaming
- Validate all user input with Zod
