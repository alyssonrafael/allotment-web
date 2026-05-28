import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '#/lib/utils'

interface PaginationProps {
  /** Página atual (base 0). */
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  /** Classes extras do wrapper (ex.: padding/margin específicos da tela). */
  className?: string
}

/**
 * Calcula a janela de páginas a exibir: sempre a primeira e a última, mais a
 * atual e suas vizinhas, com `'gap'` (…) entre saltos. Mantém o número de
 * botões constante (no máx. ~7) independentemente do total de páginas.
 */
function pageWindow(current: number, total: number): Array<number | 'gap'> {
  const wanted = new Set<number>([0, total - 1, current - 1, current, current + 1])
  const valid = [...wanted].filter((n) => n >= 0 && n < total).sort((a, b) => a - b)
  const out: Array<number | 'gap'> = []
  let prev: number | null = null
  for (const n of valid) {
    if (prev !== null && n - prev > 1) out.push('gap')
    out.push(n)
    prev = n
  }
  return out
}

const STEP =
  'flex size-7 shrink-0 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:pointer-events-none disabled:opacity-30'

/**
 * Paginação responsiva. No desktop mostra os números (janelados, com …); no
 * mobile mostra um indicador compacto "X / Y" entre as setas. Retorna `null`
 * quando há 0 ou 1 página.
 */
export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(0, page), totalPages - 1)
  if (totalPages <= 1) return null

  const items = pageWindow(safePage, totalPages)
  const start = safePage * pageSize + 1
  const end = Math.min((safePage + 1) * pageSize, totalItems)

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 border-t border-border',
        className,
      )}
    >
      <span className="whitespace-nowrap text-[11px] text-fg-subtle">
        {start}–{end} de {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(0, safePage - 1))}
          disabled={safePage === 0}
          className={STEP}
          aria-label="Página anterior"
        >
          <ChevronLeft size={13} />
        </button>

        {/* Desktop: números janelados */}
        <div className="hidden items-center gap-1 sm:flex">
          {items.map((it, idx) =>
            it === 'gap' ? (
              <span
                key={`gap-${idx}`}
                className="flex size-7 items-center justify-center text-[12px] text-fg-subtle"
              >
                …
              </span>
            ) : (
              <button
                key={it}
                onClick={() => onPageChange(it)}
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-md text-[12px] font-semibold transition-colors',
                  it === safePage
                    ? 'bg-brand-primary text-white'
                    : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
                )}
              >
                {it + 1}
              </button>
            ),
          )}
        </div>

        {/* Mobile: indicador compacto */}
        <span className="px-1.5 text-[12px] font-semibold tabular-nums text-fg-muted sm:hidden">
          {safePage + 1} / {totalPages}
        </span>

        <button
          onClick={() => onPageChange(Math.min(totalPages - 1, safePage + 1))}
          disabled={safePage === totalPages - 1}
          className={STEP}
          aria-label="Próxima página"
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  )
}
