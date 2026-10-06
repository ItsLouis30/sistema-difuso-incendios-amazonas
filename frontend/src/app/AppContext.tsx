import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../services/api/client'
import type { HistoryRange, ModelResponse } from '../types/api'

interface AppContextValue {
  model: ModelResponse | null
  historyRange: HistoryRange | null
  backendOnline: boolean | null
  bootError: string | null
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [model, setModel] = useState<ModelResponse | null>(null)
  const [historyRange, setHistoryRange] = useState<HistoryRange | null>(null)
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)
  const [bootError, setBootError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([api.health(), api.model(), api.historyRange()])
      .then(([, modelResponse, rangeResponse]) => {
        if (!active) return
        setModel(modelResponse)
        setHistoryRange(rangeResponse)
        setBackendOnline(true)
      })
      .catch((error: Error) => {
        if (!active) return
        setBackendOnline(false)
        setBootError(error.message)
      })
    return () => {
      active = false
    }
  }, [])

  const value = useMemo(
    () => ({ model, historyRange, backendOnline, bootError }),
    [model, historyRange, backendOnline, bootError],
  )
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppContext debe usarse dentro de AppProvider')
  return context
}
