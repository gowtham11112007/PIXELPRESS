---
description: Guidelines for mobile-first design, responsive layouts, and touch-friendly interfaces.
---

# Mobile-First Design & Responsive Guidelines

When building or modifying UI components in the PIXELPRESS project, always prioritize the mobile experience.

## 1. Tailwind Mobile-First Approach
- Always write base Tailwind classes for **mobile screens first** (e.g., `flex-col`, `p-4`, `text-sm`).
- Use responsive modifiers (`sm:`, `md:`, `lg:`, `xl:`) only to adjust the layout for larger screens (e.g., `md:flex-row`, `md:p-8`, `md:text-base`).
- Avoid hardcoding fixed widths or heights unless necessary. Use percentages, `w-full`, or `max-w-*` to allow elements to scale.

## 2. Touch Targets & Interaction
- Ensure all interactive elements (buttons, links, form fields) have a minimum touch target size of **44x44 pixels** (approx. `min-h-[44px] min-w-[44px]` or `p-3`).
- Add active states (`active:scale-95`, `active:bg-gray-200`) to give immediate tactile feedback on mobile devices.
- For Framer Motion animations, use `whileTap={{ scale: 0.95 }}` on buttons.

## 3. Navigation & Layouts
- **CUSTOMER App**: Consider bottom tab bars or hamburger menus for mobile navigation instead of top navigation bars if the screen is narrow.
- **SELLER App**: Dashboards should stack columns vertically on mobile and utilize sidebars that can be toggled or hidden off-screen.
- Use horizontal scrolling (`overflow-x-auto snap-x`) for rows of cards on mobile rather than shrinking them too much or wrapping them excessively.

## 4. Safe Areas & Spacing
- Add adequate padding at the bottom of the screen to account for iOS/Android home indicators (e.g., `pb-safe` or manual padding if safe-area classes aren't configured).
- Maintain generous whitespace to prevent the UI from feeling cluttered on small screens.
