import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import ModuleGuard from '../components/ModuleGuard'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import api from '../api/client'
import { Plus, Users, DollarSign, Pencil, Trash2, CreditCard, ChevronDown } from 'lucide-react'

const ESTADOS = ['activo', 'inactivo', 'vacaciones']
const TIPOS_PAGO = ['mensual', 'quincenal', 'semanal', 'diario']
const ESTADO_COLOR = { activo: 'pos', inactivo: 'neg', vacaciones: 'warn' }

function EmpleadoForm({ initial = {}, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    nombre: '', puesto: '', sucursal: '', email: '', telefono: '',
    salario: '', tipo_pago: 'mensual', fecha_ingreso: '', estado: 'activo',
    ...initial,
  })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...form, salario: parseFloat(form.salario) || 0 }) }}
      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <div>
          <label className="eyebrow" style={{ marginBottom: 6 }}>Nombre completo *</label>
          <input className="input" value={form.nombre} onChange={set('nombre')} placeholder="Ej. María González" required />
        </div>
        <div>
          <label className="eyebrow" style={{ marginBottom: 6 }}>Estado</label>
          <select className="input" value={form.estado} onChange={set('estado')}>
            {ESTADOS.map(e => <option key={e} value={e} style={{ textTransform: 'capitalize' }}>{e}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="eyebrow" style={{ marginBottom: 6 }}>Puesto</label>
          <input className="input" value={form.puesto ?? ''} onChange={set('puesto')} placeholder="Ej. Vendedor" />
        </div>
        <div>
          <label className="eyebrow" style={{ marginBottom: 6 }}>Sucursal</label>
          <input className="input" value={form.sucursal ?? ''} onChange={set('sucursal')} placeholder="Ej. Principal" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="eyebrow" style={{ marginBottom: 6 }}>Email</label>
          <input className="input" type="email" value={form.email ?? ''} onChange={set('email')} placeholder="empleado@empresa.com" />
        </div>
        <div>
          <label className="eyebrow" style={{ marginBottom: 6 }}>Teléfono</label>
          <input className="input" value={form.telefono ?? ''} onChange={set('telefono')} placeholder="809-000-0000" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div style={{ gridColumn: '1 / 2' }}>
          <label className="eyebrow" style={{ marginBottom: 6 }}>Salario</label>
          <input className="input" type="number" min="0" step="0.01" value={form.salario ?? ''} onChange={set('salario')} placeholder="0.00" />
        </div>
        <div>
          <label className="eyebrow" style={{ marginBottom: 6 }}>Tipo de pago</label>
          <select className="input" value={form.tipo_pago} onChange={set('tipo_pago')}>
            {TIPOS_PAGO.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="eyebrow" style={{ marginBottom: 6 }}>Fecha ingreso</label>
          <input className="input" type="date" value={form.fecha_ingreso ?? ''} onChange={set('fecha_ingreso')} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>
          {loading ? '...' : (initial.id ? 'Guardar cambios' : 'Agregar empleado')}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
      </div>
    </form>
  )
}

function NominaModal({ empleado, onClose }) {
  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ periodo: '', monto: '', fecha_pago: new Date().toISOString().split('T')[0], notas: '' })
  const [showForm, setShowForm] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const fmt = n => 'RD$' + Number(n).toLocaleString('es-DO', { maximumFractionDigits: 0 })
  const loadPagos = async () => {
    const r = await api.get(`/empleados/${empleado.id}/nomina`)
    setPagos(r.data); setLoading(false)
  }
  useEffect(() => { loadPagos() }, [])

  const handlePagar = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post(`/empleados/${empleado.id}/nomina`, { ...form, monto: parseFloat(form.monto) })
      setForm({ periodo: '', monto: '', fecha_pago: new Date().toISOString().split('T')[0], notas: '' })
      setShowForm(false); await loadPagos()
    } finally { setSaving(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 12, border: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="muted sm" style={{ margin: 0 }}>{empleado.puesto}</p>
          <p style={{ fontWeight: 700, fontSize: 16, margin: '4px 0 0' }}>{empleado.nombre}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p className="muted sm" style={{ margin: 0 }}>Salario {empleado.tipo_pago}</p>
          <b style={{ fontFamily: 'JetBrains Mono', color: 'var(--green)', fontSize: 18 }}>{fmt(empleado.salario)}</b>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>Historial de pagos</h4>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ fontSize: 13, padding: '7px 14px' }}>
          <Plus size={14} /> Registrar pago
        </button>
      </div>

      {showForm && (
        <form onSubmit={handlePagar} style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="eyebrow" style={{ marginBottom: 5 }}>Período *</label>
              <input className="input" value={form.periodo} onChange={set('periodo')} placeholder="2026-06" required />
            </div>
            <div>
              <label className="eyebrow" style={{ marginBottom: 5 }}>Monto *</label>
              <input className="input" type="number" min="0" step="0.01" value={form.monto} onChange={set('monto')} placeholder={empleado.salario} required />
            </div>
            <div>
              <label className="eyebrow" style={{ marginBottom: 5 }}>Fecha de pago *</label>
              <input className="input" type="date" value={form.fecha_pago} onChange={set('fecha_pago')} required />
            </div>
            <div>
              <label className="eyebrow" style={{ marginBottom: 5 }}>Notas</label>
              <input className="input" value={form.notas} onChange={set('notas')} placeholder="Opcional" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? '...' : 'Confirmar pago'}</button>
        </form>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 30 }}><span style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} /></div>
      ) : pagos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-3)' }}>
          <CreditCard size={30} style={{ opacity: .3, marginBottom: 10 }} />
          <p style={{ margin: 0, fontSize: 14 }}>Sin pagos registrados</p>
        </div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>{['Período', 'Monto', 'Fecha pago', 'Notas'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {pagos.map(p => (
                <tr key={p.id}>
                  <td className="mono chip">{p.periodo}</td>
                  <td className="mono strong pos">{fmt(p.monto)}</td>
                  <td className="mono muted">{p.fecha_pago}</td>
                  <td className="muted">{p.notas || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn-secondary" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  )
}

export default function Empleados() {
  const [empleados, setEmpleados] = useState([])
  const [resumen, setResumen] = useState({ total: 0, activos: 0, en_vacaciones: 0, nomina_mensual: 0, sucursales: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [modal, setModal] = useState(null)
  const [nominaModal, setNominaModal] = useState(null)
  const [openDrop, setOpenDrop] = useState(null)

  const load = async () => {
    const [e, r] = await Promise.all([
      api.get('/empleados/' + (estadoFiltro ? '?estado=' + estadoFiltro : '')),
      api.get('/empleados/resumen'),
    ])
    setEmpleados(e.data); setResumen(r.data); setLoading(false)
  }
  useEffect(() => { load() }, [estadoFiltro])

  const handleSave = async data => {
    setSaving(true)
    try {
      if (modal?.id) await api.put(`/empleados/${modal.id}`, data)
      else await api.post('/empleados/', data)
      await load(); setModal(null)
    } finally { setSaving(false) }
  }
  const handleDelete = async id => {
    if (!confirm('¿Eliminar este empleado?')) return
    await api.delete(`/empleados/${id}`); await load()
  }

  const fmt = n => 'RD$' + Number(n).toLocaleString('es-DO', { maximumFractionDigits: 0 })

  return (
    <Layout>
      <ModuleGuard module="empleados">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <span className="eyebrow">Gestión de personal y nómina</span>
            <h2>Empleados</h2>
          </div>
          <button className="btn-primary" onClick={() => setModal({})}>
            <Plus size={16} /> Nuevo empleado
          </button>
        </div>

        {/* Stats */}
        <section className="card split-stats" style={{ marginBottom: 20 }}>
          <div>
            <span className="eyebrow"><Users size={11} /> Total empleados</span>
            <b className="mono big">{resumen.total}</b>
            <span className="muted sm">en plantilla</span>
          </div>
          <div>
            <span className="eyebrow" style={{ color: 'var(--green)' }}>Activos</span>
            <b className="mono big" style={{ color: 'var(--green)' }}>{resumen.activos}</b>
            <span className="muted sm">trabajando</span>
          </div>
          <div>
            <span className="eyebrow" style={{ color: 'var(--amber)' }}>Vacaciones</span>
            <b className="mono big" style={{ color: 'var(--amber)' }}>{resumen.en_vacaciones}</b>
            <span className="muted sm">este mes</span>
          </div>
          <div>
            <span className="eyebrow"><DollarSign size={11} /> Nómina mensual</span>
            <b className="mono big">{fmt(resumen.nomina_mensual)}</b>
            <span className="muted sm">empleados activos</span>
          </div>
          <div>
            <span className="eyebrow">Sucursales</span>
            <b className="mono big">{resumen.sucursales}</b>
            <span className="muted sm">con personal</span>
          </div>
        </section>

        {/* Filtros rápidos */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[['', 'Todos'], ...ESTADOS.map(e => [e, e.charAt(0).toUpperCase() + e.slice(1)])].map(([v, l]) => (
            <button key={v} onClick={() => setEstadoFiltro(v)} className={estadoFiltro === v ? 'btn-primary' : 'btn-ghost'}
              style={{ padding: '7px 16px', fontSize: 13, borderRadius: 20 }}>
              {l}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <span style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'block' }} />
          </div>
        ) : empleados.length === 0 ? (
          <EmptyState icon="👥" title={estadoFiltro ? 'Sin empleados con este estado' : 'Sin empleados registrados'}
            description="Agrega tu primer empleado para comenzar a gestionar tu equipo."
            action={!estadoFiltro && <button className="btn-primary" onClick={() => setModal({})}><Plus size={16} /> Agregar empleado</button>}
          />
        ) : (
          <section className="card">
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>{['Empleado', 'Puesto', 'Sucursal', 'Contacto', 'Ingreso', 'Salario', 'Tipo pago', 'Estado', ''].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {empleados.map(e => (
                    <tr key={e.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar" style={{ background: 'rgba(52,211,153,.15)', color: 'var(--green)', fontSize: 14, width: 36, height: 36, minWidth: 36 }}>
                            {e.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <span style={{ fontWeight: 600 }}>{e.nombre}</span>
                        </div>
                      </td>
                      <td className="muted">{e.puesto || '—'}</td>
                      <td>{e.sucursal ? <span className="chip">{e.sucursal}</span> : <span className="muted">—</span>}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {e.email && <span className="muted sm">{e.email}</span>}
                          {e.telefono && <span className="muted sm">{e.telefono}</span>}
                          {!e.email && !e.telefono && <span className="muted">—</span>}
                        </div>
                      </td>
                      <td className="mono muted">{e.fecha_ingreso || '—'}</td>
                      <td className="mono strong">{fmt(e.salario)}</td>
                      <td><span className="chip" style={{ textTransform: 'capitalize' }}>{e.tipo_pago}</span></td>
                      <td><span className={`pill ${ESTADO_COLOR[e.estado]}`} style={{ textTransform: 'capitalize' }}>{e.estado}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => setNominaModal(e)} className="btn-ghost" title="Nómina" style={{ color: 'var(--blue)' }}><CreditCard size={14} /></button>
                          <button onClick={() => setModal(e)} className="btn-ghost" title="Editar"><Pencil size={14} /></button>
                          <button onClick={() => handleDelete(e.id)} className="btn-ghost" style={{ color: 'var(--coral)' }} title="Eliminar"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Editar empleado' : 'Nuevo empleado'} size="lg">
          <EmpleadoForm initial={modal || {}} onSave={handleSave} onCancel={() => setModal(null)} loading={saving} />
        </Modal>

        <Modal open={!!nominaModal} onClose={() => setNominaModal(null)} title="Historial de Nómina" size="lg">
          {nominaModal && <NominaModal empleado={nominaModal} onClose={() => setNominaModal(null)} />}
        </Modal>
      </ModuleGuard>
    </Layout>
  )
}
