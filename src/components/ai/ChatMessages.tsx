import { useEffect, useRef } from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '#/lib/utils'
import type { AIMessage } from '#/types'

interface ChatMessagesProps {
  messages: Array<AIMessage>
  loading: boolean
  emptyHint: string
  /** Sugestões de prompt inicial — exibidas no estado vazio. */
  suggestions?: Array<string>
  onPickSuggestion?: (text: string) => void
}

export function ChatMessages({
  messages,
  loading,
  emptyHint,
  suggestions = [],
  onPickSuggestion,
}: ChatMessagesProps) {
  const endRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll para a última mensagem.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, loading])

  const isEmpty = messages.length === 0 && !loading

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
      {isEmpty ? (
        <div className="m-auto flex max-w-sm flex-col items-center gap-4 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
            <Sparkles size={20} />
          </span>
          <p className="text-[13px] text-fg-muted">{emptyHint}</p>
          {suggestions.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle">
                Sugestões
              </span>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onPickSuggestion?.(s)}
                  className="rounded-xl border border-border bg-card px-3 py-2 text-left text-[12.5px] text-fg-muted shadow-sm transition-colors hover:border-brand-primary hover:text-fg"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        messages.map((m, i) => <Bubble key={i} role={m.role} content={m.content} />)
      )}
      {loading && <TypingBubble />}
      <div ref={endRef} />
    </div>
  )
}

function Bubble({ role, content }: { role: AIMessage['role']; content: string }) {
  const isUser = role === 'user'
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[13px] leading-snug',
          isUser
            ? 'rounded-br-sm bg-brand-primary text-primary-foreground'
            : 'rounded-bl-sm bg-card text-fg shadow-sm',
        )}
      >
        {content}
      </div>
    </div>
  )
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-card px-3 py-2.5 shadow-sm">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-bounce rounded-full bg-fg-subtle"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}
