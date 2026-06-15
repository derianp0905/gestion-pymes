import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api/client"
import Layout from "../components/Layout"
import {
  Building2, Save, Loader2, CheckCircle2, Globe, Phone, Mail,
  MapPin, Camera, ArrowLeft,
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

function Field({ label, children }) {
  return (
    <div>
      <label className="eyebrow" style={{ marginBottom: 6, display: 'block' }}>{label}</label>
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
      <div style={{ marginBottom: 28 }}>
        <button onClick={() => navigate(-1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 14px', lineHeight: 1 }}>
          <ArrowLeft size={13} /> Volver
        </button>
        <h2 style={{ margin: '0 0 4px' }}>Perfil de Empresa</h2>
        <p className="muted sm" style={{ margin: 0 }}>Esta información aparece en tus facturas y documentos.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Identidad */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Building2 size={14} style={{ color: 'var(--blue)' }} />
            <span className="eyebrow">Identidad Comercial</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Nombre Comercial">
              <input className="input" style={{ width: '100%' }} value={form.nombre_comercial}
                onChange={e => set("nombre_comercial", e.target.value)}
                placeholder="Mi Empresa S.R.L." />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="RNC / RIF / RUT / NIT">
                <input className="input" style={{ width: '100%' }} value={form.rn_fiscal}
                  onChange={e => set("rn_fiscal", e.target.value)}
                  placeholder="1-23-45678-9" />
              </Field>
              <Field label="Moneda">
                <select className="input" style={{ width: '100%' }} value={form.moneda}
                  onChange={e => set("moneda", e.target.value)}>
                  {MONEDAS.map(m => <option key={m.code} value={m.code}>{m.label}</option>)}
                </select>
              </Field>
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Phone size={14} style={{ color: 'var(--blue)' }} />
            <span className="eyebrow">Información de Contacto</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Teléfono">
              <input className="input" style={{ width: '100%' }} value={form.telefono}
                onChange={e => set("telefono", e.target.value)}
                placeholder="+1 (809) 000-0000" />
            </Field>
            <Field label="Email Comercial">
              <input className="input" style={{ width: '100%' }} type="email" value={form.email_comercial}
                onChange={e => set("email_comercial", e.target.value)}
                placeholder="facturacion@miempresa.com" />
            </Field>
          </div>
        </div>

        {/* Dirección */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <MapPin size={14} style={{ color: 'var(--blue)' }} />
            <span className="eyebrow">Dirección</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Dirección">
              <input className="input" style={{ width: '100%' }} value={form.direccion}
                onChange={e => set("direccion", e.target.value)}
                placeholder="Calle Principal #123, Sector Naco" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Ciudad">
                <input className="input" style={{ width: '100%' }} value={form.ciudad}
                  onChange={e => set("ciudad", e.target.value)}
                  placeholder="Santo Domingo" />
              </Field>
              <Field label="País">
                <select className="input" style={{ width: '100%' }} value={form.pais}
                  onChange={e => set("pais", e.target.value)}>
                  {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
            </div>
          </div>
        </div>

        {/* Logo URL */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Camera size={14} style={{ color: 'var(--blue)' }} />
            <span className="eyebrow">Logo</span>
          </div>
          <Field label="URL del Logo">
            <input className="input" style={{ width: '100%' }} value={form.logo_url}
              onChange={e => set("logo_url", e.target.value)}
              placeholder="https://tuempresa.com/logo.png" />
          </Field>
          {form.logo_url && (
            <div style={{ marginTop: 14, padding: 14, background: 'var(--surface-2)', borderRadius: 12, display: 'inline-block' }}>
              <img src={form.logo_url} alt="Logo preview" style={{ height: 64, objectFit: 'contain' }}
                onError={e => e.currentTarget.style.display = "none"} />
            </div>
          )}
          <p className="muted sm" style={{ marginTop: 8 }}>El logo aparecerá en el encabezado de tus facturas PDF.</p>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
          {saved ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--green)', fontSize: 13.5 }}>
              <CheckCircle2 size={15} /> Cambios guardados
            </div>
          ) : <div />}
          <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 7 }} disabled={saving}>
            {saving ? <Loader2 size={15} style={{ animation: 'spin .7s linear infinite' }} /> : <Save size={15} />}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
    </Layout>
  )
}
