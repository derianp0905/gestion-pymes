import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import ModuleGuard from '../components/ModuleGuard'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import api from '../api/client'
import { Plus, Search, Phone, Mail, MapPin, MoreHorizontal, Pencil, Trash2, ChevronRight } from 'lucide-react'

function ClienteForm({ initial = {}, onSave, onCancel, loading }) {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', direccion: '', notas: '', ...initial })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label className="eyebrow" style={{ marginBottom: 6 }}>Nombre *</label>
        <input className="input" value={form.nombre} onChange={set('nombre')} placeholder="Nombre o razón social" required />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="eyebrow" style={{ marginBottom: 6 }}>Email</label>
          <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="correo@ejemplo.com" />
        </div>
        <div>
          <label className="eyebrow" style={{ marginBottom: 6 }}>Teléfono</label>
          <input className="input" value={form.telefono} onChange={set('telefono')} placeholder="+1 809 000 0000" />
        </div>
      </div>
      <div>
        <label className="eyebrow" style={{ marginBottom: 6 }}>Dirección</label>
        <input className="input" value={form.direccion} onChange={set('direccion')} placeholder="Calle, ciudad, país" />
      </div>
      <div>
        <label className="eyebrow" style={{ marginBottom: 6 }}>Notas</label>
        <textarea className="input" rows={3} value={form.notas} onChange={set('notas')} placeholder="Observaciones adicionales..." />
      </div>
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>
          {loading ? <span style={{ width: 16, height: 16, border: '2px solid rgba(6,40,31,.3)', borderTopColor: '#06281f', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> : 'Guardar cliente'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
      </div>
    </form>
  )
}

const GRAD = ['linear-gradient(140deg,#34D399,#10b981)', 'linear-gradient(140deg,#60A5FA,#2563eb)', 'linear-gradient(140deg,#8B86F8,#6d28d9)', 'linear-gradient(140deg,#FBBF24,#d97706)', 'linear-gradient(140deg,#FB7185,#e11d48)']

export default function Clientes() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [menuOpen, setMenuOpen] = useState(null)

  const load = () => api.get('/clientes/').then(r => setClientes(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])
  useEffect(() => {
    if (!menuOpen) return
    const close = () => setMenuOpen(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [menuOpen])

  const handleSave = async data => {
    setSaving(true)
    try {
      if (modal?.id) await api.put(`/clientes/${modal.id}`, data)
      else await api.post('/clientes/', data)
      await load(); setModal(null)
    } finally { setSaving(false) }
  }
  const handleDelete = async id => {
    if (!confirm('¿Eliminar este cliente?')) return
    await api.delete(`/clientes/${id}`)
    setClientes(cs => cs.filter(c => c.id !== id))
    setMenuOpen(null)
  }

  const filtered = clientes.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.telefono?.includes(search)
  )

  return (
    <Layout>
      <ModuleGuard module="clientes">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <span className="eyebrow">Base de clientes</span>
            <h2>{clientes.length} clientes registrados</h2>
          </div>
          <button className="btn-primary" onClick={() => setModal('crear')}>
            <Plus size={16} /> Nuevo cliente
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 340, marginBottom: 20 }}>
          <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input className="input" style={{ paddingLeft: 38 }} placeholder="Buscar por nombre, email o teléfono..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <span style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'block' }} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="👥" title={search ? 'Sin resultados' : 'Aún no tienes clientes'}
            description={search ? 'Intenta con otro término de búsqueda.' : 'Agrega tu primer cliente para comenzar a gestionar tus relaciones comerciales.'}
            action={!search && <button className="btn-primary" onClick={() => setModal('crear')}><Plus size={16} /> Agregar primer cliente</button>}
          />
        ) : (
          <div className="cli-grid">
            {filtered.map(c => (
              <section key={c.id} className="card cli" style={{ cursor: 'pointer' }} onClick={() => navigate(`/clientes/${c.id}`)}>
                <div className="cli-head">
                  <div className="avatar lg" style={{ background: GRAD[c.id % GRAD.length], color: '#fff' }}>
                    {c.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                    <button className="btn-ghost" onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === c.id ? null : c.id) }}>
                      <MoreHorizontal size={17} />
                    </button>
                    {menuOpen === c.id && (
                      <div style={{ position: 'absolute', right: 0, top: 34, background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,.4)', zIndex: 20, width: 148, padding: '4px 0' }}>
                        <button onClick={() => { setModal(c); setMenuOpen(null) }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', fontSize: 13.5, color: 'var(--text-2)', background: 'none', cursor: 'pointer', transition: '.12s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                          <Pencil size={13} /> Editar
                        </button>
                        <button onClick={() => handleDelete(c.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', fontSize: 13.5, color: 'var(--coral)', background: 'none', cursor: 'pointer', transition: '.12s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(251,113,133,.08)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                          <Trash2 size={13} /> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="cli-name">{c.nombre}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                  {c.email && <span className="muted sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Mail size={11} />{c.email}</span>}
                  {c.telefono && <span className="muted sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={11} />{c.telefono}</span>}
                  {c.direccion && <span className="muted sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={11} />{c.direccion}</span>}
                </div>
                <div className="cli-stats">
                  <div>
                    <span className="muted sm">Historial</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--green)', fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>
                      <ChevronRight size={13} /> Ver facturas
                    </div>
                  </div>
                </div>
                {c.notas && <p className="muted sm" style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-soft)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.notas}</p>}
              </section>
            ))}
          </div>
        )}

        <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Editar cliente' : 'Nuevo cliente'}>
          <ClienteForm initial={modal?.id ? modal : {}} onSave={handleSave} onCancel={() => setModal(null)} loading={saving} />
        </Modal>
      </ModuleGuard>
    </Layout>
  )
}
