import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../api/client"
import {
  ArrowLeft, User, Mail, Phone, MapPin, FileText,
  DollarSign, TrendingUp, Clock, CheckCircle2, AlertCircle,
  Download, ChevronRight, Loader2
} from "lucide-react"

const ESTADO_CONFIG = {
  pagada:  { color: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", icon: CheckCircle2 },
  enviada: { color: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30",    icon: Clock },
  borrador:{ color: "bg-slate-500/20 text-slate-400 border border-slate-500/30",       icon: FileText },
  vencida: { color: "bg-red-500/20 text-red-400 border border-red-500/30",             icon: AlertCircle },
}

function StatCard({ label, value, sub, color = "indigo" }) {
  const colors = {
    indigo: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 text-indigo-300",
    emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-300",
    amber: "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-300",
    red: "from-red-500/20 to-red-600/10 border-red-500/30 text-red-300",
  }
  return (
    <div className={`card bg-gradient-to-br ${colors[color]} border`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function ClienteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/facturacion/cliente/${id}/historial`)
      .then(r => setData(r.data))
      .catch(() => navigate("/clientes"))
      .finally(() => setLoading(false))
  }, [id])

  const handlePdf = (facturaId, numero) => {
    const token = localStorage.getItem("token")
    const url = `/api/v1/facturacion/${facturaId}/pdf`
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement("a")
        a.href = URL.createObjectURL(blob)
        a.download = `factura-${numero}.pdf`
        a.click()
      })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
      </div>
    )
  }

  if (!data) return null
  const { cliente, stats, facturas } = data

  const avatarColor = [
    "from-indigo-500 to-purple-600",
    "from-pink-500 to-rose-600",
    "from-amber-500 to-orange-600",
    "from-emerald-500 to-teal-600",
    "from-cyan-500 to-blue-600",
  ][cliente.id % 5]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate("/clientes")}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-6">
        <ArrowLeft size={16} />
        Volver a Clientes
      </button>

      {/* Cliente header */}
      <div className="card mb-6">
        <div className="flex items-start gap-5">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-xl flex-shrink-0`}>
            {cliente.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white truncate">{cliente.nombre}</h1>
            <div className="flex flex-wrap gap-4 mt-2">
              {cliente.email && (
                <span className="flex items-center gap-1.5 text-sm text-slate-400">
                  <Mail size={13} /> {cliente.email}
                </span>
              )}
              {cliente.telefono && (
                <span className="flex items-center gap-1.5 text-sm text-slate-400">
                  <Phone size={13} /> {cliente.telefono}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Facturas" value={stats.total_facturas} color="indigo" />
        <StatCard label="Total Facturado"
          value={`$${Number(stats.total_facturado).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`}
          color="indigo" />
        <StatCard label="Total Cobrado"
          value={`$${Number(stats.total_cobrado).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`}
          color="emerald" />
        <StatCard label="Pendiente"
          value={`$${Number(stats.pendiente).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`}
          color={stats.pendiente > 0 ? "amber" : "emerald"} />
      </div>

      {/* Historial */}
      <div className="card">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileText size={14} className="text-indigo-400" />
          Historial de Facturas
        </h2>

        {facturas.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <FileText size={36} className="mx-auto mb-3 opacity-30" />
            <p>Este cliente no tiene facturas aún.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {facturas.map(f => {
              const cfg = ESTADO_CONFIG[f.estado] || ESTADO_CONFIG.borrador
              const Icon = cfg.icon
              return (
                <div key={f.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors group">
                  <div className="w-9 h-9 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={15} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">{f.numero}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                        <Icon size={10} />
                        {f.estado}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{f.concepto}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-white text-sm">
                      ${Number(f.total).toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-slate-500">{f.fecha ? new Date(f.fecha + "T00:00:00").toLocaleDateString("es-DO") : ""}</p>
                  </div>
                  <button
                    onClick={() => handlePdf(f.id, f.numero)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
                    title="Descargar PDF">
                    <Download size={15} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
