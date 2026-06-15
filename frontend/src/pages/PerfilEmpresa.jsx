import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api/client"
import Layout from "../components/Layout"
import {
  Building2, Save, Loader2, CheckCircle2, Globe, Phone, Mail,
  MapPin, FileText, DollarSign, Camera, ArrowLeft,
} from "lucide-react"

const PAISES = [
  "República Dominicana", "México", "Colombia", "Argentina", "Chile",
  "Perú", "Venezuela", "Ecuador", "Bolivia", "Paraguay", "Uruguay", "Panamá",
  "Costa Rica", "Guatemala", "Honduras", "El Salvador", "Nicaragua",
]
const MONEDAS = [
  { code: "DOP", label: "DOP — Peso Dominicano" },
  { code: "USD", label: "USD — Dólar Estadounidense" },
  { code: "MXN", label: "MXN — Peso Mexicano" },
  { code: "COP", label: "COP — Peso Colombiano" },
  { code: "ARS", label: "ARS — Peso Argentino" },
  { code: "CLP", label: "CLP — Peso Chileno" },
  { code: "PEN", label: "PEN — Sol Peruano" },
  { code: "EUR", label: "EUR — Euro" },
]

const EMPTY = {
  nombre_comercial: "",
  rn_fiscal: "",
  telefono: "",
  email_comercial: "",
  direccion: "",
  ciudad: "",
  pais: "República Dominicana",
  moneda: "DOP",
  logo_url: "",
}

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon size={12} />}
        {label}
      </label>
      {children}
    </div>
  )
}

export default function PerfilEmpresa() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get("/perfil-empresa/").then(r => {
      setForm({ ...EMPTY, ...Object.fromEntries(Object.entries(r.data).map(([k, v]) => [k, v ?? ""])) })
    }).finally(() => setLoading(false))
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put("/perfil-empresa/", form)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <Loader2 size={32} style={{ color: 'var(--green)', animation: 'spin .8s linear infinite' }} />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button onClick={() => navigate(-1)} className="btn-ghost"
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', padding: '6px 10px' }}>
          <ArrowLeft size={15} /> Volver
        </button>
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Building2 size={18} style={{ color: 'var(--blue)' }} />
          <div>
            <h2 style={{ margin: 0 }}>Perfil de Empresa</h2>
            <p className="muted sm" style={{ margin: 0 }}>Esta información aparece en tus facturas y documentos.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identidad */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-5 flex items-center gap-2">
            <Building2 size={14} className="text-indigo-400" />
            Identidad Comercial
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Field label="Nombre Comercial" icon={Building2}>
                <input className="input w-full" value={form.nombre_comercial}
                  onChange={e => set("nombre_comercial", e.target.value)}
                  placeholder="Mi Empresa S.R.L." />
              </Field>
            </div>
            <Field label="RNC / RIF / RUT / NIT" icon={FileText}>
              <input className="input w-full" value={form.rn_fiscal}
                onChange={e => set("rn_fiscal", e.target.value)}
                placeholder="1-23-45678-9" />
            </Field>
            <Field label="Moneda" icon={DollarSign}>
              <select className="input w-full" value={form.moneda}
                onChange={e => set("moneda", e.target.value)}>
                {MONEDAS.map(m => <option key={m.code} value={m.code}>{m.label}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* Contacto */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-5 flex items-center gap-2">
            <Phone size={14} className="text-indigo-400" />
            Información de Contacto
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Teléfono" icon={Phone}>
              <input className="input w-full" value={form.telefono}
                onChange={e => set("telefono", e.target.value)}
                placeholder="+1 (809) 000-0000" />
            </Field>
            <Field label="Email Comercial" icon={Mail}>
              <input className="input w-full" type="email" value={form.email_comercial}
                onChange={e => set("email_comercial", e.target.value)}
                placeholder="facturacion@miempresa.com" />
            </Field>
          </div>
        </div>

        {/* Dirección */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-5 flex items-center gap-2">
            <MapPin size={14} className="text-indigo-400" />
            Dirección
          </h2>
          <div className="space-y-4">
            <Field label="Dirección" icon={MapPin}>
              <input className="input w-full" value={form.direccion}
                onChange={e => set("direccion", e.target.value)}
                placeholder="Calle Principal #123, Sector Naco" />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Ciudad" icon={MapPin}>
                <input className="input w-full" value={form.ciudad}
                  onChange={e => set("ciudad", e.target.value)}
                  placeholder="Santo Domingo" />
              </Field>
              <Field label="País" icon={Globe}>
                <select className="input w-full" value={form.pais}
                  onChange={e => set("pais", e.target.value)}>
                  {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
            </div>
          </div>
        </div>

        {/* Logo URL */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-5 flex items-center gap-2">
            <Camera size={14} className="text-indigo-400" />
            Logo
          </h2>
          <Field label="URL del Logo" icon={Camera}>
            <input className="input w-full" value={form.logo_url}
              onChange={e => set("logo_url", e.target.value)}
              placeholder="https://tuempresa.com/logo.png" />
          </Field>
          {form.logo_url && (
            <div className="mt-4 p-4 bg-slate-800 rounded-xl inline-block">
              <img src={form.logo_url} alt="Logo preview" className="h-16 object-contain"
                onError={e => e.currentTarget.style.display = "none"} />
            </div>
          )}
          <p className="text-xs text-slate-500 mt-2">El logo aparecerá en el encabezado de tus facturas PDF.</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          {saved && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <CheckCircle2 size={16} />
              Cambios guardados
            </div>
          )}
          {!saved && <div />}
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
    </Layout>
  )
}
