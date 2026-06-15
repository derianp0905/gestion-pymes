import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import {
  LayoutDashboard, Users, FileText, Wallet, Package,
  CalendarClock, Building2, UserCog, Sparkles, GitBranch,
  Settings, ShieldCheck, LogOut, ChevronLeft, CircleDollarSign,
  Search, Bell, Sun, Moon, Zap, Lock,
} from 'lucide-react'

const CORE = ['clientes', 'facturacion', 'caja']
const ESP  = ['inventario', 'agenda']
const PREM = ['empleados', 'reportes_ia', 'multi_sucursal']

const reqPlanFor = (key) =>
  CORE.includes(key) ? 'Basic' : ESP.includes(key) ? 'Pro' : 'Business'

const CATALOG = [
  { label: null, items: [{ to: '/dashboard', key: 'resumen', label: 'Resumen', icon: LayoutDashboard, free: true }] },
  { label: 'Core', items: [
    { to: '/clientes',    key: 'clientes',    label: 'Clientes',    icon: Users },
    { to: '/facturacion', key: 'facturacion', label: 'Facturación', icon: FileText },
    { to: '/caja',        key: 'caja',        label: 'Caja',        icon: Wallet },
  ]},
  { label: 'Especializados', items: [
    { to: '/inventario', key: 'inventario', label: 'Inventario', icon: Package },
    { to: '/agenda',     key: 'agenda',     label: 'Agenda',     icon: CalendarClock },
  ]},
  { label: 'Premium', items: [
    { to: '/empleados',   key: 'empleados',       label: 'Empleados',      icon: UserCog },
    { to: '/reportes',    key: 'reportes_ia',     label: 'Reportes',       icon: Sparkles },
  ]},
  { label: null, items: [{ to: '/perfil-empresa', key: 'config', label: 'Configuración', icon: Settings, free: true }] },
]

function NavItem({ item, hasModule, collapsed }) {
  const location = useLocation()
  const active = location.pathname === item.to || (item.to === '/dashboard' && location.pathname === '/')
  const needsPlan = !item.free && item.key && !hasModule(item.key)
  const badge = needsPlan ? reqPlanFor(item.key) : null

  return (
    <Link
      to={item.to}
      className={`nav-item ${active ? 'active' : ''} ${needsPlan ? 'locked' : ''}`}
      title={collapsed ? item.label : undefined}
    >
      <item.icon size={18} style={{ flexShrink: 0 }} />
      <span>{item.label}</span>
      {badge && !collapsed && (
        <span className={`badge-plan ${badge.toLowerCase()}`}>
          <Lock size={9} />{badge}
        </span>
      )}
    </Link>
  )
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { subscription, hasModule } = useSubscription()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [light, setLight] = useState(() => localStorage.getItem('theme') === 'light')

  const handleLogout = () => { logout(); navigate('/login') }

  const planLabel = subscription?.plan ?? '—'
  const trialEnds = subscription?.trial_ends_at
    ? new Date(subscription.trial_ends_at).toLocaleDateString('es-DO', { day: 'numeric', month: 'short' })
    : null

  const pageTitle = (() => {
    const p = location.pathname
    if (p === '/dashboard' || p === '/') return 'Resumen general'
    if (p.startsWith('/clientes')) return 'Clientes'
    if (p.startsWith('/facturacion')) return 'Facturación'
    if (p.startsWith('/caja')) return 'Caja'
    if (p.startsWith('/inventario')) return 'Inventario'
    if (p.startsWith('/agenda')) return 'Agenda'
    if (p.startsWith('/empleados')) return 'Empleados'
    if (p.startsWith('/reportes')) return 'Reportes'
    if (p.startsWith('/sucursales')) return 'Multi-sucursal'
    if (p.startsWith('/perfil-empresa')) return 'Configuración'
    if (p.startsWith('/superadmin')) return 'Super Admin'
    return ''
  })()

  const today = new Date().toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const initials = user?.role === 'superadmin' ? 'SA' : (user?.nombre?.[0] ?? 'A').toUpperCase()

  return (
    <div className={`app ${collapsed ? 'is-collapsed' : ''} ${light ? 'light' : ''}`}>
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="brand">
          <div className="logo"><CircleDollarSign size={20} /></div>
          <div className="brand-txt">
            <b>Gestión<span>OS</span></b>
            <span className="plan-sub">{planLabel}</span>
          </div>
          <button className="collapse-btn" onClick={() => setCollapsed(c => !c)} aria-label="Contraer menú">
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav>
          {CATALOG.map((group, gi) => (
            <div key={gi}>
              {group.label && <span className="nav-label">{group.label}</span>}
              {group.items.map(item => (
                <NavItem key={item.key} item={item} hasModule={hasModule} collapsed={collapsed} />
              ))}
            </div>
          ))}

          {user?.role === 'superadmin' && (
            <>
              <span className="nav-label">Administración</span>
              <Link
                to="/superadmin"
                className={`nav-item ${location.pathname.startsWith('/superadmin') ? 'active' : ''}`}
                title={collapsed ? 'Super Admin' : undefined}
              >
                <ShieldCheck size={18} style={{ flexShrink: 0, color: '#fb923c' }} />
                <span>Super Admin</span>
              </Link>
            </>
          )}
        </nav>

        {/* Trial notice */}
        {!collapsed && subscription?.status === 'trial' && (
          <div className="sub-status">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--amber)', fontWeight: 600, marginBottom: 3 }}>
              <Zap size={12} /> Trial activo
            </div>
            {trialEnds && <span className="muted sm">Vence el {trialEnds}</span>}
          </div>
        )}

        {/* User */}
        <div className="user-section" style={{ marginTop: subscription?.status === 'trial' ? 10 : 'auto' }}>
          <div className="avatar">{initials}</div>
          <div className="grow">
            <b>{user?.role === 'superadmin' ? 'Super Admin' : 'Administrador'}</b>
            <span className="muted sm" style={{ textTransform: 'capitalize' }}>{user?.role}</span>
          </div>
          <button onClick={handleLogout} className="logout-icon" title="Cerrar sesión"
            style={{ color: 'var(--text-3)', padding: 4, borderRadius: 8, transition: '.14s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--coral)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main">
        {/* Topbar */}
        <header className="topbar">
          <div>
            <span className="muted sm" style={{ textTransform: 'capitalize' }}>{today}</span>
            <h1>{pageTitle}</h1>
          </div>
          <div className="top-actions">
            <div className="searchbox">
              <Search size={16} />
              <input placeholder="Buscar factura, cliente…" readOnly onClick={() => navigate('/clientes')} style={{ cursor: 'pointer' }} />
            </div>
            <span className="plan-chip">{planLabel}</span>
            <button className="icon-btn" aria-label="Cambiar tema" onClick={() => setLight(l => { const next = !l; localStorage.setItem('theme', next ? 'light' : 'dark'); return next })}>
              {light ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button className="icon-btn" aria-label="Notificaciones">
              <Bell size={18} />
              {subscription?.status === 'trial' && <span className="badge-dot" />}
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="content">{children}</div>
      </main>
    </div>
  )
}
