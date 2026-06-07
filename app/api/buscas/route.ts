import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data, error } = await supabase
    .from('historico_buscas')
    .select('*')
    .eq('user_id', user.id)
    .order('searched_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false })

  const body = await req.json()
  const { termo, filtros, resultado_count } = body

  await supabase.from('historico_buscas').insert({
    user_id: user.id,
    termo,
    filtros,
    resultado_count,
  })

  return NextResponse.json({ ok: true })
}
