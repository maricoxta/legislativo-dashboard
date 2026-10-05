import { createClient } from '@supabase/supabase-js'

// SUPABASE_URL (mesmo nome do segredo do GitHub) é o nome preferido: só o
// servidor usa este endereço, então ele não precisa do prefixo NEXT_PUBLIC_.
export function supabaseUrl() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
}

export function createAdminClient() {
  // Aceita a Project URL com ou sem "/rest/v1" no final.
  const url = supabaseUrl()?.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key || url === 'your-project-url') return null
  return createClient(url, key)
}
