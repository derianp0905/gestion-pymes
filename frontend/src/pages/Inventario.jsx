import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import ModuleGuard from '../components/ModuleGuard'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import api from '../api/client'
import { Plus, Package, AlertTriangle, Pencil, Trash2, TrendingUp, Search, Minus } from 'lucide-react'

const CATEGORIAS_COMUNES = ['Abarrotes', 'Bebidas', 'Limpieza', 'Electrónica', 'Ropa', 'Herramientas', 'Medicamentos', 'Otros']

function ProductoForm({ initial = {}, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    nombre: '', sku: '', categoria: '', descripcion: '',
    precio_compra: '', precio_venta: '', stock_actual: 0, stock_minimo: 0,
    ...initial,
  })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const margen = form.precio_venta && form.precio_compra
    ? ((parseFloat(form.precio_venta) - parseFloat(form.precio_compra)) / parseFloat(form.precio_venta) * 100).toFixed(1)
    : null

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <div>
          <label className="eyebrow" style={{ marginBottom: 6 }}>Nombre del producto *</label>
          <input className="input" value={form.nombre} onChange={set('nombre')} placeholder="Ej. Aceite vegetal 1L" required />
        </div>
        <div>
          <label className="eyebrow" style={{ marginBottom: 6 }}>SKU</label>
          <input className="input" value={form.sku ?? ''} onChange={set('sku')} placeholder="ABA-001" />
        </div>
      </div>
      <div>
        <label className="eyebrow" style={{ marginBottom: 6 }}>Categoría</label>
        <select className="input" value={form.categoria ?? ''} onChange={set('categoria')}>
          <option value="">— Sin categoría —</option>
          {CATEGORIAS_COMUNES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="eyebrow" style={{ marginBottom: 6 }}>Precio de compra</label>
          <input className="input" type="number" min="0" step="0.01" value={form.precio_compra ?? ''} onChange={set('precio_compra')} placeholder="0.00" />
        </div>
        <div>
          <label className="eyebrow" style={{ marginBottom: 6 }}>Precio de venta *</label>
          <input className="input" type="number" min="0" step="0.01" value={form.precio_venta ?? ''} onChange={set('precio_venta')} placeholder="0.00" required />
        </div>
      </div>
      {margen && (
        <div style={{ padding: '8px 14px', background: 'rgba(52,211,153,.1)', border: '1px solid rgba(52,211,153,.2)', borderRadius: 10, fontSize: 13, color: 'var(--green)' }}>
          Margen bruto: <b>{margen}%</b>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="eyebrow" style={{ marginBottom: 6 }}>Stock actual</label>
          <input className="input" type="number" min="0" step="1" value={form.stock_actual ?? 0} onChange={set('stock_actual')} />
        </div>
        <div>
          <label className="eyebrow" style={{ marginBottom: 6 }}>Stock mínimo</label>
          <input className="input" type="number" min="0" step="1" value={form.stock_minimo ?? 0} onChange={set('stock_minimo')} />
          <span className="muted sm" style={{ marginTop: 4, display: 'block' }}>Alerta cuando baje de este nivel</span>
        </div>
      </div>
      <div>
        <label className="eyebrow" style={{ marginBottom: 6 }}>Descripción</label>
        <textarea className="input" rows={2} value={form.descripcion ?? ''} onChange={set('descripcion')} placeholder="Descripción del producto..." />
      </div>
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>
          {loading ? <span style={{ width: 16, height: 16, border: '2px solid rgba(6,40,31,.3)', borderTopColor: '#06281f', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> : 'Guardar producto'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
      </div>
    </form>
  )
}

function AjusteStockModal({ producto, onSave, onCancel, loading }) {
  const [cantidad, setCantidad] = useState(0)
  const [tipo, setTipo] = useState('entrada')
  const delta = tipo === 'entrada' ? Math.abs(cantidad) : -Math.abs(cantidad)
  const nuevo = (producto.stock_actual || 0) + delta

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ padding: '14px', background: 'var(--surface-2)', borderRadius: 12, border: '1px solid var(--border-soft)' }}>
        <p className="muted sm" style={{ marginBottom: 4 }}>{producto.nombre}</p>
        <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'JetBrains Mono', margin: 0 }}>Stock: <span style={{ color: producto.stock_bajo ? 'var(--coral)' : 'var(--green)' }}>{producto.stock_actual}</span></p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[['entrada', '↑ Entrada'], ['salida', '↓ Salida']].map(([v, l]) => (
          <button key={v} type="button" onClick={() => setTipo(v)}
            style={{ padding: '10px', borderRadius: 11, fontSize: 13.5, fontWeight: 600, border: `2px solid ${tipo === v ? (v === 'entrada' ? '#34D399' : '#FB7185') : 'var(--border-soft)'}`, background: tipo === v ? (v === 'entrada' ? 'rgba(52,211,153,.12)' : 'rgba(251,113,133,.12)') : 'transparent', color: tipo === v ? (v === 'entrada' ? '#34D399' : '#FB7185') : 'var(--text-3)', cursor: 'pointer', transition: '.14s' }}>
            {l}
          </button>
        ))}
      </div>
      <div>
        <label className="eyebrow" style={{ marginBottom: 6 }}>Cantidad</label>
        <input className="input" type="number" min="1" step="1" value={Math.abs(cantidad) || ''} onChange={e => setCantidad(parseInt(e.target.value) || 0)} placeholder="0" />
      </div>
      {cantidad !== 0 && (
        <div style={{ padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 10, display: 'flex', justifyContent: 'space-between' }}>
          <span className="muted">Nuevo stock:</span>
          <b style={{ fontFamily: 'JetBrains Mono', color: nuevo < (producto.stock_minimo || 0) ? 'var(--coral)' : 'var(--green)' }}>{nuevo}</b>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn-primary" style={{ flex: 1 }} disabled={loading || !cantidad}
          onClick={() => onSave(delta)}>
          {loading ? '...' : 'Aplicar ajuste'}
        </button>
        <button className="btn-secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  )
}

export default function Inventario() {
  const [productos, setProductos] = useState([])
  const [resumen, setResumen] = useState({ total_productos: 0, stock_bajo: 0, valor_inventario: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [catFiltro, setCatFiltro] = useState('')
  const [soloBajo, setSoloBajo] = useState(false)
  const [modal, setModal] = useState(null)         // null | 'nuevo' | producto
  const [stockModal, setStockModal] = useState(null)

  const load = async () => {
    const params = new URLSearchParams()
    if (catFiltro) params.set('categoria', catFiltro)
    if (soloBajo) params.set('solo_bajo', 'true')
    const [p, r] = await Promise.all([
      api.get('/inventario/?' + params),
      api.get('/inventario/resumen'),
    ])
    setProductos(p.data); setResumen(r.data); setLoading(false)
  }
  useEffect(() => { load() }, [catFiltro, soloBajo])

  const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))]

  const handleSave = async data => {
    setSaving(true)
    try {
      if (modal?.id) await api.put(`/inventario/${modal.id}`, data)
      else await api.post('/inventario/', data)
      await load(); setModal(null)
    } finally { setSaving(false) }
  }
  const handleDelete = async id => {
    if (!confirm('¿Eliminar este producto?')) return
    await api.delete(`/inventario/${id}`); setProductos(ps => ps.filter(p => p.id !== id))
    await load()
  }
  const handleAjuste = async delta => {
    setSaving(true)
    try {
      await api.patch(`/inventario/${stockModal.id}/stock`, { cantidad: delta })
      await load(); setStockModal(null)
    } finally { setSaving(false) }
  }

  const fmt = n => 'RD$' + Number(n).toLocaleString('es-DO', { maximumFractionDigits: 0 })
  const filtered = productos.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.categoria?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout>
      <ModuleGuard module="inventario">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <span className="eyebrow">Control de existencias</span>
            <h2>Inventario</h2>
          </div>
          <button className="btn-primary" onClick={() => setModal('nuevo')}>
            <Plus size={16} /> Nuevo producto
          </button>
        </div>

        {/* Stats */}
        <div className="grid-main" style={{ marginBottom: 20 }}>
          <section className="card span-full split-stats">
            <div>
              <span className="eyebrow"><Package size={11} /> Total SKUs</span>
              <b className="mono big">{resumen.total_productos}</b>
              <span className="muted sm">productos activos</span>
            </div>
            <div>
              <span className="eyebrow" style={{ color: resumen.stock_bajo > 0 ? 'var(--coral)' : undefined }}>
                {resumen.stock_bajo > 0 && <AlertTriangle size={11} />} Stock bajo
              </span>
              <b className="mono big" style={{ color: resumen.stock_bajo > 0 ? 'var(--coral)' : 'var(--green)' }}>{resumen.stock_bajo}</b>
              <span className="muted sm">requieren reposición</span>
            </div>
            <div>
              <span className="eyebrow"><TrendingUp size={11} /> Valor inventario</span>
              <b className="mono big">{fmt(resumen.valor_inventario)}</b>
              <span className="muted sm">a precio de venta</span>
            </div>
            <div>
              <span className="eyebrow">Categorías</span>
              <b className="mono big">{categorias.length}</b>
              <span className="muted sm">distintas</span>
            </div>
          </section>
        </div>

        {/* Alerta stock bajo */}
        {resumen.stock_bajo > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(251,113,133,.1)', border: '1px solid rgba(251,113,133,.25)', borderRadius: 12, marginBottom: 16, cursor: 'pointer' }}
            onClick={() => { setSoloBajo(!soloBajo); setCatFiltro('') }}>
            <AlertTriangle size={16} style={{ color: 'var(--coral)', flexShrink: 0 }} />
            <span style={{ fontSize: 13.5, color: 'var(--coral)', fontWeight: 600 }}>{resumen.stock_bajo} productos con stock bajo</span>
            <span className="pill neg" style={{ marginLeft: 'auto' }}>{soloBajo ? 'Ver todos' : 'Ver solo estos'}</span>
          </div>
        )}

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
            <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input className="input" style={{ paddingLeft: 38 }} placeholder="Buscar por nombre, SKU o categoría..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ width: 180 }} value={catFiltro} onChange={e => { setCatFiltro(e.target.value); setSoloBajo(false) }}>
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <span style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'block' }} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="📦" title={search || catFiltro ? 'Sin resultados' : 'Aún no tienes productos'}
            description="Agrega tu primer producto para comenzar a controlar tu inventario."
            action={!search && !catFiltro && <button className="btn-primary" onClick={() => setModal('nuevo')}><Plus size={16} /> Agregar primer producto</button>}
          />
        ) : (
          <section className="card">
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>{['Producto', 'SKU', 'Categoría', 'Stock', 'P. Compra', 'P. Venta', 'Margen', 'Estado', ''].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const pct = p.stock_minimo > 0 ? Math.min((p.stock_actual / p.stock_minimo) * 100, 100) : 100
                    return (
                      <tr key={p.id}>
                        <td className="strong">{p.nombre}</td>
                        <td className="mono muted">{p.sku || '—'}</td>
                        <td><span className="pill soft">{p.categoria || '—'}</span></td>
                        <td>
                          <div className="cell-stock">
                            <span className="mono sm" style={{ color: p.stock_bajo ? 'var(--coral)' : 'var(--green)' }}>{p.stock_actual}/{p.stock_minimo}</span>
                            <div className="track sm"><span className="fill" style={{ width: `${pct}%`, background: p.stock_bajo ? 'linear-gradient(90deg,#FB7185,#e11d48)' : 'linear-gradient(90deg,#34D399,#10b981)' }} /></div>
                          </div>
                        </td>
                        <td className="mono">{fmt(p.precio_compra)}</td>
                        <td className="mono strong">{fmt(p.precio_venta)}</td>
                        <td className="mono pos">{p.margen_pct}%</td>
                        <td><span className={`pill ${p.stock_bajo ? 'neg' : 'pos'}`}>{p.stock_bajo ? 'Reabastecer' : 'Óptimo'}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => setStockModal(p)} className="btn-ghost" title="Ajustar stock" style={{ color: 'var(--blue)' }}>
                              {p.stock_bajo ? <Plus size={14} /> : <Minus size={14} />}
                            </button>
                            <button onClick={() => setModal(p)} className="btn-ghost" title="Editar"><Pencil size={14} /></button>
                            <button onClick={() => handleDelete(p.id)} className="btn-ghost" style={{ color: 'var(--coral)' }} title="Eliminar"><Trash2 size={14} /></button>
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

        <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Editar producto' : 'Nuevo producto'} size="lg">
          <ProductoForm initial={modal?.id ? modal : {}} onSave={handleSave} onCancel={() => setModal(null)} loading={saving} />
        </Modal>

        <Modal open={!!stockModal} onClose={() => setStockModal(null)} title="Ajuste de stock" size="sm">
          {stockModal && <AjusteStockModal producto={stockModal} onSave={handleAjuste} onCancel={() => setStockModal(null)} loading={saving} />}
        </Modal>
      </ModuleGuard>
    </Layout>
  )
}
