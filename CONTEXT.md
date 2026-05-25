# CONTEXT.md — Allotment Manager Frontend

> Referência técnica completa do projeto. Contém modelo de domínio, contratos de API, design system, regras de negócio e padrões de implementação.

---

## 1. Visão geral

Módulo web para gerenciamento visual de stands (allotments) de pavilhões de eventos. O usuário seleciona um evento, visualiza o pavilhão e posiciona/edita stands via drag & drop em um canvas. Há telas complementares de gestão comercial (kanban), financeira e de stands (tabela).

---

## 2. Stack

| Camada | Tecnologia |
|---|---|
| Framework UI | React 18 + TypeScript |
| Meta-framework | TanStack Start (SSR) |
| Roteamento | TanStack Router (file-based) |
| Server state | TanStack Query |
| Estado global | Zustand |
| Canvas | react-konva / Konva.js |
| UI components | shadcn/ui (new-york, zinc base) |
| Estilo | Tailwind CSS v4 + tokens CSS customizados |
| HTTP client | axios |
| Forms | react-hook-form + zod |
| Ícones | lucide-react |
| Toasts | sonner |
| Atalhos | react-hotkeys-hook |
| Gráficos | recharts |
| DnD | @dnd-kit/core (kanban) |
| Backend | NestJS — `http://localhost:3333/api/v1` |

---

## 3. Hierarquia de domínio

```
Venue (Pavilhão)
  └── Event (Evento)          ← venueId obrigatório
        └── Allotment (Stand) ← eventId obrigatório; posição validada contra o canvas
```

- **Venue**: local físico permanente com endereço, dimensões e identidade visual (cor + gradiente).
- **Event**: ocupação temporária do venue. Tem janela de datas (`startDate`/`endDate`), tipo e canvas próprio.
- **Allotment**: retângulo posicionado dentro do canvas do evento.

---

## 4. Tipos TypeScript

```ts
// src/types/index.ts

export type AllotmentStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'BLOCKED'
export type EventType       = 'FEIRA' | 'CONGRESSO' | 'EXPO' | 'CORPORATE'
export type EventStatus     = 'upcoming' | 'active' | 'finished'  // derivado — nunca enviado no body

// ── Venue ──────────────────────────────────────────────────────────────────
// Endereço em campos planos (não aninhados)

export interface Venue {
  id: string
  name: string
  description: string | null
  width: number      // metros
  height: number     // metros
  city: string
  state: string      // sigla UF: 'SP'
  street: string | null
  neighborhood: string | null
  zipCode: string | null
  accent: string     // CSS color token — ex: 'var(--primary)'
  photo: string      // CSS gradient — ex: 'linear-gradient(135deg, #2563eb 0%, ...)'
  createdAt: string
  updatedAt: string
}

export interface VenueListItem extends Venue {
  _count: { events: number }
}

export interface VenueWithEvents extends Venue {
  events: Array<{ id: string; name: string; startDate: string; endDate: string }>
}

export type CreateVenuePayload = {
  name: string
  description?: string
  width: number
  height: number
  city: string
  state: string
  street?: string
  neighborhood?: string
  zipCode?: string
  accent: string
  photo: string
}

export type UpdateVenuePayload = Partial<CreateVenuePayload>

// ── Event ──────────────────────────────────────────────────────────────────

export interface Event {
  id: string
  name: string
  startDate: string    // ISO 8601
  endDate: string      // ISO 8601
  status: EventStatus  // campo computado pelo backend — nunca enviar no body
  type: EventType
  venueId: string
  canvasWidth: number
  canvasHeight: number
  createdAt: string
  updatedAt: string
}

export interface EventListItem extends Event {
  venue: { id: string; name: string }
  _count: { allotments: number }
}

export interface EventDetail extends Event {
  venue: { id: string; name: string; width: number; height: number }
  allotments: Allotment[]
}

export type CreateEventPayload = {
  name: string
  startDate: string
  endDate: string
  type: EventType
  venueId: string
  canvasWidth?: number   // opcional — padrão: venue.width
  canvasHeight?: number  // opcional — padrão: venue.height
}

export type UpdateEventPayload = {
  name?: string
  startDate?: string
  endDate?: string
  type?: EventType
  canvasWidth?: number
  canvasHeight?: number
  // venueId NÃO pode ser alterado
}

// ── Allotment ──────────────────────────────────────────────────────────────

export interface Allotment {
  id: string
  name: string
  code: string        // único por evento
  x: number           // posição X em metros (origem: canto superior esquerdo)
  y: number
  width: number       // mínimo 1 m
  height: number      // mínimo 1 m
  status: AllotmentStatus
  price: number       // mínimo 0
  eventId: string
  createdAt: string
  updatedAt: string
}

export type CreateAllotmentPayload = {
  name: string
  code: string
  x: number
  y: number
  width: number
  height: number
  status?: AllotmentStatus  // padrão: 'AVAILABLE'
  price: number
}

export type UpdateAllotmentPayload = Partial<
  Omit<Allotment, 'id' | 'eventId' | 'code' | 'createdAt' | 'updatedAt'>
>
// code NÃO pode ser alterado via PUT

export type PatchPositionPayload = { x: number; y: number }
export type PatchStatusPayload   = { status: AllotmentStatus }

// ── Activity & Revenue ──────────────────────────────────────────────────────

export type ActivityType =
  | 'CREATED' | 'UPDATED' | 'DELETED'
  | 'SOLD' | 'RESERVED' | 'BLOCKED' | 'AVAILABLE'

export interface RecentActivity {
  id: string
  action: string      // descrição legível: "Lote A01 passou para RESERVED"
  type: ActivityType  // usado para selecionar ícone via ACTIVITY_ICONS
  createdAt: string   // ISO 8601
}

export interface EventRevenue {
  realized: number       // soma dos lotes SOLD
  inNegotiation: number  // soma dos lotes RESERVED
  total: number          // realized + inNegotiation
  counts: {
    sold: number
    reserved: number
    available: number
    blocked: number
  }
}
```

---

## 5. API REST — Backend (`/api/v1`)

### 5.1 Formato de erro (todos os endpoints)

```ts
interface ApiError {
  statusCode: number
  message: string
  detail: string | string[]  // array quando erro de validação de campos (400)
}
```

### 5.2 Venues — `/venues`

| Método | Rota | Body | Resposta | Notas |
|---|---|---|---|---|
| `POST` | `/venues` | `CreateVenuePayload` | `201 Venue` | name ≥ 3 chars; address obrigatório |
| `GET` | `/venues` | — | `200 VenueListItem[]` | inclui `_count.events` |
| `GET` | `/venues/:id` | — | `200 VenueWithEvents` | inclui events[] |
| `PUT` | `/venues/:id` | `UpdateVenuePayload` | `200 Venue` | todos os campos opcionais |
| `DELETE` | `/venues/:id` | — | `204` | 409 se tiver eventos vinculados |
| `GET` | `/venues/:id/revenue` | — | `200 EventRevenue` | receita agregada de todos os eventos; use `useVenueRevenueQuery` |

### 5.3 Events — `/events`

| Método | Rota | Body / Query | Resposta | Notas |
|---|---|---|---|---|
| `POST` | `/events` | `CreateEventPayload` | `201 Event & { venue: { id, name } }` | backend copia width/height do venue se não enviados |
| `GET` | `/events` | `?venueId=` | `200 EventListItem[]` | filtro opcional por pavilhão |
| `GET` | `/events/:id` | — | `200 EventDetail` | inclui venue + allotments[] |
| `PUT` | `/events/:id` | `UpdateEventPayload` | `200 Event` | venueId imutável |
| `DELETE` | `/events/:id` | — | `204` | allotments removidos em cascata |
| `GET` | `/events/:id/revenue` | — | `200 EventRevenue` | receita por status; use `useEventRevenueQuery` |
| `GET` | `/events/:id/activities` | — | `200 RecentActivity[]` | feed últimas 24h; polling 30s via `useEventActivitiesQuery` |

### 5.4 Allotments — `/events/:eventId/allotments` e `/allotments/:id`

| Método | Rota | Body | Resposta | Notas |
|---|---|---|---|---|
| `POST` | `/events/:eventId/allotments` | `CreateAllotmentPayload` | `201 Allotment` | valida bounds + overlap; 409 em conflito |
| `GET` | `/events/:eventId/allotments` | — | `200 Allotment[]` | ordenados por criação |
| `GET` | `/allotments/:id` | — | `200 Allotment` | |
| `PUT` | `/allotments/:id` | `UpdateAllotmentPayload` | `200 Allotment` | revalida posição + colisão; code imutável |
| `PATCH` | `/allotments/:id/position` | `{ x, y }` | `200 Allotment` | drag & drop — só x/y |
| `PATCH` | `/allotments/:id/status` | `{ status }` | `200 Allotment` | kanban — só status |
| `DELETE` | `/allotments/:id` | — | `204` | |

**Regras de posicionamento (validadas no backend e replicadas no front):**
```
x >= 0  &&  y >= 0
x + width  <= event.canvasWidth
y + height <= event.canvasHeight
Nenhum allotment pode sobrepor outro (AABB)
```

---

## 6. Frontend routes

| Rota | Tela | Descrição |
|---|---|---|
| `/events` | Hub de pavilhões | Lista venues com eventos agrupados; modais de criação |
| `/events/$eventId/dashboard` | Dashboard | KPIs, donut chart de status, heatmap, atividade recente |
| `/events/$eventId/pavilhao` | Editor visual | Canvas drag/drop/resize (react-konva), mini-mapa, painel lateral |
| `/events/$eventId/stands` | Gestão de stands | Tabela com filtros, busca, ações inline |
| `/events/$eventId/comercial` | Funil de vendas | Kanban com drag entre 4 colunas de status |
| `/events/$eventId/financas` | Previsão financeira | KPIs, barras por status, ranking de stands |

`/events/$eventId/route.tsx` é a layout route: carrega o evento, seta `uiStore.activeEventId` e renderiza `<AppShell>` com `<Outlet>`.

---

## 7. Regras de negócio no canvas

### 7.1 Escala

```ts
export const SCALE = 50      // 50 px = 1 m
export const GRID_SIZE = 1   // 1 m por célula de snap

export const toPixels = (m: number) => m * SCALE
export const toMeters = (p: number) => p / SCALE
```

### 7.2 Detecção de colisão (`src/lib/collision.ts` — sem imports React)

```ts
export function detectOverlap(a: Allotment, b: Allotment): boolean {
  return (
    a.x < b.x + b.width  &&
    a.x + a.width  > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

export function isOutOfBounds(a: Allotment, event: EventDetail): boolean {
  return (
    a.x < 0 ||
    a.y < 0 ||
    a.x + a.width  > event.canvasWidth ||
    a.y + a.height > event.canvasHeight
  )
}

export function snapToGrid(value: number, gridSize = GRID_SIZE): number {
  return Math.round(value / gridSize) * gridSize
}
```

### 7.3 Fluxo de drag/resize (Konva `onDragEnd` / `onTransformEnd`)

1. Snap: `snapToGrid(x, GRID_SIZE)`, `snapToGrid(y, GRID_SIZE)`
2. `isOutOfBounds` → revert se verdadeiro
3. `detectOverlap` contra todos os outros stands → revert se colisão
4. Se válido → `PATCH /allotments/:id/position` (somente x/y; mais leve que PUT)

---

## 8. Cores de status (allotment)

| Status | Token CSS | Hex (light) | Hex (dark) | Significado |
|---|---|---|---|---|
| `AVAILABLE` | `--status-livre` | `#10b981` | `#34d399` | Disponível para venda |
| `RESERVED` | `--status-reservado` | `#f59e0b` | `#fbbf24` | Em negociação |
| `SOLD` | `--status-vendido` | `#8b5cf6` | `#a78bfa` | Faturamento confirmado |
| `BLOCKED` | `--status-bloqueado` | `#94a3b8` | `#6b7090` | Indisponível |
| Erro | `--status-erro` | `#ef4444` | `#f87171` | Colisão, validação, exclusão |

Cada status tem **3 variantes**: `--status-{x}` (sólido), `--status-{x}-50` (fundo suave), `--status-{x}-text` (texto sobre fundo claro).

---

## 9. Constantes de domínio (`src/lib/constants.ts`)

### Capas de venue (`VENUE_PHOTOS`)

4 opções fixas — nunca picker livre (preserva consistência visual):

```ts
export const VENUE_PHOTOS = [
  { id: 'blue',   accent: '#2563eb', photo: 'linear-gradient(135deg, #2563eb 0%, #6366f1 60%, #8b5cf6 100%)' },
  { id: 'orange', accent: '#f97316', photo: 'linear-gradient(135deg, #f97316 0%, #ea580c 60%, #c2410c 100%)' },
  { id: 'violet', accent: '#8b5cf6', photo: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 60%, #ec4899 100%)' },
  { id: 'green',  accent: '#10b981', photo: 'linear-gradient(135deg, #10b981 0%, #059669 60%, #047857 100%)' },
] as const

export type VenuePhotoId = (typeof VENUE_PHOTOS)[number]['id']
```

### Presets de tamanho (`VENUE_SIZE_PRESETS`)

```ts
export const VENUE_SIZE_PRESETS = [
  { id: 'small',  label: 'Pequeno', width: 20, height: 15 },
  { id: 'medium', label: 'Médio',   width: 40, height: 30 },
  { id: 'large',  label: 'Grande',  width: 50, height: 35 },
  { id: 'huge',   label: 'Enorme',  width: 80, height: 50 },
] as const
```

### Tipos de evento (`EVENT_TYPES`)

IDs em **MAIÚSCULAS** — exatamente como a API espera:

```ts
export const EVENT_TYPES = [
  { id: 'FEIRA',     label: 'Feira',       color: '#2563eb' },
  { id: 'CONGRESSO', label: 'Congresso',   color: '#8b5cf6' },
  { id: 'EXPO',      label: 'Exposição',   color: '#f97316' },
  { id: 'CORPORATE', label: 'Corporativo', color: '#10b981' },
]
```

### Status de ciclo de vida (`EVENT_STATUS_TOKENS`)

`EventStatus` é **derivado** de `startDate`/`endDate` — nunca armazenado:

```ts
export const EVENT_STATUS_TOKENS: Record<EventStatus, { label: string; color: string; bg: string }> = {
  upcoming: { label: 'Próximo',   color: '#2563eb', bg: '#eff6ff' },
  active:   { label: 'Em curso',  color: '#10b981', bg: '#ecfdf5' },
  finished: { label: 'Encerrado', color: '#94a3b8', bg: '#f8fafc' },
}
```

---

## 10. Helpers de formatação (`src/lib/format.ts`)

```ts
// Moeda
fmtBRL(value: number): string            // R$ 1.250,00
fmtBRLcompact(value: number): string     // R$ 1,2k / R$ 1,5M

// Datas
fmtDate(iso: string): string             // '15/09/2026'
fmtDateLong(iso: string): string         // '15 de setembro de 2026'
fmtDateRange(start: string, end: string): string  // '11/09/2026 – 14/09/2026'

// Status de evento (derivado das datas)
computeEventStatus(startDate: string, endDate: string): EventStatus
// → 'upcoming' | 'active' | 'finished'

// Endereço de venue — aceita { city, state, street?, neighborhood? }
formatVenueAddress(venue, mode: 'short' | 'full'): string
// short → 'São Paulo · SP'
// full  → 'Av. Olavo Fontoura, 1209 — Santana, São Paulo · SP'
```

---

## 11. Design system

### 11.1 Tokens de superfície

```css
/* Light (default) */
:root {
  --bg:           #f6f7fb;
  --surface:      #ffffff;
  --surface-2:    #f1f3f9;
  --surface-3:    #e6e9f2;
  --border:       #e6e8f0;
  --border-strong:#d4d8e6;
  --fg:           #0d1020;
  --fg-muted:     #525873;
  --fg-subtle:    #8a90a6;
}

/* Dark */
:root.dark {
  --bg:           #0a0b14;
  --surface:      #12131e;
  --surface-2:    #181a27;
  --surface-3:    #21243a;
  --border:       #1f2235;
  --border-strong:#2c3050;
  --fg:           #ecedf3;
  --fg-muted:     #a1a6c0;
  --fg-subtle:    #6b7090;
}
```

### 11.2 Tokens de marca

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--brand-primary` | `#2563eb` | `#6366f1` | Ações primárias, seleção, foco |
| `--brand-accent` | `#f97316` | `#fb923c` | CTAs secundários, receita, reservado |
| `--brand-violet` | `#8b5cf6` | `#a78bfa` | Status "vendido", marcadores premium |

### 11.3 Tipografia

| Classe | Tamanho | Peso | Uso |
|---|---|---|---|
| `.text-display` | 44px | 800 | Números KPI grandes |
| `.text-h1` | 22px | 800 | Header da página |
| `.text-h2` | 15px | 800 | Título de card |
| `.text-h3` | 14px | 800 | Título de painel |
| `.text-body` | 13.5px | 600 | Texto base de UI |
| `.text-caption` | 11px | 700 | Labels uppercase com tracking |
| `.text-mono` | 12px | 700 | Códigos (`A-01`), valores monetários |

- **Família:** Inter (UI) + JetBrains Mono (códigos/IDs/valores)

### 11.4 Raios e sombras

```
sm: 8px   → chips, inputs pequenos
md: 12px  → botões, controls
lg: 16px  → cards padrão
xl: 22px  → cards KPI
hero: 28px → cards de destaque
```

---

## 12. Componentes de layout

### Shell

```
┌──────────────────────────────────────────────────────────┐
│ Sidebar (240px fixo)  │ Header (sticky 72px)             │
│                       ├──────────────────────────────────┤
│  Logo + versão        │                                  │
│  Nav: 5 telas         │  Conteúdo (max-width 1500px)     │
│                       │                                  │
│  Card "Atalho do dia" │                                  │
│  Avatar + ThemeToggle │                                  │
└──────────────────────────────────────────────────────────┘
```

### shadcn/ui instalados

`button`, `card`, `input`, `label`, `textarea`, `select`, `badge`, `separator`, `tooltip`, `dialog`, `alert-dialog`, `dropdown-menu`, `sheet`, `tabs`, `table`, `avatar`, `progress`, `skeleton`, `sonner`

---

## 13. Zustand stores

### canvasStore.ts

```ts
interface CanvasStore {
  selectedId:  string | null
  selectedIds: string[]
  zoom:        number
  snapEnabled: boolean
  setSelected:    (id: string | null) => void
  toggleSelected: (id: string) => void
  clearSelection: () => void
  setZoom:        (z: number) => void
  toggleSnap:     () => void
}
```

### uiStore.ts

```ts
interface UIStore {
  theme:            'light' | 'dark'
  sidebarCollapsed: boolean
  activeEventId:    string | null
  saveStatus:       'idle' | 'saving' | 'saved'
  setTheme:         (theme: 'light' | 'dark') => void
  toggleSidebar:    () => void
  setActiveEvent:   (id: string | null) => void
  setSaveStatus:    (status: 'idle' | 'saving' | 'saved') => void
}
// getInitialTheme() lê localStorage; padrão: 'light'
```

### historyStore.ts (stub — sprint futuro)

```ts
interface HistoryStore {
  past:   Allotment[][]
  future: Allotment[][]
  push:   (state: Allotment[]) => void
  undo:   () => void
  redo:   () => void
  clear:  () => void
}
// max 50 estados no passado
```

---

## 14. Tema (light ↔ dark)

**Bootstrap inline** (antes do React montar — evita flash):
```html
<script>
  (function(){
    try {
      var t = localStorage.getItem('theme');
      var theme = (t === 'dark' || t === 'light') ? t : 'light';
      if (theme === 'dark') document.documentElement.classList.add('dark');
    } catch(e) {}
  })();
</script>
```

**`useThemeTransition`** anima via View Transitions API com `clip-path circle()`. Fallback instantâneo em browsers sem suporte.

---

## 15. Atalhos de teclado

| Atalho | Ação |
|---|---|
| `G` + `D` | Navegar para Dashboard |
| `G` + `P` | Navegar para Pavilhão |
| `G` + `S` | Navegar para Stands |
| `G` + `C` | Navegar para Comercial |
| `G` + `F` | Navegar para Finanças |
| `Ctrl/⌘ + Z` | Desfazer (undo) |
| `Ctrl/⌘ + Shift + Z` / `Ctrl/⌘ + Y` | Refazer (redo) |
| `Ctrl/⌘ + A` | Selecionar todos (canvas) |
| `Shift + Click` | Adicionar/remover da seleção |
| `Esc` | Limpar seleção |
| `Delete` / `Backspace` | Excluir selecionados |

---

## 16. Convenções de código

- Um componente por arquivo, nomes PascalCase.
- Hooks em `src/hooks/` com prefixo `use`.
- Lógica pura (sem React) em `src/lib/`.
- Sem fetch direto em componentes — sempre via hooks TanStack Query.
- `useMutation` para todas as operações de escrita.
- `useEffect` deps: **nunca incluir** objetos que recriam-se a cada render (e.g., o retorno completo de `useMutation`). Use event handlers ou refs estáveis.
- `cn()` (clsx + tailwind-merge) para classes condicionais.
- Toasts de feedback via `sonner` (`toast.success`, `toast.error`).
- Invalidação de queries nas mutations: `queryClient.invalidateQueries({ queryKey: ... })`.
- `EventStatus` é **retornado** pelo backend como campo computado — nunca enviar no body de criação/atualização.
- Endereço de venue em campos planos diretamente no `Venue` (`city`, `state`, `street`, etc.); usar `formatVenueAddress(venue, mode)` para exibição.
- `EventType` sempre em **MAIÚSCULAS** (`'FEIRA' | 'CONGRESSO' | 'EXPO' | 'CORPORATE'`) — valor que a API aceita e retorna.
