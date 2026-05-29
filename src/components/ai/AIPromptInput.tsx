import { useEffect, useRef } from 'react'
import { Loader2, Send } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Textarea } from '#/components/ui/textarea'

const MAX_LEN = 1000

interface AIPromptInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isLoading: boolean
  placeholder?: string
  /** Mínimo de caracteres. 10 na 1ª mensagem; 1 nos follow-ups do chat. */
  minLength?: number
  /** Incrementar para forçar foco no textarea (ex: após cada resposta da IA). */
  focusTrigger?: number
}

/**
 * Composer do chat de IA. A 1ª mensagem exige `minLength` (10) chars; os
 * follow-ups são curtos ("Expo", "SP") e exigem só texto não-vazio (1).
 */
export function AIPromptInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder,
  minLength = 1,
  focusTrigger,
}: AIPromptInputProps) {
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (focusTrigger) {
      wrapRef.current?.querySelector('textarea')?.focus()
    }
  }, [focusTrigger])

  const len = value.trim().length
  const tooShort = len < minLength
  const canSubmit = !isLoading && !tooShort

  return (
    <div className="flex flex-col gap-1">
      <div ref={wrapRef} className="flex items-end gap-2">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_LEN))}
          placeholder={placeholder}
          disabled={isLoading}
          rows={2}
          className="resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && canSubmit) {
              e.preventDefault()
              onSubmit()
            }
          }}
        />
        <Button
          onClick={onSubmit}
          disabled={!canSubmit}
          size="icon"
          className="shrink-0"
          aria-label="Enviar"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </Button>
      </div>
      {minLength > 1 && tooShort && len > 0 && (
        <span className="text-[11px] text-fg-subtle">
          Descreva um pouco mais (mínimo {minLength} caracteres).
        </span>
      )}
    </div>
  )
}
