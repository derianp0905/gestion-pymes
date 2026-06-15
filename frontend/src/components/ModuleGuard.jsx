import { useSubscription } from '../hooks/useSubscription'
import { Lock, ArrowRight, Zap } from 'lucide-react'

const PLAN_FOR_MODULE = {
  clientes: 'Basic', facturacion: 'Basic', caja: 'Basic',
  inventario: 'Pro', agenda: 'Pro', establo: 'Pro',
  empleados: 'Business', reportes_ia: 'Business', multi_sucursal: 'Business',
}

const MODULE_INFO = {
  clientes:      { label: 'Clientes',        desc: 'Gestiona tu cartera de clientes, contactos y seguimiento comercial.' },
  facturacion:   { label: 'Facturación',      desc: 'Crea cotizaciones y facturas profesionales en segundos.' },
  caja:          { label: 'Caja',             desc: 'Controla tus ingresos y gastos con reportes automáticos.' },
  inventario:    { label: 'Inventario',       desc: 'Control de stock en tiempo real con alertas de reposición.' },
  agenda:        { label: 'Agenda / Citas',   desc: 'Gestiona citas y servicios con calendario interactivo.' },
  establo:       { label: 'Establo',          desc: 'Módulo especializado para gestión de caballerizas.' },
  empleados:     { label: 'Empleados',        desc: 'Nómina, asistencia y gestión de personal.' },
  reportes_ia:   { label: 'Reportes con IA', desc: 'Análisis avanzado de tu negocio impulsado por inteligencia artificial.' },
  multi_sucursal:{ label: 'Multi-sucursal',  desc: 'Administra múltiples sucursales desde un solo panel.' },
}

export default function ModuleGuard({ module, children }) {
  const { hasModule, loading } = useSubscription()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!hasModule(module)) {
    const info = MODULE_INFO[module] ?? { label: module, desc: '' }
    const plan = PLAN_FOR_MODULE[module] ?? 'Pro'

    return (
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-7 h-7 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">{info.label}</h2>
          <p className="text-slate-500 mb-6">{info.desc}</p>
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-5 mb-6 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-semibold text-indigo-700">Disponible en Plan {plan}</span>
            </div>
            <p className="text-xs text-indigo-600">
              Actualiza tu plan para desbloquear este módulo y muchos más.
            </p>
          </div>
          <a
            href="/upgrade"
            className="btn-primary inline-flex items-center gap-2"
          >
            Ver planes y precios <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    )
  }

  return children
}
