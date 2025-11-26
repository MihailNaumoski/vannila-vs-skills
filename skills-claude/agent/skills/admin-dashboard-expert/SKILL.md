---
name: admin-dashboard-expert
description: Build protected admin dashboards for Next.js applications. Implement password protection, route guards, analytics displays with charts, signup tables, stat cards, and data visualization using Recharts. Perfect for waitlist analytics following 2025 best practices.
when_to_use: Building admin dashboards, implementing password protection, displaying analytics data, creating charts and graphs, waitlist management interfaces, protected routes, data visualization
version: 1.0.0
languages: typescript, react, nextjs, prisma
---

# Admin Dashboard Expert

**Protect first, build second.** Never expose admin routes without authentication. Use middleware to guard all `/admin` routes before rendering any sensitive data.

## When NOT to Use

- Public-facing dashboards (use proper auth like NextAuth)
- Multi-user admin systems (need role-based access)
- Complex permission systems (use dedicated auth library)
- Real-time collaborative dashboards (use WebSockets)
- Customer-facing analytics (use proper authentication)

## Anti-Rationalizations

| Rationalization | Counter |
|-----------------|---------|
| "I'll add auth later" | No. Protect routes FIRST. Exposed admin = data breach. Middleware takes 5 minutes. |
| "Simple password is insecure" | For single-admin waitlist, env var password + rate limiting is sufficient. Not Fort Knox. |
| "I'll use localStorage for session" | No. Use HTTP-only cookies. localStorage is XSS vulnerable. |
| "Charts can be added later" | No. Stakeholders need visuals. Add Recharts from day 1. |
| "Raw numbers are enough" | No. Humans process visuals 60,000x faster. Charts are mandatory. |
| "Real-time updates aren't needed" | Correct. ISR with 60s revalidation is sufficient for waitlist dashboards. |

## Prerequisites

Must have:
1. Next.js 14+ with App Router
2. Prisma with waitlist schema
3. Tailwind CSS configured
4. Environment variables for admin credentials

Install dependencies:
```bash
npm install iron-session recharts @upstash/ratelimit @upstash/redis lucide-react
```

## Workflow

### 1. Implement Password Protection

**Option A: HTTP Basic Auth (Simplest)**

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export const config = {
  matcher: ['/admin/:path*'],
}

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization')

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1]
    const [user, pwd] = atob(authValue).split(':')

    if (
      user === process.env.ADMIN_USERNAME &&
      pwd === process.env.ADMIN_PASSWORD
    ) {
      return NextResponse.next()
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Admin Dashboard"',
    },
  })
}
```

**Option B: Cookie-Based with iron-session (Better UX)**

```typescript
// lib/session.ts
import { SessionOptions } from 'iron-session'

export interface SessionData {
  isLoggedIn: boolean
  username?: string
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string, // min 32 chars
  cookieName: 'admin_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 24, // 24 hours
  },
}
```

```typescript
// app/actions/auth.ts
'use server'

import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions)
    session.isLoggedIn = true
    session.username = username
    await session.save()
    redirect('/admin/dashboard')
  }

  return { error: 'Invalid credentials' }
}

export async function logout() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  session.destroy()
  redirect('/admin/login')
}
```

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'

export async function middleware(req: NextRequest) {
  // Skip login page
  if (req.nextUrl.pathname === '/admin/login') {
    return NextResponse.next()
  }

  const session = await getIronSession<SessionData>(
    req.cookies,
    sessionOptions
  )

  if (!session.isLoggedIn) {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

### 2. Create Login Page

```typescript
// app/admin/login/page.tsx
import { login } from '@/app/actions/auth'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-8">Admin Login</h1>

        <form action={login} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium mb-2"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
```

### 3. Add Rate Limiting to Login

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const loginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 min
  analytics: true,
})
```

```typescript
// app/actions/auth.ts
import { loginLimiter } from '@/lib/rate-limit'
import { headers } from 'next/headers'

export async function login(formData: FormData) {
  const headersList = headers()
  const ip = headersList.get('x-forwarded-for') || 'unknown'

  const { success } = await loginLimiter.limit(ip)

  if (!success) {
    return { error: 'Too many attempts. Try again in 15 minutes.' }
  }

  // Continue with authentication...
}
```

### 4. Implement Analytics Queries

```typescript
// lib/analytics.ts
import { prisma } from '@/lib/prisma'

export async function getDashboardStats() {
  const [total, today, thisWeek, sources, timeline] = await Promise.all([
    // Total signups
    prisma.waitlistSignup.count(),

    // Today's signups
    prisma.waitlistSignup.count({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }
    }),

    // This week's signups
    prisma.waitlistSignup.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    }),

    // By referral source
    prisma.waitlistSignup.groupBy({
      by: ['source'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),

    // Daily signups (last 30 days)
    getSignupsOverTime(30),
  ])

  return { total, today, thisWeek, sources, timeline }
}

export async function getSignupsOverTime(days: number) {
  const signups = await prisma.waitlistSignup.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      }
    },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' }
  })

  // Group by date
  const grouped = signups.reduce((acc, signup) => {
    const date = signup.createdAt.toISOString().split('T')[0]
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(grouped).map(([date, count]) => ({
    date,
    count
  }))
}

export async function getRecentSignups(limit: number = 50) {
  return await prisma.waitlistSignup.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      source: true,
      status: true,
      createdAt: true,
    }
  })
}
```

### 5. Create Chart Components with Recharts

**Line Chart for Signups Over Time:**

```typescript
// components/charts/signups-chart.tsx
'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface SignupsChartProps {
  data: { date: string; count: number }[]
}

export function SignupsChart({ data }: SignupsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) =>
            new Date(value).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })
          }
          stroke="#6b7280"
          fontSize={12}
        />
        <YAxis stroke="#6b7280" fontSize={12} />
        <Tooltip
          labelFormatter={(value) => new Date(value).toLocaleDateString()}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', strokeWidth: 2 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

**Pie Chart for Referral Sources:**

```typescript
// components/charts/referral-chart.tsx
'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'

interface ReferralChartProps {
  data: { source: string; count: number }[]
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function ReferralChart({ data }: ReferralChartProps) {
  const chartData = data.map(item => ({
    name: item.source || 'Direct',
    value: item.count,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) =>
            `${name}: ${(percent * 100).toFixed(0)}%`
          }
        >
          {chartData.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

### 6. Create UI Components

**Stat Card:**

```typescript
// components/stat-card.tsx
import {
  Users,
  TrendingUp,
  Calendar,
  Link2,
  ArrowUpIcon,
  ArrowDownIcon,
} from 'lucide-react'

const icons = {
  users: Users,
  trending: TrendingUp,
  calendar: Calendar,
  link: Link2,
}

interface StatCardProps {
  title: string
  value: number
  change?: number
  icon: keyof typeof icons
}

export function StatCard({ title, value, change, icon }: StatCardProps) {
  const Icon = icons[icon]
  const isPositive = change && change >= 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>

          {change !== undefined && (
            <div className="flex items-center mt-2">
              {isPositive ? (
                <ArrowUpIcon className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 text-red-500" />
              )}
              <span
                className={`text-sm font-medium ml-1 ${
                  isPositive ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>

        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
      </div>
    </div>
  )
}
```

**Signups Table:**

```typescript
// components/signups-table.tsx
interface Signup {
  id: string
  email: string
  name: string | null
  source: string | null
  status: string
  createdAt: Date
}

interface SignupsTableProps {
  signups: Signup[]
}

export function SignupsTable({ signups }: SignupsTableProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold">Recent Signups</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="text-left p-4 font-medium text-sm">Email</th>
              <th className="text-left p-4 font-medium text-sm">Name</th>
              <th className="text-left p-4 font-medium text-sm">Source</th>
              <th className="text-left p-4 font-medium text-sm">Status</th>
              <th className="text-left p-4 font-medium text-sm">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {signups.map((signup) => (
              <tr
                key={signup.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td className="p-4">{signup.email}</td>
                <td className="p-4 text-gray-600 dark:text-gray-400">
                  {signup.name || '-'}
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                    {signup.source || 'Direct'}
                  </span>
                </td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                      signup.status === 'APPROVED'
                        ? 'bg-green-100 text-green-700'
                        : signup.status === 'INVITED'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {signup.status}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                  {new Date(signup.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

### 7. Build Dashboard Page

```typescript
// app/admin/dashboard/page.tsx
import { getDashboardStats, getRecentSignups } from '@/lib/analytics'
import { StatCard } from '@/components/stat-card'
import { SignupsChart } from '@/components/charts/signups-chart'
import { ReferralChart } from '@/components/charts/referral-chart'
import { SignupsTable } from '@/components/signups-table'

export const revalidate = 60 // Refresh every 60 seconds

export default async function DashboardPage() {
  const [stats, recentSignups] = await Promise.all([
    getDashboardStats(),
    getRecentSignups(50),
  ])

  const referralData = stats.sources.map(s => ({
    source: s.source || 'Direct',
    count: s._count.id,
  }))

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Waitlist Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Monitor your waitlist performance
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Signups"
          value={stats.total}
          icon="users"
        />
        <StatCard
          title="Today"
          value={stats.today}
          icon="calendar"
        />
        <StatCard
          title="This Week"
          value={stats.thisWeek}
          icon="trending"
        />
        <StatCard
          title="Sources"
          value={stats.sources.length}
          icon="link"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">
            Signups Over Time
          </h2>
          <SignupsChart data={stats.timeline} />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">
            Referral Sources
          </h2>
          <ReferralChart data={referralData} />
        </div>
      </div>

      {/* Recent Signups Table */}
      <SignupsTable signups={recentSignups} />
    </div>
  )
}
```

### 8. Create Admin Layout

```typescript
// app/admin/layout.tsx
import { logout } from '@/app/actions/auth'
import { LayoutDashboard, Users, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>

        <nav className="px-4 space-y-1">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>

          <Link
            href="/admin/signups"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Users className="h-5 w-5" />
            Signups
          </Link>

          <Link
            href="/admin/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 dark:border-gray-700">
          <form action={logout}>
            <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600">
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
```

## Checklist

Before shipping:

### Authentication
- [ ] Middleware protects all `/admin` routes
- [ ] Login page styled and functional
- [ ] Logout functionality works
- [ ] Session expires appropriately (24h)
- [ ] Rate limiting on login (5 attempts/15 min)

### Security
- [ ] Environment variables for credentials
- [ ] HTTP-only cookies for session
- [ ] CSRF protection enabled
- [ ] No sensitive data in client-side code
- [ ] Secure cookie in production

### Analytics
- [ ] Total signup count displayed
- [ ] Today's signups shown
- [ ] Weekly growth calculated
- [ ] Signups over time chart
- [ ] Referral sources chart

### UI Components
- [ ] Stat cards with icons
- [ ] Line chart for timeline
- [ ] Pie/bar chart for sources
- [ ] Data table with sorting
- [ ] Responsive on mobile

### Data Fetching
- [ ] Server Components for data
- [ ] ISR with appropriate revalidate
- [ ] Parallel data fetching (Promise.all)
- [ ] Error handling for queries

### Polish
- [ ] Loading states
- [ ] Empty states
- [ ] Dark mode support
- [ ] Proper typography
- [ ] Consistent spacing

## Common Mistakes to Avoid

**DON'T:**
- Store admin password in client code
- Skip rate limiting on login
- Use localStorage for sessions
- Fetch data in useEffect (use Server Components)
- Forget loading states for charts

**DO:**
- Protect routes with middleware FIRST
- Use HTTP-only cookies
- Implement rate limiting
- Fetch data in Server Components
- Add ISR for reasonable freshness
- Test on mobile devices
