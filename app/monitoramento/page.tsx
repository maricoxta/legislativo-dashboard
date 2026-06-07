import { createClient } from '@/lib/supabase/server'
import { MonitoramentoClient } from '@/components/monitoramento/MonitoramentoClient'

export default async function MonitoramentoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: temas } = user
    ? await supabase.from('temas_monitorados').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    : { data: [] }

  return <MonitoramentoClient initialTemas={temas ?? []} />
}
