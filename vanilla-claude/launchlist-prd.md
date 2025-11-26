# Product Requirements Document: LaunchList

## Executive Summary

LaunchList is a single-page waitlist application for product launches. It collects email signups, displays social proof through a live counter, and provides basic analytics for tracking signup sources.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL with Prisma ORM
- **Deployment:** Vercel

## Problem Statement

Founders and product teams need a quick way to validate interest before launch. Existing solutions are either too complex (full marketing platforms) or too simple (just a form). LaunchList provides the right balance: simple setup, essential analytics.

## User Personas

### Primary: Product Launcher
- Founder or marketer preparing a product launch
- Needs to collect emails and measure interest
- Wants to know where signups come from (Twitter, ProductHunt, etc.)

### Secondary: Admin
- Checks signup progress
- Reviews analytics to optimize marketing channels

## Features

### 1. Landing Page (Public)

#### Hero Section
- Product name and logo
- Compelling tagline (editable)
- Brief value proposition (2-3 sentences)

#### Signup Form
- Single email input field
- Submit button with loading state
- Success message after signup
- Error handling (invalid email, already registered)

#### Social Proof
- Live counter: "Join X others on the waitlist"
- Counter updates without page refresh
- Optional: Recent signup indicators

#### Footer
- Links to social media
- Copyright notice

### 2. Email Collection (Backend)

#### Data Captured
- Email address (required, validated)
- Signup timestamp
- UTM source parameter (from URL)
- Referrer URL

#### Validation Rules
- Valid email format
- No duplicate emails
- Sanitized input

#### Response
- Success: Show confirmation, update counter
- Duplicate: "You're already on the list!"
- Error: "Something went wrong, try again"

### 3. Admin Dashboard (Protected)

#### Authentication
- Simple password protection
- Password stored in environment variable
- Redirect to login if not authenticated

#### Analytics Display
- Total signup count
- Signups today / this week
- Line chart: signups over time
- Table: top referral sources with counts

## Technical Requirements

### Performance
- Lighthouse score > 90
- No Cumulative Layout Shift on counter
- First Contentful Paint < 1.5s

### SEO
- Dynamic metadata (title, description)
- Open Graph tags for social sharing
- Semantic HTML structure

### Accessibility
- WCAG 2.1 AA compliant
- Keyboard navigable
- Screen reader friendly
- Proper form labels and error messages

### Security
- Environment variables for secrets
- Input sanitization
- Rate limiting on signup endpoint
- CSRF protection

## Database Schema

```prisma
model Waitlist {
  id        String   @id @default(cuid())
  email     String   @unique
  source    String?  // UTM source
  referrer  String?  // Full referrer URL
  createdAt DateTime @default(now())
}
```

## Page Structure

```
/                   - Landing page with signup form
/admin              - Analytics dashboard (protected)
/admin/login        - Password login page
```

## API Routes / Server Actions

```
POST /signup        - Server Action: add email to waitlist
GET  /api/count     - Get current signup count (if needed)
POST /admin/login   - Authenticate admin
```

## Success Metrics

- Signup conversion rate > 10%
- Page load time < 2 seconds
- Zero duplicate signups (proper validation)
- Admin can identify top 3 referral sources

## Out of Scope (V1)

- Email verification / double opt-in
- Custom domains
- Email sending / notifications
- Multiple waitlist support
- Team members / roles
- Export functionality

## Timeline

- V1: Single page, signup, basic analytics (this PRD)
- V2: Email verification, export, notifications
- V3: Multiple waitlists, team support

## Open Questions

1. Should counter show exact number or rounded ("1,200+" vs "1,247")?
2. Include email confirmation sent to user?
3. Add CAPTCHA for spam prevention?

---

## Implementation Notes

This PRD should be implemented following Next.js 14 App Router best practices:

- Use Server Components by default
- Server Actions for form submission
- Proper loading and error states with Suspense
- Environment variables for all secrets
- Prisma for type-safe database access
