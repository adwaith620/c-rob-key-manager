# C-ROB visual and interaction polish

## Goal
Enhance the existing C-ROB Smart Key Locker experience without changing its identity, page structure, authentication, booking behavior, database access, or hardware placeholders.

## Changes
- Add a short, reduced-motion-safe C-ROB startup reveal that runs only once per browser session.
- Add lightweight shared motion styles for page entry, staggered groups, cards, buttons, navigation, status indicators, dialogs, menus, and focus states.
- Refine the existing sidebar and mobile navigation with clearer active indicators and responsive press feedback.
- Improve member, Execom, and admin dashboard cards, loading skeletons, empty states, status hierarchy, and action feedback while preserving their current workflows.
- Add subtle circuit, blueprint-grid, and connection-line details using CSS only.
- Add a lower-page maker community photo composition using locally stored, optimized, verified free-use photographs with source attribution.
- Keep all effects touch-friendly, keyboard accessible, fast, and disabled or simplified under `prefers-reduced-motion`.

## Technical details
- Reuse the existing semantic color tokens and Orbitron/Inter typography.
- Use CSS transitions and keyframes only; no heavy animation dependency.
- Build small shared presentation components for the startup screen, route transition wrapper, skeletons, and maker gallery.
- Lazy-load below-fold images and provide descriptive alt text.
- Add route-specific metadata where missing, without changing application behavior.
- Validate public and authenticated-facing layouts at desktop and mobile sizes, then check diagnostics and console output.

## Guardrails
- No changes to authentication, the `@tkmce.ac.in` restriction, booking rules, data queries, database schema, environment variables, or server/Edge Function code.
- No feature removals, new workflows, excessive neon, particles, parallax, or game-like motion.
