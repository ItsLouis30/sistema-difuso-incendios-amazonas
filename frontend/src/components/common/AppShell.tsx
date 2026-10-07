import {
  BookOpenText,
  ChartNoAxesCombined,
  ChevronLeft,
  Globe,
  LayoutDashboard,
  LogOut,
  CalendarDays,
  SlidersHorizontal
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAppContext } from '../../app/AppContext'

const navItems = [
  { to: '/manual', label: 'Evaluación Manual', Icon: SlidersHorizontal },
  { to: '/historico', label: 'Evaluación Histórica', Icon: CalendarDays },
  { to: '/historial', label: 'Tendencias', Icon: ChartNoAxesCombined },
  { to: '/metodologia', label: 'Metodología', Icon: BookOpenText },
]

export function AppShell() {
  const { backendOnline } = useAppContext()
  
  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800 overflow-hidden md:p-4 lg:p-6 gap-6">
      {/* Sidebar - Capsule Style */}
      <aside className="w-72 bg-white rounded-[2rem] flex flex-col shadow-xl shadow-gray-200/50 z-10 hidden md:flex h-full overflow-hidden border border-gray-100/50 shrink-0">
        <div className="flex items-center justify-between px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 text-white p-2.5 rounded-2xl shadow-lg shadow-emerald-600/30">
              <Globe size={24} />
            </div>
            <span className="font-black text-lg tracking-tight text-gray-900 leading-tight">Sistema Difuso<br/><span className="text-sm font-bold text-emerald-600">Grupo 8</span></span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
            Plataforma
          </div>
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 scale-[1.02]'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon size={20} strokeWidth={2.5} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50 mt-auto">
          <div className={`px-4 py-3.5 rounded-2xl text-sm font-bold flex items-center gap-3 ${
            backendOnline === null ? 'bg-white text-gray-500 border border-gray-100' : 
            backendOnline ? 'bg-white text-green-700 border border-green-100 shadow-sm' : 'bg-white text-red-700 border border-red-100 shadow-sm'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${
              backendOnline === null ? 'bg-gray-400' : 
              backendOnline ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50'
            }`} />
            {backendOnline === null ? 'Conectando...' : backendOnline ? 'API Conectada' : 'API Desconectada'}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:rounded-[2rem] bg-gray-100 md:bg-transparent">
        {/* Mobile Topbar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-center md:hidden z-10 shrink-0 shadow-sm">
          <div className="font-black text-lg text-gray-900 flex items-center gap-2">
            <Globe size={18} className="text-emerald-600" />
            Sistema Difuso G8
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-0 md:pr-2 custom-scrollbar">
          <Outlet />
        </main>
      </div>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 pb-safe z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-bold transition-colors ${
                isActive ? 'text-emerald-600' : 'text-gray-500'
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
