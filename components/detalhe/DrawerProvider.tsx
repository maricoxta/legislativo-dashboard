'use client'
import { createContext, useContext, useState, useCallback } from 'react'
import { Drawer } from '@/components/detalhe/Drawer'

interface DrawerState {
  id: string | number
  source: 'camara' | 'senado'
}

const DrawerCtx = createContext<{
  open: (id: string | number, source: 'camara' | 'senado') => void
}>({ open: () => {} })

export function useDrawer() { return useContext(DrawerCtx) }

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DrawerState | null>(null)
  const open = useCallback((id: string | number, source: 'camara' | 'senado') => setState({ id, source }), [])
  const close = useCallback(() => setState(null), [])

  return (
    <DrawerCtx.Provider value={{ open }}>
      {children}
      <Drawer state={state} onClose={close} />
    </DrawerCtx.Provider>
  )
}
