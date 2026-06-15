import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import ModuleGuard from '../components/ModuleGuard'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import api from '../api/client'
import { Plus, Trash2, Download, PlusCircle, Pencil } from 'lucide-react'

const ESTADOS = ['borrador', 'enviada', 'pagada', 'vencida']
const ESTADO_PILL = {
  borrador: 'soft',
  enviada:  'soft',
  pagada:   'pos',
  vencida:  'neg',
}

const ITBIS_RATE = 0.18
const EMPTY_ITEM = () => ({ descripcion: '', cantidad: 1, precio_unitario: '', descuento_pct: 0 })

function ItemsTable({ items, onChange }) {
  const calcSub = item => {
    const base = (parseFloat(item.cantidad) || 0) * (parseFloat(item.precio_unitario) || 0)
    const desc = base * ((parseFloat(item.descuento_pct) || 0) / 100)
    return (base - desc).toFixed(2)
  }
  const setItem = (idx, field, val) => onChange(items.map((it, i) => i === idx ? { ...it, [field]: val } : it))
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 2fr 2fr 1fr 1fr 24px', gap: 6, padding: '0 4px', marginBottom: 6 }}>
        {['Descripción', 'Cant.', 'Precio', 'Desc%', 'Sub.', ''].map(h => (
          <span key={h} className="eyebrow" style={{ fontSize: 10, marginBottom: 0 }}>{h}</span>
        ))}
      </div>
      {items.map((item, idx) => (
        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '5fr 2fr 2fr 1fr 1fr 24px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
          <input className="input" style={{ fontSize: 13 }} value={item.descripcion} onChange={e => setItem(idx, 'descripcion', e.target.value)} placeholder="Descripción" />
          <input className="input" style={{ fontSize: 13, textAlign: 'right' }} type="number" min="0" step="1" value={item.cantidad} onChange={e => setItem(idx, 'cantidad', e.target.value)} />
          <input className="input" style={{ fontSize: 13, textAlign: 'right' }} type="number" min="0" step="0.01" value={item.precio_unitario} onChange={e => setItem(idx, 'precio_unitario', e.target.value)} placeholder="0.00" />
          <input className="input" style={{ fontSize: 13, textAlign: 'right' }} type="number" min="0" max="100" step="1" value={item.descuento_pct} onChange={e => setItem(idx, 'descuento_pct', e.target.value)} />
          <span className="mono sm" style={{ textAlign: 'right', color: 'var(--text-2)', paddingRight: 4 }}>{calcSub(item)}</span>
          <button type="button" onClick={() => onChange(items.filter((_, i) => i !== idx))} className="btn-ghost" style={{ color: 'var(--coral)', width: 24, height: 24 }} disabled={items.length <= 1}>
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, EMPTY_ITEM()])}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--green)', fontWeight: 600, marginTop: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
        <PlusCircle size={13} /> Agregar ítem
      </button>
    </div>
  )
}

function FacturaForm({ clientes, initial = {}, onSave, onCancel, loading }) {
  const today = new Date().toISOString().slice(0, 10)
  const [itbis, setItbis] = useState(!!(initial.impuesto && Number(initial.impuesto) > 0))
  const [items, setItems] = useState(
    initial.items?.length
      ? initial.items.map(i => ({ descripcion: i.descripcion, cantidad: i.cantidad, precio_unitario: i.precio_unitario, descuento_pct: i.descuento_pct ?? 0 }))
      : [EMPTY_ITEM()]
  )
  const [form, setForm] = useState({
    concepto: '', fecha_vencimiento: '', cliente_id: '',
    subtotal: '0', impuesto: '0', total: '0', estado: 'borrador', notas: '',
    ...Object.fromEntries(Object.entries(initial).filter(([k]) => k !== 'items')),
    fecha: initial.fecha ?? today,
  })

  useEffect(() => {
    const hasContent = items.some(i => i.descripcion || parseFloat(i.precio_unitario) > 0)
    if (!hasContent) return
    const calcSub = item => {
      const base = (parseFloat(item.cantidad) || 0) * (parseFloat(item.precio_unitario) || 0)
      return base - base * ((parseFloat(item.descuento_pct) || 0) / 100)
    }
    const subtotal = items.reduce((s, i) => s + calcSub(i), 0)
    const imp = itbis ? +(subtotal * ITBIS_RATE).toFixed(2) : 0
    setForm(f => ({ ...f, subtotal: subtotal.toFixed(2), impuesto: imp.toFixed(2), total: (subtotal + imp).toFixed(2) }))
  }, [items, itbis])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const handleSubmit = e => { e.preventDefault(); onSave({ ...form, concepto: form.concepto || items[0]?.descripcion || 'Factura', items }) }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="eyebrow" style={{ marginBottom: 6 }}>Fecha *</label>
          <input className="input" type="date" value={form.fecha} onChange={set('fecha')} required />
        </div>
        <div>
          <label className="eyebrow" style={{ marginBottom: 6 }}>Vencimiento</label>
          <input className="input" type="date" value={form.fecha_vencimiento ?? ''} onChange={set('fecha_vencimiento')} />
        </div>
      </div>
      <div>
        <label className="eyebrow" style={{ marginBottom: 6 }}>Cliente</label>
        <select className="input" value={form.cliente_id ?? ''} onChange={set('cliente_id')}>
          <option value="">— Sin cliente —</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>
      <div>
        <label className="eyebrow" style={{ marginBottom: 6 }}>Concepto general</label>
        <input className="input" value={form.concepto ?? ''} onChange={set('concepto')} placeholder="Servicios de diseño, etc." />
      </div>
      <div>
        <label className="eyebrow" style={{ marginBottom: 8 }}>Ítems</label>
        <ItemsTable items={items} onChange={setItems} />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 11, cursor: 'pointer' }}>
        <input type="checkbox" checked={itbis} onChange={e => setItbis(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--green)' }} />
        <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)' }}>Aplicar ITBIS (18%)</span>
        {itbis && form.subtotal && <span className="muted sm" style={{ marginLeft: 'auto' }}>= RD${(parseFloat(form.subtotal) * ITBIS_RATE).toFixed(2)}</span>}
        {itbis && <span className="pill soft" style={{ marginLeft: itbis && form.subtotal ? 0 : 'auto' }}>RD</span>}
      </label>
      <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid var(--border-soft)' }}>
        {[['Subtotal', form.subtotal || '0'], ['ITBIS (18%)', form.impuesto || '0']].map(([l, v]) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
            <span className="muted">{l}</span>
            <span>RD${parseFloat(v).toFixed(2)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, borderTop: '1px solid var(--border-soft)', paddingTop: 10, marginTop: 2 }}>
          <span>Total</span>
          <span style={{ color: 'var(--green)' }} className="mono">RD${parseFloat(form.total || 0).toFixed(2)}</span>
        </div>
      </div>
      <div>
        <label className="eyebrow" style={{ marginBottom: 6 }}>Estado</label>
        <select className="input" value={form.estado} onChange={set('estado')}>
          {ESTADOS.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
        </select>
      </div>
      <div>
        <label className="eyebrow" style={{ marginBottom: 6 }}>Notas</label>
        <textarea className="input" rows={2} value={form.notas ?? ''} onChange={set('notas')} placeholder="Condiciones de pago..." />
      </div>
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>
          {loading ? <span style={{ width: 16, height: 16, border: '2px solid rgba(6,40,31,.3)', borderTopColor: '#06281f', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> : 'Guardar factura'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
      </div>
    </form>
  )
}

export default function Facturacion() {
  const [facturas, setFacturas] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modal, setModal] = useState(null)

  const load = async () => {
    const [f, c] = await Promise.all([api.get('/facturacion/'), api.get('/clientes/')])
    setFacturas(f.data); setClientes(c.data); setLoading(false)
  }
  useEffect(() => { load() }, [])

  const handleSave = async data => {
    setSaving(true)
    try {
      if (modal?.id) await api.put(`/facturacion/${modal.id}`, data)
      else await api.post('/facturacion/', data)
      await load(); setModal(null)
    } finally { setSaving(false) }
  }
  const handleDelete = async id => {
    if (!confirm('¿Eliminar esta factura?')) return
    await api.delete(`/facturacion/${id}`); setFacturas(fs => fs.filter(f => f.id !== id))
  }
  const handlePdf = (id, numero) => {
    const token = localStorage.getItem('token')
    fetch(`/api/v1/facturacion/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob()).then(blob => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `factura-${numero}.pdf`; a.click() })
  }

  const filtered = facturas.filter(f => {
    const ms = (f.concepto || '').toLowerCase().includes(search.toLowerCase()) || (f.numero || '').includes(search)
    const me = !filtroEstado || f.estado === filtroEstado
    return ms && me
  })
  const fmt = n => 'RD$' + Number(n).toLocaleString('es-DO', { maximumFractionDigits: 0 })
  const totalPagadas = facturas.filter(f => f.estado === 'pagada').reduce((s, f) => s + Number(f.total), 0)
  const totalPendientes = facturas.filter(f => f.estado === 'enviada').reduce((s, f) => s + Number(f.total), 0)

  return (
    <Layout>
      <ModuleGuard module="facturacion">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <span className="eyebrow">Documentos comerciales</span>
            <h2>Facturación</h2>
          </div>
          <button className="btn-primary" onClick={() => setModal('nueva')}>
            <Plus size={16} /> Nueva factura
          </button>
        </div>

        <div className="grid-main" style={{ marginBottom: 20 }}>
          <section className="card span-full split-stats">
            <div>
              <span className="eyebrow">Facturado hoy</span>
              <b className="mono big">{fmt(facturas.reduce((s, f) => s + Number(f.total), 0))}</b>
              <span className="muted sm">{facturas.length} documentos</span>
            </div>
            <div>
              <span className="eyebrow">Ticket promedio</span>
              <b className="mono big">{facturas.length ? fmt(facturas.reduce((s, f) => s + Number(f.total), 0) / facturas.length) : 'RD$0'}</b>
            </div>
            <div>
              <span className="eyebrow">Por cobrar</span>
              <b className="mono big warn">{fmt(totalPendientes)}</b>
              <span className="muted sm warn">enviadas</span>
            </div>
            <div>
              <span className="eyebrow">Cobradas</span>
              <b className="mono big pos">{fmt(totalPagadas)}</b>
              <span className="muted sm">{facturas.filter(f => f.estado === 'pagada').length} facturas</span>
            </div>
          </section>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
            <input className="input" placeholder="Buscar por concepto o número..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ width: 180 }} value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <span style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'block' }} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="🧾" title="Sin facturas" description="Crea tu primera factura para empezar a registrar tus cobros."
            action={<button className="btn-primary" onClick={() => setModal('nueva')}><Plus size={16} /> Crear factura</button>}
          />
        ) : (
          <section className="card">
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>{['Folio', 'Cliente', 'Fecha', 'Artículos', 'Total', 'Estado', ''].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filtered.map(f => {
                    const cliente = clientes.find(c => c.id === f.cliente_id)
                    const pill = ESTADO_PILL[f.estado] ?? 'soft'
                    const itemCount = f.items?.length ?? '—'
                    return (
                      <tr key={f.id}>
                        <td className="mono muted">#{f.numero}</td>
                        <td className="strong">{cliente?.nombre ?? '—'}</td>
                        <td className="muted">{f.fecha ? new Date(f.fecha + 'T00:00:00').toLocaleDateString('es-DO') : '—'}</td>
                        <td className="mono">{itemCount}</td>
                        <td className="mono strong">{fmt(f.total)}</td>
                        <td><span className={`pill ${pill}`}>{f.estado.charAt(0).toUpperCase() + f.estado.slice(1)}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => setModal(f)} className="btn-ghost" title="Editar"><Pencil size={14} /></button>
                            <button onClick={() => handlePdf(f.id, f.numero)} className="btn-ghost" style={{ color: 'var(--blue)' }} title="Descargar PDF"><Download size={14} /></button>
                            <button onClick={() => handleDelete(f.id)} className="btn-ghost" style={{ color: 'var(--coral)' }} title="Eliminar"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Editar factura' : 'Nueva factura'} size="xl">
          <FacturaForm clientes={clientes} initial={modal?.id ? modal : {}} onSave={handleSave} onCancel={() => setModal(null)} loading={saving} />
        </Modal>
      </ModuleGuard>
    </Layout>
  )
}
