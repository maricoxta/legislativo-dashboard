import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  // Aceita a Project URL com ou sem "/rest/v1" no final.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key || url === 'your-project-url') return null
  return createClient(url, key)
}
