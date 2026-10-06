import {
  Activity,
  BookOpenText,
  ChartNoAxesCombined,
  FlameKindling,
  LayoutDashboard,
  MapPin,
  ShieldCheck,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAppContext } from '../../app/AppContext'

const navItems = [
  { to: '/', label: 'Evaluación', Icon: LayoutDashboard, end: true },
  { to: '/historial', label: 'Historial', Icon: ChartNoAxesCombined },
  { to: '/metodologia', label: 'Metodología', Icon: BookOpenText },
]

export function AppShell() {
  const { backendOnline, model } = useAppContext()
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><FlameKindling size={22} /></span>
          <span><strong>SelvaGuard</strong><small>Inteligencia preventiva</small></span>
        </div>

        <nav className="primary-nav" aria-label="Navegación principal">
          <span className="nav-eyebrow">Plataforma</span>
          {navItems.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <Icon size={18} /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <div className="location-card">
          <MapPin size={18} />
          <div><strong>Chachapoyas</strong><span>Amazonas · Perú</span></div>
        </div>
        <div className="model-card">
          <div className="model-card-head"><ShieldCheck size={17} /><span>Modelo verificado</span></div>
          <strong>Mamdani v{model?.version ?? '1.1.0'}</strong>
          <span>192 reglas · Centroide</span>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark"><FlameKindling size={19} /></span><strong>SelvaGuard</strong></div>
          <div className="context-location"><MapPin size={15} /><span>Chachapoyas, Amazonas</span></div>
          <div className={`api-status ${backendOnline === false ? 'offline' : ''}`}>
            <span className="status-dot" />
            {backendOnline === null ? 'Conectando…' : backendOnline ? 'API conectada' : 'API sin conexión'}
          </div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>

      <nav className="mobile-nav" aria-label="Navegación móvil">
        {navItems.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => isActive ? 'active' : ''}>
            <Icon size={19} /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="ambient-orb orb-one" />
      <div className="ambient-orb orb-two" />
      <Activity className="ambient-glyph" aria-hidden="true" />
    </div>
  )
}
