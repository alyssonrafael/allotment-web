# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # dev server on port 3000
npm run build      # production build
npm run test       # vitest run (single pass)
npm run lint       # eslint
npm run format     # prettier --write + eslint --fix
npm run check      # prettier --check

# Add a shadcn/ui component
npx shadcn@latest add <component>
```

## Architecture

This is an **event pavilion management app** built with **TanStack Start** (SSR-capable React meta-framework). Routes are file-based under `src/routes/`; the router is configured in [src/router.tsx](src/router.tsx) and the root shell in [src/routes/__root.tsx](src/routes/__root.tsx).

**Domain hierarchy:** `Venue → Event → Allotment`
- **Venue** (pavilhão): physical space with dimensions. One venue hosts many events.
- **Event**: a single fair/expo tied to a venue, with its own `canvasWidth`/`canvasHeight` (may be ≤ venue dimensions).
- **Allotment** (stand): a positioned rectangle within the event canvas.

**Data flow:** Components never fetch directly — all server state goes through TanStack Query hooks in `src/hooks/`. Mutations always use `useMutation`. The axios client instance lives in `src/api/client.ts` and reads `VITE_API_URL` + `VITE_API_PREFIX` from the environment (backend is a separate NestJS service at `localhost:3333/api/v1`).

**Global UI state** (selected stand, zoom, theme) lives in Zustand stores under `src/stores/`. Canvas state (`selectedId`, `zoom`) goes in `canvasStore.ts`; undo/redo history goes in `historyStore.ts`; UI/theme state goes in `uiStore.ts`.

**Path aliases:** `#/*` maps to `src/*` (configured in `package.json` imports and tsconfig). Use `#/components/...`, `#/hooks/...`, etc.

## Folder structure

```
src/
  api/             ← axios client + per-resource functions
    client.ts      ← axios instance (baseURL from VITE_API_URL + VITE_API_PREFIX)
    venues.ts      ← getVenues, getVenue, createVenue, updateVenue, deleteVenue, getVenueRevenue
    events.ts      ← getEvents, getEvent, createEvent, updateEvent, deleteEvent, getEventRevenue, getEventActivities
    allotments.ts  ← CRUD + patchPosition, patchStatus
  components/
    ui/            ← shadcn/ui (do not edit manually)
    canvas/        ← PavilionStage, AllotmentNode, MiniMap, Grid
    events/        ← EventCard, CreateEventDialog
    allotments/    ← AllotmentForm, AllotmentPanel
    layout/        ← AppShell, Sidebar, Header, EventSelector
    shared/        ← StatusBadge, ThemeToggle, KPI
  hooks/           ← useVenues, useEvents, useAllotments, useThemeTransition, useGlobalHotkeys
  stores/          ← canvasStore.ts, historyStore.ts, uiStore.ts
  types/           ← index.ts (Venue, Event, Allotment, AllotmentStatus, RecentActivity, EventRevenue + payloads)
  lib/             ← utils.ts (cn), collision.ts, constants.ts, format.ts
  routes/          ← file-based routes (see Frontend Routes below)
```

## Frontend routes

| Route | Screen |
|---|---|
| `/events` | Lista de eventos com seletor |
| `/events/$eventId/dashboard` | KPIs, donut, heatmap, atividade |
| `/events/$eventId/pavilhao` | Editor visual (canvas drag/drop/resize) |
| `/events/$eventId/stands` | Tabela de stands com filtros |
| `/events/$eventId/comercial` | Kanban por status |
| `/events/$eventId/financas` | Previsão financeira |

Layout route: `src/routes/events/$eventId/route.tsx` wraps child routes in `<AppShell>`.

## Canvas: critical business rules

**Scale:** `SCALE = 50` — 50 px = 1 m. Use `toPixels(meters)` / `toMeters(pixels)` for all Konva ↔ API conversions.

**Bounds check against event canvas (not venue):**
```
x >= 0  &&  y >= 0
x + width  <= event.canvasWidth
y + height <= event.canvasHeight
```

**On drag/resize end (Konva `onDragEnd` / `onTransformEnd`):**
1. Snap coordinates: `snapToGrid(value, GRID_SIZE)` — `GRID_SIZE = 1 m`
2. Check `isOutOfBounds(allotment, event)` → revert if true
3. Check `detectOverlap(a, b)` against every other allotment → revert on any hit
4. If valid → `PATCH /allotments/:id/position` mutation (not PUT — faster, only x/y)

The pure functions (`collision.ts`, `constants.ts`) must stay free of React imports.

## API endpoints (backend at `localhost:3333/api/v1`)

```
Venues
  POST    /venues              body: flat fields (city, state, street?, neighborhood?, zipCode?, accent, photo)
  GET     /venues              returns VenueListItem[] (inclui _count.events)
  GET     /venues/:id          returns VenueWithEvents
  PUT     /venues/:id
  DELETE  /venues/:id          fails 409 if venue has events
  GET     /venues/:id/revenue  returns EventRevenue — receita agregada de todos os eventos do pavilhão

Events
  POST    /events              body: { name, type (UPPERCASE), startDate, endDate (ISO), venueId, canvasWidth?, canvasHeight? }
  GET     /events              ?venueId= ?type= ?status=
  GET     /events/:id          returns EventDetail (venue + allotments[] + status computado)
  PUT     /events/:id          name, type, startDate, endDate, canvasWidth, canvasHeight (venueId immutable)
  DELETE  /events/:id          cascade-deletes allotments
  GET     /events/:id/revenue    returns EventRevenue { realized, inNegotiation, total, counts }
  GET     /events/:id/activities returns RecentActivity[] — últimas 24h, mais recente primeiro

Allotments
  POST    /events/:eventId/allotments
  GET     /events/:eventId/allotments
  GET     /allotments/:id
  PUT     /allotments/:id      all fields except code (revalidates bounds + overlap)
  PATCH   /allotments/:id/position   { x, y } — for drag & drop
  PATCH   /allotments/:id/status     { status } — for kanban
  DELETE  /allotments/:id
```

All errors follow `{ statusCode, message, detail: string | string[] }`.

**Critical type rules:**
- `EventType` values are **UPPERCASE**: `'FEIRA' | 'CONGRESSO' | 'EXPO' | 'CORPORATE'`
- `Venue` address fields are **flat** on the object (`city`, `state`, `street`, etc.) — no nested `address`
- `Event.status` is **returned** by the API (computed) but never sent in request bodies
- `getEvents(params?)` accepts `{ venueId?, type?, status? }` — all optional

## Status colours

| Status | Colour | CSS token |
|---|---|---|
| `AVAILABLE` | `#10b981` (emerald) | `--status-livre` |
| `RESERVED` | `#f59e0b` (amber) | `--status-reservado` |
| `SOLD` | `#8b5cf6` (violet) | `--status-vendido` |
| `BLOCKED` | `#94a3b8` (slate) | `--status-bloqueado` |

Each status has three variants: `--status-{x}` (solid), `--status-{x}-50` (soft bg), `--status-{x}-text`. Always combine colour + text + icon — never colour alone.

## Design system

- **Light mode is the default.** Bootstrap via inline `<script>` before React mounts; toggle persists to `localStorage`. Dark mode available via `ThemeToggle`.
- Theme transition: View Transitions API with `clip-path` circle expand from click point (`useThemeTransition` hook).
- Fonts: **Inter** (UI, 400–900) + **JetBrains Mono** (codes, IDs, monetary values, 400–600).
- All shadcn components live in `src/components/ui/` — do not edit manually; customise via variants.
- Use `cn()` (clsx + tailwind-merge) for all conditional class logic.
- CSS tokens are in `src/styles.css` with `@theme inline` mapping them to Tailwind utilities.
- Sidebar: 240 px fixed. Header: sticky 72 px. Content max-width: 1500 px centred.

## Code conventions

- One component per file, PascalCase filenames.
- Hooks in `src/hooks/` with `use` prefix.
- Pure logic (no React) in `src/lib/`.
- No data fetching inside components — always go through hooks.
- `useMutation` for all write operations.
- Keyboard shortcuts managed via `react-hotkeys-hook` (G+D/P/S/C/F navigate, Ctrl+Z undo, Esc deselect, Del/Backspace delete).
- `useEffect` deps must not include objects that change every render (e.g. full `useMutation` return value) — use stable refs or handle side-effects in event handlers.
