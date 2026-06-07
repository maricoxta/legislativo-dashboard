import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { DrawerProvider } from '@/components/detalhe/DrawerProvider'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Legislativo BR – Painel de Proposições',
  description: 'Acompanhe proposições legislativas da Câmara dos Deputados e do Senado Federal.',
}

async function getUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl === 'your-project-url') return null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch { return null }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()

  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full flex antialiased">
        <Sidebar />
        <DrawerProvider>
          <div className="ml-64 flex-1 flex flex-col min-h-screen">
            <Topbar userEmail={user?.email} />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </DrawerProvider>
      </body>
    </html>
  )
}
