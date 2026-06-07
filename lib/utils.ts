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
