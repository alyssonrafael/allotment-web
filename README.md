# Allotment Manager — Frontend

Sistema web para gerenciamento visual de stands em pavilhões de eventos. Permite posicionar, redimensionar e editar stands via canvas interativo (drag & drop), com telas complementares de gestão comercial, financeira e tabular.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework UI | React 18 + TypeScript |
| Meta-framework | TanStack Start (SSR) |
| Roteamento | TanStack Router (file-based) |
| Server state | TanStack Query |
| Estado global | Zustand |
| Canvas | react-konva / Konva.js |
| UI components | shadcn/ui (new-york, zinc) |
| Estilo | Tailwind CSS v4 + tokens CSS |
| HTTP client | axios |
| Forms | react-hook-form + zod |
| Ícones | lucide-react |
| Toasts | sonner |
| Atalhos | react-hotkeys-hook |
| Gráficos | recharts |
| DnD (kanban) | @dnd-kit/core |
| Backend | NestJS — `http://localhost:3333/api/v1` |

---

## Pré-requisitos

- Node.js 20+
- Backend rodando em `localhost:3333` (NestJS separado)
- Arquivo `.env` com as variáveis de ambiente (veja abaixo)

---

## Variáveis de ambiente

Crie um arquivo `.env` na raiz com:

```env
VITE_API_URL=http://localhost:3333
VITE_API_PREFIX=/api/v1
```

---

## Instalação e execução

```bash
npm install
npm run dev        # dev server em http://localhost:3000
```

### Outros comandos

```bash
npm run build      # build de produção
npm run test       # testes com Vitest (single pass)
npm run lint       # ESLint
npm run format     # Prettier --write + ESLint --fix
npm run check      # Prettier --check

# Adicionar componente shadcn/ui
npx shadcn@latest add <componente>
```

---

## Estrutura de pastas

```
src/
  api/             ← cliente axios + funções por recurso (venues, events, allotments)
  components/
    ui/            ← componentes shadcn/ui (não editar manualmente)
    canvas/        ← PavilionStage, AllotmentNode, MiniMap, Grid, StandTipsBar
    allotments/    ← AllotmentPanel, AllotmentForm
    events/        ← EventCard, CreateEventDialog
    layout/        ← AppShell, Sidebar, Header, EventSelector
    shared/        ← StatusBadge, ThemeToggle, KPI
  hooks/           ← useVenues, useEvents, useAllotments, useAutosave,
                     useCssTokens, usePavilionHotkeys, useThemeTransition,
                     useGlobalHotkeys
  stores/          ← canvasStore.ts, historyStore.ts, uiStore.ts
  types/           ← index.ts (todos os tipos TypeScript do domínio)
  lib/             ← utils.ts (cn), collision.ts, constants.ts, format.ts,
                     allotmentInsert.ts, platform.ts
  routes/          ← rotas file-based (TanStack Router)
  styles.css       ← tokens CSS globais + utilities Tailwind
```

---

## Hierarquia de domínio

```
Venue (Pavilhão físico)
  └── Event (Evento / feira)
        └── Allotment (Stand posicionado no canvas)
```

---

## Telas

| Rota | Tela |
|---|---|
| `/events` | Hub de pavilhões — lista venues com eventos agrupados |
| `/events/$eventId/dashboard` | KPIs, donut de status, heatmap, atividade recente |
| `/events/$eventId/pavilhao` | Editor visual interativo (canvas drag/resize) |
| `/events/$eventId/stands` | Tabela com filtros, edição inline e exclusão |
| `/events/$eventId/comercial` | Kanban por status de stand |
| `/events/$eventId/financas` | Receita por status, distribuição de área, tabela de contribuição |

### Editor de pavilhão (`/pavilhao`)

- **Canvas Konva** com grid 1m, snap ao soltar, colisão visual em tempo real
- **Drag** com auto-pan ao aproximar das bordas
- **Resize** via Transformer (alças nos cantos); labels ocultados durante o resize
- **Painel lateral** com edição de nome, dimensões, status e preço (live preview)
- **Autosave** configurável (2s após parar de mexer) ou manual (`N`)
- **Undo/Redo** (`Ctrl/⌘+Z` / `Ctrl/⌘+Shift+Z`); histórico é zerado ao inserir stand novo
- **Mini-mapa** SVG interativo para navegação e pan
- **Presets de inserção** (3×3m, 4×3m…) com detecção de espaço livre
- Aceita `?standId=` para pré-selecionar um stand ao abrir

---

## Atalhos de teclado

| Atalho | Ação |
|---|---|
| `G` + `D/P/S/C/F` | Navegar entre telas |
| `Esc` | Limpar seleção |
| `Ctrl/⌘ + Z` | Desfazer |
| `Ctrl/⌘ + Shift + Z` | Refazer |
| `Delete` / `Backspace` | Excluir stand (com confirmação) |
| `+` / `-` | Zoom in / out no canvas |
| `N` | Salvar agora (flush manual) |

---

## Documentação técnica

- [CLAUDE.md](CLAUDE.md) — guia para o Claude Code: convenções, regras do canvas, API
- [CONTEXT.md](CONTEXT.md) — referência técnica completa: tipos, endpoints, design system, regras de negócio
