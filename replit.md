# Box Cricket Tournament Management System

## Overview

A comprehensive full-stack web application for managing IPL-style box cricket tournaments with PostgreSQL database persistence. Features include QR-based player registration with approval workflow, 12 IPL-style teams with ₹25,000 budgets, admin-controlled category-based auctions, live ball-by-ball match scoring with power overs, team management with captain/vice-captain assignments, and auto-calculated leaderboards.

## Key Features Implemented

### Player Registration & Approval
- **Extended Registration**: Email, phone, mobile, T-shirt size, photo, address
- **Player Categories**: Batsman, Bowler, All-rounder, Unsold (based on player role selection)
- **Approval Workflow**: Players start as pending, admin approves/rejects before auction
- **Payment Tracking**: Payment status (pending/verified/rejected) managed by admin

### Auction System (Two-Phase)
**Phase 1: Team Names Auction**
- **Team Names Management**: Admin creates 12 team identities (name, logo, colors) in Team Names tab
- **Captain/VC Pairs as Bidders**: Pre-assigned captain pairs bid for team identities
- **Category Locking**: Non-Team Names categories are blurred/locked until Phase 1 completes
- **Assign Team**: Captain pair that wins bid gets assigned to that team identity

**Phase 2: Player Auction**
- **Role-Based Categories**: Auction groups players by role (Batsman, Bowler, All-rounder, Unsold)
- **Category Summary**: Pre-auction grid shows available/total players per category
- **Player Dropdown**: Select specific players from current category (excludes sold players)
- **Live Category Switching**: Changing category mid-auction immediately shows first player from new category
- **Incremental Bidding**: +₹200 until bid reaches ₹4000, then +₹250 increments
- **Budget Enforcement**: Teams cannot exceed their ₹25,000 budget
- **Roster Limit**: Max 8 players per team (2 captain/VC already assigned + 6 to buy)
- **Lost Gold Round**: Unsold players get a second chance in the Lost Gold round
- **Real-time State**: Auction state persisted in database with bid history and current category
- **Category Filtering**: Players appear only when their matching category is selected

### Live Scoring
- **Ball-by-Ball**: Record runs (0-6), extras (wide, no-ball - no free hit), wickets (bowled, caught, lbw, run_out, stumped)
- **Batsman/Bowler Selection**: Admin must select opening batsmen and bowler before scoring; wicket requires new batsman selection; end of over requires new bowler selection
- **Fielder Selection**: For catches, stumpings, and run outs, admin selects the fielder who made the dismissal
- **8-Player Teams**: Max 7 wickets per innings; last-man-standing rule allows solo batting
- **Strike Rotation**: Changes on odd runs and end of over (unless last-man-standing)
- **Extras Handling**: Wide and no-ball add 1 run, ball doesn't count (reball required)
- **Power Overs**: Admin selects power over - runs doubled, wicket costs -5 points
- **Auto-calculation**: Overs increment automatically, innings change at 6 overs
- **Match Completion**: Points table updates automatically when match ends
- **Undo Last Ball**: Admin can undo the last recorded ball (reverses all stats)
- **Reset Match**: Admin can reset a match to start fresh (requires confirmation)
- **Cricbuzz-Style Display**: Live batsmen stats (runs, balls, 4s, 6s, SR), bowler stats (overs, runs, wickets, economy), full scorecards
- **Match History**: Display interface shows completed matches; clicking opens full Cricbuzz-style scorecard with both innings

### Leaderboards
- **Orange Cap**: Top run scorers with strike rate and average
- **Purple Cap**: Top wicket takers with economy and average
- **MVP**: Combined points (runs + wickets×25 + catches×10)

### Admin Panel (password: admin123)
- Full auction control: start, pause, resume, next player, sell, unsold
- Team bidding interface with remaining budget display
- Match creation and live scoring controls
- Player management with lock/unlock functionality
- **Player Approval**: Approve/reject pending registrations
- **Payment Verification**: Mark players as payment verified
- **Captain Assignment**: Set captain/vice-captain for each team
- **Tournament Settings**: Configure payment methods (Zelle/CashApp/Venmo)
- **Broadcasts**: Create announcements for display screens

### Tournament Settings
- **Payment Configuration**: Zelle (phone/email/QR), CashApp (ID/QR), Venmo (ID/QR)
- **Registration Fee**: Configurable (default $25)
- **Key Dates**: Auction date, tournament date
- **Display Credentials**: Username/password for display mode

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
- **Players**: Registration data, ratings (batting/bowling/fielding), auction status, team assignment, captain/vice-captain status, payment/approval status, category (Batsman/Bowler/All-rounder/Unsold)
- **Teams**: Name, colors, budget management, remaining budget tracking, captain/vice-captain IDs
- **Matches**: Scheduling, live scoring state, innings tracking, power over fields
- **Ball Events**: Ball-by-ball event logging for live scoring, power over tracking
- **Auction State**: Current auction status, bidding history, active player, current category
- **Points Table**: Team standings with NRR calculations
- **Tournament Settings**: Payment configuration (Zelle/CashApp/Venmo), registration fee, key dates
- **Broadcasts**: Admin announcements with priority and active status

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