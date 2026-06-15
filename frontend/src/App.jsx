import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import ClienteDetalle from './pages/ClienteDetalle'
import Facturacion from './pages/Facturacion'
import Caja from './pages/Caja'
import SuperAdmin from './pages/SuperAdmin'
import PerfilEmpresa from './pages/PerfilEmpresa'
import Inventario from './pages/Inventario'
import Agenda from './pages/Agenda'
import Empleados from './pages/Empleados'
import ModuloPlaceholder from './pages/ModuloPlaceholder'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function SuperAdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'superadmin') return <Navigate to="/dashboard" replace />
  return children
}

const priv = (el) => <PrivateRoute>{el}</PrivateRoute>
const sa   = (el) => <SuperAdminRoute>{el}</SuperAdminRoute>

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/login"    element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          {/* Módulos core */}
          <Route path="/dashboard"        element={priv(<Dashboard />)} />
          <Route path="/clientes"         element={priv(<Clientes />)} />
          <Route path="/clientes/:id"     element={priv(<ClienteDetalle />)} />
          <Route path="/facturacion"      element={priv(<Facturacion />)} />
          <Route path="/caja"             element={priv(<Caja />)} />
          <Route path="/perfil-empresa"   element={priv(<PerfilEmpresa />)} />

          {/* Módulos especializados (Pro+) */}
          <Route path="/inventario"  element={priv(<Inventario />)} />
          <Route path="/agenda"      element={priv(<Agenda />)} />
          <Route path="/establo"     element={priv(<ModuloPlaceholder module="establo" />)} />

          {/* Módulos premium (Business) */}
          <Route path="/empleados"   element={priv(<Empleados />)} />
          <Route path="/reportes"    element={priv(<ModuloPlaceholder module="reportes_ia" />)} />
          <Route path="/sucursales"  element={priv(<ModuloPlaceholder module="multi_sucursal" />)} />

          {/* Super Admin */}
          <Route path="/superadmin"  element={sa(<SuperAdmin />)} />

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
