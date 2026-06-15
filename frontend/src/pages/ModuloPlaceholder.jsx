import Layout from '../components/Layout'
import ModuleGuard from '../components/ModuleGuard'

export default function ModuloPlaceholder({ module }) {
  return (
    <Layout>
      <ModuleGuard module={module}>
        <div className="p-8">
          <p className="text-slate-400 text-sm">Módulo en construcción.</p>
        </div>
      </ModuleGuard>
    </Layout>
  )
}
