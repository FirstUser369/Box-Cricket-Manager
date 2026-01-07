# Box Cricket Tournament Management System - Design Guidelines

## Design Approach: IPL Stadium Night Broadcast Experience

**Primary References**: IPL Official App, Cricbuzz Live, ESPN Broadcast Graphics
**Design Philosophy**: Dark, high-energy sports platform with stadium-at-night aesthetic, neon accents, and premium broadcast feel

---

## Color System

**Dark Foundation**:
- Background primary: #0a0e1a (deep navy-black)
- Background secondary: #1a1f2e (elevated surfaces)
- Background tertiary: #252b3d (cards, modals)

**Neon Accents** (IPL-inspired):
- Orange: #ff6b35 (primary actions, highlights)
- Purple: #9d4edd (secondary actions, badges)
- Gold: #ffd60a (premium features, celebrations)
- Cyan: #00f5ff (live indicators, active states)

**Gradients** (Stadium Lights):
- Hero: linear-gradient(135deg, #0a0e1a 0%, #1a1f2e 50%, #2d1b4e 100%)
- Card overlays: linear-gradient(180deg, transparent 0%, rgba(10,14,26,0.9) 100%)
- Auction spotlight: radial-gradient(circle, rgba(255,107,53,0.2) 0%, transparent 70%)
- Live match: linear-gradient(90deg, #ff6b35 0%, #9d4edd 100%)

**Functional Colors**:
- Text primary: #ffffff
- Text secondary: #a0aec0
- Text muted: #64748b
- Success: #10b981 (wickets, wins)
- Danger: #ef4444 (dismissals, losses)

---

## Typography System

**Font Families** (Google Fonts CDN):
- Primary: 'Inter' (400, 500, 600, 700) - UI, body, data
- Display: 'Bebas Neue' (400) - Numbers, team names, dramatic moments

**Type Scale**:
- Hero numbers: text-8xl to text-9xl (Bebas Neue) - scores, bids
- Section headings: text-4xl to text-5xl (Bebas Neue)
- Card titles: text-xl (Inter, font-semibold)
- Body text: text-base (Inter)
- Stats labels: text-sm (Inter, font-medium, uppercase, tracking-wide)

---

## Layout System

**Spacing Primitives**: Use Tailwind units 2, 4, 6, 8, 12
- Card padding: p-6, p-8
- Section spacing: space-y-12
- Grid gaps: gap-6, gap-8

**Grid Patterns**:
- Player auction cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Live match sections: 2-column split (lg:grid-cols-5, scorecard takes 3 cols, commentary 2 cols)
- Points table: Full-width responsive table
- Team roster: grid-cols-2 md:grid-cols-3 lg:grid-cols-4

**Container**: max-w-7xl for content, full-width for hero and live sections

---

## Core Components

### Hero Section
**Image**: Full-width stadium crowd shot at night with floodlights (min-h-screen). Use dramatic cricket stadium atmosphere - packed stands, lights creating golden glow.
**Overlay**: Dark gradient from bottom (rgba(10,14,26,0.95)) to transparent top
**Content**: Center-aligned, white text, CTA buttons with backdrop-blur-md bg-white/10 treatment

### Auction Player Card
- Dark card (bg-[#252b3d])
- Top section: Player photo with neon border glow (shadow-[0_0_30px_rgba(255,107,53,0.4)])
- Photo overlay: Bottom gradient for text
- Large base points: Bebas Neue, text-6xl, gold color
- Stats grid: 2x2 with icons, purple accent labels
- Hover: Lift effect (translate-y-[-4px])

### Auction Screen (Full Experience)
- Full-screen dark background with subtle radial spotlight
- Center stage: Single player card (max-w-lg)
- Current bid: Massive number (text-9xl, Bebas Neue, orange neon glow)
- Team bidding buttons: Full-width grid, each with team gradient background
- Budget ticker: Top bar, horizontal scroll, real-time updates
- Sold animation: Full-screen burst with confetti particles, gold "SOLD!" text slides in

### Live Scoring Interface
- Split layout: Scorecard (60%) + Ball-by-ball (40%)
- Header: Animated gradient bar showing match progress
- Current partnership: Horizontal bar chart with player avatars
- Batting table: Striped rows (alternating bg opacity), sticky header
- Ball-by-ball: Reverse chrono, boundaries highlighted with orange pill badges
- Mobile: Tab switcher with active tab underline

### Points Table
- Sticky header row with gradient background
- First column (teams) sticky on horizontal scroll
- Alternating row backgrounds (bg-white/5)
- NRR with colored +/- indicators
- Qualifying positions: Gold border-left-4

### Navigation
- Fixed top bar (bg-[#0a0e1a]/95, backdrop-blur-lg)
- Logo left, nav center, admin right
- Active state: Orange bottom border (border-b-2)
- Mobile: Slide-out drawer with purple gradient header

### Registration Form (QR Landing)
- Centered column (max-w-2xl)
- Dark card with subtle neon border
- Photo upload: Large dropzone with dashed orange border
- Rating sliders: Custom purple track, orange thumb
- Role cards: Large selectable options with icon, purple border when selected
- Submit: Full-width gradient button (orange to purple)

---

## Images

**Hero**: Cricket stadium night shot with floodlights and crowd (Unsplash: "cricket stadium night")
**Player cards**: Portrait cricket action shots (3:4 ratio) with neon border treatment
**Team logos**: Circular badges with transparent backgrounds
**Background textures**: Subtle geometric patterns (stadium seating grid overlay at 5% opacity)

---

## Animations (Strategic Drama)

**Auction Events**:
- Player reveal: Card slide-up with scale (0.5s ease-out)
- Bid increment: Number count-up with glow pulse
- Sold celebration: Confetti burst + screen flash (gold) + "SOLD" banner slide-down (1.2s total)
- Unsold: Card fade-out with purple tint overlay

**Live Match**:
- Score update: Run value pulses with orange glow (0.3s)
- Wicket fall: Screen shake effect + red flash
- Boundary: Expanding ring animation from run badge

**Micro-interactions**:
- Button hover: Glow intensity increase (transition-all 0.2s)
- Card hover: Lift + border glow brighten
- Tab switch: Sliding underline indicator

---

## Accessibility

- Min touch targets: h-12 for all buttons
- Form inputs: Consistent h-12, visible focus rings (ring-2 ring-orange-500)
- High contrast maintained on dark backgrounds (AAA for body text)
- Live regions: aria-live="polite" for score updates
- Table headers: Proper semantic structure

---

## Mobile Optimization

- Hero: Reduced height (min-h-[70vh]) on mobile
- Navigation: Hamburger menu below md breakpoint
- Live scoring: Single-column stacked, tab navigation
- Auction controls: Stacked full-width team buttons
- Tables: Horizontal scroll with visible scroll indicator