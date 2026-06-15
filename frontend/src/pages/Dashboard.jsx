import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import Layout from '../components/Layout'
import api from '../api/client'
import {
  TrendingUp, TrendingDown, Users, FileText,
  Wallet, ArrowUpRight, Zap, Calendar, RefreshCw
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'

const QUICK_ACTIONS = [
  { label: 'Nuevo cliente',     icon: Users,    href: '/clientes',    color: 'bg-indigo-500/20 text-indigo-400' },
  { label: 'Nueva factura',     icon: FileText, href: '/facturacion', color: 'bg-emerald-500/20 text-emerald-400' },
  { label: 'Registrar ingreso', icon: Wallet,   href: '/caja',        color: 'bg-amber-500/20 text-amber-400' },
  { label: 'Ver agenda',        icon: Calendar, href: '/agenda',      color: 'bg-violet-500/20 text-violet-400' },
]

function StatCard({ label, value, sub, trend, trendUp, icon: Icon, iconColor, loading }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}%
          </div>
        )}
      </div>
      {loading ? (
        <div className="h-8 w-28 bg-slate-700 rounded-lg animate-pulse mb-1" />
      ) : (
        <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
      )}
      <p className="text-sm text-slate-400">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const fmt = (n) => '$' + Number(n).toLocaleString('es-DO', { minimumFractionDigits: 2 })
  return (
    <div className="bg-slate-800 border border-slate-700 px-4 py-3 shadow-xl rounded-xl">
      <p className="text-xs font-semibold text-slate-400 mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="text-slate-400">Ingresos:</span>
          <span className="font-semibold text-white">{fmt(payload[0]?.value ?? 0)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          <span className="text-slate-400">Gastos:</span>
          <span className="font-semibold text-white">{fmt(payload[1]?.value ?? 0)}</span>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { subscription } = useSubscription()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      const r = await api.get('/dashboard/resumen')
      setData(r.data)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  const fmt = (n) => '$' + Number(n ?? 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })
  const mesActual = new Date().toLocaleDateString('es-419', { month: 'long', year: 'numeric' })
  const chartVacio = !data?.chart?.some(m => m.ingresos > 0 || m.gastos > 0)

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 capitalize">{mesActual}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          {subscription?.status === 'trial' && (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm px-4 py-2 rounded-xl">
              <Zap className="w-4 h-4" />
              <span>Trial · vence {subscription.trial_ends_at
                ? new Date(subscription.trial_ends_at).toLocaleDateString('es-419', { day: 'numeric', month: 'short' })
                : '—'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Ingresos del mes" value={fmt(data?.ingresos_mes)}
            icon={TrendingUp} iconColor="bg-emerald-500/20 text-emerald-400" loading={loading} />
          <StatCard label="Gastos del mes" value={fmt(data?.gastos_mes)}
            icon={TrendingDown} iconColor="bg-rose-500/20 text-rose-400" loading={loading} />
          <StatCard label="Balance neto" value={fmt(data?.balance_mes)} sub="Ingresos − gastos"
            icon={Wallet} iconColor="bg-indigo-500/20 text-indigo-400" loading={loading} />
          <StatCard label="Clientes activos" value={loading ? '—' : data?.clientes_total}
            icon={Users} iconColor="bg-violet-500/20 text-violet-400" loading={loading} />
        </div>

        {/* Chart + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Chart */}
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-semibold text-white">Ingresos vs Gastos</h2>
                <p className="text-xs text-slate-500 mt-0.5">Últimos 6 meses</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-indigo-400 rounded-full inline-block" />
                  <span className="text-slate-400">Ingresos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-rose-400 rounded-full inline-block" />
                  <span className="text-slate-400">Gastos</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="h-[220px] bg-slate-700/30 rounded-xl animate-pulse" />
            ) : chartVacio ? (
              <div className="h-[220px] flex flex-col items-center justify-center text-center">
                <p className="text-4xl mb-3">📊</p>
                <p className="text-sm font-medium text-slate-400">Sin datos aún</p>
                <p className="text-xs text-slate-500 mt-1">Registra movimientos en Caja para ver la gráfica</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data?.chart ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gGastos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb7185" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="ingresos" stroke="#6366f1" strokeWidth={2} fill="url(#gIngresos)"
                    dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
                  <Area type="monotone" dataKey="gastos" stroke="#fb7185" strokeWidth={2} fill="url(#gGastos)"
                    dot={false} activeDot={{ r: 4, fill: '#fb7185' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Quick Actions + Facturas */}
          <div className="space-y-4">
            <div className="card">
              <h2 className="font-semibold text-white mb-4">Acciones rápidas</h2>
              <div className="space-y-1">
                {QUICK_ACTIONS.map(({ label, icon: Icon, href, color }) => (
                  <a key={href} href={href}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-700/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{label}</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </a>
                ))}
              </div>
            </div>

            {/* Facturas resumen */}
            <div className="card">
              <h2 className="font-semibold text-white mb-4">Facturación</h2>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2].map(i => <div key={i} className="h-10 bg-slate-700 rounded-lg animate-pulse" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <span className="text-xs text-emerald-400 font-medium">Cobradas</span>
                    <span className="text-sm font-bold text-emerald-400">{data?.facturas_pagadas ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <span className="text-xs text-amber-400 font-medium">Por cobrar</span>
                    <span className="text-sm font-bold text-amber-400">{fmt(data?.monto_por_cobrar)}</span>
                  </div>
                  <a href="/facturacion" className="flex items-center gap-1 text-xs text-indigo-400 font-medium pt-1 hover:text-indigo-300">
                    Ver todas las facturas <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Módulos activos */}
        {subscription?.modulos?.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">Módulos activos</h2>
              <span className="badge badge-blue">{subscription.plan}</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {subscription.modulos.map((mod) => {
                const iconos = { clientes: '👥', facturacion: '🧾', caja: '💰', inventario: '📦', agenda: '📅', establo: '🐴', empleados: '👔', reportes_ia: '🤖', multi_sucursal: '🏢' }
                const hrefs = { clientes: '/clientes', facturacion: '/facturacion', caja: '/caja', inventario: '/inventario', agenda: '/agenda', establo: '/establo', empleados: '/empleados', reportes_ia: '/reportes', multi_sucursal: '/sucursales' }
                return (
                  <a key={mod} href={hrefs[mod] ?? '#'}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-700/40 hover:bg-slate-700 border border-slate-700/60 hover:border-indigo-500/40 transition-all group">
                    <span className="text-2xl">{iconos[mod] ?? '⚙️'}</span>
                    <span className="text-xs font-medium text-slate-400 group-hover:text-white text-center leading-tight capitalize">
                      {mod.replace('_', ' ')}
                    </span>
                  </a>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
