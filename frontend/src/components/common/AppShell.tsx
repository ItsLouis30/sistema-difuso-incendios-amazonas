import {
  BookOpenText,
  ChartNoAxesCombined,
  ChevronLeft,
  Leaf,
  LayoutDashboard,
  LogOut,
  Bell,
  Grid,
  Search
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAppContext } from '../../app/AppContext'

const navItems = [
  { to: '/', label: 'Evaluación', Icon: LayoutDashboard, end: true },
  { to: '/historial', label: 'Historial', Icon: ChartNoAxesCombined },
  { to: '/metodologia', label: 'Metodología', Icon: BookOpenText },
]

export function AppShell() {
  const { backendOnline } = useAppContext()
  
  return (
    <div className="flex h-screen bg-[#F4F6F8] font-sans text-gray-800 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 border-r border-gray-100 hidden md:flex">
        <div className="flex items-center justify-between px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 text-white p-2 rounded-full shadow-lg shadow-emerald-600/30">
              <Leaf size={24} fill="currentColor" />
            </div>
            <span className="font-bold text-lg tracking-tight text-gray-900">Sistema Difuso</span>
          </div>
          <button className="text-emerald-600 bg-emerald-50 p-1 rounded-md">
            <ChevronLeft size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-2">
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Plataforma
          </div>
          {navItems.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon size={20} strokeWidth={2.5} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 ${
            backendOnline === null ? 'bg-gray-100 text-gray-500' : 
            backendOnline ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${
              backendOnline === null ? 'bg-gray-400' : 
              backendOnline ? 'bg-green-500' : 'bg-red-500'
            }`} />
            {backendOnline === null ? 'Conectando...' : backendOnline ? 'API Conectada' : 'API Desconectada'}
          </div>
          <button className="flex items-center gap-4 px-4 py-3 text-gray-500 hover:text-gray-900 font-medium w-full rounded-xl hover:bg-gray-50 transition-colors">
            <LogOut size={20} strokeWidth={2.5} />
            <span>Salir</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-20 bg-[#F4F6F8] flex items-center justify-between px-8 z-0">
          <div className="relative w-96 hidden sm:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
            />
          </div>
          <div className="sm:hidden font-bold text-lg text-gray-900">Sistema Difuso</div>
          
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-600 shadow-sm relative hover:bg-gray-50 border border-gray-200">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 bg-white rounded-full p-1.5 shadow-sm pr-4 border border-gray-200">
              <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50">
                <Grid size={16} />
              </button>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                U
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-8 pt-2">
          <Outlet />
        </main>
      </div>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 pb-safe z-50">
        {navItems.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium ${
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
