import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/common/AppShell'
import { ManualPage } from '../pages/ManualPage'
import { HistoricalPage } from '../pages/HistoricalPage'
import { HistoryPage } from '../pages/HistoryPage'
import { MethodologyPage } from '../pages/MethodologyPage'
import { AppProvider } from './AppContext'

export function App() {
  return (
    <BrowserRouter>
      <AppProvider>
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
      </AppProvider>
    </BrowserRouter>
  )
}
