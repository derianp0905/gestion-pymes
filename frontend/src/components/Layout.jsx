import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import {
  LayoutDashboard, Users, FileText, Wallet, Package,
  CalendarDays, Building2, Users2, BarChart3, GitBranch,
  ShieldCheck, LogOut, ChevronRight, Lock
} from 'lucide-react'

const NAV = [
  { section: 'Principal' },
  { to: '/dashboard',   label: 'Dashboard',     icon: LayoutDashboard, module: null },
  { section: 'Módulos Core' },
  { to: '/clientes',    label: 'Clientes',       icon: Users,           module: 'clientes' },
  { to: '/facturacion', label: 'Facturación',    icon: FileText,        module: 'facturacion' },
  { to: '/caja',        label: 'Caja',           icon: Wallet,          module: 'caja' },
  { section: 'Especializados' },
  { to: '/inventario',  label: 'Inventario',     icon: Package,         module: 'inventario' },
  { to: '/agenda',      label: 'Agenda',         icon: CalendarDays,    module: 'agenda' },
  { to: '/establo',     label: 'Establo',        icon: Building2,       module: 'establo' },
  { section: 'Premium' },
  { to: '/empleados',   label: 'Empleados',      icon: Users2,          module: 'empleados' },
  { to: '/reportes',    label: 'Reportes IA',    icon: BarChart3,       module: 'reportes_ia' },
  { to: '/sucursales',  label: 'Multi-sucursal', icon: GitBranch,       module: 'multi_sucursal' },
]

function NavItem({ item, hasModule }) {
  const location = useLocation()
  const active = location.pathname === item.to
  const locked = item.module && !hasModule(item.module)

  return (
    <Link
      to={item.to}
      className={[
        'group flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-150',
        active
          ? 'bg-white/10 text-white font-medium'
          : 'text-slate-400 hover:text-white hover:bg-white/5',
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-indigo-300' : 'text-slate-500 group-hover:text-slate-300'}`} />
        <span>{item.label}</span>
      </div>
      {locked
        ? <Lock className="w-3 h-3 text-slate-600" />
        : active && <ChevronRight className="w-3 h-3 text-slate-400" />
      }
    </Link>
  )
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { subscription, hasModule } = useSubscription()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const statusColor = {
    active: 'bg-emerald-400',
    trial:  'bg-amber-400',
    expired:'bg-rose-400',
  }[subscription?.status] ?? 'bg-slate-400'

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-slate-900 flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/5">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">Gestión PYMES</p>
            <p className="text-slate-500 text-xs truncate">{subscription?.plan ?? 'Sin plan'}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {NAV.map((item, i) =>
            item.section ? (
              <p key={i} className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 px-3 pt-4 pb-1.5 first:pt-1">
                {item.section}
              </p>
            ) : (
              <NavItem key={item.to} item={item} hasModule={hasModule} />
            )
          )}

          {user?.role === 'superadmin' && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 px-3 pt-4 pb-1.5">
                Administración
              </p>
              <Link
                to="/superadmin"
                className={[
                  'flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150',
                  location.pathname.startsWith('/superadmin')
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-white/5',
                ].join(' ')}
              >
                <ShieldCheck className="w-4 h-4 shrink-0 text-orange-400" />
                Super Admin
              </Link>
            </>
          )}
        </nav>

        {/* Subscription status */}
        {subscription && (
          <div className="mx-3 mb-3 p-3 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${statusColor}`} />
              <span className="text-xs text-slate-300 font-medium capitalize">{subscription.status}</span>
            </div>
            {subscription.status === 'trial' && subscription.trial_ends_at && (
              <p className="text-xs text-slate-500">
                Trial hasta {new Date(subscription.trial_ends_at).toLocaleDateString('es-419', { day: 'numeric', month: 'short' })}
              </p>
            )}
          </div>
        )}

        {/* User */}
        <div className="border-t border-white/5 px-3 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center shrink-0">
              <span className="text-indigo-300 text-xs font-bold">
                {user?.role === 'superadmin' ? 'SA' : 'A'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">
                {user?.role === 'superadmin' ? 'Super Admin' : 'Admin'}
              </p>
              <p className="text-slate-500 text-xs capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="text-slate-600 hover:text-rose-400 transition-colors p-1 rounded-lg hover:bg-white/5"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        {children}
      </main>
    </div>
  )
}
