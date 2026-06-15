import { useSubscription } from '../hooks/useSubscription'
import { Lock, Sparkles } from 'lucide-react'

const PLAN_FOR_MODULE = {
  clientes: 'Basic', facturacion: 'Basic', caja: 'Basic',
  inventario: 'Pro', agenda: 'Pro', establo: 'Pro',
  empleados: 'Business', reportes_ia: 'Business', multi_sucursal: 'Business',
}

const PERKS = {
  inventario:    'Control de existencias, alertas de stock bajo y órdenes de compra automáticas.',
  agenda:        'Citas y reservas con recordatorios — ideal para servicios, talleres y clínicas.',
  establo:       'Módulo especializado para la gestión de caballerizas y servicios ecuestres.',
  empleados:     'Gestión de personal y nómina básica, organizada por sucursal.',
  reportes_ia:   'Análisis y recomendaciones automáticas sobre la salud de tu negocio.',
  multi_sucursal:'Administra varias sucursales con métricas comparativas en un solo lugar.',
}

const MODULE_LABELS = {
  clientes: 'Clientes', facturacion: 'Facturación', caja: 'Caja',
  inventario: 'Inventario', agenda: 'Agenda', establo: 'Establo',
  empleados: 'Empleados', reportes_ia: 'Reportes IA', multi_sucursal: 'Multi-sucursal',
}

export default function ModuleGuard({ module, children }) {
  const { hasModule, loading } = useSubscription()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
        <span style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTopColor: 'var(--green)', borderRadius: '50%', display: 'block', animation: 'spin .7s linear infinite' }} />
      </div>
    )
  }

  if (!hasModule(module)) {
    const label   = MODULE_LABELS[module] ?? module
    const reqPlan = PLAN_FOR_MODULE[module] ?? 'Pro'
    const desc    = PERKS[module] ?? 'Actualiza tu plan para acceder a este módulo.'

    return (
      <div className="upgrade">
        <div className="up-icon"><Lock size={26} /></div>
        <span className="pill soft up-plan">Plan {reqPlan}</span>
        <h2>El módulo {label} no está en tu plan</h2>
        <p className="muted">{desc}</p>
        <button className="btn-primary lg" onClick={() => window.location.href = '/perfil-empresa'}>
          <Sparkles size={16} /> Mejorar a {reqPlan}
        </button>
        <span className="muted sm up-foot">Tu plan actual no lo incluye. Cámbialo desde Configuración.</span>
      </div>
    )
  }

  return children
}
