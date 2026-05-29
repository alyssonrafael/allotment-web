import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '#/lib/apiError'
import type { AIMessage } from '#/types'

type NeedsInfoLike = { status: 'needs_info'; assistantMessage: string }
type CompleteLike = { status: 'complete' }

type Phase = 'chatting' | 'loading' | 'complete'

interface UseAIChatResult<TComplete> {
  messages: AIMessage[]
  phase: Phase
  complete: TComplete | null
  send: (text: string) => void
  /** Volta ao chat mantendo todo o histórico (para ajustar o resultado). */
  resume: () => void
  /** Limpa tudo (usado ao fechar o painel). */
  reset: () => void
}

/**
 * Orquestra uma conversa multi-turno com um endpoint de IA. Mantém o histórico
 * (`messages`), cresce 2 entradas por turno (user + assistant) e expõe `send`.
 *
 * - `needs_info` → adiciona a mensagem da IA como bolha e continua em `chatting`.
 * - `complete`   → guarda o resultado em `complete`, adiciona uma bolha-resumo
 *   (via `summarize`, para o histórico ficar coerente) e muda para `complete`.
 *
 * O `call` recebe a nova mensagem e o histórico **anterior** (sem a nova) —
 * exatamente o que o contrato espera (`prompt` separado de `history`).
 */
export function useAIChat<TComplete extends CompleteLike>(
  call: (prompt: string, history: AIMessage[]) => Promise<TComplete | NeedsInfoLike>,
  summarize?: (complete: TComplete) => string,
): UseAIChatResult<TComplete> {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [phase, setPhase] = useState<Phase>('chatting')
  const [complete, setComplete] = useState<TComplete | null>(null)

  const send = useCallback(
    async (text: string) => {
      const prompt = text.trim()
      if (!prompt) return
      const history = messages
      setMessages((m) => [...m, { role: 'user', content: prompt }])
      setPhase('loading')
      try {
        const res = await call(prompt, history)
        if (res.status === 'needs_info') {
          setMessages((m) => [...m, { role: 'assistant', content: res.assistantMessage }])
          setPhase('chatting')
        } else {
          setComplete(res)
          if (summarize) {
            const content = summarize(res)
            setMessages((m) => [...m, { role: 'assistant', content }])
          }
          setPhase('complete')
        }
      } catch (err) {
        toast.error('Não foi possível interpretar o pedido', {
          description: getApiErrorMessage(err),
        })
        setPhase('chatting')
      }
    },
    [messages, call, summarize],
  )

  // Volta ao chat preservando o histórico — o próximo turno continua o contexto.
  const resume = useCallback(() => {
    setPhase('chatting')
  }, [])

  const reset = useCallback(() => {
    setMessages([])
    setPhase('chatting')
    setComplete(null)
  }, [])

  return { messages, phase, complete, send, resume, reset }
}
