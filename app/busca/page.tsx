import { BuscaForm } from '@/components/busca/BuscaForm'

interface Props {
  searchParams: Promise<Record<string, string>>
}

export default async function BuscaPage({ searchParams }: Props) {
  const sp = await searchParams
  return <BuscaForm initialParams={sp} />
}
