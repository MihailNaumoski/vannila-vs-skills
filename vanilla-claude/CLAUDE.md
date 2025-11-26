# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LaunchList is a single-page waitlist application for product launches. It collects email signups, displays social proof through a live counter, and provides basic analytics for tracking signup sources.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL with Prisma ORM
- **Deployment:** Vercel

## Common Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Database
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema changes to database
npx prisma migrate dev   # Create and apply migrations
npx prisma studio        # Open Prisma database GUI

# Linting
npm run lint             # Run ESLint
```

## Architecture

### Page Structure
- `/` - Public landing page with signup form
- `/admin` - Protected analytics dashboard
- `/admin/login` - Password login page

### Database Schema
Single `Waitlist` model storing email signups with optional UTM source and referrer tracking.

### Key Patterns
- Use Server Components by default
- Server Actions for form submission (POST /signup)
- Suspense for loading states
- Environment variables for all secrets (including admin password)
