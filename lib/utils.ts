export function formatDate(str?: string | null): string {
  if (!str) return '—'
  try {
    return new Date(str).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return str
  }
}

export function formatDatetime(str?: string | null): string {
  if (!str) return '—'
  try {
    return new Date(str).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return str
  }
}

export function truncate(text?: string | null, len = 160): string {
  if (!text) return ''
  return text.length > len ? text.slice(0, len).trimEnd() + '…' : text
}

/**
 * Retorna a URL base correta para fetch interno no servidor:
 * - Na Vercel: usa VERCEL_URL (injetado automaticamente, sem https://)
 * - Localmente: usa NEXT_PUBLIC_APP_URL ou fallback para localhost:3000
 */
export function getBaseUrl(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}
