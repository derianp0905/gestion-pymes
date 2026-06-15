import { useEffect, useState } from 'react'
import api from '../api/client'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import {
  Building2, TrendingUp, Activity, Search, RefreshCw,
  ShieldAlert, DollarSign, Users, Clock, Ban, Settings
} from 'lucide-react'

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_LABEL = { active: 'Activo', trial: 'Trial', expired: 'Expirado', blocked: 'Bloqueado' }
const STATUS_BADGE = {
  active:  'badge badge-green',
  trial:   'badge badge-yellow',
  expired: 'badge badge-red',
  blocked: 'badge badge-red',
}
const STATUS_DOT = {
  active: 'bg-emerald-500', trial: 'bg-amber-500',
  expired: 'bg-rose-500',   blocked: 'bg-rose-500',
}
const PLANES = ['Basic', 'Pro', 'Business']

// ── Subcomponents ─────────────────────────────────────────────────────────────

function MetricCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function TenantAvatar({ nombre }) {
  const colors = [
    'bg-indigo-100 text-indigo-700', 'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',   'bg-violet-100 text-violet-700',
    'bg-rose-100 text-rose-700',
  ]
  const color = colors[nombre.charCodeAt(0) % colors.length]
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${color}`}>
      {nombre.charAt(0).toUpperCase()}
    </div>
  )
}

// ── Modal de gestión ──────────────────────────────────────────────────────────

function GestionModal({ tenant, onClose, onSaved }) {
  const [form, setForm] = useState({
    plan_name: tenant.plan ?? 'Basic',
    status: tenant.suscripcion_status ?? 'trial',
    activo: tenant.activo,
    trial_days: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [k]: val }))
  }

  const handleSave = async () => {
    setError('')
    setLoading(true)
    try {
      const body = {
        plan_name: form.plan_name,
        status: form.status,
        activo: form.activo,
      }
      if (form.trial_days !== '' && form.trial_days !== '0') {
        body.trial_days = parseInt(form.trial_days)
      }
      const { data } = await api.patch(`/superadmin/tenants/${tenant.id}/gestionar`, body)
      onSaved(data)
      onClose()
    } catch (e) {
      setError(e.response?.data?.detail ?? 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const planColors = { Basic: 'border-slate-300', Pro: 'border-indigo-500', Business: 'border-violet-500' }
  const planDesc   = { Basic: '$15/mes · 2 usuarios', Pro: '$30/mes · 5 usuarios', Business: '$60/mes · ilimitados' }

  return (
    <div className="space-y-5">
      {/* Tenant info */}
      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
        <TenantAvatar nombre={tenant.nombre} />
        <div>
          <p className="font-semibold text-slate-900">{tenant.nombre}</p>
          <p className="text-xs text-slate-500">{tenant.email}</p>
        </div>
      </div>

      {/* Plan */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Plan de suscripción</label>
        <div className="grid grid-cols-3 gap-2">
          {PLANES.map(p => (
            <button
              key={p} type="button"
              onClick={() => setForm(f => ({ ...f, plan_name: p }))}
              className={[
                'py-3 px-2 rounded-xl border-2 text-sm font-medium transition-all text-center',
                form.plan_name === p
                  ? `${planColors[p]} bg-indigo-50 text-indigo-700`
                  : 'border-slate-200 text-slate-500 hover:border-slate-300',
              ].join(' ')}
            >
              <p className="font-bold">{p}</p>
              <p className="text-xs font-normal mt-0.5 text-slate-500">{planDesc[p].split('·')[0].trim()}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Estado de suscripción */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Estado de suscripción</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(STATUS_LABEL).map(([val, label]) => (
            <button
              key={val} type="button"
              onClick={() => setForm(f => ({ ...f, status: val }))}
              className={[
                'py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-2',
                form.status === val
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300',
              ].join(' ')}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[val]}`} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Extender trial */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Extender trial <span className="font-normal text-slate-400">(días desde hoy)</span>
        </label>
        <div className="flex gap-2">
          {[7, 14, 30].map(d => (
            <button
              key={d} type="button"
              onClick={() => setForm(f => ({ ...f, trial_days: String(d), status: 'trial' }))}
              className={[
                'px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                form.trial_days === String(d)
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300',
              ].join(' ')}
            >
              {d} días
            </button>
          ))}
          <input
            type="number" min="1" max="365"
            placeholder="Custom"
            value={['7','14','30'].includes(form.trial_days) ? '' : form.trial_days}
            onChange={(e) => setForm(f => ({ ...f, trial_days: e.target.value, status: 'trial' }))}
            className="input w-28 text-sm"
          />
        </div>
      </div>

      {/* Cuenta activa */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
        <div>
          <p className="text-sm font-semibold text-slate-700">Cuenta activa</p>
          <p className="text-xs text-slate-500">Desactivar impide el acceso al sistema</p>
        </div>
        <button
          type="button"
          onClick={() => setForm(f => ({ ...f, activo: !f.activo }))}
          className={[
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            form.activo ? 'bg-emerald-500' : 'bg-slate-300',
          ].join(' ')}
        >
          <span className={[
            'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
            form.activo ? 'translate-x-6' : 'translate-x-1',
          ].join(' ')} />
        </button>
      </div>

      {!form.activo && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
          <Ban className="w-4 h-4 shrink-0" />
          La cuenta quedará bloqueada y el usuario no podrá iniciar sesión.
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">{error}</div>
      )}

      <div className="flex gap-3 pt-1">
        <button onClick={handleSave} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : 'Guardar cambios'}
        </button>
        <button onClick={onClose} className="btn-secondary">Cancelar</button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SuperAdmin() {
  const [tenants, setTenants] = useState([])
  const [metricas, setMetricas] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [managing, setManaging] = useState(null) // tenant seleccionado

  const load = async () => {
    const [t, m] = await Promise.all([
      api.get('/superadmin/tenants'),
      api.get('/superadmin/metricas'),
    ])
    setTenants(t.data)
    setMetricas(m.data)
  }

  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  const refresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const handleSaved = (updated) => {
    setTenants(ts => ts.map(t => t.id === updated.id ? updated : t))
    refresh()
  }

  const filtered = tenants.filter(t => {
    const matchSearch = t.nombre.toLowerCase().includes(search.toLowerCase()) ||
                        t.email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filtroStatus || t.suscripcion_status === filtroStatus
    return matchSearch && matchStatus
  })

  return (
    <Layout>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-sm border-b border-slate-100 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Super Admin</h1>
            <p className="text-sm text-slate-500">Panel de administración de la plataforma</p>
          </div>
          <button onClick={refresh} disabled={refreshing} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Métricas */}
        {metricas && (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <MetricCard label="Total empresas"   value={metricas.total_tenants}          icon={Building2}   color="bg-indigo-50 text-indigo-600" />
            <MetricCard label="Activas"          value={metricas.suscripciones_activas}  icon={TrendingUp}  color="bg-emerald-50 text-emerald-600" />
            <MetricCard label="En trial"         value={metricas.en_trial}               icon={Clock}       color="bg-amber-50 text-amber-600" />
            <MetricCard label="Expiradas"        value={metricas.expirados}              icon={Activity}    color="bg-rose-50 text-rose-500" />
            <MetricCard label="Bloqueadas"       value={metricas.bloqueados}             icon={ShieldAlert} color="bg-slate-100 text-slate-500" />
            <MetricCard
              label="MRR estimado"
              value={'$' + Number(metricas.mrr).toLocaleString('es', { minimumFractionDigits: 0 })}
              icon={DollarSign}
              color="bg-violet-50 text-violet-600"
              sub="solo suscripciones activas"
            />
          </div>
        )}

        {/* Tabla */}
        <div className="card overflow-hidden">
          {/* Filtros */}
          <div className="flex items-center gap-3 p-5 border-b border-slate-100">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text" placeholder="Buscar empresa o email..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="input pl-9 text-sm"
              />
            </div>
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              {[['', 'Todos'], ['active', 'Activos'], ['trial', 'Trial'], ['expired', 'Expirados'], ['blocked', 'Bloqueados']].map(([v, l]) => (
                <button
                  key={v} onClick={() => setFiltroStatus(v)}
                  className={[
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    filtroStatus === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                  ].join(' ')}
                >
                  {l}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400 ml-auto">{filtered.length} empresa{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Empresa', 'Plan', 'Estado', 'Trial / Vencimiento', 'Registro', 'Cuenta', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-slate-100 rounded-lg animate-pulse w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">
                      {search || filtroStatus ? 'Sin resultados para tu búsqueda' : 'No hay empresas registradas aún'}
                    </td>
                  </tr>
                ) : filtered.map(t => (
                  <tr key={t.id} className={`hover:bg-slate-50/60 transition-colors ${!t.activo ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <TenantAvatar nombre={t.nombre} />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{t.nombre}</p>
                          <p className="text-xs text-slate-400">{t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {t.plan
                        ? <span className={`badge ${t.plan === 'Business' ? 'badge-blue' : t.plan === 'Pro' ? 'bg-violet-50 text-violet-700' : 'badge-gray'}`}>{t.plan}</span>
                        : <span className="text-slate-400 text-sm">—</span>
                      }
                    </td>
                    <td className="px-5 py-4">
                      <span className={STATUS_BADGE[t.suscripcion_status] ?? 'badge badge-gray'}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[t.suscripcion_status] ?? 'bg-slate-400'}`} />
                        {STATUS_LABEL[t.suscripcion_status] ?? 'Sin suscripción'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {t.trial_ends_at
                        ? new Date(t.trial_ends_at).toLocaleDateString('es-419', { day: 'numeric', month: 'short', year: 'numeric' })
                        : t.current_period_end
                          ? new Date(t.current_period_end).toLocaleDateString('es-419', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">{t.creado_en}</td>
                    <td className="px-5 py-4">
                      {t.activo
                        ? <span className="badge badge-green"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Activa</span>
                        : <span className="badge badge-red"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />Bloqueada</span>
                      }
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setManaging(t)}
                        className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Gestionar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de gestión */}
      <Modal
        open={!!managing}
        onClose={() => setManaging(null)}
        title="Gestionar membresía"
        size="md"
      >
        {managing && (
          <GestionModal
            tenant={managing}
            onClose={() => setManaging(null)}
            onSaved={handleSaved}
          />
        )}
      </Modal>
    </Layout>
  )
}
