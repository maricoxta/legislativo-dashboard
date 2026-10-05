import { redirect } from 'next/navigation'

// A página "Entenda o processo" virou a página inicial.
export default function EntendaPage() {
  redirect('/')
}
