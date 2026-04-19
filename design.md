# SelfUp — Design System

---

## Design Philosophy
- **Minimal but alive** — clean layouts with subtle animations and depth
- **Dark-first** — primary dark theme, clean light theme
- **Gamified but serious** — feels like a tool, not a toy
- **Mobile-responsive** — designed mobile-first, scales to desktop
- **Accessible** — keyboard navigation, sufficient contrast, focus states

---

## Color Palette

### Dark Theme (Default)
```css
--bg-base:         #0A0A0F    /* Page background */
--bg-surface:      #12121A    /* Cards, panels */
--bg-elevated:     #1C1C28    /* Modals, dropdowns */
--bg-input:        #1A1A24    /* Input fields */

--border:          #2A2A3A    /* Subtle borders */
--border-strong:   #3A3A50    /* Visible borders */

--text-primary:    #F0F0FF    /* Main text */
--text-secondary:  #9090B0    /* Subtitles, labels */
--text-muted:      #5A5A78    /* Placeholder, disabled */

--accent-primary:  #7C6AF0    /* Purple — main brand color */
--accent-hover:    #9080FF    /* Hover state */
--accent-glow:     rgba(124, 106, 240, 0.2)

--green:           #34D399    /* Fitness, success */
--blue:            #60A5FA    /* Skills */
--amber:           #FBBF24    /* Time management */
--pink:            #F472B6    /* Style */
--red:             #F87171    /* Error, danger */
--orange:          #FB923C    /* Streaks, fire */

--coin-gold:       #FFD700    /* AiCoin color */
--xp-purple:       #A78BFA    /* XP bar */

--shadow-sm:       0 2px 8px rgba(0,0,0,0.4)
--shadow-md:       0 4px 20px rgba(0,0,0,0.6)
--shadow-glow:     0 0 20px rgba(124,106,240,0.15)
```

### Light Theme
```css
--bg-base:         #F4F4F8
--bg-surface:      #FFFFFF
--bg-elevated:     #FFFFFF
--bg-input:        #F0F0F6

--border:          #E2E2EC
--border-strong:   #C8C8DC

--text-primary:    #0D0D1A
--text-secondary:  #5A5A78
--text-muted:      #9898B0

--accent-primary:  #6C5CE7
--accent-hover:    #7C6AF0
```

### Category Colors
| Category | Color | Hex |
|----------|-------|-----|
| Fitness | Green | `#34D399` |
| Skills | Blue | `#60A5FA` |
| Time | Amber | `#FBBF24` |
| Style | Pink | `#F472B6` |

---

## Typography

```css
/* Font Stack */
--font-sans:   'Inter', -apple-system, sans-serif
--font-mono:   'JetBrains Mono', monospace
--font-display:'Plus Jakarta Sans', sans-serif  /* Headings */

/* Scale */
--text-xs:     0.75rem    /* 12px */
--text-sm:     0.875rem   /* 14px */
--text-base:   1rem       /* 16px */
--text-lg:     1.125rem   /* 18px */
--text-xl:     1.25rem    /* 20px */
--text-2xl:    1.5rem     /* 24px */
--text-3xl:    1.875rem   /* 30px */
--text-4xl:    2.25rem    /* 36px */

/* Weights */
Regular: 400
Medium:  500
Semibold: 600
Bold: 700
```

---

## Spacing System
Based on 4px grid:
```
4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px, 96px
```
TailwindCSS default scale maps to this perfectly.

---

## Border Radius
```css
--radius-sm:   6px    /* small elements */
--radius-md:   10px   /* cards, inputs */
--radius-lg:   16px   /* modals, panels */
--radius-xl:   24px   /* profile card */
--radius-full: 9999px /* pills, avatars */
```

---

## Component Specs

### Cards
```
Background: var(--bg-surface)
Border: 1px solid var(--border)
Border-radius: var(--radius-md)
Padding: 20px
Shadow: var(--shadow-sm)
Hover: border-color → var(--border-strong), shadow → var(--shadow-glow)
Transition: 200ms ease
```

### Buttons
```
Primary:
  bg: var(--accent-primary)
  text: white
  hover: var(--accent-hover)
  padding: 10px 20px
  border-radius: var(--radius-sm)
  font-weight: 600

Secondary:
  bg: transparent
  border: 1px solid var(--border-strong)
  text: var(--text-primary)
  hover: bg → var(--bg-elevated)

Destructive:
  bg: transparent
  border: 1px solid var(--red)
  text: var(--red)
  hover: bg → rgba(248,113,113,0.1)

Ghost:
  bg: transparent
  text: var(--text-secondary)
  hover: bg → var(--bg-elevated), text → var(--text-primary)

Icon Button:
  size: 36x36px
  border-radius: var(--radius-sm)
  hover: bg → var(--bg-elevated)
```

### Inputs
```
bg: var(--bg-input)
border: 1px solid var(--border)
border-radius: var(--radius-sm)
padding: 10px 14px
font-size: var(--text-sm)
focus: border-color → var(--accent-primary), box-shadow → 0 0 0 3px var(--accent-glow)
placeholder: var(--text-muted)
```

### Badges/Pills
```
Category badges: colored bg (10% opacity), colored text, colored border
Level badge: gold gradient
AiCoin: gold coin icon + number
Streak: orange flame icon + number
```

### XP Bar
```
Container: bg var(--bg-elevated), height 8px, border-radius 99px
Fill: gradient left-to-right var(--accent-primary) → var(--xp-purple)
Animated fill on XP gain
```

### Avatar
```
Sizes: 32px, 40px, 48px, 64px, 96px
Border: 2px solid var(--accent-primary) (for user's own)
Border-radius: 50%
Fallback: gradient bg with initials
```

---

## Layout Grid

### Desktop (≥1024px)
```
Sidebar: 240px fixed left
Main content: remaining width, max-width 1200px, centered
Top bar: 60px height
Content padding: 24px
```

### Tablet (768px–1023px)
```
Sidebar: collapsible (icon-only = 64px)
Content padding: 20px
```

### Mobile (<768px)
```
No sidebar
Bottom navigation bar: 64px height, 5 icons
Content padding: 16px
Top bar: 56px
```

---

## Animation Guidelines

### Principles
- Fast: 150ms for hover/feedback
- Normal: 250ms for page transitions
- Slow: 400ms for modals, level-up animations
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` (standard), `spring` for gamification

### Specific Animations
```
Page transition: fade + slide up (250ms)
Card hover: scale(1.01) + shadow increase (150ms)
Button press: scale(0.97) (100ms)
Modal: fade + scale from 0.95 (200ms)
Level up: confetti explosion + card flip (600ms)
XP gain: bar fill animation + floating "+XP" text
AiCoin earn: coin bounce + glow
Streak flame: flickering CSS animation
Notification: slide in from right (300ms)
Typing indicator: 3-dot pulse (AI is responding)
```

---

## Iconography
- Library: **Lucide React** (consistent stroke weight)
- Size defaults: 16px (inline), 20px (buttons), 24px (nav), 32px (feature icons)
- Category icons:
  - Fitness: `Dumbbell`
  - Skills: `Brain`
  - Time: `Clock`
  - Style: `Shirt`
  - AI Chat: `Bot`
  - Quests: `Sword`
  - Leaderboard: `Trophy`
  - AiCoin: `Coins`

---

## RPG Avatar System
- 16+ base character options (4 per archetype: Warrior, Mage, Scholar, Athlete)
- Each has color variants
- Displayed in profile card as illustrated character card
- Level up animations per avatar
- Named in `constants/avatars.ts` with SVG keys

---

## Dark/Light Mode
- Toggle button in top bar (sun/moon icon)
- Stored in `uiStore` + localStorage
- Applied via `class="dark"` on `<html>`
- TailwindCSS `dark:` variants used throughout
- System preference detection on first visit

---

## Responsive Breakpoints (Tailwind)
```
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
2xl: 1536px
```
