# Box Cricket Tournament Management System

## Overview

A comprehensive full-stack web application for managing IPL-style box cricket tournaments with PostgreSQL database persistence. Features include player registration, admin-controlled IPL-style auctions with incremental bidding, live ball-by-ball match scoring, team management with budget tracking, and auto-calculated leaderboards.

## Key Features Implemented

### Auction System
- **Incremental Bidding**: ₹200 (<5k), ₹500 (5-10k), ₹1000 (>10k)
- **Budget Enforcement**: Teams cannot exceed their ₹30,000 budget
- **Lost Gold Round**: Unsold players get a second chance in the Lost Gold round
- **Real-time State**: Auction state persisted in database with bid history

### Live Scoring
- **Ball-by-Ball**: Record runs (0-6), extras (wide, no-ball), wickets (bowled, caught, lbw, run_out, stumped)
- **Auto-calculation**: Overs increment automatically, innings change at 6 overs or 10 wickets
- **Match Completion**: Points table updates automatically when match ends

### Leaderboards
- **Orange Cap**: Top run scorers with strike rate and average
- **Purple Cap**: Top wicket takers with economy and average
- **MVP**: Combined points (runs + wickets×25 + catches×10)

### Admin Panel (password: admin123)
- Full auction control: start, pause, resume, next player, sell, unsold
- Team bidding interface with remaining budget display
- Match creation and live scoring controls
- Player management with lock/unlock functionality

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query for server state with automatic refetching for live updates
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Design System**: IPL/Cricbuzz-inspired sports theme with Inter and Bebas Neue fonts
- **Build Tool**: Vite with HMR support

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints under `/api/*` prefix
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Validation**: Zod with drizzle-zod integration for type-safe schemas

### Data Storage
- **Database**: PostgreSQL (connection via `DATABASE_URL` environment variable)
- **Schema Location**: `shared/schema.ts` defines all tables and types
- **Migrations**: Drizzle Kit for schema management (`npm run db:push`)

### Key Data Models
- **Players**: Registration data, ratings (batting/bowling/fielding), auction status, team assignment
- **Teams**: Name, colors, budget management, remaining budget tracking
- **Matches**: Scheduling, live scoring state, innings tracking
- **Ball Events**: Ball-by-ball event logging for live scoring
- **Auction State**: Current auction status, bidding history, active player
- **Points Table**: Team standings with NRR calculations

### Project Structure
```
client/           # React frontend
  src/
    components/   # Reusable UI components
    pages/        # Route components
    hooks/        # Custom React hooks
    lib/          # Utilities and providers
server/           # Express backend
  index.ts        # Server entry point
  routes.ts       # API route definitions
  storage.ts      # Database operations
  db.ts           # Database connection
shared/           # Shared types and schemas
  schema.ts       # Drizzle schema definitions
```

### Real-time Updates
- Polling-based approach with TanStack Query's `refetchInterval` (2-3 seconds for live data)
- Auction state, match scores, and ball events auto-refresh during live sessions

## External Dependencies

### Database
- PostgreSQL database required
- Connection configured via `DATABASE_URL` environment variable
- Drizzle ORM handles queries and schema synchronization

### Key NPM Packages
- **UI**: Radix UI primitives, Lucide icons, Embla Carousel
- **Forms**: React Hook Form with Zod resolver
- **Dates**: date-fns for date formatting
- **Styling**: Tailwind CSS, class-variance-authority, clsx

### Development Tools
- TypeScript for type safety across frontend and backend
- Vite for frontend bundling with hot module replacement
- esbuild for production server bundling
- Drizzle Kit for database schema management