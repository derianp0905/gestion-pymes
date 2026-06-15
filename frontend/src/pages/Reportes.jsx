import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import ModuleGuard from '../components/ModuleGuard'
import api from '../api/client'
import {
  Sparkles, RefreshCw, TrendingUp, TrendingDown, Minus,
  AlertTriangle, AlertCircle, Info, CheckCircle2,
  Lightbulb, BarChart2, ShoppingCart, Settings, Megaphone,
} from 'lucide-react'

const SALUD_CONFIG = {
  buena:   { color: 'var(--green)',  bg: 'rgba(52,211,153,.1)',  border: 'rgba(52,211,153,.25)',  label: 'Saludable',  icon: CheckCircle2 },
  regular: { color: 'var(--amber)',  bg: 'rgba(251,191,36,.1)',  border: 'rgba(251,191,36,.25)',  label: 'Regular',    icon: AlertCircle },
  alerta:  { color: 'var(--coral)',  bg: 'rgba(251,113,133,.1)', border: 'rgba(251,113,133,.25)', label: 'Atención',   icon: AlertTriangle },
}

const NIVEL_CONFIG = {
  alta:  { color: 'var(--coral)',  bg: 'rgba(251,113,133,.08)', dot: '#FB7185' },
  media: { color: 'var(--amber)',  bg: 'rgba(251,191,36,.08)',  dot: '#FBBF24' },
  baja:  { color: 'var(--blue)',   bg: 'rgba(96,165,250,.08)',  dot: '#60A5FA' },
}

const CAT_ICON = {
  ventas:       BarChart2,
  operaciones:  Settings,
  finanzas:     TrendingUp,
  marketing:    Megaphone,
}

const IMPACTO_COLOR = {
  alto:  'var(--green)',
  medio: 'var(--amber)',
  bajo:  'var(--text-3)',
}

function KpiCard({ kpi }) {
  const TrendIcon = kpi.tendencia === 'up' ? TrendingUp : kpi.tendencia === 'down' ? TrendingDown : Minus
  const trendColor = kpi.tendencia === 'up' ? 'var(--green)' : kpi.tendencia === 'down' ? 'var(--coral)' : 'var(--text-3)'
  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span className="eyebrow">{kpi.titulo}</span>
        <TrendIcon size={15} style={{ color: trendColor }} />
      </div>
      <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px', letterSpacing: '-.02em' }}>
        {kpi.valor}
      </p>
      <p style={{ fontSize: 12.5, color: 'var(--text-2)', margin: 0, lineHeight: 1.4 }}>{kpi.insight}</p>
    </div>
  )
}

function AlertaCard({ alerta }) {
  const cfg = NIVEL_CONFIG[alerta.nivel] || NIVEL_CONFIG.baja
  return (
    <div style={{ background: cfg.bg, border: `1px solid ${cfg.color}33`, borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 14 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0, marginTop: 6 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: cfg.color, margin: 0 }}>{alerta.titulo}</p>
          <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: `${cfg.color}22`, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '.04em' }}>
            {alerta.nivel}
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 8px' }}>{alerta.descripcion}</p>
        {alerta.accion && (
          <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Info size={11} /> {alerta.accion}
          </p>
        )}
      </div>
    </div>
  )
}

function RecomendacionCard({ rec }) {
  const Icon = CAT_ICON[rec.categoria] || Lightbulb
  return (
    <div className="card" style={{ padding: '18px 20px', display: 'flex', gap: 14 }}>
      <div style={{ width: 38, height: 38, background: 'var(--surface-2)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={17} style={{ color: 'var(--blue)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', margin: 0 }}>{rec.titulo}</p>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: IMPACTO_COLOR[rec.impacto], background: `${IMPACTO_COLOR[rec.impacto]}18`, padding: '2px 8px', borderRadius: 20 }}>
            Impacto {rec.impacto}
          </span>
          <span className="chip" style={{ textTransform: 'capitalize', fontSize: 10.5 }}>{rec.categoria}</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>{rec.descripcion}</p>
      </div>
    </div>
  )
}

function DatosBase({ datos }) {
  const fmt = n => 'RD$' + Number(n).toLocaleString('es-DO', { maximumFractionDigits: 0 })
  const sections = [
    { label: 'Facturación', items: [
      ['Ingresos cobrados', fmt(datos.facturacion.ingresos_mes)],
      ['Mes anterior', fmt(datos.facturacion.ingresos_mes_anterior)],
      ['Facturas emitidas', datos.facturacion.facturas_emitidas],
      ['Pendientes de cobro', fmt(datos.facturacion.monto_pendiente)],
    ]},
    { label: 'Caja', items: [
      ['Ingresos', fmt(datos.caja.ingresos)],
      ['Gastos', fmt(datos.caja.gastos)],
      ['Balance neto', fmt(datos.caja.balance)],
    ]},
    { label: 'Clientes', items: [
      ['Total', datos.clientes.total],
      ['Nuevos este mes', datos.clientes.nuevos_este_mes],
    ]},
    { label: 'Inventario', items: [
      ['Productos activos', datos.inventario.total_productos],
      ['Stock bajo', datos.inventario.productos_stock_bajo],
      ['Valor inventario', fmt(datos.inventario.valor_inventario)],
    ]},
    { label: 'Empleados', items: [
      ['Activos', datos.empleados.activos],
      ['Nómina mensual', fmt(datos.empleados.nomina_mensual)],
    ]},
    { label: 'Agenda', items: [
      ['Citas del mes', datos.agenda.citas_mes],
      ['Canceladas', datos.agenda.canceladas],
      ['Tasa cancelación', `${datos.agenda.tasa_cancelacion_pct}%`],
    ]},
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      {sections.map(s => (
        <div key={s.label} style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '14px 16px' }}>
          <p className="eyebrow" style={{ marginBottom: 10 }}>{s.label}</p>
          {s.items.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{k}</span>
              <span style={{ fontSize: 12.5, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-2)', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function Reportes() {
  const [reporte, setReporte]       = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [showDatos, setShowDatos]   = useState(false)

  const cargar = async (forzar = false) => {
    setLoading(true); setError('')
    try {
      const r = await api.get(`/reportes/?forzar=${forzar}`)
      setReporte(r.data)
    } catch (e) {
      const msg = e.response?.data?.detail || 'Error al generar el reporte'
      setError(typeof msg === 'string' ? msg : 'Error al generar el reporte')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const salud = reporte ? (SALUD_CONFIG[reporte.salud] || SALUD_CONFIG.regular) : null
  const SaludIcon = salud?.icon

  return (
    <Layout>
      <ModuleGuard module="reportes_ia">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <span className="eyebrow"><Sparkles size={11} /> Inteligencia artificial</span>
            <h2>Reportes IA</h2>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {reporte?.desde_cache && (
              <span className="chip muted" style={{ fontSize: 12 }}>Desde caché · 30 min</span>
            )}
            <button onClick={() => cargar(true)} disabled={loading} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin .7s linear infinite' : 'none' }} />
              {loading ? 'Analizando...' : 'Regenerar'}
            </button>
          </div>
        </div>

        {/* Estado de carga */}
        {loading && !reporte && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--green)', animation: 'spin .8s linear infinite' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', margin: '0 0 6px' }}>Claude está analizando tu negocio</p>
              <p className="muted sm">Procesando datos de facturación, caja, inventario y más...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(251,113,133,.1)', border: '1px solid rgba(251,113,133,.25)', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
            <p style={{ color: 'var(--coral)', fontWeight: 700, margin: '0 0 6px' }}>Error al generar reporte</p>
            <p style={{ color: 'var(--text-2)', fontSize: 13.5, margin: 0 }}>{error}</p>
            {error.includes('ANTHROPIC_API_KEY') && (
              <p style={{ color: 'var(--text-3)', fontSize: 12.5, marginTop: 10 }}>
                Agrega la variable de entorno <code style={{ background: 'var(--surface-2)', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace' }}>ANTHROPIC_API_KEY</code> al backend y reinicia el servidor.
              </p>
            )}
          </div>
        )}

        {/* Reporte */}
        {reporte && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Salud + Resumen */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
              <div className="card" style={{ padding: '22px', background: salud.bg, border: `1px solid ${salud.border}` }}>
                <span className="eyebrow" style={{ color: salud.color }}>Estado del negocio</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 6px' }}>
                  <SaludIcon size={22} style={{ color: salud.color }} />
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, color: salud.color }}>{salud.label}</span>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-2)', margin: 0 }}>
                  {new Date(reporte.generado_en + 'Z').toLocaleString('es-DO', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="card" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Sparkles size={14} style={{ color: 'var(--violet)' }} />
                  <span className="eyebrow">Resumen ejecutivo</span>
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--text)', margin: 0 }}>{reporte.resumen}</p>
              </div>
            </div>

            {/* KPIs */}
            {reporte.kpis?.length > 0 && (
              <div>
                <p className="eyebrow" style={{ marginBottom: 12 }}>KPIs principales</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                  {reporte.kpis.map((kpi, i) => <KpiCard key={i} kpi={kpi} />)}
                </div>
              </div>
            )}

            {/* Alertas */}
            {reporte.alertas?.length > 0 && (
              <div>
                <p className="eyebrow" style={{ marginBottom: 12 }}>
                  <AlertTriangle size={11} /> Alertas ({reporte.alertas.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {reporte.alertas.map((a, i) => <AlertaCard key={i} alerta={a} />)}
                </div>
              </div>
            )}

            {/* Recomendaciones */}
            {reporte.recomendaciones?.length > 0 && (
              <div>
                <p className="eyebrow" style={{ marginBottom: 12 }}>
                  <Lightbulb size={11} /> Recomendaciones de Claude
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {reporte.recomendaciones.map((r, i) => <RecomendacionCard key={i} rec={r} />)}
                </div>
              </div>
            )}

            {/* Datos base (colapsable) */}
            {reporte.datos_base && (
              <div>
                <button onClick={() => setShowDatos(!showDatos)} className="btn-ghost"
                  style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 10 }}>
                  {showDatos ? '▲' : '▶'} Datos utilizados para el análisis
                </button>
                {showDatos && <DatosBase datos={reporte.datos_base} />}
              </div>
            )}
          </div>
        )}
      </ModuleGuard>
    </Layout>
  )
}
