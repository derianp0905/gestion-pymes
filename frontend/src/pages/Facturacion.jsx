import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import ModuleGuard from '../components/ModuleGuard'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import api from '../api/client'
import { Plus, FileText, Search, ChevronDown } from 'lucide-react'

const ESTADOS = ['borrador', 'enviada', 'pagada', 'vencida']
const ESTADO_BADGE = {
  borrador: 'badge badge-gray',
  enviada:  'badge badge-blue',
  pagada:   'badge badge-green',
  vencida:  'badge badge-red',
}

const ITBIS_RATE = 0.18

function FacturaForm({ clientes, initial = {}, onSave, onCancel, loading }) {
  const today = new Date().toISOString().slice(0, 10)
  const tieneItbis = initial.impuesto && Number(initial.impuesto) > 0
  const [itbis, setItbis] = useState(!!tieneItbis)
  const [form, setForm] = useState({
    concepto: '', fecha_vencimiento: '', cliente_id: '',
    subtotal: '', impuesto: '0', total: '', estado: 'borrador', notas: '',
    ...initial,
    fecha: initial.fecha ?? today,
  })

  const recalcular = (subtotalVal, aplicarItbis) => {
    const sub = parseFloat(subtotalVal) || 0
    const imp = aplicarItbis ? +(sub * ITBIS_RATE).toFixed(2) : 0
    const tot = +(sub + imp).toFixed(2)
    return { impuesto: imp.toFixed(2), total: tot.toFixed(2) }
  }

  const handleSubtotal = (e) => {
    const val = e.target.value
    const { impuesto, total } = recalcular(val, itbis)
    setForm(f => ({ ...f, subtotal: val, impuesto, total }))
  }

  const handleItbis = (e) => {
    const checked = e.target.checked
    setItbis(checked)
    const { impuesto, total } = recalcular(form.subtotal, checked)
    setForm(f => ({ ...f, impuesto, total }))
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha *</label>
          <input className="input" type="date" value={form.fecha} onChange={set('fecha')} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Vencimiento</label>
          <input className="input" type="date" value={form.fecha_vencimiento} onChange={set('fecha_vencimiento')} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Cliente</label>
        <select className="input" value={form.cliente_id} onChange={set('cliente_id')}>
          <option value="">— Sin cliente —</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Concepto *</label>
        <input className="input" value={form.concepto} onChange={set('concepto')} placeholder="Descripción del servicio o producto" required />
      </div>

      {/* Subtotal + ITBIS + Total */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Subtotal</label>
        <input className="input" type="number" step="0.01" min="0" value={form.subtotal} onChange={handleSubtotal} placeholder="0.00" />
      </div>

      <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer select-none hover:bg-slate-100 transition-colors">
        <input
          type="checkbox"
          checked={itbis}
          onChange={handleItbis}
          className="w-4 h-4 rounded accent-indigo-600"
        />
        <div className="flex-1">
          <span className="text-sm font-medium text-slate-700">Aplicar ITBIS (18%)</span>
          {itbis && form.subtotal && (
            <span className="text-xs text-slate-500 ml-2">
              = ${(parseFloat(form.subtotal) * ITBIS_RATE).toFixed(2)}
            </span>
          )}
        </div>
        {itbis && (
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">RD</span>
        )}
      </label>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-1.5">ITBIS</label>
          <input className="input bg-slate-100 text-slate-500 cursor-not-allowed" type="number" step="0.01" value={form.impuesto} readOnly />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Total</label>
          <input className="input bg-indigo-50 text-indigo-700 font-semibold cursor-not-allowed" type="number" step="0.01" value={form.total} readOnly />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Estado</label>
        <select className="input" value={form.estado} onChange={set('estado')}>
          {ESTADOS.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Notas</label>
        <textarea className="input resize-none" rows={2} value={form.notas} onChange={set('notas')} placeholder="Condiciones, términos de pago..." />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> : 'Guardar factura'}
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
    setFacturas(f.data)
    setClientes(c.data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (modal?.id) await api.put(`/facturacion/${modal.id}`, data)
      else await api.post('/facturacion/', data)
      await load()
      setModal(null)
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta factura?')) return
    await api.delete(`/facturacion/${id}`)
    setFacturas(fs => fs.filter(f => f.id !== id))
  }

  const filtered = facturas.filter(f => {
    const matchSearch = f.concepto.toLowerCase().includes(search.toLowerCase()) || f.numero?.includes(search)
    const matchEstado = !filtroEstado || f.estado === filtroEstado
    return matchSearch && matchEstado
  })

  const totalPagadas = facturas.filter(f => f.estado === 'pagada').reduce((s, f) => s + Number(f.total), 0)
  const totalPendientes = facturas.filter(f => f.estado === 'enviada').reduce((s, f) => s + Number(f.total), 0)

  return (
    <Layout>
      <ModuleGuard module="facturacion">
        <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-sm border-b border-slate-100 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Facturación</h1>
              <p className="text-sm text-slate-500">{facturas.length} facturas</p>
            </div>
            <button onClick={() => setModal('nueva')} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nueva factura
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Cobradas', value: '$' + totalPagadas.toLocaleString('es', { minimumFractionDigits: 2 }), color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Por cobrar', value: '$' + totalPendientes.toLocaleString('es', { minimumFractionDigits: 2 }), color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Total facturas', value: facturas.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            ].map(s => (
              <div key={s.label} className={`card p-4 flex items-center gap-3 ${s.bg} border-0`}>
                <div>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className="input pl-9" placeholder="Buscar por concepto o número..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input w-44" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option value="">Todos los estados</option>
              {ESTADOS.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><span className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon="🧾" title="Sin facturas" description="Crea tu primera factura para empezar a registrar tus cobros." action={<button onClick={() => setModal('nueva')} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Crear factura</button>} />
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Número', 'Concepto', 'Cliente', 'Fecha', 'Total', 'Estado', ''].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(f => {
                    const cliente = clientes.find(c => c.id === f.cliente_id)
                    return (
                      <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono text-slate-500">{f.numero}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 max-w-[200px] truncate">{f.concepto}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{cliente?.nombre ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{new Date(f.fecha + 'T00:00:00').toLocaleDateString('es-419')}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">${Number(f.total).toLocaleString('es', { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-3"><span className={ESTADO_BADGE[f.estado] ?? 'badge badge-gray'}>{f.estado}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => setModal(f)} className="text-xs text-indigo-600 hover:underline">Editar</button>
                            <button onClick={() => handleDelete(f.id)} className="text-xs text-rose-500 hover:underline">Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Editar factura' : 'Nueva factura'} size="lg">
          <FacturaForm clientes={clientes} initial={modal?.id ? modal : {}} onSave={handleSave} onCancel={() => setModal(null)} loading={saving} />
        </Modal>
      </ModuleGuard>
    </Layout>
  )
}
