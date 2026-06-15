import { useEffect, useState } from 'react'
import api from '../api/client'
import Layout from '../components/Layout'
import { Building2, Users, TrendingUp, Activity, Search, RefreshCw } from 'lucide-react'

function MetricCard({ label, value, icon: Icon, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  )
}

const STATUS_BADGE = {
  active:  'badge badge-green',
  trial:   'badge badge-yellow',
  expired: 'badge badge-red',
  blocked: 'badge badge-red',
}

export default function SuperAdmin() {
  const [tenants, setTenants] = useState([])
  const [metricas, setMetricas] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    const [t, m] = await Promise.all([
      api.get('/superadmin/tenants'),
      api.get('/superadmin/metricas'),
    ])
    setTenants(t.data)
    setMetricas(m.data)
  }

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [])

  const refresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const filtered = tenants.filter(
    (t) =>
      t.nombre.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <Layout>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-sm border-b border-slate-100 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Super Admin</h1>
            <p className="text-sm text-slate-500">Vista global de la plataforma</p>
          </div>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Métricas */}
        {metricas && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard label="Total empresas" value={metricas.total_tenants} icon={Building2} color="bg-indigo-50 text-indigo-600" />
            <MetricCard label="Suscripciones activas" value={metricas.suscripciones_activas} icon={TrendingUp} color="bg-emerald-50 text-emerald-600" />
            <MetricCard label="En período de trial" value={metricas.en_trial} icon={Activity} color="bg-amber-50 text-amber-600" />
          </div>
        )}

        {/* Tabla */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Empresas registradas</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar empresa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 w-56 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Empresa', 'Email', 'Plan', 'Estado', 'Registro'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <span className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin inline-block" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-400 text-sm">
                      {search ? 'Sin resultados para tu búsqueda' : 'No hay empresas registradas aún'}
                    </td>
                  </tr>
                ) : filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-indigo-600">
                            {t.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-slate-900 text-sm">{t.nombre}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">{t.email}</td>
                    <td className="px-5 py-4">
                      {t.plan
                        ? <span className="badge badge-blue">{t.plan}</span>
                        : <span className="text-slate-400 text-sm">—</span>
                      }
                    </td>
                    <td className="px-5 py-4">
                      <span className={STATUS_BADGE[t.suscripcion_status] ?? 'badge badge-gray'}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          t.suscripcion_status === 'active' ? 'bg-emerald-500' :
                          t.suscripcion_status === 'trial'  ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        {t.suscripcion_status ?? 'sin suscripción'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">{t.creado_en}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
              {filtered.length} empresa{filtered.length !== 1 ? 's' : ''}
              {search && ` · filtrando "${search}"`}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
