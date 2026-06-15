# CRM Hub — Premium UI Upgrade

## Visual Design System

### Color Palette
- **Background:** `#08090a` (canvas), `#0f1011` (surface), `#191a1b` (elevated)
- **Text:** `#f7f8f8` (primary), `#d0d6e0` (secondary), `#8a8f98` (muted), `#62666d` (faint)
- **Brand:** `#5e6ad2` → `#828fff` (hover)
- **Status:** Success `#10b981`, Danger `#ef4444`, Warning `#f59e0b`, Info `#3b82f6`

### Typography
- **Font:** Inter with `cv01`, `ss03` features
- **H1:** 24px/500/-0.3px
- **H2:** 18px/500/-0.2px
- **Body:** 13px/400/1.5
- **Label:** 12px/500/muted/uppercase
- **Micro:** 11px/400/faint

### Spacing
- Micro: 4px
- Tight: 8px
- Standard: 12px
- Card: 16px
- Section: 24px
- Hero: 32px

### Components

#### Buttons
```tsx
// Primary
className="h-9 px-4 rounded-lg bg-[#5e6ad2] text-white text-sm font-medium hover:bg-[#828fff] transition-colors"

// Secondary
className="h-9 px-4 rounded-lg bg-transparent border border-white/[0.06] text-[#d0d6e0] text-sm font-medium hover:bg-white/[0.04] transition-colors"

// Tertiary
className="h-9 px-4 rounded-lg bg-transparent text-[#8a8f98] text-sm font-medium hover:text-[#d0d6e0] hover:bg-white/[0.04] transition-colors"
```

#### Inputs
```tsx
className="h-9 px-3 rounded-lg bg-[#0f1011] border border-white/[0.06] text-[#d0d6e0] text-sm placeholder-[#62666d] focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/50 focus:border-[#5e6ad2]/50 transition-all"
```

#### Cards
```tsx
className="bg-[#0f1011] border border-white/[0.06] rounded-xl p-6"
```

#### Tables
```tsx
// Container
className="bg-[#0f1011] border border-white/[0.06] rounded-xl overflow-hidden"

// Header
className="bg-[#0f1011] border-b border-white/[0.06] text-[#8a8f98] text-xs font-medium uppercase tracking-wide"

// Row
className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02] transition-colors"

// Cell
className="px-4 py-3 text-[#d0d6e0] text-sm"
```

#### Status Pills
```tsx
// Success
className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#10b981]/10 text-[#10b981] text-xs font-medium border border-[#10b981]/20"

// Warning
className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] text-xs font-medium border border-[#f59e0b]/20"

// Danger
className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#ef4444]/10 text-[#ef4444] text-xs font-medium border border-[#ef4444]/20"
```

### Layout Patterns

#### Page Structure
```tsx
<div className="min-h-screen bg-[#08090a]">
  {/* Top Bar */}
  <header className="h-12 border-b border-white/[0.06] bg-[#08090a]">...</header>
  
  {/* Main Content */}
  <main className="p-6">
    {/* Page Header */}
    <div className="mb-6">
      <h1 className="text-2xl font-medium text-[#f7f8f8]">Page Title</h1>
      <p className="text-[#8a8f98] text-sm mt-1">Description</p>
    </div>
    
    {/* Content */}
    ...
  </main>
</div>
```

#### Empty States
```tsx
<div className="text-center py-12">
  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/[0.02] flex items-center justify-center">
    <Icon className="w-8 h-8 text-[#62666d]" />
  </div>
  <h3 className="text-[#d0d6e0] font-medium mb-1">No items yet</h3>
  <p className="text-[#8a8f98] text-sm mb-4">Get started by creating your first item</p>
  <button className="h-9 px-4 rounded-lg bg-[#5e6ad2] text-white text-sm font-medium hover:bg-[#828fff] transition-colors">
    Create Item
  </button>
</div>
```

#### Loading Skeletons
```tsx
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-white/[0.04] rounded w-3/4"></div>
  <div className="h-4 bg-white/[0.04] rounded w-1/2"></div>
  <div className="h-4 bg-white/[0.04] rounded w-5/6"></div>
</div>
```

### Animation Tokens
- Base transition: `150ms ease`
- Hover: `100ms`
- Modal: `200ms cubic-bezier(0.16, 1, 0.3, 1)`
- Dropdown: `100ms ease-out`

### Icons
- Use Lucide React icons
- Stroke width: 1.5
- Size: 16px (sidebar), 20px (buttons), 24px (headers)

### Accessibility
- All interactive elements must have `:focus-visible` ring
- Color contrast ratio: minimum 4.5:1 for text
- ARIA labels on icon-only buttons
- Keyboard navigation support
