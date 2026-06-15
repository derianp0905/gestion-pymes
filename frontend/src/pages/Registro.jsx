import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Building2, ArrowRight, Eye, EyeOff, Check } from 'lucide-react'

const PLANES = [
  {
    name: 'Basic',
    price: '$15',
    desc: 'Para empezar',
    modulos: ['Clientes', 'Facturación', 'Caja'],
    color: 'border-slate-200',
    badge: '',
  },
  {
    name: 'Pro',
    price: '$30',
    desc: 'El más popular',
    modulos: ['Todo Basic', 'Inventario', 'Agenda', 'Establo'],
    color: 'border-indigo-500',
    badge: 'Popular',
  },
  {
    name: 'Business',
    price: '$60',
    desc: 'Sin límites',
    modulos: ['Todo Pro', 'Empleados', 'Reportes IA', 'Multi-sucursal'],
    color: 'border-slate-200',
    badge: '',
  },
]

export default function Registro() {
  const { registro } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
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
    <div className="min-h-screen flex">
      {/* Left — planes */}
      <div className="hidden lg:flex lg:w-[55%] bg-slate-50 p-12 flex-col justify-between border-r border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">Gestión PYMES</span>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Elige tu plan</h2>
          <p className="text-slate-500 mb-8">14 días gratis en cualquier plan, sin tarjeta de crédito.</p>
          <div className="grid grid-cols-3 gap-4">
            {PLANES.map((p) => (
              <div key={p.name} className={`card p-5 relative border-2 ${p.color}`}>
                {p.badge && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 badge badge-blue text-xs">
                    {p.badge}
                  </span>
                )}
                <p className="text-xs text-slate-500 mb-1">{p.desc}</p>
                <p className="text-2xl font-bold text-slate-900">{p.price}<span className="text-sm font-normal text-slate-500">/mes</span></p>
                <p className="font-semibold text-slate-800 mt-2 mb-3">{p.name}</p>
                <ul className="space-y-1.5">
                  {p.modulos.map((m) => (
                    <li key={m} className="flex items-center gap-2 text-xs text-slate-600">
                      <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-400 text-xs">Puedes cambiar de plan en cualquier momento.</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">Gestión PYMES</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">Crea tu cuenta</h2>
          <p className="text-slate-500 text-sm mb-8">
            Empieza con el plan Basic gratis por 14 días.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre de tu empresa</label>
              <input
                type="text"
                placeholder="Ej: Ferretería Don José"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="input"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="tu@empresa.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Crear cuenta gratis <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <p className="text-center text-xs text-slate-400">
              Al registrarte aceptas nuestros términos de servicio.
            </p>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-700">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
