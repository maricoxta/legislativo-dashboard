import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { DrawerProvider } from '@/components/detalhe/DrawerProvider'

export const metadata: Metadata = {
  title: 'Legislativo BR – Painel de Proposições',
  description: 'Acompanhe proposições legislativas da Câmara dos Deputados e do Senado Federal.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full flex antialiased">
        <Sidebar />
        <DrawerProvider>
          <div className="ml-64 flex-1 flex flex-col min-h-screen">
            <Topbar />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </DrawerProvider>
      </body>
    </html>
  )
}
