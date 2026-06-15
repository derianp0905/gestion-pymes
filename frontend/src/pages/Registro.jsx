import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowRight, Eye, EyeOff, Check } from 'lucide-react'

const PLANES = [
  {
    name: 'Basic',
    price: '$15',
    desc: 'Para empezar',
    color: 'var(--border-soft)',
    accent: 'var(--text-3)',
    modulos: ['Clientes', 'Facturación', 'Caja'],
  },
  {
    name: 'Pro',
    price: '$30',
    desc: 'El más popular',
    color: 'var(--green)',
    accent: 'var(--green)',
    badge: 'Popular',
    modulos: ['Todo Basic', 'Inventario', 'Agenda'],
  },
  {
    name: 'Business',
    price: '$60',
    desc: 'Sin límites',
    color: 'var(--violet)',
    accent: 'var(--violet)',
    modulos: ['Todo Pro', 'Empleados', 'Reportes', 'Multi-sucursal'],
  },
]

export default function Registro() {
  const { registro } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]         = useState({ nombre: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await registro(form.nombre, form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Panel izquierdo — planes ── */}
      <div style={{ display: 'none', width: '55%', background: 'var(--sidebar)', borderRight: '1px solid var(--border-soft)', padding: '48px', flexDirection: 'column', justifyContent: 'space-between' }}
        className="reg-left">

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(140deg,#34D399,#10b981)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#06281f', fontFamily: "'Space Grotesk', sans-serif" }}>G</div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>GestiónOS</span>
        </div>

        <div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 30, color: 'var(--text)', margin: '0 0 8px' }}>Elige tu plan</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 28 }}>14 días gratis en cualquier plan, sin tarjeta de crédito.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {PLANES.map(p => (
              <div key={p.name} style={{ background: 'var(--surface)', border: `1.5px solid ${p.color}`, borderRadius: 16, padding: '20px 16px', position: 'relative' }}>
                {p.badge && (
                  <span style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: 'var(--green)', color: '#06281f', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                    {p.badge}
                  </span>
                )}
                <p style={{ color: 'var(--text-3)', fontSize: 11, marginBottom: 4 }}>{p.desc}</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: '0 0 2px', fontFamily: "'Space Grotesk', sans-serif" }}>
                  {p.price}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-3)' }}>/mes</span>
                </p>
                <p style={{ fontWeight: 600, color: p.accent, fontSize: 13, margin: '0 0 14px' }}>{p.name}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {p.modulos.map(m => (
                    <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Check size={12} style={{ color: 'var(--green)', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: 'var(--text-3)', fontSize: 12 }}>Puedes cambiar de plan en cualquier momento desde tu cuenta.</p>
      </div>

      {/* ── Panel derecho — formulario ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }} className="reg-logo-mobile">
            <div style={{ width: 36, height: 36, background: 'linear-gradient(140deg,#34D399,#10b981)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#06281f', fontFamily: "'Space Grotesk', sans-serif" }}>G</div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>GestiónOS</span>
          </div>

          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 26, color: 'var(--text)', margin: '0 0 6px' }}>Crea tu cuenta</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 32 }}>
            Empieza con el plan Basic gratis por 14 días.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="eyebrow" style={{ marginBottom: 7 }}>Nombre de tu empresa</label>
              <input className="input" type="text" placeholder="Ej: Ferretería Don José"
                value={form.nombre} onChange={set('nombre')} required autoFocus />
            </div>

            <div>
              <label className="eyebrow" style={{ marginBottom: 7 }}>Email</label>
              <input className="input" type="email" placeholder="tu@empresa.com"
                value={form.email} onChange={set('email')} required />
            </div>

            <div>
              <label className="eyebrow" style={{ marginBottom: 7 }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPass ? 'text' : 'password'} placeholder="Mínimo 8 caracteres"
                  value={form.password} onChange={set('password')} required style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 0 }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(251,113,133,.1)', border: '1px solid rgba(251,113,133,.3)', color: 'var(--coral)', fontSize: 13.5, padding: '10px 14px', borderRadius: 10 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary"
              style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading
                ? <span style={{ width: 16, height: 16, border: '2px solid rgba(6,40,31,.3)', borderTopColor: '#06281f', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'block' }} />
                : <><span>Crear cuenta gratis</span><ArrowRight size={16} /></>}
            </button>

            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)' }}>
              Al registrarte aceptas nuestros términos de servicio.
            </p>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-3)', marginTop: 24 }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color: 'var(--green)', fontWeight: 600, textDecoration: 'none' }}>
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .reg-left { display: flex !important; }
          .reg-logo-mobile { display: none !important; }
        }
      `}</style>
    </div>
  )
}
