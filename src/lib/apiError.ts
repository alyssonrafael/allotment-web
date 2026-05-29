import { isAxiosError } from 'axios'

/**
 * Extrai uma mensagem legível de um erro de API. O backend responde no formato
 * `{ statusCode, message, detail: string | string[] }`. Cai para a mensagem do
 * Error ou para o fallback quando não houver corpo estruturado.
 */
export function getApiErrorMessage(
  err: unknown,
  fallback = 'Tente novamente.',
): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; detail?: string | string[] }
      | undefined
    if (data?.detail) {
      return Array.isArray(data.detail) ? data.detail.join(', ') : data.detail
    }
    if (data?.message) return data.message
  }
  return err instanceof Error ? err.message : fallback
}
