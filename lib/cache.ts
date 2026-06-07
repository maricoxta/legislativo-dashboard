import { createAdminClient } from '@/lib/supabase/admin'

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('api_cache')
      .select('data')
      .eq('cache_key', key)
      .gt('expires_at', new Date().toISOString())
      .single()
    return (data?.data as T) ?? null
  } catch {
    return null
  }
}

export async function setCache(key: string, data: unknown, ttlMinutes: number): Promise<void> {
  try {
    const supabase = createAdminClient()
    const expires = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString()
    await supabase.from('api_cache').upsert({ cache_key: key, data, expires_at: expires })
  } catch {}
}
