import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/common/AppShell'
import { AppProvider } from './AppContext'

const ManualPage = lazy(() => import('../pages/ManualPage').then((module) => ({ default: module.ManualPage })))
const HistoricalPage = lazy(() => import('../pages/HistoricalPage').then((module) => ({ default: module.HistoricalPage })))
const HistoryPage = lazy(() => import('../pages/HistoryPage').then((module) => ({ default: module.HistoryPage })))
const MethodologyPage = lazy(() => import('../pages/MethodologyPage').then((module) => ({ default: module.MethodologyPage })))

function PageFallback() {
  return (
    <div className="flex min-h-72 items-center justify-center" role="status">
      <span className="rounded-full bg-white px-4 py-2 text-sm text-muted">Cargando módulo…</span>
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/manual" replace />} />
              <Route path="manual" element={<ManualPage />} />
              <Route path="historico" element={<HistoricalPage />} />
              <Route path="historial" element={<HistoryPage />} />
              <Route path="metodologia" element={<MethodologyPage />} />
              <Route path="*" element={<Navigate to="/manual" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </AppProvider>
    </BrowserRouter>
  )
}
