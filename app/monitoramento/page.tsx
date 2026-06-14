import { createClient } from '@/lib/supabase/server'
import { MonitoramentoClient } from '@/components/monitoramento/MonitoramentoClient'

export default async function MonitoramentoPage() {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let temas: any[] = []
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('temas_monitorados')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      temas = data ?? []
    }
  }

  return <MonitoramentoClient initialTemas={temas} />
}
