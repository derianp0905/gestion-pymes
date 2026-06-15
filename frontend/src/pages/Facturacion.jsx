import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import ModuleGuard from '../components/ModuleGuard'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import api from '../api/client'
import {
  Plus, FileText, Search, Trash2, Download,
  PlusCircle, CheckCircle2, Clock, AlertCircle, Pencil
} from 'lucide-react'

const ESTADOS = ['borrador', 'enviada', 'pagada', 'vencida']
const ESTADO_CFG = {
  borrador: { cls: 'bg-slate-500/20 text-slate-400 border border-slate-500/30', icon: FileText },
  enviada:  { cls: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30', icon: Clock },
  pagada:   { cls: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', icon: CheckCircle2 },
  vencida:  { cls: 'bg-red-500/20 text-red-400 border border-red-500/30', icon: AlertCircle },
}

const ITBIS_RATE = 0.18
const EMPTY_ITEM = () => ({ descripcion: '', cantidad: 1, precio_unitario: '', descuento_pct: 0 })

// ── Tabla de ítems ────────────────────────────────────────────────────────────
function ItemsTable({ items, onChange }) {
  const calcSub = (item) => {
    const base = (parseFloat(item.cantidad) || 0) * (parseFloat(item.precio_unitario) || 0)
    const desc = base * ((parseFloat(item.descuento_pct) || 0) / 100)
    return (base - desc).toFixed(2)
  }

  const setItem = (idx, field, val) =>
    onChange(items.map((it, i) => i === idx ? { ...it, [field]: val } : it))

  const addRow = () => onChange([...items, EMPTY_ITEM()])
  const removeRow = idx => onChange(items.filter((_, i) => i !== idx))

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-1 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <div className="col-span-5">Descripción</div>
        <div className="col-span-2 text-right">Cant.</div>
        <div className="col-span-2 text-right">Precio</div>
        <div className="col-span-1 text-right">Desc%</div>
        <div className="col-span-1 text-right">Sub.</div>
        <div className="col-span-1" />
      </div>
      {items.map((item, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-1 items-center">
          <input
            className="input col-span-5 text-sm py-1.5"
            value={item.descripcion}
            onChange={e => setItem(idx, 'descripcion', e.target.value)}
            placeholder="Descripción del ítem"
          />
          <input
            className="input col-span-2 text-sm py-1.5 text-right"
            type="number" min="0" step="1"
            value={item.cantidad}
            onChange={e => setItem(idx, 'cantidad', e.target.value)}
          />
          <input
            className="input col-span-2 text-sm py-1.5 text-right"
            type="number" min="0" step="0.01"
            value={item.precio_unitario}
            onChange={e => setItem(idx, 'precio_unitario', e.target.value)}
            placeholder="0.00"
          />
          <input
            className="input col-span-1 text-sm py-1.5 text-right"
            type="number" min="0" max="100" step="1"
            value={item.descuento_pct}
            onChange={e => setItem(idx, 'descuento_pct', e.target.value)}
          />
          <div className="col-span-1 text-right text-sm text-slate-300 font-medium pr-1">
            {calcSub(item)}
          </div>
          <button
            type="button"
            onClick={() => removeRow(idx)}
            className="col-span-1 flex justify-center text-slate-600 hover:text-rose-400 transition-colors"
            disabled={items.length <= 1}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 mt-2 transition-colors"
      >
        <PlusCircle size={13} /> Agregar ítem
      </button>
    </div>
  )
}

// ── FacturaForm ───────────────────────────────────────────────────────────────
function FacturaForm({ clientes, initial = {}, onSave, onCancel, loading }) {
  const today = new Date().toISOString().slice(0, 10)
  const tieneItbis = initial.impuesto && Number(initial.impuesto) > 0
  const [itbis, setItbis] = useState(!!tieneItbis)
  const [items, setItems] = useState(
    initial.items?.length ? initial.items.map(i => ({
      descripcion: i.descripcion,
      cantidad: i.cantidad,
      precio_unitario: i.precio_unitario,
      descuento_pct: i.descuento_pct ?? 0,
    })) : [EMPTY_ITEM()]
  )
  const [form, setForm] = useState({
    concepto: '', fecha_vencimiento: '', cliente_id: '',
    subtotal: '0', impuesto: '0', total: '0', estado: 'borrador', notas: '',
    ...Object.fromEntries(Object.entries(initial).filter(([k]) => k !== 'items')),
    fecha: initial.fecha ?? today,
  })

  // Recalculate subtotal/impuesto/total when items change
  useEffect(() => {
    const calcSub = (item) => {
      const base = (parseFloat(item.cantidad) || 0) * (parseFloat(item.precio_unitario) || 0)
      const desc = base * ((parseFloat(item.descuento_pct) || 0) / 100)
      return base - desc
    }
    const hasContent = items.some(i => i.descripcion || parseFloat(i.precio_unitario) > 0)
    if (!hasContent) return
    const subtotal = items.reduce((s, i) => s + calcSub(i), 0)
    const imp = itbis ? +(subtotal * ITBIS_RATE).toFixed(2) : 0
    const total = +(subtotal + imp).toFixed(2)
    setForm(f => ({
      ...f,
      subtotal: subtotal.toFixed(2),
      impuesto: imp.toFixed(2),
      total: total.toFixed(2),
    }))
  }, [items, itbis])

  const handleItbis = (e) => {
    const checked = e.target.checked
    setItbis(checked)
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    // Use first item description as concepto if empty
    const concepto = form.concepto || items[0]?.descripcion || 'Factura'
    onSave({ ...form, concepto, items })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Fecha *</label>
          <input className="input w-full" type="date" value={form.fecha} onChange={set('fecha')} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Vencimiento</label>
          <input className="input w-full" type="date" value={form.fecha_vencimiento ?? ''} onChange={set('fecha_vencimiento')} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Cliente</label>
        <select className="input w-full" value={form.cliente_id ?? ''} onChange={set('cliente_id')}>
          <option value="">— Sin cliente —</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Concepto / Descripción general</label>
        <input className="input w-full" value={form.concepto ?? ''} onChange={set('concepto')} placeholder="Servicios de diseño web, etc." />
      </div>

      {/* Line items */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Ítems</label>
        <ItemsTable items={items} onChange={setItems} />
      </div>

      {/* ITBIS */}
      <label className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl cursor-pointer select-none hover:bg-slate-700/80 transition-colors border border-slate-700">
        <input
          type="checkbox"
          checked={itbis}
          onChange={handleItbis}
          className="w-4 h-4 rounded accent-indigo-500"
        />
        <div className="flex-1">
          <span className="text-sm font-medium text-slate-200">Aplicar ITBIS (18%)</span>
          {itbis && form.subtotal && (
            <span className="text-xs text-slate-400 ml-2">
              = ${(parseFloat(form.subtotal) * ITBIS_RATE).toFixed(2)}
            </span>
          )}
        </div>
        {itbis && <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/20 px-2 py-1 rounded-lg">RD</span>}
      </label>

      {/* Totals */}
      <div className="bg-slate-800 rounded-xl p-4 space-y-2 border border-slate-700">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Subtotal</span>
          <span className="text-slate-200">${parseFloat(form.subtotal || 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">ITBIS (18%)</span>
          <span className="text-slate-200">${parseFloat(form.impuesto || 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base font-bold border-t border-slate-700 pt-2 mt-2">
          <span className="text-white">Total</span>
          <span className="text-indigo-400">${parseFloat(form.total || 0).toFixed(2)}</span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Estado</label>
        <select className="input w-full" value={form.estado} onChange={set('estado')}>
          {ESTADOS.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Notas</label>
        <textarea className="input w-full resize-none" rows={2} value={form.notas ?? ''} onChange={set('notas')} placeholder="Condiciones, términos de pago..." />
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Facturacion() {
  const [facturas, setFacturas] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modal, setModal] = useState(null)

  const load = async () => {
    const [f, c] = await Promise.all([
      api.get('/facturacion/'),
      api.get('/clientes/'),
    ])
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

  const handlePdf = (facturaId, numero) => {
    const token = localStorage.getItem('token')
    fetch(`/api/v1/facturacion/${facturaId}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.blob()).then(blob => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `factura-${numero}.pdf`
      a.click()
    })
  }

  const filtered = facturas.filter(f => {
    const matchSearch = (f.concepto || '').toLowerCase().includes(search.toLowerCase()) || (f.numero || '').includes(search)
    const matchEstado = !filtroEstado || f.estado === filtroEstado
    return matchSearch && matchEstado
  })

  const totalPagadas = facturas.filter(f => f.estado === 'pagada').reduce((s, f) => s + Number(f.total), 0)
  const totalPendientes = facturas.filter(f => f.estado === 'enviada').reduce((s, f) => s + Number(f.total), 0)

  return (
    <Layout>
      <ModuleGuard module="facturacion">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Facturación</h1>
            <p className="text-sm text-slate-400">{facturas.length} facturas en total</p>
          </div>
          <button onClick={() => setModal('nueva')} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nueva factura
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Cobradas', value: '$' + totalPagadas.toLocaleString('es-DO', { minimumFractionDigits: 2 }), color: 'text-emerald-400', bg: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20' },
            { label: 'Por cobrar', value: '$' + totalPendientes.toLocaleString('es-DO', { minimumFractionDigits: 2 }), color: 'text-amber-400', bg: 'from-amber-500/10 to-amber-600/5 border-amber-500/20' },
            { label: 'Total facturas', value: facturas.length, color: 'text-indigo-400', bg: 'from-indigo-500/10 to-indigo-600/5 border-indigo-500/20' },
          ].map(s => (
            <div key={s.label} className={`card bg-gradient-to-br ${s.bg} border`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input className="input pl-9 w-full" placeholder="Buscar por concepto o número..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-48" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <span className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🧾"
            title="Sin facturas"
            description="Crea tu primera factura para empezar a registrar tus cobros."
            action={<button onClick={() => setModal('nueva')} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Crear factura</button>}
          />
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/60">
                  {['Número', 'Concepto', 'Cliente', 'Fecha', 'Total', 'Estado', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 first:pl-5 last:pr-5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {filtered.map(f => {
                  const cliente = clientes.find(c => c.id === f.cliente_id)
                  const cfg = ESTADO_CFG[f.estado] || ESTADO_CFG.borrador
                  const Icon = cfg.icon
                  return (
                    <tr key={f.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="px-4 py-3 pl-5 text-xs font-mono text-slate-500">{f.numero}</td>
                      <td className="px-4 py-3 text-sm font-medium text-white max-w-[180px] truncate">{f.concepto}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{cliente?.nombre ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {f.fecha ? new Date(f.fecha + 'T00:00:00').toLocaleDateString('es-DO') : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-white">
                        ${Number(f.total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.cls}`}>
                          <Icon size={10} />{f.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 pr-5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setModal(f)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                            title="Editar"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handlePdf(f.id, f.numero)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-700 transition-colors"
                            title="Descargar PDF"
                          >
                            <Download size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(f.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <Modal
          open={!!modal}
          onClose={() => setModal(null)}
          title={modal?.id ? 'Editar factura' : 'Nueva factura'}
          size="xl"
        >
          <FacturaForm
            clientes={clientes}
            initial={modal?.id ? modal : {}}
            onSave={handleSave}
            onCancel={() => setModal(null)}
            loading={saving}
          />
        </Modal>
      </ModuleGuard>
    </Layout>
  )
}
