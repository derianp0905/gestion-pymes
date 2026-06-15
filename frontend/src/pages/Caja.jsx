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
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label className="eyebrow" style={{ marginBottom: 8 }}>Tipo</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {['ingreso', 'gasto'].map(t => (
            <button key={t} type="button"
              onClick={() => setForm(f => ({ ...f, tipo: t, categoria: '' }))}
              style={{
                padding: '10px', borderRadius: 11, fontSize: 13.5, fontWeight: 600,
                border: `2px solid ${form.tipo === t ? (t === 'ingreso' ? '#34D399' : '#FB7185') : 'var(--border-soft)'}`,
                background: form.tipo === t ? (t === 'ingreso' ? 'rgba(52,211,153,.12)' : 'rgba(251,113,133,.12)') : 'transparent',
                color: form.tipo === t ? (t === 'ingreso' ? '#34D399' : '#FB7185') : 'var(--text-3)',
                transition: '.14s',
              }}>
              {t === 'ingreso' ? '↑ Ingreso' : '↓ Gasto'}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="eyebrow" style={{ marginBottom: 6 }}>Monto *</label>
          <input className="input" type="number" step="0.01" min="0.01" value={form.monto} onChange={set('monto')} placeholder="0.00" required />
        </div>
        <div>
          <label className="eyebrow" style={{ marginBottom: 6 }}>Fecha *</label>
          <input className="input" type="date" value={form.fecha} onChange={set('fecha')} required />
        </div>
      </div>
      <div>
        <label className="eyebrow" style={{ marginBottom: 6 }}>Descripción *</label>
        <input className="input" value={form.descripcion} onChange={set('descripcion')} placeholder="¿De qué es este movimiento?" required />
      </div>
      <div>
        <label className="eyebrow" style={{ marginBottom: 6 }}>Categoría</label>
        <select className="input" value={form.categoria} onChange={set('categoria')}>
          <option value="">— Sin categoría —</option>
          {CATEGORIAS[form.tipo].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="eyebrow" style={{ marginBottom: 6 }}>Notas</label>
        <textarea className="input" rows={2} value={form.notas} onChange={set('notas')} placeholder="Detalles adicionales..." />
      </div>
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>
          {loading ? <span style={{ width: 16, height: 16, border: '2px solid rgba(6,40,31,.3)', borderTopColor: '#06281f', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> : 'Guardar movimiento'}
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
    setMovimientos(m.data); setResumen(r.data); setLoading(false)
  }
  useEffect(() => { load() }, [filtroTipo, mes])

  const handleSave = async data => {
    setSaving(true)
    try {
      if (modal?.id) await api.put(`/caja/${modal.id}`, data)
      else await api.post('/caja/', data)
      await load(); setModal(null)
    } finally { setSaving(false) }
  }
  const handleDelete = async id => {
    if (!confirm('¿Eliminar este movimiento?')) return
    await api.delete(`/caja/${id}`); await load()
  }
  const fmt = n => 'RD$' + Number(n).toLocaleString('es-DO', { maximumFractionDigits: 0 })

  return (
    <Layout>
      <ModuleGuard module="caja">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <span className="eyebrow">Control financiero</span>
            <h2>Caja</h2>
          </div>
          <button className="btn-primary" onClick={() => setModal('nuevo')}>
            <Plus size={16} /> Registrar movimiento
          </button>
        </div>

        {/* Resumen */}
        <div className="grid-main" style={{ marginBottom: 20 }}>
          <section className="card span-full split-stats">
            <div>
              <span className="eyebrow"><TrendingUp size={11} style={{ color: 'var(--green)' }} /> Ingresos del mes</span>
              <b className="mono big pos">{fmt(resumen.ingresos)}</b>
            </div>
            <div>
              <span className="eyebrow"><TrendingDown size={11} style={{ color: 'var(--coral)' }} /> Gastos del mes</span>
              <b className="mono big neg">{fmt(resumen.gastos)}</b>
            </div>
            <div>
              <span className="eyebrow"><Wallet size={11} /> Saldo neto</span>
              <b className={`mono big ${resumen.balance >= 0 ? 'pos' : 'neg'}`}>{fmt(resumen.balance)}</b>
            </div>
            <div>
              <span className="eyebrow">Movimientos</span>
              <b className="mono big">{movimientos.length}</b>
            </div>
          </section>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input type="month" className="input" style={{ width: 168 }} value={mes} onChange={e => setMes(e.target.value)} />
          <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: 11, padding: 4 }}>
            {[['', 'Todos'], ['ingreso', 'Ingresos'], ['gasto', 'Gastos']].map(([v, l]) => (
              <button key={v} onClick={() => setFiltroTipo(v)}
                style={{ padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: filtroTipo === v ? 'var(--text)' : 'var(--text-3)', background: filtroTipo === v ? 'var(--surface-2)' : 'transparent', transition: '.14s' }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <span style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'block' }} />
          </div>
        ) : movimientos.length === 0 ? (
          <EmptyState icon="💰" title="Sin movimientos"
            description="Registra tus primeros ingresos o gastos para llevar el control de tu caja."
            action={<button className="btn-primary" onClick={() => setModal('nuevo')}><Plus size={16} /> Registrar movimiento</button>}
          />
        ) : (
          <section className="card span-full">
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    {['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto', ''].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map(m => (
                    <tr key={m.id} style={{ position: 'relative' }}>
                      <td className="mono muted">{new Date(m.fecha + 'T00:00:00').toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}</td>
                      <td className="strong">{m.descripcion}</td>
                      <td><span className="pill soft">{m.categoria || '—'}</span></td>
                      <td>
                        <span className={m.tipo === 'ingreso' ? 'pill pos' : 'pill neg'}>
                          {m.tipo === 'ingreso' ? '↑ Ingreso' : '↓ Gasto'}
                        </span>
                      </td>
                      <td className={`mono strong ${m.tipo === 'ingreso' ? 'pos' : 'neg'}`}>
                        {m.tipo === 'ingreso' ? '+' : '−'}{fmt(m.monto)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => setModal(m)} className="btn-ghost" title="Editar"><Pencil size={14} /></button>
                          <button onClick={() => handleDelete(m.id)} className="btn-ghost" style={{ color: 'var(--coral)' }} title="Eliminar"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Editar movimiento' : 'Nuevo movimiento'}>
          <MovimientoForm initial={modal?.id ? modal : {}} onSave={handleSave} onCancel={() => setModal(null)} loading={saving} />
        </Modal>
      </ModuleGuard>
    </Layout>
  )
}
