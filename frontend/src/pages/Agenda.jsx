import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import ModuleGuard from '../components/ModuleGuard'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import api from '../api/client'
import { Plus, ChevronLeft, ChevronRight, Calendar, Clock, User, Check, X, Pencil, Trash2 } from 'lucide-react'

const ESTADOS = ['pendiente', 'confirmada', 'cancelada', 'completada']
const ESTADO_COLOR = {
  pendiente: 'warn', confirmada: 'pos', cancelada: 'neg', completada: 'soft',
}
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function CitaForm({ initial = {}, clientes = [], onSave, onCancel, loading }) {
  const hoy = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    titulo: '', servicio: '', fecha: hoy, hora_inicio: '09:00',
    duracion_min: 60, cliente_id: '', estado: 'pendiente', notas: '',
    ...initial,
  })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...form, cliente_id: form.cliente_id || null, duracion_min: parseInt(form.duracion_min) }) }}
      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label className="eyebrow" style={{ marginBottom: 6 }}>Título *</label>
        <input className="input" value={form.titulo} onChange={set('titulo')} placeholder="Ej. Corte de cabello" required />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="eyebrow" style={{ marginBottom: 6 }}>Servicio</label>
          <input className="input" value={form.servicio ?? ''} onChange={set('servicio')} placeholder="Tipo de servicio" />
        </div>
        <div>
          <label className="eyebrow" style={{ marginBottom: 6 }}>Cliente</label>
          <select className="input" value={form.cliente_id ?? ''} onChange={set('cliente_id')}>
            <option value="">— Sin cliente —</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label className="eyebrow" style={{ marginBottom: 6 }}>Fecha *</label>
          <input className="input" type="date" value={form.fecha} onChange={set('fecha')} required />
        </div>
        <div>
          <label className="eyebrow" style={{ marginBottom: 6 }}>Hora inicio *</label>
          <input className="input" type="time" value={form.hora_inicio} onChange={set('hora_inicio')} required />
        </div>
        <div>
          <label className="eyebrow" style={{ marginBottom: 6 }}>Duración (min)</label>
          <select className="input" value={form.duracion_min} onChange={set('duracion_min')}>
            {[15, 30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m} min</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="eyebrow" style={{ marginBottom: 6 }}>Estado</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {ESTADOS.map(s => (
            <button key={s} type="button" onClick={() => setForm(f => ({ ...f, estado: s }))}
              style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, border: `1.5px solid ${form.estado === s ? 'var(--green)' : 'var(--border-soft)'}`, background: form.estado === s ? 'rgba(52,211,153,.12)' : 'transparent', color: form.estado === s ? 'var(--green)' : 'var(--text-3)', cursor: 'pointer', textTransform: 'capitalize', transition: '.14s' }}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="eyebrow" style={{ marginBottom: 6 }}>Notas</label>
        <textarea className="input" rows={2} value={form.notas ?? ''} onChange={set('notas')} placeholder="Observaciones adicionales..." />
      </div>
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>
          {loading ? '...' : (initial.id ? 'Guardar cambios' : 'Crear cita')}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
      </div>
    </form>
  )
}

function MiniCal({ selected, onSelect }) {
  const [viewDate, setViewDate] = useState(selected || new Date())
  const year = viewDate.getFullYear(); const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  const selStr = selected?.toDateString()

  return (
    <div style={{ padding: '14px', border: '1px solid var(--border-soft)', borderRadius: 16, background: 'var(--surface)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="btn-ghost" style={{ padding: 6, borderRadius: 8 }}><ChevronLeft size={16} /></button>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{MESES[month]} {year}</span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="btn-ghost" style={{ padding: 6, borderRadius: 8 }}><ChevronRight size={16} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center' }}>
        {DIAS.map(d => <span key={d} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', padding: '2px 0 6px' }}>{d}</span>)}
        {cells.map((d, i) => (
          <button key={i} onClick={() => d && onSelect(d)}
            style={{ aspectRatio: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: d?.toDateString() === new Date().toDateString() ? 700 : 500, borderRadius: 8, border: 'none', cursor: d ? 'pointer' : 'default', background: d && d.toDateString() === selStr ? 'var(--green)' : 'transparent', color: !d ? 'transparent' : d.toDateString() === selStr ? '#06281f' : d.toDateString() === new Date().toDateString() ? 'var(--green)' : 'var(--text)', transition: '.1s' }}>
            {d?.getDate()}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Agenda() {
  const [citas, setCitas] = useState([])
  const [clientes, setClientes] = useState([])
  const [resumen, setResumen] = useState({ citas_hoy: 0, confirmadas: 0, pendientes: 0, total_mes: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [modal, setModal] = useState(null)
  const [estadoFiltro, setEstadoFiltro] = useState('')

  const dateStr = d => d.toISOString().split('T')[0]

  const load = async () => {
    const desde = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    const hasta = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
    const [ca, cl, r] = await Promise.all([
      api.get(`/agenda/?fecha_desde=${dateStr(desde)}&fecha_hasta=${dateStr(hasta)}${estadoFiltro ? '&estado=' + estadoFiltro : ''}`),
      api.get('/clientes/'),
      api.get('/agenda/resumen'),
    ])
    setCitas(ca.data); setClientes(cl.data); setResumen(r.data); setLoading(false)
  }
  useEffect(() => { load() }, [selectedDate, estadoFiltro])

  const citasDelDia = citas.filter(c => c.fecha === dateStr(selectedDate))

  const handleSave = async data => {
    setSaving(true)
    try {
      if (modal?.id) await api.put(`/agenda/${modal.id}`, data)
      else await api.post('/agenda/', data)
      await load(); setModal(null)
    } finally { setSaving(false) }
  }
  const handleDelete = async id => {
    if (!confirm('¿Eliminar esta cita?')) return
    await api.delete(`/agenda/${id}`); await load()
  }
  const handleEstado = async (id, estado) => {
    await api.patch(`/agenda/${id}/estado?estado=${estado}`); await load()
  }

  const horaToMin = h => { const [hh, mm] = h.split(':').map(Number); return hh * 60 + mm }
  const HORA_INICIO = 7; const HORA_FIN = 20
  const totalMin = (HORA_FIN - HORA_INICIO) * 60

  return (
    <Layout>
      <ModuleGuard module="agenda">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <span className="eyebrow">Gestión de citas y servicios</span>
            <h2>Agenda</h2>
          </div>
          <button className="btn-primary" onClick={() => setModal({})}>
            <Plus size={16} /> Nueva cita
          </button>
        </div>

        {/* Stats */}
        <section className="card split-stats" style={{ marginBottom: 20 }}>
          <div>
            <span className="eyebrow"><Calendar size={11} /> Citas hoy</span>
            <b className="mono big">{resumen.citas_hoy}</b>
            <span className="muted sm">programadas</span>
          </div>
          <div>
            <span className="eyebrow" style={{ color: 'var(--green)' }}><Check size={11} /> Confirmadas</span>
            <b className="mono big" style={{ color: 'var(--green)' }}>{resumen.confirmadas}</b>
            <span className="muted sm">hoy</span>
          </div>
          <div>
            <span className="eyebrow" style={{ color: 'var(--amber)' }}><Clock size={11} /> Pendientes</span>
            <b className="mono big" style={{ color: 'var(--amber)' }}>{resumen.pendientes}</b>
            <span className="muted sm">hoy</span>
          </div>
          <div>
            <span className="eyebrow">Total mes</span>
            <b className="mono big">{resumen.total_mes}</b>
            <span className="muted sm">este mes</span>
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
          {/* Panel izquierdo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <MiniCal selected={selectedDate} onSelect={setSelectedDate} />
            <div style={{ padding: '14px', border: '1px solid var(--border-soft)', borderRadius: 16, background: 'var(--surface)' }}>
              <p className="eyebrow" style={{ marginBottom: 10 }}>Filtrar por estado</p>
              {[['', 'Todos'], ...ESTADOS.map(e => [e, e])].map(([v, l]) => (
                <button key={v} onClick={() => setEstadoFiltro(v)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px', borderRadius: 9, marginBottom: 4, border: 'none', background: estadoFiltro === v ? 'rgba(52,211,153,.12)' : 'transparent', color: estadoFiltro === v ? 'var(--green)' : 'var(--text)', fontWeight: estadoFiltro === v ? 600 : 400, fontSize: 13.5, cursor: 'pointer', transition: '.12s', textTransform: 'capitalize' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Vista del día */}
          <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d) }} className="btn-ghost" style={{ padding: 6 }}><ChevronLeft size={16} /></button>
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: 17 }}>
                  {DIAS[selectedDate.getDay()]} {selectedDate.getDate()} de {MESES[selectedDate.getMonth()]}
                </h3>
                <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d) }} className="btn-ghost" style={{ padding: 6 }}><ChevronRight size={16} /></button>
              </div>
              <span className="chip">{citasDelDia.length} {citasDelDia.length === 1 ? 'cita' : 'citas'}</span>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                <span style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'block' }} />
              </div>
            ) : citasDelDia.length === 0 ? (
              <EmptyState icon="📅" title="Sin citas este día"
                description="No hay citas programadas para este día."
                action={<button className="btn-primary" onClick={() => setModal({ fecha: dateStr(selectedDate) })}><Plus size={16} /> Agendar cita</button>}
              />
            ) : (
              <div style={{ position: 'relative', padding: '16px 20px 16px 70px', minHeight: 480 }}>
                {/* Líneas de hora */}
                {Array.from({ length: HORA_FIN - HORA_INICIO + 1 }).map((_, i) => {
                  const h = HORA_INICIO + i
                  const top = (i / (HORA_FIN - HORA_INICIO)) * 100
                  return (
                    <div key={h} style={{ position: 'absolute', left: 0, right: 0, top: `${top}%`, borderTop: '1px solid var(--border-soft)', display: 'flex' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', width: 50, marginLeft: 4, marginTop: -8, fontFamily: 'JetBrains Mono' }}>{h}:00</span>
                    </div>
                  )
                })}

                {/* Citas */}
                {citasDelDia.map(c => {
                  const startMin = horaToMin(c.hora_inicio) - HORA_INICIO * 60
                  const pctTop = (startMin / totalMin) * 100
                  const pctH = ((c.duracion_min || 60) / totalMin) * 100
                  const colores = { pendiente: ['#FBBF24', 'rgba(251,191,36,.1)'], confirmada: ['#34D399', 'rgba(52,211,153,.1)'], cancelada: ['#FB7185', 'rgba(251,113,133,.1)'], completada: ['#94A2B5', 'rgba(148,162,181,.08)'] }
                  const [col, bg] = colores[c.estado] || ['var(--blue)', 'rgba(96,165,250,.1)']
                  return (
                    <div key={c.id} style={{ position: 'absolute', left: 70, right: 20, top: `${pctTop}%`, height: `calc(${pctH}% - 4px)`, minHeight: 38, background: bg, borderLeft: `3px solid ${col}`, borderRadius: '0 10px 10px 0', padding: '6px 12px', overflow: 'hidden', cursor: 'pointer' }}
                      onClick={() => setModal(c)}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: col, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.titulo}</p>
                          {c.cliente_nombre && <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-3)' }}><User size={9} /> {c.cliente_nombre}</p>}
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          {c.estado === 'pendiente' && <button onClick={e => { e.stopPropagation(); handleEstado(c.id, 'confirmada') }} className="btn-ghost" title="Confirmar" style={{ padding: 4, color: 'var(--green)' }}><Check size={13} /></button>}
                          {c.estado !== 'cancelada' && c.estado !== 'completada' && <button onClick={e => { e.stopPropagation(); handleEstado(c.id, 'cancelada') }} className="btn-ghost" title="Cancelar" style={{ padding: 4, color: 'var(--coral)' }}><X size={13} /></button>}
                          <button onClick={e => { e.stopPropagation(); handleDelete(c.id) }} className="btn-ghost" style={{ padding: 4, color: 'var(--text-3)' }} title="Eliminar"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        {/* Lista del mes */}
        {citas.length > 0 && (
          <section className="card" style={{ marginTop: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontWeight: 700 }}>Todas las citas del mes</h3>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr>{['Fecha', 'Hora', 'Título', 'Servicio', 'Cliente', 'Duración', 'Estado', ''].map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {citas.map(c => (
                    <tr key={c.id}>
                      <td className="mono">{c.fecha}</td>
                      <td className="mono">{c.hora_inicio}</td>
                      <td className="strong">{c.titulo}</td>
                      <td className="muted">{c.servicio || '—'}</td>
                      <td>{c.cliente_nombre || <span className="muted">—</span>}</td>
                      <td className="mono muted">{c.duracion_min} min</td>
                      <td><span className={`pill ${ESTADO_COLOR[c.estado]}`} style={{ textTransform: 'capitalize' }}>{c.estado}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => setModal(c)} className="btn-ghost" title="Editar"><Pencil size={14} /></button>
                          <button onClick={() => handleDelete(c.id)} className="btn-ghost" style={{ color: 'var(--coral)' }} title="Eliminar"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Editar cita' : 'Nueva cita'} size="lg">
          <CitaForm initial={modal || {}} clientes={clientes} onSave={handleSave} onCancel={() => setModal(null)} loading={saving} />
        </Modal>
      </ModuleGuard>
    </Layout>
  )
}
