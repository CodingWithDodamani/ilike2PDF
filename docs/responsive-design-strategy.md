# Mobile-First Responsive Design Strategy

## 1. Key Principles of Mobile-First Responsive Design

### 1.1 Start Small, Scale Up
Every design decision begins at **320px** (the narrowest smartphone viewport). Styles are written for mobile first, then progressively enhanced at larger breakpoints using `min-width` media queries (Tailwind's default behavior).

```
Base styles    → Mobile (0px+)
sm: (640px)    → Large phones / small tablets
md: (768px)    → Tablets / small desktops
tl: (900px)    → Large tablets / small laptops (custom breakpoint)
lg: (1024px)   → Laptops
xl: (1280px)   → Desktops
```

### 1.2 Content Hierarchy Over Visual Symmetry
On mobile, content is stacked vertically in order of importance. Visual "side-by-side" layouts are a desktop luxury — mobile users need the most important information first, with clear pathways to secondary content.

### 1.3 Touch-First Interaction
All interactive elements must be designed for fingers, not cursors. This means larger hit areas, generous spacing, and feedback that works without hover states.

### 1.4 Progressive Enhancement, Not Graceful Degradation
The mobile experience is the **foundation**, not the fallback. Desktop enhances the mobile experience with additional features (sidebars, hover states, multi-column layouts), never the other way around.

---

## 2. Recommended Breakpoints and Layout Strategies

### 2.1 Breakpoint System

| Breakpoint | Prefix | Width | Device Target | Layout Strategy |
|------------|--------|-------|---------------|-----------------|
| Base | (none) | 0–639px | Smartphones | Single column, full-width, bottom nav |
| `sm:` | `sm` | 640px+ | Large phones / small tablets | 2-column grids, horizontal padding increases |
| `md:` | `md` | 768px+ | Tablets / small desktops | Desktop nav replaces mobile menu, 3-column grids |
| `tl:` | `tl` | 900px+ | Large tablets / small laptops | 3–4 column grids (custom breakpoint) |
| `lg:` | `lg` | 1024px+ | Laptops | 2-column tool layouts, sidebar appears |
| `xl:` | `xl` | 1280px+ | Desktops | 4-column grids, max-width container |

### 2.2 Grid Progression Pattern

```html
<!-- Homepage tool grid example -->
<div class="grid grid-cols-1 sm:grid-cols-2 tl:grid-cols-3 lg:grid-cols-4 gap-3">
  <!-- Tool cards -->
</div>
```

**Rule:** Grids expand by adding columns, never by shrinking content. Each breakpoint adds exactly one column until reaching the maximum useful density.

### 2.3 Container Width System

| Container | Max Width | Used For |
|-----------|-----------|----------|
| Default | 100% | Mobile content |
| `max-w-6xl` | 1152px | Tool pages, main content |
| `max-w-7xl` | 1280px | Homepage, category pages |

Horizontal padding progression: `px-5 sm:px-6 lg:px-8` (20px → 24px → 32px)

---

## 3. Content Prioritization and Adaptation Techniques

### 3.1 Mobile Content Hierarchy

```
Priority 1: Core action (file upload, primary input)
Priority 2: Controls (settings, options)
Priority 3: Results (output, preview)
Priority 4: Supplementary (tips, related tools)
```

### 3.2 Adaptation Patterns

**Show/Hide by breakpoint:**
```html
<!-- Privacy badge: always visible -->
<div class="inline-flex ...">100% Private</div>

<!-- Hero illustration: desktop only -->
<div class="hidden lg:block">...</div>

<!-- Desktop nav: hidden on mobile -->
<nav class="hidden md:flex ...">...</nav>

<!-- Mobile bottom nav: hidden on desktop -->
<nav class="md:hidden fixed bottom-0 ...">...</nav>
```

**Layout shift:**
```html
<!-- Tool page: single column mobile, 2-column desktop -->
<div class="lg:grid lg:grid-cols-[1fr_200px] lg:gap-6">
  <div class="min-w-0">{/* Main content */}</div>
  <aside class="hidden lg:block">{/* Sidebar */}</aside>
</div>
```

**Fluid typography:**
```css
/* Hero title: scales smoothly between 24px and 52px */
text-[clamp(1.5rem,5vw,3.25rem)]
```

### 3.3 Mobile-Specific Content Decisions

| Element | Mobile Behavior | Desktop Behavior |
|---------|----------------|-----------------|
| Hero illustration | Hidden | Visible |
| Tool sidebar | Hidden (tips in dropdown) | Sticky right column |
| Search bar | Icon-only trigger | Full input with Ctrl+K hint |
| Privacy badge | Compact text only | Full badge with icon |
| Footer | Stacked single column | 6-column grid |
| Tool shortcuts | Hidden | Visible sidebar panel |

---

## 4. Navigation Patterns for Different Screen Sizes

### 4.1 Mobile Navigation (0–767px)

```
┌─────────────────────────────┐
│ ☰  Logo        🔍  About   │  ← Top bar (fixed)
├─────────────────────────────┤
│                             │
│       Main Content          │  ← Scrollable area
│       (pb-20 for nav)       │
│                             │
├─────────────────────────────┤
│ 🏠  📄  🖼️  ⬛  ⚙️         │  ← Bottom tab bar (fixed)
│ Home PDF  Img QR  Utils     │     pb-[env(safe-area-inset-bottom)]
└─────────────────────────────┘
```

**Key patterns:**
- Hamburger menu for secondary navigation
- Bottom tab bar for primary sections (5 tabs max)
- `pb-20 md:pb-0` on main content to clear bottom nav
- Safe area padding for iPhone notch/home indicator
- Slide-down menu with Framer Motion animation

### 4.2 Tablet Navigation (768–1023px)

```
┌─────────────────────────────────────────┐
│ Logo   PDF  Image  QR  Utilities   🔍   │  ← Horizontal nav
├─────────────────────────────────────────┤
│                                         │
│            Main Content                 │
│                                         │
├─────────────────────────────────────────┤
│ Footer                                  │
└─────────────────────────────────────────┘
```

**Key patterns:**
- Full horizontal navigation (hamburger hidden)
- No bottom tab bar
- Search bar visible with keyboard shortcut hint
- Footer visible

### 4.3 Desktop Navigation (1024px+)

```
┌──────────────────────────────────────────────────┐
│ Logo   PDF  Image  QR  Utilities   🔍 Ctrl+K   [GitHub] [Get Started] │
├──────────────────────────────────────────────────┤
│                                          │       │
│            Main Content                  │ Side  │
│                                          │ bar   │
├──────────────────────────────────────────────────┤
│ Footer (6-column grid)                           │
└──────────────────────────────────────────────────┘
```

**Key patterns:**
- All navigation elements visible
- Tool sidebar with shortcuts
- "Get started" CTA button
- Full footer with columns

---

## 5. Best Practices for Touch Targets and Interactive Elements

### 5.1 Touch Target Sizing

| Element | Minimum Size | Recommended | Our Implementation |
|---------|-------------|-------------|-------------------|
| Buttons | 44×44px | 48×48px | `btn-sm` = ~40px, `btn-md` = ~44px |
| Bottom nav tabs | 44×44px | 48×48px | `py-3 min-h-[44px]` ✓ |
| Remove/close buttons | 44×44px | 44×44px | `h-11 w-11` ✓ |
| Rotate buttons | 44×44px | 44×44px | `h-11 w-11` ✓ |
| Form inputs | 44px height | 48px height | `input` class = 44px ✓ |

### 5.2 Touch Feedback Patterns

```css
/* Button press feedback */
.btn { @apply active:scale-[0.97] transition-transform; }

/* Tap highlight removal (mobile) */
html { -webkit-tap-highlight-color: transparent; }

/* Haptic feedback (JavaScript) */
navigator.vibrate(30)  // On drag start
```

### 5.3 Touch Gesture Support

| Gesture | Implementation | Use Case |
|---------|---------------|----------|
| Long press (400ms) | `useTouchDnd` hook | File chip reordering |
| Swipe down | Framer Motion `drag="y"` | Command palette dismiss |
| Pan | `touch-pan-y` | Before/after slider |

### 5.4 Hover vs Touch Considerations

```html
<!-- Desktop: hover to reveal -->
<button class="sm:invisible sm:group-hover:visible ...">Rotate</button>

<!-- Mobile: always visible -->
<button class="...">Rotate</button>

<!-- Solution: use group-hover on desktop, always visible on mobile -->
<div class="group">
  <button class="sm:invisible sm:group-hover:visible ...">Rotate</button>
</div>
```

---

## 6. Performance Optimization for Mobile

### 6.1 GPU-Intensive Operations

```css
/* Reduce backdrop blur on mobile for glass effects */
@media (max-width: 767px) {
  .glass { @apply backdrop-blur-md; }      /* was backdrop-blur-xl */
  .glass-strong { @apply backdrop-blur-xl; } /* was backdrop-blur-2xl */
}
```

### 6.2 Image Optimization

| Technique | Implementation |
|-----------|---------------|
| Lazy loading | `loading="lazy" decoding="async"` on all non-critical images |
| Responsive images | `<img srcset="...">` for hero images |
| WebP format | Serve WebP to supported browsers |
| Thumbnail rendering | Batch render PDF thumbnails (6 at a time) |
| Object URL cleanup | `URL.revokeObjectURL()` after image loads |

### 6.3 Animation Performance

```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

```javascript
// Framer Motion configuration
<motion.div reducedMotion="user">
```

### 6.4 Network Considerations

| Strategy | Implementation |
|----------|---------------|
| Code splitting | React.lazy() for all 94 tool components |
| Dynamic imports | `@imgly/background-removal` and `tesseract.js` loaded on-demand |
| Service worker | Offline-first with PWA caching |
| Asset preloading | `<link rel="preconnect">` for API endpoints |
| Bundle analysis | Vite's built-in chunk splitting |

### 6.5 Mobile-Specific Optimizations

```css
/* iOS momentum scrolling */
* { -webkit-overflow-scrolling: touch; }

/* Prevent zoom on input focus (iOS) */
input[type="text"], input[type="number"] {
  font-size: 16px; /* Prevents auto-zoom */
}

/* Safe area handling */
pb-[env(safe-area-inset-bottom)]
```

```html
<!-- Viewport meta tag -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

---

## 7. Testing Checklist

### 7.1 Device Testing Matrix

| Device | Viewport | Priority |
|--------|----------|----------|
| iPhone SE | 375×667 | High |
| iPhone 14 | 390×844 | High |
| iPhone 14 Pro Max | 430×932 | Medium |
| iPad | 768×1024 | High |
| iPad Pro | 1024×1366 | Medium |
| Android (360px) | 360×640 | High |
| Desktop (1280px) | 1280×720 | High |
| Desktop (1920px) | 1920×1080 | Low |

### 7.2 Functional Testing

- [ ] Bottom nav doesn't overlap content
- [ ] All touch targets are ≥44×44px
- [ ] No horizontal scroll on any page
- [ ] Tables scroll horizontally on mobile
- [ ] Forms don't trigger zoom on focus
- [ ] Keyboard doesn't obscure inputs
- [ ] Pull-to-refresh doesn't break layout
- [ ] Safe area padding works on iPhone
- [ ] Dark mode works at all breakpoints
- [ ] Landscape mode doesn't break layout

### 7.3 Performance Testing

- [ ] First Contentful Paint < 1.5s on 3G
- [ ] Largest Contentful Paint < 2.5s on 3G
- [ ] Cumulative Layout Shift < 0.1
- [ ] Total Blocking Time < 200ms
- [ ] No layout thrashing during scroll
- [ ] Images load progressively

---

## 8. Component-Specific Guidelines

### 8.1 Dropzone (File Upload)

```
Mobile:  Full-width, compact padding (p-6)
Desktop: Full-width, generous padding (p-8)

Touch:   whileTap={{ scale: 0.995 }} for visual feedback
A11y:    sr-only file input, button wrapper for tap target
```

### 8.2 Tool Page Layout

```
Mobile:  Single column, full-width
Desktop: lg:grid lg:grid-cols-[1fr_200px] with sticky sidebar

Controls: Always above the fold on mobile
Results:  Below controls, scrollable
```

### 8.3 File List / Table

```
Mobile:  Card-based layout, stacked rows
Desktop: Table layout with grid columns

Columns: Progressive reveal (hide non-essential on mobile)
Actions: Icon-only on mobile, icon+text on desktop
```

### 8.4 Progress Indicators

```
Mobile:  Full-width progress bar + text below
Desktop: Progress bar + inline percentage

Position: Always visible, never behind keyboard
```

---

## 9. Common Pitfalls to Avoid

| Pitfall | Solution |
|---------|----------|
| Fixed widths on containers | Use `max-w-*` + `w-full` |
| Hover-only interactions | Provide tap alternatives |
| Small touch targets | Minimum 44×44px for all interactive elements |
| No safe area handling | Use `env(safe-area-inset-*)` |
| Ignoring keyboard overlap | Use `visualViewport` API or scroll-into-view |
| Blocking scroll on mobile | Avoid `overflow: hidden` on body |
| Auto-zoom on input focus | Ensure inputs are ≥16px font-size |
| No loading states | Always show skeleton/spinner during async ops |
| Desktop-only features | Progressive enhancement, not regression |
| Ignoring landscape mode | Test both orientations |

---

## 10. Quick Reference: Tailwind Classes

### Spacing
```html
<!-- Mobile-first padding progression -->
px-5 sm:px-6 lg:px-8

<!-- Section vertical spacing -->
py-10 sm:py-14 lg:py-20

<!-- Gap progression -->
gap-3 sm:gap-4 lg:gap-6
```

### Grids
```html
<!-- Tool cards: 1→2→3→4 columns -->
grid grid-cols-1 sm:grid-cols-2 tl:grid-cols-3 lg:grid-cols-4

<!-- Tool page: 1→2 columns -->
lg:grid lg:grid-cols-[1fr_200px]

<!-- Stats: 2→4 columns -->
grid grid-cols-2 sm:grid-cols-4
```

### Typography
```html
<!-- Fluid heading -->
text-[clamp(1.5rem,5vw,3.25rem)]

<!-- Progressive size -->
text-lg sm:text-xl lg:text-2xl

<!-- Responsive line height -->
leading-relaxed lg:leading-loose
```

### Visibility
```html
<!-- Hide on mobile, show on desktop -->
hidden md:flex

<!-- Show on mobile, hide on desktop -->
md:hidden

<!-- Always visible but responsive sizing -->
text-[10px] sm:text-xs
```

### Touch
```html
<!-- Minimum touch target -->
min-h-[44px] min-w-[44px]

<!-- Touch feedback -->
active:scale-[0.97] transition-transform

<!-- Safe area bottom padding -->
pb-[env(safe-area-inset-bottom)]
```
