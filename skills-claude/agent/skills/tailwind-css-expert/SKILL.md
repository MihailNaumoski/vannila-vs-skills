---
name: tailwind-css-expert
description: Build modern, responsive UIs with Tailwind CSS. Implement mobile-first design, dark mode, custom animations, form styling, gradients, shadows, and component patterns. Create production-ready waitlist pages, landing pages, and dashboards following 2025 best practices.
when_to_use: Styling React/Next.js applications, responsive design, dark mode implementation, form styling, landing pages, waitlist pages, modern UI patterns, component styling
version: 1.0.0
languages: css, tailwindcss, html, react, typescript
---

# Tailwind CSS Expert

**Mobile-first is not optional.** Start with mobile styles (no prefix), then progressively enhance for larger screens. Every class without a breakpoint prefix applies to ALL screen sizes.

## When NOT to Use

- Projects requiring complex CSS animations (use CSS-in-JS or plain CSS)
- Teams preferring traditional CSS methodology (BEM, SMACSS)
- Projects with existing large CSS codebases (migration costly)
- Simple static HTML pages (overhead not justified)
- Email templates (Tailwind requires build step, emails need inline CSS)

## Anti-Rationalizations

| Rationalization | Counter |
|-----------------|---------|
| "I'll add responsive styles later" | No. Mobile-first from line 1. Adding responsive later breaks layouts. |
| "Desktop-first is easier to visualize" | No. Mobile-first ensures content hierarchy. Desktop-first creates overflow issues. |
| "Dark mode can wait until launch" | No. Add `dark:` classes immediately. Retrofitting dark mode doubles work. |
| "I'll use arbitrary values everywhere" | No. Stick to design system. `text-[17px]` breaks consistency. Use scale values. |
| "Inline styles are fine for one-offs" | No. Create component with Tailwind classes. Inline styles break dark mode. |
| "I don't need hover/focus states" | No. Accessibility requires focus states. Add `focus:ring-2` to ALL interactive elements. |

## Prerequisites

Must have:
1. Node.js project with build system
2. PostCSS configured
3. Tailwind CSS 3.x installed
4. Understanding of CSS fundamentals

Setup:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## Workflow

### 1. Configure Tailwind for Your Project

**tailwind.config.js:**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
```

**globals.css:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    @apply scroll-smooth;
  }
  body {
    @apply bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased;
  }
}
```

### 2. Master Mobile-First Responsive Design

**Breakpoint Reference:**

| Prefix | Min-width | Target Device |
|--------|-----------|---------------|
| (none) | 0px | Mobile (default) |
| `sm:` | 640px | Large phones / Small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large desktops |

**CORRECT Mobile-First Approach:**

```jsx
{/* Start with mobile, enhance for larger */}
<div className="
  px-4 sm:px-6 lg:px-8
  py-8 sm:py-12 lg:py-16
  max-w-7xl mx-auto
">
  <h1 className="
    text-3xl sm:text-4xl md:text-5xl lg:text-6xl
    font-bold
    leading-tight
  ">
    Mobile First Title
  </h1>

  <div className="
    grid
    grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
    gap-4 sm:gap-6 lg:gap-8
  ">
    {/* Cards */}
  </div>
</div>
```

**WRONG Desktop-First:**

```jsx
{/* DON'T DO THIS - starts with desktop, removes for mobile */}
<div className="hidden sm:block">  {/* Wrong thinking */}
```

### 3. Style Forms Properly

**Modern Input Field:**

```jsx
<input
  type="email"
  placeholder="your@email.com"
  className="
    w-full
    px-4 py-3
    text-base

    bg-white dark:bg-gray-800
    text-gray-900 dark:text-gray-100
    placeholder:text-gray-400 dark:placeholder:text-gray-500

    border border-gray-300 dark:border-gray-600
    rounded-lg

    focus:outline-none
    focus:ring-2
    focus:ring-brand-500
    focus:border-brand-500

    disabled:bg-gray-100 dark:disabled:bg-gray-700
    disabled:cursor-not-allowed

    transition-colors duration-200
  "
/>
```

**Button with All States:**

```jsx
<button
  type="submit"
  className="
    w-full sm:w-auto
    px-6 py-3

    text-base font-semibold text-white

    bg-brand-600
    hover:bg-brand-700
    active:bg-brand-800

    rounded-lg
    shadow-lg shadow-brand-600/25
    hover:shadow-xl hover:shadow-brand-600/30

    focus:outline-none
    focus:ring-2
    focus:ring-brand-500
    focus:ring-offset-2
    dark:focus:ring-offset-gray-900

    disabled:opacity-50
    disabled:cursor-not-allowed
    disabled:hover:bg-brand-600

    transition-all duration-200
  "
>
  Join Waitlist
</button>
```

**Form with Validation States:**

```jsx
{/* Success state */}
<input
  className="
    border-2 border-green-500
    focus:ring-green-500
    bg-green-50 dark:bg-green-900/20
  "
/>
<p className="mt-1 text-sm text-green-600 dark:text-green-400">
  Looks good!
</p>

{/* Error state */}
<input
  className="
    border-2 border-red-500
    focus:ring-red-500
    bg-red-50 dark:bg-red-900/20
  "
/>
<p className="mt-1 text-sm text-red-600 dark:text-red-400">
  Please enter a valid email
</p>
```

### 4. Implement Dark Mode

**Setup with next-themes (Recommended):**

```bash
npm install next-themes
```

```tsx
// app/providers.tsx
'use client'

import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}
```

```tsx
// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

**Dark Mode Classes Pattern:**

```jsx
<div className="
  bg-white dark:bg-gray-900
  text-gray-900 dark:text-gray-100
  border-gray-200 dark:border-gray-700
">
  <h1 className="text-gray-900 dark:text-white">
    Title
  </h1>
  <p className="text-gray-600 dark:text-gray-400">
    Secondary text
  </p>
</div>
```

**Theme Toggle Component:**

```tsx
'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="
        p-2 rounded-lg
        bg-gray-100 dark:bg-gray-800
        hover:bg-gray-200 dark:hover:bg-gray-700
        transition-colors
      "
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
```

### 5. Create Modern UI Effects

**Gradient Backgrounds:**

```jsx
{/* Gradient background */}
<div className="
  bg-gradient-to-br
  from-brand-500 via-purple-500 to-pink-500
">

{/* Gradient text */}
<h1 className="
  bg-gradient-to-r from-brand-600 to-purple-600
  bg-clip-text text-transparent
  text-5xl font-bold
">
  Gradient Text
</h1>

{/* Subtle gradient overlay */}
<div className="
  bg-gradient-to-b from-transparent to-black/50
">
```

**Shadow Effects:**

```jsx
{/* Standard shadows */}
<div className="shadow-sm">Subtle</div>
<div className="shadow-md">Medium</div>
<div className="shadow-lg">Large</div>
<div className="shadow-xl">Extra large</div>

{/* Colored shadows */}
<div className="
  shadow-lg shadow-brand-500/25
  hover:shadow-xl hover:shadow-brand-500/30
  transition-shadow
">
  Colored shadow
</div>

{/* Glow effect */}
<div className="relative group">
  <div className="
    absolute -inset-0.5
    bg-gradient-to-r from-brand-500 to-purple-600
    rounded-lg blur
    opacity-30 group-hover:opacity-100
    transition duration-500
  "></div>
  <div className="relative bg-white dark:bg-gray-900 rounded-lg p-6">
    Content with glow
  </div>
</div>
```

**Hover and Transform Effects:**

```jsx
{/* Scale on hover */}
<div className="
  transition-transform duration-300
  hover:scale-105
  hover:-translate-y-1
">
  Lifts on hover
</div>

{/* Button with multiple effects */}
<button className="
  transform
  hover:scale-105
  active:scale-95
  transition-all duration-200
">
  Interactive
</button>

{/* Card with group hover */}
<div className="group">
  <img className="
    transition-transform duration-300
    group-hover:scale-110
  " />
  <h3 className="
    transition-colors
    group-hover:text-brand-600
  ">
    Title changes on card hover
  </h3>
</div>
```

### 6. Build Common Components

**Hero Section:**

```jsx
<section className="
  relative overflow-hidden
  min-h-screen
  flex items-center justify-center
  bg-gradient-to-br from-brand-50 via-white to-purple-50
  dark:from-gray-900 dark:via-gray-800 dark:to-gray-900
">
  {/* Background decoration */}
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="
      absolute -top-1/2 -right-1/2
      w-96 h-96
      bg-brand-400/20 dark:bg-brand-600/10
      rounded-full blur-3xl
    "></div>
  </div>

  {/* Content */}
  <div className="
    relative z-10
    max-w-4xl mx-auto
    px-4 sm:px-6 lg:px-8
    text-center
  ">
    <h1 className="
      text-4xl sm:text-5xl md:text-6xl lg:text-7xl
      font-bold
      bg-gradient-to-r from-brand-600 to-purple-600
      bg-clip-text text-transparent
      mb-6
    ">
      Join the Waitlist
    </h1>

    <p className="
      text-lg sm:text-xl md:text-2xl
      text-gray-600 dark:text-gray-300
      mb-8
      max-w-2xl mx-auto
    ">
      Be the first to experience our platform
    </p>

    <form className="flex flex-col sm:flex-row gap-4 justify-center">
      <input
        type="email"
        placeholder="your@email.com"
        className="px-4 py-3 rounded-lg border"
      />
      <button className="px-8 py-3 bg-brand-600 text-white rounded-lg">
        Get Early Access
      </button>
    </form>
  </div>
</section>
```

**Card Component:**

```jsx
<div className="
  group
  bg-white dark:bg-gray-800
  rounded-xl
  border border-gray-200 dark:border-gray-700
  shadow-md hover:shadow-xl
  overflow-hidden
  transition-all duration-300
  hover:-translate-y-1
">
  {/* Image */}
  <div className="relative h-48 overflow-hidden">
    <img
      src="/image.jpg"
      alt=""
      className="
        w-full h-full object-cover
        transition-transform duration-300
        group-hover:scale-110
      "
    />
  </div>

  {/* Content */}
  <div className="p-6">
    <h3 className="
      text-xl font-semibold
      text-gray-900 dark:text-white
      mb-2
    ">
      Card Title
    </h3>

    <p className="
      text-gray-600 dark:text-gray-400
      mb-4
      line-clamp-3
    ">
      Card description goes here with line clamping.
    </p>

    <button className="
      text-brand-600 dark:text-brand-400
      font-semibold
      hover:text-brand-700
      inline-flex items-center gap-2
    ">
      Learn more →
    </button>
  </div>
</div>
```

**Stat Card:**

```jsx
<div className="
  bg-white dark:bg-gray-800
  rounded-lg
  border border-gray-200 dark:border-gray-700
  p-6
">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Total Signups
      </p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
        12,345
      </p>
      <div className="flex items-center mt-2 text-green-600">
        <span>↑</span>
        <span className="text-sm font-medium ml-1">12%</span>
      </div>
    </div>
    <div className="
      p-3
      bg-brand-100 dark:bg-brand-900/30
      rounded-full
    ">
      <svg className="w-6 h-6 text-brand-600" />
    </div>
  </div>
</div>
```

### 7. Typography Best Practices

```jsx
{/* Responsive typography scale */}
<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">
  Main Heading
</h1>

<h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold">
  Section Heading
</h2>

<p className="text-base sm:text-lg leading-relaxed text-gray-600 dark:text-gray-400">
  Body text with comfortable line height
</p>

<p className="text-sm text-gray-500 dark:text-gray-500">
  Caption or secondary text
</p>

{/* Max width for readability */}
<article className="max-w-prose mx-auto">
  <p className="text-base leading-7">
    Long-form content constrained to ~65 characters per line
    for optimal readability.
  </p>
</article>
```

## Checklist

Before shipping:

### Configuration
- [ ] tailwind.config.js properly configured
- [ ] Content paths include all component files
- [ ] Custom colors/fonts defined in theme.extend
- [ ] Dark mode set to 'class' strategy
- [ ] Custom animations defined

### Responsive Design
- [ ] Mobile-first approach (no prefix = mobile)
- [ ] All breakpoints tested (sm, md, lg, xl)
- [ ] Touch targets minimum 44x44px on mobile
- [ ] No horizontal scroll on mobile
- [ ] Text readable without zooming

### Dark Mode
- [ ] Every color has dark: variant
- [ ] Tested in both light and dark modes
- [ ] Proper contrast ratios maintained
- [ ] Images/icons visible in both modes

### Forms
- [ ] Focus states visible (focus:ring-2)
- [ ] Error states styled
- [ ] Disabled states styled
- [ ] Proper padding for touch targets
- [ ] Placeholder text styled

### Accessibility
- [ ] Focus states on all interactive elements
- [ ] Sufficient color contrast (4.5:1 minimum)
- [ ] No reliance on color alone for meaning
- [ ] Hover effects not required for functionality

### Performance
- [ ] No unused classes in production (PurgeCSS)
- [ ] No arbitrary values where scale exists
- [ ] Consistent spacing using scale values

## Common Mistakes to Avoid

**DON'T:**
- Use arbitrary values like `text-[17px]` (use scale)
- Forget dark mode variants
- Skip focus states on buttons/links
- Use `hidden sm:block` (desktop-first thinking)
- Mix inline styles with Tailwind
- Forget `transition` class with hover effects

**DO:**
- Start with mobile styles (no prefix)
- Add dark: variant for every color
- Include focus:ring-2 on interactive elements
- Use design system scale values
- Create reusable component patterns
- Test on real devices
