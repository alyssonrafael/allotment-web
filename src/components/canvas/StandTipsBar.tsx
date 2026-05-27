import { useEffect, useState } from 'react'
import {
  HelpCircle,
  Keyboard,
  MousePointerClick,
  Move,
  Maximize2,
  Trash2,
  Undo2,
  Redo2,
  X,
  ZoomIn,
  ZoomOut,
  Sparkles,
  History,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { isMac } from '#/lib/platform'

interface ShortcutItem {
  keys: Array<string>
  label: string
  icon: LucideIcon
}

interface ShortcutGroup {
  label: string
  items: Array<ShortcutItem>
}

function buildShortcutGroups(mod: string, shift: string): Array<ShortcutGroup> {
  return [
    {
      label: 'Canvas',
      items: [
        { keys: ['Clique'], label: 'Selecionar stand', icon: MousePointerClick },
        { keys: ['Arrastar'], label: 'Mover stand', icon: Move },
        { keys: ['Alças'], label: 'Redimensionar', icon: Maximize2 },
        { keys: ['Esc'], label: 'Limpar seleção', icon: X },
      ],
    },
    {
      label: 'Edição',
      items: [
        { keys: [mod, 'Z'], label: 'Desfazer', icon: Undo2 },
        { keys: [mod, shift, 'Z'], label: 'Refazer', icon: Redo2 },
        { keys: ['Del'], label: 'Excluir stand', icon: Trash2 },
      ],
    },
    {
      label: 'Vista',
      items: [
        { keys: ['+'], label: 'Aumentar zoom', icon: ZoomIn },
        { keys: ['−'], label: 'Diminuir zoom', icon: ZoomOut },
      ],
    },
  ]
}

export function StandTipsBar() {
  const [open, setOpen] = useState(false)
  // Detect Mac no client (evita hydration mismatch — SSR usa Win por default)
  const [isMacClient, setIsMacClient] = useState(false)
  useEffect(() => {
    setIsMacClient(isMac)
  }, [])
  const mod = isMacClient ? '⌘' : 'Ctrl'
  const shift = isMacClient ? '⇧' : 'Shift'
  const groups = buildShortcutGroups(mod, shift)

  return (
    <>
      <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[11.5px] text-fg-muted">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-[11.5px] font-semibold text-fg-subtle shadow-sm transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <HelpCircle size={12} />
          Ajuda
        </button>

        <span className="text-fg-subtle/50">·</span>
        <Tip kbd="Clique">seleciona</Tip>
        <Tip kbd="Arrastar">move</Tip>
        <Tip kbd={`${mod}+Z`}>desfaz</Tip>
        <Tip kbd="Del">exclui</Tip>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle size={16} className="text-brand-primary" />
              Ajuda do editor
            </DialogTitle>
          </DialogHeader>

          <div className="mt-1 max-h-[70vh] space-y-6 overflow-y-auto pr-1">
            {/* Como funciona */}
            <section>
              <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-fg-subtle">
                <Sparkles size={12} className="text-brand-primary" />
                Como funciona
              </p>
              <div className="space-y-2 text-[12.5px] leading-relaxed text-fg-muted">
                <p>
                  Clique nos <strong className="text-fg">presets do topo</strong> (3×3m, 4×3m…) para
                  adicionar um stand no primeiro espaço livre do canvas.
                </p>
                <p>
                  <strong className="text-fg">Arraste</strong> para mover, use as{' '}
                  <strong className="text-fg">alças</strong> nos cantos para redimensionar.
                </p>
                <p>
                  O <strong className="text-fg">painel à direita</strong> aparece com o stand
                  selecionado. Você edita nome, dimensões, status e preço por ali.
                </p>
                <p>
                  O toggle <strong className="text-fg">Auto/Manual</strong> na barra controla o
                  autosave: em <em>Auto</em> ele salva 2s após você parar de mexer; em{' '}
                  <em>Manual</em>, o botão <strong className="text-fg">Salvar (N)</strong> envia
                  tudo de uma vez.
                </p>
                <p>
                  Stands que colidem com outros ou ficam fora do canvas ganham{' '}
                  <strong className="text-status-erro-text">borda vermelha</strong> em tempo real, e
                  o movimento é revertido ao soltar.
                </p>
              </div>
            </section>

            {/* Atalhos */}
            <section>
              <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-fg-subtle">
                <Keyboard size={12} className="text-brand-primary" />
                Atalhos
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {groups.map((group) => (
                  <div key={group.label}>
                    <p className="mb-2 text-[10.5px] font-bold uppercase tracking-wider text-fg-muted">
                      {group.label}
                    </p>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon
                        return (
                          <div
                            key={item.label}
                            className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-2"
                          >
                            <div className="flex min-w-0 items-center gap-2 text-[12px] text-fg-muted">
                              <Icon size={13} className="shrink-0 text-fg-subtle" />
                              <span className="truncate">{item.label}</span>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              {item.keys.map((k, i) => (
                                <span key={k} className="flex items-center gap-1">
                                  <Kbd>{k}</Kbd>
                                  {i < item.keys.length - 1 && (
                                    <span className="text-[10px] text-fg-subtle">+</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Histórico */}
            <section>
              <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-fg-subtle">
                <History size={12} className="text-brand-primary" />
                Histórico (undo/redo)
              </p>
              <div className="space-y-2 text-[12.5px] leading-relaxed text-fg-muted">
                <p>
                  Use <Kbd>{mod}</Kbd>+<Kbd>Z</Kbd> para desfazer e{' '}
                  <Kbd>{mod}</Kbd>+<Kbd>{shift}</Kbd>+<Kbd>Z</Kbd> para refazer movimentos,
                  redimensionamentos e edições do painel.
                </p>
                <div className="rounded-lg border border-status-reservado/40 bg-status-reservado-50 p-3 text-[12px] text-status-reservado-text">
                  <strong className="block font-bold">⚠ Inserir um novo stand zera o histórico.</strong>
                  <span>
                    Como o ID novo não tem como ser desfeito de forma confiável, a pilha é reiniciada
                    quando você adiciona um stand. Salve ou descarte as alterações antes de inserir
                    para preservar o histórico.
                  </span>
                </div>
                <p>
                  O histórico também é resetado ao <strong className="text-fg">trocar de evento</strong>.
                </p>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Tip({ kbd, children }: { kbd: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="kbd">{kbd}</span>
      <span>{children}</span>
    </span>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center rounded border border-border bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] font-bold text-fg">
      {children}
    </span>
  )
}
