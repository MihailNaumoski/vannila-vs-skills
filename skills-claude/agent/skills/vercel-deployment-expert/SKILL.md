---
name: vercel-deployment-expert
description: Deploy Next.js applications to Vercel with optimal configuration. Set up environment variables, database connections, Edge Functions, caching strategies, custom domains, SSL, monitoring, and scaling for production waitlist launches following 2025 best practices.
when_to_use: Deploying Next.js apps, configuring Vercel projects, setting up databases (Neon/Supabase), environment variables, custom domains, SSL certificates, performance optimization, production launches
version: 1.0.0
languages: typescript, javascript, nextjs, vercel
---

# Vercel Deployment Expert

**Push to deploy. Vercel handles the rest.** Automatic builds, preview deployments, SSL, CDN, and scaling. Focus on code, not infrastructure.

## When NOT to Use

- Applications requiring long-running processes (use traditional servers)
- WebSocket-heavy apps (Edge has 25-second limit)
- Projects needing custom server configurations
- Cost-sensitive projects with predictable high traffic (VPS cheaper)
- Self-hosting requirements (compliance/data residency)

## Anti-Rationalizations

| Rationalization | Counter |
|-----------------|---------|
| "I'll set up environment variables later" | No. Missing env vars = failed builds. Configure ALL variables before first deploy. |
| "Preview deployments aren't important" | No. Preview deployments catch bugs before production. Review every PR preview. |
| "I'll add monitoring after launch" | No. Enable Vercel Analytics NOW. Launch day issues without monitoring = blindness. |
| "Free tier is enough for launch" | No. Free tier has 100GB bandwidth. Viral launch = overage charges. Upgrade to Pro. |
| "SSL will configure itself" | Yes, but verify. Check domain SSL status. Cloudflare proxy breaks Let's Encrypt. |
| "Caching defaults are fine" | No. Set explicit `revalidate` values. Wrong defaults = stale data or poor performance. |

## Prerequisites

Must have:
1. Vercel account (free tier works to start)
2. Git repository (GitHub, GitLab, or Bitbucket)
3. Next.js application
4. Database provisioned (Neon, Supabase, or Vercel Postgres)

Setup:
```bash
npm install -g vercel
vercel login
```

## Workflow

### 1. Connect Repository to Vercel

**Via Dashboard (Recommended):**
1. Go to vercel.com/new
2. Import your Git repository
3. Vercel auto-detects Next.js
4. Configure project settings
5. Deploy

**Via CLI:**
```bash
cd your-project
vercel
# Follow prompts to link/create project
```

**Automatic Deployments:**
- Push to `main` → Production deployment
- Push to any branch → Preview deployment
- Every PR gets unique preview URL

### 2. Configure Environment Variables

**Required Variables for Waitlist App:**

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
DIRECT_URL="postgresql://user:pass@host:5432/db"  # For migrations

# Authentication (if using)
AUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://yourdomain.com"

# Email Service
RESEND_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="noreply@yourdomain.com"

# Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID="your-analytics-id"

# Admin
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="secure-password-here"
```

**Setting Variables via Dashboard:**
1. Project → Settings → Environment Variables
2. Add key-value pairs
3. Select environments (Production, Preview, Development)
4. Save

**Setting Variables via CLI:**
```bash
# Add variable
vercel env add DATABASE_URL production

# Pull to local .env
vercel env pull
```

**Environment-Specific Values:**
- Production: Real database, real API keys
- Preview: Staging database, test API keys
- Development: Local database, test keys

### 3. Connect Database

**Option A: Neon (Recommended for Serverless)**

1. Create Neon project at neon.tech
2. Install Vercel integration (Settings → Integrations → Neon)
3. Variables auto-configured:
   - `DATABASE_URL` (pooled)
   - `DIRECT_URL` (direct for migrations)

**Option B: Vercel Postgres**

1. Project → Storage → Create Database
2. Select Postgres
3. Variables auto-configured

**Option C: Supabase**

1. Create Supabase project
2. Install Vercel integration
3. Configure connection pooling (port 6543)

**Connection String Format:**
```env
# With connection pooling (for serverless)
DATABASE_URL="postgresql://user:pass@host:6543/db?pgbouncer=true"

# Direct connection (for migrations)
DIRECT_URL="postgresql://user:pass@host:5432/db"
```

### 4. Optimize Build Configuration

**next.config.js:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for optimized deployment
  output: 'standalone',

  // Enable React strict mode
  reactStrictMode: true,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-cdn.com',
      },
    ],
  },

  // Environment validation
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

**vercel.json (Optional):**

```json
{
  "buildCommand": "prisma generate && next build",
  "framework": "nextjs",
  "regions": ["iad1"],
  "crons": [
    {
      "path": "/api/cron/daily-digest",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### 5. Implement Caching Strategies

**Page-Level Caching:**

```typescript
// Static (cached at build time)
export default function Page() { ... }

// ISR - Revalidate every 60 seconds
export const revalidate = 60

// Dynamic - No caching
export const dynamic = 'force-dynamic'
```

**API Route Caching:**

```typescript
// app/api/stats/route.ts
export async function GET() {
  const stats = await getStats()

  return Response.json(stats, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
    },
  })
}
```

**Cache Header Meanings:**

| Header | Meaning |
|--------|---------|
| `s-maxage=3600` | Cache on CDN for 1 hour |
| `stale-while-revalidate=1800` | Serve stale for 30min while refreshing |
| `public` | Cacheable by CDN |
| `private` | Only browser cache (user-specific) |

**Monitor Cache Performance:**
Check `x-vercel-cache` header:
- `HIT`: Served from cache
- `MISS`: Fetched from origin
- `STALE`: Served stale while revalidating

### 6. Use Edge Functions for Performance

**Edge Runtime (Low Latency):**

```typescript
// app/api/waitlist/route.ts
export const runtime = 'edge'

export async function POST(request: Request) {
  const { email } = await request.json()

  // Fast response from edge location nearest to user
  await db.insert({ email })

  return Response.json({ success: true })
}
```

**When to Use Edge:**
- Authentication checks
- Redirects/rewrites
- Rate limiting
- Geolocation-based logic
- Simple CRUD operations

**When NOT to Use Edge:**
- Heavy computation
- Long-running processes
- Node.js-specific APIs
- Large dependencies

### 7. Set Up Custom Domain

**Add Domain:**
1. Project → Settings → Domains
2. Enter domain (e.g., `waitlist.yourdomain.com`)
3. Click Add

**Configure DNS:**

For root domain (yourdomain.com):
```
Type: A
Name: @
Value: 76.76.21.21
```

For subdomain (waitlist.yourdomain.com):
```
Type: CNAME
Name: waitlist
Value: cname.vercel-dns.com
```

**SSL Certificates:**
- Automatic via Let's Encrypt
- Generated after DNS propagation
- Renewed automatically before expiration

**Troubleshooting SSL:**
- DNS propagation takes 5min to 48hrs
- Cloudflare proxy breaks Let's Encrypt (disable or use Vercel DNS)
- Check domain status in Vercel dashboard

### 8. Enable Monitoring

**Vercel Analytics:**

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

**Speed Insights:**

```typescript
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
```

**Error Tracking (Sentry):**

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Log Drains (Pro Plan):**
- Connect to Axiom, Datadog, or custom endpoint
- Settings → Log Drains → Add

### 9. Prepare for Traffic Spikes

**Vercel Scaling Features:**
- Automatic scaling (no configuration)
- Fluid Compute: Zero cold starts (99.37% of requests)
- Scale to One: Production always keeps warm instance
- Pro Plan: 30,000 concurrent executions
- Enterprise: 100,000+ concurrent executions

**Rate Limiting (Protect against abuse):**

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
})

// app/api/waitlist/route.ts
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return Response.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  // Process signup...
}
```

**Pre-Launch Checklist:**
- [ ] Pro plan activated (if expecting high traffic)
- [ ] Rate limiting implemented
- [ ] Error tracking configured
- [ ] Analytics enabled
- [ ] Database connection pooling enabled
- [ ] Caching strategies set

### 10. Deploy and Monitor

**Deploy Commands:**

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs
```

**Monitor Launch:**
1. Watch Vercel Analytics dashboard
2. Monitor error rates in Sentry
3. Check database connection pool usage
4. Review API response times

**Rollback if Needed:**
1. Go to Deployments tab
2. Find last working deployment
3. Click "..." → Promote to Production

## Deployment Checklist

### Pre-Deployment

**Environment Variables:**
- [ ] `DATABASE_URL` configured
- [ ] `DIRECT_URL` configured (for migrations)
- [ ] All API keys set
- [ ] Auth secrets generated
- [ ] Variables set for all environments (Prod/Preview/Dev)

**Database:**
- [ ] Production database provisioned
- [ ] Connection pooling enabled
- [ ] Migrations run successfully
- [ ] Backup strategy in place

**Code:**
- [ ] Build succeeds locally
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Tests passing

### Deployment

**Git & Vercel:**
- [ ] Repository connected to Vercel
- [ ] Automatic deployments enabled
- [ ] Preview deployments working
- [ ] Production branch set correctly

**Domain & SSL:**
- [ ] Custom domain added
- [ ] DNS records configured
- [ ] SSL certificate generated
- [ ] HTTPS redirect enabled

### Post-Deployment

**Monitoring:**
- [ ] Vercel Analytics enabled
- [ ] Speed Insights enabled
- [ ] Error tracking (Sentry) configured
- [ ] Log drains set up (if Pro)

**Testing:**
- [ ] All pages load correctly
- [ ] Forms submit successfully
- [ ] Database operations working
- [ ] API routes responding
- [ ] Mobile responsive

**Performance:**
- [ ] Lighthouse score > 90
- [ ] Core Web Vitals passing
- [ ] API response times < 200ms
- [ ] Caching working (check x-vercel-cache)

### Launch Day

- [ ] Team has dashboard access
- [ ] Rollback plan documented
- [ ] Support channels ready
- [ ] Rate limiting active
- [ ] Budget alerts configured

## Common Mistakes to Avoid

**DON'T:**
- Deploy without environment variables set
- Skip preview deployment testing
- Forget database connection pooling
- Ignore Vercel Analytics
- Use Cloudflare proxy with Let's Encrypt
- Deploy on Friday before launch weekend

**DO:**
- Test every preview deployment
- Monitor builds and deployments
- Use environment-specific variables
- Enable analytics before launch
- Set up error tracking
- Have rollback plan ready
