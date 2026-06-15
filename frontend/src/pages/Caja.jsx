import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import ModuleGuard from '../components/ModuleGuard'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import api from '../api/client'
import { Plus, TrendingUp, TrendingDown, Wallet, Search } from 'lucide-react'

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
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo</label>
        <div className="grid grid-cols-2 gap-2">
          {['ingreso', 'gasto'].map(t => (
            <button
              key={t} type="button"
              onClick={() => setForm({ ...form, tipo: t, categoria: '' })}
              className={[
                'py-2.5 rounded-xl text-sm font-medium border-2 transition-all',
                form.tipo === t
                  ? t === 'ingreso' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-rose-500 bg-rose-50 text-rose-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300',
              ].join(' ')}
            >
              {t === 'ingreso' ? '↑ Ingreso' : '↓ Gasto'}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Monto *</label>
          <input className="input" type="number" step="0.01" min="0.01" value={form.monto} onChange={set('monto')} placeholder="0.00" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha *</label>
          <input className="input" type="date" value={form.fecha} onChange={set('fecha')} required />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripción *</label>
        <input className="input" value={form.descripcion} onChange={set('descripcion')} placeholder="¿De qué es este movimiento?" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoría</label>
        <select className="input" value={form.categoria} onChange={set('categoria')}>
          <option value="">— Sin categoría —</option>
          {CATEGORIAS[form.tipo].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Notas</label>
        <textarea className="input resize-none" rows={2} value={form.notas} onChange={set('notas')} placeholder="Detalles adicionales..." />
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

  const fmt = (n) => '$' + Number(n).toLocaleString('es', { minimumFractionDigits: 2 })

  return (
    <Layout>
      <ModuleGuard module="caja">
        <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-sm border-b border-slate-100 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Caja</h1>
              <p className="text-sm text-slate-500">Ingresos y gastos</p>
            </div>
            <button onClick={() => setModal('nuevo')} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Registrar movimiento
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Resumen */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-5 border-l-4 border-l-emerald-400">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-xs text-slate-500">Ingresos</p>
                  <p className="text-xl font-bold text-emerald-600">{fmt(resumen.ingresos)}</p>
                </div>
              </div>
            </div>
            <div className="card p-5 border-l-4 border-l-rose-400">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-5 h-5 text-rose-500" />
                <div>
                  <p className="text-xs text-slate-500">Gastos</p>
                  <p className="text-xl font-bold text-rose-600">{fmt(resumen.gastos)}</p>
                </div>
              </div>
            </div>
            <div className={`card p-5 border-l-4 ${resumen.balance >= 0 ? 'border-l-indigo-400' : 'border-l-amber-400'}`}>
              <div className="flex items-center gap-3">
                <Wallet className={`w-5 h-5 ${resumen.balance >= 0 ? 'text-indigo-500' : 'text-amber-500'}`} />
                <div>
                  <p className="text-xs text-slate-500">Balance</p>
                  <p className={`text-xl font-bold ${resumen.balance >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>{fmt(resumen.balance)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-3">
            <input type="month" className="input w-44" value={mes} onChange={e => setMes(e.target.value)} />
            <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
              {[['', 'Todos'], ['ingreso', 'Ingresos'], ['gasto', 'Gastos']].map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setFiltroTipo(v)}
                  className={[
                    'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                    filtroTipo === v ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800',
                  ].join(' ')}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><span className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>
          ) : movimientos.length === 0 ? (
            <EmptyState icon="💰" title="Sin movimientos" description="Registra tus primeros ingresos o gastos para llevar el control de tu caja." action={<button onClick={() => setModal('nuevo')} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Registrar movimiento</button>} />
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto', ''].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {movimientos.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-500">{new Date(m.fecha + 'T00:00:00').toLocaleDateString('es-419', { day: '2-digit', month: 'short' })}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 max-w-[200px] truncate">{m.descripcion}</td>
                      <td className="px-4 py-3"><span className="badge badge-gray">{m.categoria || '—'}</span></td>
                      <td className="px-4 py-3">
                        <span className={m.tipo === 'ingreso' ? 'badge badge-green' : 'badge badge-red'}>
                          {m.tipo === 'ingreso' ? '↑ Ingreso' : '↓ Gasto'}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-sm font-bold ${m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {m.tipo === 'ingreso' ? '+' : '-'}{fmt(m.monto)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setModal(m)} className="text-xs text-indigo-600 hover:underline">Editar</button>
                          <button onClick={() => handleDelete(m.id)} className="text-xs text-rose-500 hover:underline">Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Editar movimiento' : 'Nuevo movimiento'}>
          <MovimientoForm initial={modal?.id ? modal : {}} onSave={handleSave} onCancel={() => setModal(null)} loading={saving} />
        </Modal>
      </ModuleGuard>
    </Layout>
  )
}
