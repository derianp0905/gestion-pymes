import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import ModuleGuard from '../components/ModuleGuard'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import api from '../api/client'
import { Plus, Search, Phone, Mail, MapPin, MoreHorizontal, Pencil, Trash2, Users } from 'lucide-react'

function ClienteForm({ initial = {}, onSave, onCancel, loading }) {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', direccion: '', notas: '', ...initial })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre *</label>
        <input className="input" value={form.nombre} onChange={set('nombre')} placeholder="Nombre completo o razón social" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
          <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="correo@ejemplo.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Teléfono</label>
          <input className="input" value={form.telefono} onChange={set('telefono')} placeholder="+1 809 000 0000" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Dirección</label>
        <input className="input" value={form.direccion} onChange={set('direccion')} placeholder="Calle, ciudad, país" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Notas</label>
        <textarea className="input resize-none" rows={3} value={form.notas} onChange={set('notas')} placeholder="Observaciones adicionales..." />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> : 'Guardar cliente'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
      </div>
    </form>
  )
}

function Avatar({ nombre }) {
  const initials = nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  const colors = ['bg-indigo-100 text-indigo-600', 'bg-emerald-100 text-emerald-600', 'bg-amber-100 text-amber-600', 'bg-violet-100 text-violet-600', 'bg-rose-100 text-rose-600']
  const color = colors[nombre.charCodeAt(0) % colors.length]
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${color}`}>
      {initials}
    </div>
  )
}

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | 'crear' | cliente (para editar)
  const [menuOpen, setMenuOpen] = useState(null)

  const load = () => api.get('/clientes/').then(r => setClientes(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (modal?.id) {
        await api.put(`/clientes/${modal.id}`, data)
      } else {
        await api.post('/clientes/', data)
      }
      await load()
      setModal(null)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
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
        <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-sm border-b border-slate-100 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Clientes</h1>
              <p className="text-sm text-slate-500">{clientes.length} clientes registrados</p>
            </div>
            <button onClick={() => setModal('crear')} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nuevo cliente
            </button>
          </div>
        </div>

        <div className="p-8">
          {/* Search */}
          <div className="relative mb-6 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Buscar por nombre, email o teléfono..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <span className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="👥"
              title={search ? 'Sin resultados' : 'Aún no tienes clientes'}
              description={search ? 'Intenta con otro término de búsqueda.' : 'Agrega tu primer cliente para comenzar a gestionar tus relaciones comerciales.'}
              action={!search && (
                <button onClick={() => setModal('crear')} className="btn-primary flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Agregar primer cliente
                </button>
              )}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map(c => (
                <div key={c.id} className="card p-5 hover:shadow-md transition-shadow relative group">
                  <div className="flex items-start gap-3">
                    <Avatar nombre={c.nombre} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{c.nombre}</h3>
                      {c.email && (
                        <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 truncate">
                          <Mail className="w-3 h-3 shrink-0" /> {c.email}
                        </p>
                      )}
                      {c.telefono && (
                        <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Phone className="w-3 h-3 shrink-0" /> {c.telefono}
                        </p>
                      )}
                      {c.direccion && (
                        <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 shrink-0" /> {c.direccion}
                        </p>
                      )}
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === c.id ? null : c.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {menuOpen === c.id && (
                        <div className="absolute right-0 top-8 bg-white border border-slate-100 rounded-xl shadow-lg z-10 py-1 w-36">
                          <button
                            onClick={() => { setModal(c); setMenuOpen(null) }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Editar
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {c.notas && (
                    <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-50 line-clamp-2">{c.notas}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Modal
          open={!!modal}
          onClose={() => setModal(null)}
          title={modal?.id ? 'Editar cliente' : 'Nuevo cliente'}
        >
          <ClienteForm
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
