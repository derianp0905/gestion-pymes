import { useState, useEffect } from 'react'
import { useSubscription } from '../hooks/useSubscription'
import Layout from '../components/Layout'
import api from '../api/client'
import {
  TrendingUp, TrendingDown, Users, Wallet,
  ArrowUpRight, ArrowDownRight, AlertTriangle, RefreshCw, MoreHorizontal,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'

/* ── Sparkline ── */
function Spark({ data, color }) {
  const d = data.map((y, x) => ({ x, y }))
  return (
    <ResponsiveContainer width="100%" height={34}>
      <AreaChart data={d} margin={{ top: 2, bottom: 0, left: 0, right: 0 }}>
        <defs>
          <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.45} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="y" stroke={color} strokeWidth={1.8}
          fill={`url(#sg-${color.replace('#', '')})`} isAnimationActive={false} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/* ── KPI card ── */
function Kpi({ label, value, delta, spark, color, loading }) {
  const up = delta >= 0
  return (
    <section className="card kpi">
      <div className="kpi-top">
        <span className="muted sm">{label}</span>
        {delta !== undefined && (
          <span className={`chip ${up ? 'chip-up' : 'chip-down'}`}>
            {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      {loading
        ? <div style={{ height: 32, background: 'var(--surface-2)', borderRadius: 8, margin: '10px 0 2px', animation: 'pulse 1.4s infinite' }} />
        : <div className="kpi-val mono">{value}</div>
      }
      <div className="kpi-spark">
        {spark && <Spark data={spark} color={color} />}
      </div>
    </section>
  )
}

/* ── Chart tooltip ── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const fmt = n => 'RD$' + Number(n).toLocaleString('es-DO', { maximumFractionDigits: 0 })
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: 12, padding: '10px 14px', fontFamily: 'Inter', fontSize: 12 }}>
      <p style={{ color: 'var(--text-2)', marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: 3, background: p.color, flexShrink: 0 }} />
          <span style={{ color: 'var(--text-2)' }}>{p.name === 'ingresos' ? 'Ingresos' : 'Gastos'}</span>
          <b style={{ color: 'var(--text)', marginLeft: 4 }}>{fmt(p.value * 1000)}</b>
        </div>
      ))}
    </div>
  )
}

const fmt = n => 'RD$' + Number(n ?? 0).toLocaleString('es-DO', { maximumFractionDigits: 0 })

export default function Dashboard() {
  const { subscription } = useSubscription()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async (showSpin = false) => {
    if (showSpin) setRefreshing(true)
    try {
      const r = await api.get('/dashboard/resumen')
      setData(r.data)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }
  useEffect(() => { load() }, [])

  const ingresos = Number(data?.ingresos_mes ?? 0)
  const gastos   = Number(data?.gastos_mes ?? 0)
  const balance  = Number(data?.balance_mes ?? 0)
  const clientes = Number(data?.clientes_total ?? 0)

  const chartData = (data?.chart ?? []).map(m => ({
    mes: m.mes,
    ingresos: Math.round(m.ingresos / 1000),
    gastos: Math.round(m.gastos / 1000),
  }))
  const chartEmpty = !chartData.some(m => m.ingresos > 0 || m.gastos > 0)

  const totalFlow = ingresos + gastos
  const wIn = totalFlow > 0 ? (ingresos / totalFlow) * 100 : 50

  // Fake-spark based on available data (6-month trend)
  const ingresosSpark = chartData.map(m => m.ingresos)
  const gastosSpark   = chartData.map(m => m.gastos)

  return (
    <Layout>
      <div className="grid-main">

        {/* ── Flow card ── */}
        <section className="card flow span-2">
          <div className="flow-glow" />
          <div className="flow-head">
            <div>
              <span className="eyebrow">Flujo de caja · mes</span>
              <div className="flow-net">
                <span className="net-num mono">{loading ? '—' : fmt(balance)}</span>
                {balance >= 0
                  ? <span className="chip chip-up"><ArrowUpRight size={13} /> Positivo</span>
                  : <span className="chip chip-down"><ArrowDownRight size={13} /> Negativo</span>
                }
              </div>
              <span className="muted sm">Saldo neto del mes</span>
            </div>
            <button className="btn-ghost" onClick={() => load(true)}>
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="flow-bar" role="img">
            <span className="flow-seg in" style={{ width: `${wIn}%` }} />
            <span className="flow-seg out" style={{ width: `${100 - wIn}%` }} />
          </div>
          <div className="flow-legend">
            <div className="leg">
              <span className="leg-top"><span className="d in" /> Ingresos</span>
              <b className="mono">{loading ? '…' : fmt(ingresos)}</b>
              <span className="muted sm">cobros del mes</span>
            </div>
            <div className="leg">
              <span className="leg-top"><span className="d out" /> Gastos</span>
              <b className="mono">{loading ? '…' : fmt(gastos)}</b>
              <span className="muted sm">egresos del mes</span>
            </div>
            <div className="leg">
              <span className="leg-top"><span className="d save" /> Clientes</span>
              <b className="mono">{loading ? '…' : clientes}</b>
              <span className="muted sm">registrados</span>
            </div>
          </div>
        </section>

        {/* ── KPIs ── */}
        <Kpi
          label="Ingresos del mes"
          value={fmt(ingresos)}
          delta={undefined}
          spark={ingresosSpark.length ? ingresosSpark : [0,0,0,0,0,0]}
          color="#34D399"
          loading={loading}
        />
        <Kpi
          label="Gastos del mes"
          value={fmt(gastos)}
          delta={undefined}
          spark={gastosSpark.length ? gastosSpark : [0,0,0,0,0,0]}
          color="#FB7185"
          loading={loading}
        />
        <Kpi
          label="Balance neto"
          value={fmt(balance)}
          delta={undefined}
          spark={chartData.map(m => Math.max(0, m.ingresos - m.gastos))}
          color="#60A5FA"
          loading={loading}
        />
        <Kpi
          label="Clientes activos"
          value={clientes}
          delta={undefined}
          spark={[1,2,2,3,4,5,clientes || 0]}
          color="#8B86F8"
          loading={loading}
        />

        {/* ── Bar chart ── */}
        <section className="card span-2">
          <div className="card-head">
            <div>
              <span className="eyebrow">Últimos 6 meses</span>
              <h3>Ingresos vs gastos</h3>
            </div>
            <span className="chip chip-soft">
              <TrendingUp size={13} /> Semestre actual
            </span>
          </div>
          {loading ? (
            <div style={{ height: 232, background: 'var(--surface-2)', borderRadius: 12, animation: 'pulse 1.4s infinite' }} />
          ) : chartEmpty ? (
            <div style={{ height: 232, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
              <p style={{ fontSize: 36, margin: 0 }}>📊</p>
              <p style={{ fontSize: 13, marginTop: 8 }}>Registra movimientos para ver la gráfica</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={232}>
              <BarChart data={chartData} barGap={6} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border-soft)" />
                <XAxis dataKey="mes" tickLine={false} axisLine={false}
                  tick={{ fill: 'var(--text-3)', fontSize: 12, fontFamily: 'Inter' }} />
                <YAxis tickLine={false} axisLine={false}
                  tick={{ fill: 'var(--text-3)', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={v => `${v}k`} />
                <Tooltip cursor={{ fill: 'rgba(127,127,127,.06)' }} content={<ChartTip />} />
                <Bar dataKey="ingresos" radius={[5,5,0,0]} fill="#34D399" maxBarSize={20} name="ingresos" />
                <Bar dataKey="gastos" radius={[5,5,0,0]} fill="#324054" maxBarSize={20} name="gastos" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        {/* ── Facturación resumen ── */}
        <section className="card">
          <div className="card-head">
            <div>
              <span className="eyebrow">Resumen</span>
              <h3>Facturación</h3>
            </div>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3].map(i => <div key={i} style={{ height: 40, background: 'var(--surface-2)', borderRadius: 9, animation: 'pulse 1.4s infinite' }} />)}
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                <div className="list-row" style={{ background: 'rgba(52,211,153,.08)', borderRadius: 10, padding: '8px 12px' }}>
                  <div className="grow">
                    <span className="row-title">Facturas cobradas</span>
                    <span className="muted sm">pagadas este mes</span>
                  </div>
                  <b className="mono pos">{data?.facturas_pagadas ?? 0}</b>
                </div>
                <div className="list-row" style={{ background: 'rgba(251,191,36,.08)', borderRadius: 10, padding: '8px 12px' }}>
                  <div className="grow">
                    <span className="row-title">Por cobrar</span>
                    <span className="muted sm">facturas enviadas</span>
                  </div>
                  <b className="mono warn">{fmt(data?.monto_por_cobrar)}</b>
                </div>
              </div>
              <a href="/facturacion" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--green)', fontWeight: 600, textDecoration: 'none' }}>
                Ver todas las facturas <ArrowUpRight size={13} />
              </a>
            </div>
          )}
        </section>

        {/* ── Acciones rápidas ── */}
        <section className="card">
          <div className="card-head">
            <div><span className="eyebrow">Atajos</span><h3>Acciones rápidas</h3></div>
          </div>
          <ul className="list">
            {[
              { label: 'Nuevo cliente',   href: '/clientes',    color: '#8B86F8', bg: 'rgba(139,134,248,.12)' },
              { label: 'Nueva factura',   href: '/facturacion', color: '#34D399', bg: 'rgba(52,211,153,.12)' },
              { label: 'Registrar gasto', href: '/caja',        color: '#FBBF24', bg: 'rgba(251,191,36,.12)' },
              { label: 'Perfil empresa',  href: '/perfil-empresa', color: '#60A5FA', bg: 'rgba(96,165,250,.12)' },
            ].map(a => (
              <li key={a.href}>
                <a href={a.href} className="list-row" style={{ textDecoration: 'none' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: a.bg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <ArrowUpRight size={14} style={{ color: a.color }} />
                  </div>
                  <span className="row-title" style={{ color: 'var(--text)' }}>{a.label}</span>
                  <ArrowUpRight size={14} style={{ color: 'var(--text-3)', marginLeft: 'auto' }} />
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Módulos activos ── */}
        {subscription?.modulos?.length > 0 && (
          <section className="card span-full">
            <div className="card-head">
              <div><span className="eyebrow">Tu plan</span><h3>Módulos activos</h3></div>
              <span className="pill soft">{subscription.plan}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
              {subscription.modulos.map(mod => {
                const iconos = { clientes: '👥', facturacion: '🧾', caja: '💰', inventario: '📦', agenda: '📅', establo: '🐴', empleados: '👔', reportes_ia: '✨', multi_sucursal: '🏢' }
                const hrefs  = { clientes: '/clientes', facturacion: '/facturacion', caja: '/caja', inventario: '/inventario', agenda: '/agenda', empleados: '/empleados', reportes_ia: '/reportes', multi_sucursal: '/sucursales' }
                return (
                  <a key={mod} href={hrefs[mod] ?? '#'}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 14, borderRadius: 14, background: 'var(--surface-2)', border: '1px solid var(--border-soft)', textDecoration: 'none', transition: '.14s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.background = 'rgba(52,211,153,.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-soft)'; e.currentTarget.style.background = 'var(--surface-2)'; }}
                  >
                    <span style={{ fontSize: 24 }}>{iconos[mod] ?? '⚙️'}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-2)', textAlign: 'center', textTransform: 'capitalize' }}>
                      {mod.replace('_', ' ')}
                    </span>
                  </a>
                )
              })}
            </div>
          </section>
        )}

      </div>
    </Layout>
  )
}
