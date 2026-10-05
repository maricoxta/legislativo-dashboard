'use client'
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { IndicadoresCasa } from '@/lib/server/indicadores'
import { CASA_HEX, STATUS_GRAFICO } from './paleta'

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const fmt = (n: number) => n.toLocaleString('pt-BR')
const EIXO = { fontSize: 11, fill: '#64748b' }
// Texto da legenda em cinza; a bolinha ao lado é que leva a cor da Casa.
const legenda = (v: string) => <span style={{ color: '#475569' }}>{v}</span>

interface Props {
  ano: number
  mesesVisiveis: number // no ano corrente, só até o mês atual
  kpis: { camara: IndicadoresCasa; senado: IndicadoresCasa }
  porMes: { camara: number[] | null; senado: number[] | null }
}

function Cartao({ titulo, sub, children }: { titulo: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
      <h3 className="text-sm font-semibold text-slate-700">{titulo}</h3>
      <p className="text-xs text-slate-400 mb-4">{sub}</p>
      {children}
    </div>
  )
}

const SemDados = () => <p className="h-[240px] flex items-center justify-center text-sm text-slate-400">Sem dados para este ano.</p>

export function DashboardCharts({ ano, mesesVisiveis, kpis, porMes }: Props) {
  // Situação: % dos PLs do ano em cada situação, lado a lado por Casa.
  // As situações não somam 100% (um PL aprovado no Senado pode seguir
  // tramitando na Câmara), por isso não é um gráfico empilhado.
  const casas = (['camara', 'senado'] as const).filter(c => kpis[c].total)
  const situacao = STATUS_GRAFICO.map(s => {
    const linha: Record<string, string | number> = { situacao: s.nome }
    for (const c of casas) {
      const k = kpis[c]
      linha[c] = Math.round(((k[s.id] ?? 0) / k.total!) * 1000) / 10
      linha[`${c}_n`] = k[s.id] ?? 0
    }
    return linha
  })

  const temMes = porMes.camara || porMes.senado
  const mensal = MESES.slice(0, mesesVisiveis).map((mes, i) => ({
    mes,
    camara: porMes.camara?.[i] ?? null,
    senado: porMes.senado?.[i] ?? null,
  }))

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <Cartao titulo={`Situação dos PLs de ${ano}`} sub="Porcentagem dos PLs apresentados no ano em cada situação">
        {casas.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={situacao} layout="vertical" margin={{ left: 0, right: 40 }} barGap={2} barCategoryGap="22%">
              <CartesianGrid horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" domain={[0, 100]} unit="%" tick={EIXO} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="situacao" tick={EIXO} width={150} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: '#f1f5f9' }}
                formatter={(v, nome, item) => {
                  const c = nome === 'Câmara' ? 'camara' : 'senado'
                  const n = Number((item.payload as Record<string, number>)[`${c}_n`])
                  return [`${fmt(n)} PLs (${String(v).replace('.', ',')}%)`, nome]
                }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} formatter={legenda} />
              {casas.map(c => (
                <Bar key={c} dataKey={c} name={c === 'camara' ? 'Câmara' : 'Senado'} fill={CASA_HEX[c]} radius={[0, 4, 4, 0]}>
                  <LabelList dataKey={c} position="right" fill="#475569" fontSize={11}
                    formatter={(v) => `${String(v).replace('.', ',')}%`} />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : <SemDados />}
      </Cartao>

      <Cartao titulo={`PLs apresentados por mês em ${ano}`} sub="Quantos projetos de lei cada Casa recebeu em cada mês">
        {temMes ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={mensal} barGap={2} margin={{ left: -8, right: 8 }}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="mes" tick={EIXO} axisLine={false} tickLine={false} />
              <YAxis tick={EIXO} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(v, nome) => [`${fmt(Number(v))} PLs`, nome]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} formatter={legenda} />
              {porMes.camara && <Bar dataKey="camara" name="Câmara" fill={CASA_HEX.camara} radius={[4, 4, 0, 0]} />}
              {porMes.senado && <Bar dataKey="senado" name="Senado" fill={CASA_HEX.senado} radius={[4, 4, 0, 0]} />}
            </BarChart>
          </ResponsiveContainer>
        ) : <SemDados />}
      </Cartao>
    </div>
  )
}
