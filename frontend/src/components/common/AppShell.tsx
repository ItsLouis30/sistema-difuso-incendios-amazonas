import { BookOpenText, CalendarDays, ChartNoAxesCombined, Flame, SlidersHorizontal } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAppContext } from '../../app/AppContext'

const navItems = [
  { to: '/manual', label: 'Manual', Icon: SlidersHorizontal },
  { to: '/historico', label: 'Histórico', Icon: CalendarDays },
  { to: '/historial', label: 'Tendencias', Icon: ChartNoAxesCombined },
  { to: '/metodologia', label: 'Metodología', Icon: BookOpenText },
]

export function AppShell() {
  const { backendOnline, model } = useAppContext()
  const status =
    backendOnline === null
      ? { text: 'Conectando…', dot: 'bg-[#c4c4c4]' }
      : backendOnline
        ? { text: 'API conectada', dot: 'bg-[#1f8a5b]' }
        : { text: 'API desconectada', dot: 'bg-ember-500' }

  return (
    <div className="min-h-screen overflow-x-hidden p-0 sm:p-4 lg:p-8">
      <div className="mx-auto w-full min-w-0 max-w-[1600px] overflow-hidden bg-shell sm:rounded-[40px]">
        <header className="flex min-w-0 flex-wrap items-center gap-4 bg-band px-5 pt-6 md:px-8">
          <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white">
              <Flame size={22} strokeWidth={2.2} />
            </span>
            <span className="min-w-0 leading-tight">
              <strong className="block font-display text-lg font-semibold">Sistema Difuso</strong>
              <span className="text-sm text-muted">Incendios · Chachapoyas, Amazonas</span>
            </span>
          </div>

          <nav
            aria-label="Secciones"
            className="no-scrollbar order-3 flex w-full gap-2 overflow-x-auto md:order-none md:ml-auto md:w-auto"
          >
            {navItems.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 min-h-11 rounded-full px-[18px] text-sm font-medium transition-colors ${
                    isActive ? 'bg-ink text-white' : 'border border-line bg-white text-ink hover:bg-[#f0f0f0]'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex w-full items-center gap-3 sm:ml-auto sm:w-auto md:ml-4">
            <span className="flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 text-xs font-medium">
              <span className={`h-2 w-2 rounded-full ${status.dot}`} />
              {status.text}
            </span>
            <span className="hidden text-xs leading-tight text-muted xl:block">
              <strong className="block text-sm font-medium text-ink">Mamdani v{model?.version ?? '1.1.0'}</strong>
              {model?.total_reglas ?? 192} reglas
            </span>
          </div>
        </header>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
