import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import ModuleGuard from '../components/ModuleGuard'
import api from '../api/client'
import {
  TrendingUp, TrendingDown, Minus, RefreshCw,
  AlertTriangle, AlertCircle, Info,
  DollarSign, Users, FileText, Package, Calendar, UserCheck,
  BarChart2,
} from 'lucide-react'

const fmt = n => 'RD$' + Number(n).toLocaleString('es-DO', { maximumFractionDigits: 0 })
const pct = n => (n > 0 ? '+' : '') + n + '%'

const NIVEL = {
  alta:  { color: 'var(--coral)',  dot: '#FB7185', bg: 'rgba(251,113,133,.08)', border: 'rgba(251,113,133,.2)' },
  media: { color: 'var(--amber)',  dot: '#FBBF24', bg: 'rgba(251,191,36,.08)',  border: 'rgba(251,191,36,.2)' },
  baja:  { color: 'var(--blue)',   dot: '#60A5FA', bg: 'rgba(96,165,250,.08)',  border: 'rgba(96,165,250,.2)' },
}

function KpiCard({ titulo, valor, sufijo = '', badge, badgeColor, tendencia, sub }) {
  const TIcon = tendencia === 'up' ? TrendingUp : tendencia === 'down' ? TrendingDown : Minus
  const tColor = tendencia === 'up' ? 'var(--green)' : tendencia === 'down' ? 'var(--coral)' : 'var(--text-3)'
  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span className="eyebrow">{titulo}</span>
        <TIcon size={15} style={{ color: tColor }} />
      </div>
      <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-.02em' }}>
        {valor}{sufijo && <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-2)', marginLeft: 4 }}>{sufijo}</span>}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {badge && (
          <span style={{ fontSize: 11, fontWeight: 700, color: badgeColor || tColor, background: `${badgeColor || tColor}18`, padding: '2px 8px', borderRadius: 20 }}>
            {badge}
          </span>
        )}
        {sub && <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{sub}</span>}
      </div>
    </div>
  )
}

function AlertaCard({ alerta }) {
  const cfg = NIVEL[alerta.nivel] || NIVEL.baja
  return (
    <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0, marginTop: 6 }} />
      <div>
        <p style={{ fontWeight: 700, fontSize: 13.5, color: cfg.color, margin: '0 0 4px' }}>{alerta.titulo}</p>
        {alerta.items?.map((item, i) => (
          <p key={i} style={{ fontSize: 12.5, color: 'var(--text-2)', margin: '0 0 2px' }}>{item}</p>
        ))}
      </div>
    </div>
  )
}

function SeccionCard({ titulo, icon: Icon, children }) {
  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Icon size={14} style={{ color: 'var(--blue)' }} />
        <span className="eyebrow">{titulo}</span>
      </div>
      {children}
    </div>
  )
}

function FilaMetrica({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{label}</span>
      <span style={{ fontSize: 13.5, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: highlight || 'var(--text)' }}>{value}</span>
    </div>
  )
}

export default function Reportes() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const cargar = async () => {
    setLoading(true); setError('')
    try {
      const r = await api.get('/reportes/')
      setData(r.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al cargar el reporte')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const d = data

  return (
    <Layout>
      <ModuleGuard module="reportes_ia">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <span className="eyebrow"><BarChart2 size={11} /> Análisis del negocio</span>
            <h2>Reportes del negocio</h2>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {d && (
              <span className="chip muted" style={{ fontSize: 12 }}>
                {new Date(d.generado_en + 'Z').toLocaleString('es-DO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button onClick={cargar} disabled={loading} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin .7s linear infinite' : 'none' }} />
              {loading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        {/* Carga inicial */}
        {loading && !d && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--green)', animation: 'spin .8s linear infinite' }} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(251,113,133,.08)', border: '1px solid rgba(251,113,133,.2)', borderRadius: 14, padding: '18px 22px' }}>
            <p style={{ color: 'var(--coral)', fontWeight: 700, margin: '0 0 4px' }}>Error al cargar</p>
            <p style={{ color: 'var(--text-2)', fontSize: 13.5, margin: 0 }}>{error}</p>
          </div>
        )}

        {d && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* KPIs principales */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
              <KpiCard
                titulo="Ingresos del mes"
                valor={fmt(d.facturacion.ingresos_mes)}
                tendencia={d.kpis[0]?.tendencia}
                badge={d.facturacion.variacion_pct !== 0 ? pct(d.facturacion.variacion_pct) + ' vs mes ant.' : undefined}
                sub={d.facturacion.variacion_pct === 0 ? 'Sin variación' : undefined}
              />
              <KpiCard
                titulo="Balance de caja"
                valor={fmt(d.caja.balance)}
                tendencia={d.kpis[1]?.tendencia}
                badge={d.caja.balance >= 0 ? 'Positivo' : 'Déficit'}
                badgeColor={d.caja.balance >= 0 ? 'var(--green)' : 'var(--coral)'}
              />
              <KpiCard
                titulo="Por cobrar"
                valor={d.facturacion.facturas_pendientes}
                sufijo="facturas"
                tendencia={d.kpis[2]?.tendencia}
                badge={d.facturacion.monto_pendiente > 0 ? fmt(d.facturacion.monto_pendiente) : undefined}
                badgeColor="var(--amber)"
                sub={d.facturacion.facturas_pendientes === 0 ? 'Todo al día' : undefined}
              />
              <KpiCard
                titulo="Clientes"
                valor={d.clientes.total}
                tendencia={d.kpis[3]?.tendencia}
                badge={d.clientes.nuevos_este_mes > 0 ? `+${d.clientes.nuevos_este_mes} nuevos` : undefined}
                sub={d.clientes.nuevos_este_mes === 0 ? 'Sin nuevos este mes' : undefined}
              />
            </div>

            {/* Alertas */}
            {d.alertas?.length > 0 && (
              <div>
                <p className="eyebrow" style={{ marginBottom: 10 }}><AlertTriangle size={11} /> Alertas ({d.alertas.length})</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {d.alertas.map((a, i) => <AlertaCard key={i} alerta={a} />)}
                </div>
              </div>
            )}

            {/* Grid de secciones */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>

              {/* Facturación */}
              <SeccionCard titulo="Facturación" icon={FileText}>
                <FilaMetrica label="Cobrado este mes" value={fmt(d.facturacion.ingresos_mes)} highlight="var(--green)" />
                <FilaMetrica label="Mes anterior" value={fmt(d.facturacion.ingresos_mes_anterior)} />
                <FilaMetrica label="Facturas emitidas" value={d.facturacion.facturas_emitidas} />
                <FilaMetrica label="Pendientes" value={`${d.facturacion.facturas_pendientes} (${fmt(d.facturacion.monto_pendiente)})`}
                  highlight={d.facturacion.monto_pendiente > 0 ? 'var(--amber)' : undefined} />
              </SeccionCard>

              {/* Caja */}
              <SeccionCard titulo="Caja del mes" icon={DollarSign}>
                <FilaMetrica label="Ingresos" value={fmt(d.caja.ingresos)} highlight="var(--green)" />
                <FilaMetrica label="Gastos" value={fmt(d.caja.gastos)} highlight="var(--coral)" />
                <FilaMetrica label="Balance neto" value={fmt(d.caja.balance)}
                  highlight={d.caja.balance >= 0 ? 'var(--green)' : 'var(--coral)'} />
                {Object.keys(d.caja.categorias_gasto).length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <p className="eyebrow" style={{ marginBottom: 8, fontSize: 10 }}>Top gastos por categoría</p>
                    {Object.entries(d.caja.categorias_gasto).map(([cat, monto]) => (
                      <div key={cat} style={{ marginBottom: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{cat}</span>
                          <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: 'var(--text)' }}>{fmt(monto)}</span>
                        </div>
                        <div style={{ height: 3, background: 'var(--border)', borderRadius: 2 }}>
                          <div style={{
                            height: '100%', borderRadius: 2, background: 'var(--coral)',
                            width: `${Math.min(100, monto / d.caja.gastos * 100)}%`,
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SeccionCard>

              {/* Inventario */}
              <SeccionCard titulo="Inventario" icon={Package}>
                <FilaMetrica label="Productos activos" value={d.inventario.total_productos} />
                <FilaMetrica label="Stock bajo" value={d.inventario.productos_stock_bajo}
                  highlight={d.inventario.productos_stock_bajo > 0 ? 'var(--coral)' : undefined} />
                <FilaMetrica label="Valor del inventario" value={fmt(d.inventario.valor_inventario)} />
                {d.inventario.nombres_stock_bajo?.length > 0 && (
                  <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(251,113,133,.06)', borderRadius: 8 }}>
                    <p style={{ fontSize: 11.5, color: 'var(--coral)', margin: '0 0 4px', fontWeight: 600 }}>Stock bajo:</p>
                    {d.inventario.nombres_stock_bajo.map(n => (
                      <p key={n} style={{ fontSize: 12, color: 'var(--text-2)', margin: '0 0 2px' }}>· {n}</p>
                    ))}
                  </div>
                )}
              </SeccionCard>

              {/* Agenda */}
              <SeccionCard titulo="Agenda del mes" icon={Calendar}>
                <FilaMetrica label="Citas programadas" value={d.agenda.citas_mes} />
                <FilaMetrica label="Canceladas" value={d.agenda.canceladas}
                  highlight={d.agenda.canceladas > 0 ? 'var(--amber)' : undefined} />
                <FilaMetrica label="Tasa de cancelación" value={`${d.agenda.tasa_cancelacion_pct}%`}
                  highlight={d.agenda.tasa_cancelacion_pct >= 20 ? 'var(--coral)' : 'var(--text)'} />
              </SeccionCard>

              {/* Clientes */}
              <SeccionCard titulo="Clientes" icon={Users}>
                <FilaMetrica label="Total registrados" value={d.clientes.total} />
                <FilaMetrica label="Nuevos este mes" value={d.clientes.nuevos_este_mes}
                  highlight={d.clientes.nuevos_este_mes > 0 ? 'var(--green)' : undefined} />
              </SeccionCard>

              {/* Empleados */}
              <SeccionCard titulo="Empleados" icon={UserCheck}>
                <FilaMetrica label="Total" value={d.empleados.total} />
                <FilaMetrica label="Activos" value={d.empleados.activos} />
                <FilaMetrica label="Nómina mensual" value={fmt(d.empleados.nomina_mensual)} />
              </SeccionCard>

            </div>
          </div>
        )}
      </ModuleGuard>
    </Layout>
  )
}
