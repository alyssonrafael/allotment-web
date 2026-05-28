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
    canvas/        ← PavilionStage, AllotmentNode, MiniMap, Grid, ExportStage
    events/        ← EventCard, CreateEventDialog
    allotments/    ← AllotmentForm, AllotmentPanel
    layout/        ← AppShell, Sidebar, Header, EventSelector
    shared/        ← StatusBadge, ThemeToggle, KPI, Pagination
  hooks/           ← useVenues, useEvents, useAllotments, useThemeTransition, useGlobalHotkeys
  stores/          ← canvasStore.ts, historyStore.ts, uiStore.ts
  types/           ← index.ts (Venue, Event, Allotment, AllotmentStatus, RecentActivity, EventRevenue + payloads)
  lib/             ← utils.ts (cn), collision.ts, constants.ts, format.ts, pavilionExport.ts
  routes/          ← file-based routes (see Frontend Routes below)
```

## Frontend routes

| Route | Screen |
|---|---|
| `/events` | Lista de eventos com seletor |
| `/events/$eventId/dashboard` | KPIs, donut, heatmap, atividade recente paginada |
| `/events/$eventId/pavilhao` | Editor visual (canvas drag/drop/resize) — aceita `?standId=` para pré-selecionar stand |
| `/events/$eventId/stands` | Tabela com filtros por status, busca, edição (nome/preço), exclusão com confirmação, link para canvas |
| `/events/$eventId/comercial` | Kanban por status |
| `/events/$eventId/financas` | 3 KPIs, receita por status (barra segmentada + mini-cards), distribuição por área, tabela de contribuição ordenável |

Layout route: `src/routes/events/$eventId/route.tsx` wraps child routes in `<AppShell>`.

### Pavilhão — search param `standId`

`/events/$eventId/pavilhao?standId=<id>` pré-seleciona o stand no canvas via `canvasStore.setSelected()`. O botão de mapa na tela de stands passa este param automaticamente.

## Canvas: critical business rules

**Scale:** `SCALE = 50` — 50 px = 1 m. Use `toPixels(meters)` / `toMeters(pixels)` for all Konva ↔ API conversions.

**Bounds check against event canvas (not venue):**
```
x >= 0  &&  y >= 0
x + width  <= event.canvasWidth
y + height <= event.canvasHeight
```

**On drag end (`onDragEnd`):**
1. Check `isOutOfBounds` → revert Konva node + `onInvalidMove('bounds')` if true
2. Check `detectOverlap` against every other allotment → revert + `onInvalidMove('overlap')` if hit
3. If valid → `onPositionCommit(id, x, y)` → `PATCH /allotments/:id/position` (not PUT)

**On resize end (`onTransformEnd`):**
1. Read `node.scaleX/scaleY`, reset scales to 1, compute new `width`/`height`/`x`/`y`
2. Snap: `Math.round(value / SCALE) * SCALE` — only at `onTransformEnd`, NEVER during drag (no snap in `boundBoxFunc`)
3. Check `isOutOfBounds` → revert if true
4. Check `detectOverlap` → revert if hit
5. If valid → `onTransformCommit(id, { x, y, width, height })`

**During resize (`boundBoxFunc`):** cursor follows freely — only enforces minimum size (SCALE=50px) and canvas bounds clamping. No grid snap here.

**Labels hidden during resize:** `isTransforming` state in PavilionStage drives `hideLabels` prop on AllotmentNode. When `true`, renders only background + top stripe + selection ring (avoids text deformation from Konva scaleX/Y on Group).

**Konva Transformer colors:** must be resolved hex/rgb values — Konva cannot parse CSS `var(...)` strings. Always read colors via `useCssTokens(['--brand-primary', '--surface'])` and pass resolved values to `borderStroke`/`anchorStroke`/`anchorFill`.

**Auto-pan during drag:** `requestAnimationFrame` loop with 40px dead zone, 14px/frame speed. Reads cursor position via `onDragCursor` callback (reports `clientX/clientY`). Loop starts on first `onDragCursor` call, stops on `onDragEnd`. Implemented in `PavilionStage` with `autoPanRafRef` + `lastCursorRef`.

**Single-select only:** multi-select is entirely removed. `handleSelect` ignores the `shift` parameter. `Shift+Click` does nothing special. No `Ctrl+A` / select-all. `selectedIds` array always has 0 or 1 items.

**Grid border:** uses neutral `--border-strong` (strokeWidth=2), no brand-primary blue.

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
- `Allotment.code` is **immutable** — `PUT /allotments/:id` accepts all fields except `code`; `UpdateAllotmentPayload` already omits it

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
- All shadcn components live in `src/components/ui/` — do not edit manually; customise via variants. **Exception:** `tooltip.tsx` was adapted to use project tokens (`bg-card`, `text-fg`, `border-border`) instead of the shadcn default inverted colors.
- Use `cn()` (clsx + tailwind-merge) for all conditional class logic.
- CSS tokens are in `src/styles.css` with `@theme inline` mapping them to Tailwind utilities.
- Sidebar: 240 px fixed. Header: sticky **56 px** (`h-14`). Content max-width: 1500 px centred.
- Sonner toast backgrounds: use `color-mix(in srgb, var(--status-X) 22%, var(--surface))` (NOT `var(--status-X-50)`) to ensure opacity in dark mode.

## Code conventions

- One component per file, PascalCase filenames.
- Hooks in `src/hooks/` with `use` prefix.
- Pure logic (no React) in `src/lib/`.
- No data fetching inside components — always go through hooks.
- `useMutation` for all write operations.
- Keyboard shortcuts managed via `react-hotkeys-hook` (G+D/P/S/C/F navigate, Ctrl+Z undo, Esc deselect, Del/Backspace delete).
- `useEffect` deps must not include objects that change every render (e.g. full `useMutation` return value) — use stable refs or handle side-effects in event handlers.

## Pavilhão editor: layout & behavior

**Height:** the editor div uses `h-[calc(100vh-72px)]` with `-mx-5 -my-4`. Math: header 56px + residual 16px from `main`'s `py-6` (48px) minus `-my-4` (32px) = 72px total to subtract.

**Layout structure:** outer `flex gap-3` row contains (1) canvas scroll wrap + MiniMap overlay, (2) `<AllotmentPanel>` as sibling. This gives the panel the same height as the canvas area without an extra container. Panel uses `rounded-2xl border border-border` (not `border-l`).

**AllotmentPanel validation:** before applying width/height changes from inputs, validates `isOutOfBounds` + `detectOverlap` against all other allotments. If invalid → `toast.error(...)` and returns without applying the diff. `onBlur` restores the input to the actual `allotment.width/height` if they diverge. Receives `allotments: Array<Allotment>` prop for this check.

**Insert flow (`handleInsert`):** if `dirtyIds.length > 0`, shows `toast.error('Salve as alterações pendentes...', { action: { label: 'Salvar agora', onClick: handleSaveNow } })` and returns early. Preset buttons have visual `opacity-50` when blocked, but the HTML `disabled` attribute is only set for hard failures (no event / mutation in progress), so the click always reaches the handler for the dirty-check toast.

**Delete confirmation:** Del/Backspace hotkey sets `pendingDeleteIds` state (instead of deleting directly). An `<AlertDialog>` renders and on confirm calls the actual delete logic. Cancelling clears `pendingDeleteIds`.

**Save behavior:** `autosaveEnabled` defaults to `true` (2 s debounce via `useAutosave`). `flushDirty` never shows a success toast — saves are silent. The toolbar shows a single `SaveStatus` component:
- Saving (request in-flight or autosave timer running) → "Salvando…" spinner. Only clears when the request resolves.
- Auto + timer pending → "Salvando…" + X button (cancels pending autosave).
- Dirty but no timer (manual mode, or after cancelling) → "Salvar (n)" button + X button (discards edits with `toast('Edições canceladas')`).
- Clean → "Salvo ✓" (discrete, green).
- Undo/redo schedules autosave like a normal edit — no immediate flush, no flicker.
- `onInvalidMove` toast throttled to 1.5 s (same window as `AllotmentPanel.flashInvalid`).

**Export (PNG / JSON / PDF):** toolbar "Exportar" dropdown (lucide `Download` icon). JSON exports immediately from in-memory data. PNG and PDF mount an `<ExportStage>` off-screen (fixed, `left: -100000px`), wait for `document.fonts.ready` + 2 rAF ticks, then call `stage.toDataURL({ pixelRatio: 2 })` — always full canvas, light theme, scale 1, independent of current zoom/scroll/theme. `ExportStage` uses `forceLight` prop on `Grid` and `AllotmentNode` to force light-mode colors. Dependencies: `jspdf`, `jspdf-autotable`.

**Pagination (`src/components/shared/Pagination`):** windowed page numbers (first, last, current ± 1, with `…` gaps) — always ≤ ~7 buttons regardless of page count. On mobile (`< sm`) number buttons are hidden and replaced by a compact "X / Y" indicator. Used in dashboard (recent activities), stands table, and finanças contribution table.

**Platform detection (`src/lib/platform.ts`):** `isMac` is SSR-safe (`typeof navigator !== 'undefined'` guard). Consumers must use `useEffect` to read it after mount to avoid hydration mismatch:
```ts
const [isMacClient, setIsMacClient] = useState(false)
useEffect(() => { setIsMacClient(isMac) }, [])
```

**Help modal (`StandTipsBar`):** button shows `<HelpCircle> Ajuda`. Dialog uses `sm:max-w-3xl` (must include `sm:` prefix to override shadcn's built-in `sm:max-w-lg`). Three sections: "Como funciona", "Atalhos" (platform-aware keys, 3-column grid: Canvas / Edição / Vista), "Histórico" (amber warning: inserting a new stand clears undo history).
