# CRM Design System v2

## Principles
- Dark-first, single theme
- Maximum information density with zero clutter
- Every pixel serves a purpose
- Subtle depth via layers, not shadows

## Color Tokens
| Token | Hex | Usage |
|-------|-----|-------|
| canvas | #08090a | Page background |
| surface | #0f1011 | Cards, panels, table rows |
| elevated | #191a1b | Modals, dropdowns, popovers |
| hover | rgba(255,255,255,0.04) | Interactive hover |
| active | rgba(255,255,255,0.06) | Active/pressed state |
| primary-text | #f7f8f8 | Headings, primary data |
| secondary | #d0d6e0 | Body text, descriptions |
| muted | #8a8f98 | Labels, timestamps, hints |
| faint | #62666d | Disabled, placeholders, borders |
| brand | #5e6ad2 | Primary actions, active nav |
| brand-light | #828fff | Hover on brand elements |
| success | #10b981 | Completed states, positive |
| danger | #ef4444 | Destructive, errors |
| warning | #f59e0b | Attention needed |
| info | #3b82f6 | Informational highlights |
| border | rgba(255,255,255,0.06) | Dividers, card outlines |
| border-hover | rgba(255,255,255,0.10) | Hover border lift |
| border-strong | rgba(255,255,255,0.14) | Focus rings, active borders |

## Typography
- Font: Inter, system-ui fallback
- Feature settings: "cv01", "ss03"
- H1: 24px, weight 500, letter-spacing -0.3px, color primary-text
- H2: 18px, weight 500, letter-spacing -0.2px
- Body: 13px, weight 400, line-height 1.5, color secondary
- Label: 12px, weight 500, color muted, uppercase for section headers
- Micro: 11px, weight 400, color faint
- Data: 13px, weight 400, tabular nums where applicable

## Spacing Scale
- 4px: micro gaps (icon + text)
- 8px: tight component padding
- 12px: standard internal padding
- 16px: card padding, section gaps
- 24px: page gutters, major sections
- 32px: hero areas, dashboard widgets

## Border Radius
- 6px: buttons, inputs, badges
- 8px: cards, table containers
- 12px: modals, panels
- 9999px: pills, avatars, status dots

## Shadows (extremely subtle, used sparingly)
- Modal: 0 24px 48px rgba(0,0,0,0.4)
- Dropdown: 0 8px 24px rgba(0,0,0,0.3)
- Card hover: 0 2px 8px rgba(0,0,0,0.2)

## Button Hierarchy
1. Primary: bg brand, text white, hover brand-light. Used for creation, save.
2. Secondary: bg transparent, border border, text secondary. Cancel, close.
3. Tertiary: bg transparent, text muted, hover bg hover. Subtle actions.
4. Danger: bg danger/10, border danger/20, text danger. Hover bg danger/20.

## Input Style
- bg surface
- border 1px border
- radius 6px
- text secondary
- placeholder faint
- focus: ring-1 border-strong
- h-9 or h-10

## Table Style
- Container: bg surface, radius 8px, border 1px border
- Header row: text muted, 12px weight 500, border-bottom 1px border
- Row: text secondary, hover bg hover
- Cell padding: px-4 py-2.5
- No zebra stripes — clean flat rows

## Sidebar
- Width: 220px collapsed to 60px
- bg canvas (blends with page)
- border-right 1px border
- Nav item: h-8, px-3, radius 6px
- Inactive: text muted
- Hover: bg hover
- Active: bg brand/10, text brand, left border 2px brand
- Icon: 16px, stroke-width 1.5

## Top Bar
- h-12, bg canvas
- border-bottom 1px border
- Breadcrumb/workspace switcher left
- Search, notifications, user avatar right

## Status Pills
- radius 9999px
- px-2 py-0.5
- font-size 11px, weight 500
- Success: bg success/10, text success, border success/20
- Warning: bg warning/10, text warning, border warning/20
- Danger: bg danger/10, text danger, border danger/20
- Neutral: bg surface, text muted, border border

## Empty States
- Centered in container
- Icon: 40px, color faint, opacity 0.5
- Title: 14px, weight 500, text secondary
- Subtitle: 13px, text muted
- CTA: primary button below

## Loading States
- Skeleton: bg faint/20, rounded 4px, shimmer animation
- Spinner: 16px, border-2 brand, border-t-transparent
- Inline: text muted with spinner icon

## Animation Tokens
- Transition base: 150ms ease
- Hover: 100ms
- Modal open: 200ms cubic-bezier(0.16, 1, 0.3, 1)
- Dropdown: 100ms ease-out
