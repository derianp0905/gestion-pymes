import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import ModuleGuard from '../components/ModuleGuard'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import api from '../api/client'
import { Plus, TrendingUp, TrendingDown, Wallet, Pencil, Trash2 } from 'lucide-react'

const CATEGORIAS = {
  ingreso: ['Ventas', 'Servicios', 'Cobros', 'Otros ingresos'],
  gasto:   ['Proveedores', 'Nómina', 'Alquiler', 'Servicios públicos', 'Marketing', 'Otros gastos'],
}

function MovimientoForm({ initial = {}, onSave, onCancel, loading }) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({ tipo: 'ingreso', categoria: '', descripcion: '', monto: '', fecha: today, notas: '', ...initial })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tipo</label>
        <div className="grid grid-cols-2 gap-2">
          {['ingreso', 'gasto'].map(t => (
            <button key={t} type="button"
              onClick={() => setForm({ ...form, tipo: t, categoria: '' })}
              className={[
                'py-2.5 rounded-xl text-sm font-medium border-2 transition-all',
                form.tipo === t
                  ? t === 'ingreso' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : 'border-rose-500 bg-rose-500/20 text-rose-300'
                  : 'border-slate-700 text-slate-500 hover:border-slate-600',
              ].join(' ')}>
              {t === 'ingreso' ? '↑ Ingreso' : '↓ Gasto'}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Monto *</label>
          <input className="input w-full" type="number" step="0.01" min="0.01" value={form.monto} onChange={set('monto')} placeholder="0.00" required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Fecha *</label>
          <input className="input w-full" type="date" value={form.fecha} onChange={set('fecha')} required />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Descripción *</label>
        <input className="input w-full" value={form.descripcion} onChange={set('descripcion')} placeholder="¿De qué es este movimiento?" required />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Categoría</label>
        <select className="input w-full" value={form.categoria} onChange={set('categoria')}>
          <option value="">— Sin categoría —</option>
          {CATEGORIAS[form.tipo].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Notas</label>
        <textarea className="input w-full resize-none" rows={2} value={form.notas} onChange={set('notas')} placeholder="Detalles adicionales..." />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> : 'Guardar movimiento'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
      </div>
    </form>
  )
}

export default function Caja() {
  const [movimientos, setMovimientos] = useState([])
  const [resumen, setResumen] = useState({ ingresos: 0, gastos: 0, balance: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7))
  const [modal, setModal] = useState(null)

  const load = async () => {
    const params = new URLSearchParams()
    if (filtroTipo) params.set('tipo', filtroTipo)
    if (mes) params.set('mes', mes)
    const [m, r] = await Promise.all([
      api.get('/caja/?' + params),
      api.get('/caja/resumen?' + new URLSearchParams(mes ? { mes } : {})),
    ])
    setMovimientos(m.data)
    setResumen(r.data)
    setLoading(false)
  }
  useEffect(() => { load() }, [filtroTipo, mes])

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (modal?.id) await api.put(`/caja/${modal.id}`, data)
      else await api.post('/caja/', data)
      await load()
      setModal(null)
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este movimiento?')) return
    await api.delete(`/caja/${id}`)
    await load()
  }

  const fmt = (n) => '$' + Number(n).toLocaleString('es-DO', { minimumFractionDigits: 2 })

  return (
    <Layout>
      <ModuleGuard module="caja">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Caja</h1>
            <p className="text-sm text-slate-400">Ingresos y gastos</p>
          </div>
          <button onClick={() => setModal('nuevo')} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Registrar movimiento
          </button>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Ingresos</p>
                <p className="text-xl font-bold text-emerald-400">{fmt(resumen.ingresos)}</p>
              </div>
            </div>
          </div>
          <div className="card border-l-4 border-l-rose-500">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Gastos</p>
                <p className="text-xl font-bold text-rose-400">{fmt(resumen.gastos)}</p>
              </div>
            </div>
          </div>
          <div className={`card border-l-4 ${resumen.balance >= 0 ? 'border-l-indigo-500' : 'border-l-amber-500'}`}>
            <div className="flex items-center gap-3">
              <Wallet className={`w-5 h-5 flex-shrink-0 ${resumen.balance >= 0 ? 'text-indigo-400' : 'text-amber-400'}`} />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Balance</p>
                <p className={`text-xl font-bold ${resumen.balance >= 0 ? 'text-indigo-400' : 'text-amber-400'}`}>{fmt(resumen.balance)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-3 mb-6">
          <input type="month" className="input w-44" value={mes} onChange={e => setMes(e.target.value)} />
          <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1">
            {[['', 'Todos'], ['ingreso', 'Ingresos'], ['gasto', 'Gastos']].map(([v, l]) => (
              <button key={v} onClick={() => setFiltroTipo(v)}
                className={[
                  'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                  filtroTipo === v ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300',
                ].join(' ')}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <span className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
          </div>
        ) : movimientos.length === 0 ? (
          <EmptyState icon="💰" title="Sin movimientos"
            description="Registra tus primeros ingresos o gastos para llevar el control de tu caja."
            action={<button onClick={() => setModal('nuevo')} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Registrar movimiento</button>}
          />
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/60">
                  {['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 first:pl-5 last:pr-5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {movimientos.map(m => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-4 py-3 pl-5 text-sm text-slate-400">
                      {new Date(m.fecha + 'T00:00:00').toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-white max-w-[200px] truncate">{m.descripcion}</td>
                    <td className="px-4 py-3">
                      <span className="badge badge-gray">{m.categoria || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={m.tipo === 'ingreso' ? 'badge badge-green' : 'badge badge-red'}>
                        {m.tipo === 'ingreso' ? '↑ Ingreso' : '↓ Gasto'}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm font-bold ${m.tipo === 'ingreso' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {m.tipo === 'ingreso' ? '+' : '-'}{fmt(m.monto)}
                    </td>
                    <td className="px-4 py-3 pr-5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setModal(m)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(m.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Editar movimiento' : 'Nuevo movimiento'}>
          <MovimientoForm initial={modal?.id ? modal : {}} onSave={handleSave} onCancel={() => setModal(null)} loading={saving} />
        </Modal>
      </ModuleGuard>
    </Layout>
  )
}
