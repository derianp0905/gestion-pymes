import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowRight, Eye, EyeOff, BarChart2, Users, FileText, Package } from 'lucide-react'

const FEATURES = [
  { icon: BarChart2, text: 'Dashboard con métricas en tiempo real' },
  { icon: Users,    text: 'Gestión de clientes y facturación' },
  { icon: FileText, text: 'Control de caja e ingresos' },
  { icon: Package,  text: 'Inventario, agenda y más módulos' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate   = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const role = await login(form.email, form.password)
      navigate(role === 'superadmin' ? '/superadmin' : '/dashboard')
    } catch {
      setError('Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Panel izquierdo — branding ── */}
      <div style={{ display: 'none', width: '48%', background: 'var(--sidebar)', borderRight: '1px solid var(--border-soft)', padding: '48px', flexDirection: 'column', justifyContent: 'space-between' }}
        className="auth-left">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(140deg,#34D399,#10b981)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#06281f', fontFamily: "'Space Grotesk', sans-serif" }}>G</div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>GestiónOS</span>
        </div>

        {/* Tagline */}
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 36, lineHeight: 1.15, color: 'var(--text)', margin: '0 0 14px' }}>
            Administra tu negocio<br />desde un solo lugar
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 16, marginBottom: 40 }}>
            La plataforma modular para PYMES en Latinoamérica.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, background: 'rgba(52,211,153,.12)', border: '1px solid rgba(52,211,153,.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} style={{ color: 'var(--green)' }} />
                </div>
                <span style={{ color: 'var(--text-2)', fontSize: 14 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: 'var(--text-3)', fontSize: 12 }}>© 2026 GestiónOS. Todos los derechos reservados.</p>
      </div>

      {/* ── Panel derecho — formulario ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>

          {/* Logo mobile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }} className="auth-logo-mobile">
            <div style={{ width: 36, height: 36, background: 'linear-gradient(140deg,#34D399,#10b981)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#06281f', fontFamily: "'Space Grotesk', sans-serif" }}>G</div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>GestiónOS</span>
          </div>

          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 26, color: 'var(--text)', margin: '0 0 6px' }}>Bienvenido de vuelta</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 32 }}>Ingresa a tu cuenta para continuar</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="eyebrow" style={{ marginBottom: 7 }}>Email</label>
              <input className="input" type="email" placeholder="tu@empresa.com"
                value={form.email} onChange={set('email')} required autoFocus />
            </div>

            <div>
              <label className="eyebrow" style={{ marginBottom: 7 }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPass ? 'text' : 'password'} placeholder="••••••••"
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
                : <><span>Iniciar sesión</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-3)', marginTop: 28 }}>
            ¿No tienes cuenta?{' '}
            <Link to="/registro" style={{ color: 'var(--green)', fontWeight: 600, textDecoration: 'none' }}>
              Empieza gratis
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .auth-left { display: flex !important; }
          .auth-logo-mobile { display: none !important; }
        }
      `}</style>
    </div>
  )
}
