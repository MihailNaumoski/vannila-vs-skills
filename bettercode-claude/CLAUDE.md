# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository contains AI agent skills and documentation for building production-ready Next.js 14 waitlist applications. It is a **documentation/skills library**, not an executable codebase.

## Structure

```
skills-claude/
├── launchlist-prd.md              # Product requirements for LaunchList waitlist app
└── agent/
    ├── nextjs-app-router-development-agent.md   # Master agent orchestration guide
    └── skills/                                   # Individual skill modules
        ├── nextjs-14-app-router-expert/SKILL.md
        ├── tailwind-css-expert/SKILL.md
        ├── prisma-postgresql-expert/SKILL.md
        ├── vercel-deployment-expert/SKILL.md
        └── admin-dashboard-expert/SKILL.md
```

## Target Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL with Prisma ORM
- **Deployment:** Vercel
- **Auth:** iron-session (simple password protection)
- **Charts:** Recharts

## Key Architectural Patterns

### Next.js App Router
- Server Components by default; use `'use client'` only for interactivity
- Server Actions for form mutations (not API routes)
- `loading.tsx` and `error.tsx` at every route segment
- ISR with explicit `revalidate` values

### Prisma
- Singleton pattern required for Next.js to prevent connection leaks during hot reload
- Always add `@@index` for frequently queried fields
- Handle P2002 error code for duplicate entries

### Tailwind
- Mobile-first: unprefixed classes apply to all screens, use `sm:`, `md:`, `lg:` for larger
- Always include `dark:` variants from the start
- Focus states required on all interactive elements (`focus:ring-2`)

### Admin Dashboard
- Middleware must protect all `/admin/*` routes before any page renders
- HTTP-only cookies for sessions (never localStorage)
- Rate limiting on login endpoints (5 attempts per 15 min)

## Skill Usage Order

When implementing a waitlist application, follow this sequence:
1. `nextjs-14-app-router-expert` - Project structure and Server Components
2. `tailwind-css-expert` - Responsive styling and dark mode
3. `prisma-postgresql-expert` - Database schema and queries
4. `vercel-deployment-expert` - Environment variables and deployment
5. `admin-dashboard-expert` - Protected analytics dashboard

## Anti-Patterns to Avoid

- Using `'use client'` everywhere (reduces bundle size benefits)
- Creating API routes for simple database queries (use Server Actions)
- Skipping loading/error states
- Desktop-first responsive design
- Creating new PrismaClient() in every file
- Using localStorage for admin sessions
