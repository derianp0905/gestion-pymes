import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUser({ id: payload.sub, role: payload.role })
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.access_token)
    const payload = JSON.parse(atob(data.access_token.split('.')[1]))
    setUser({ id: payload.sub, role: payload.role })
    return payload.role
  }

  const registro = async (nombre, email, password) => {
    const { data } = await api.post('/auth/registro', { nombre, email, password })
    localStorage.setItem('token', data.access_token)
    const payload = JSON.parse(atob(data.access_token.split('.')[1]))
    setUser({ id: payload.sub, role: payload.role })
    return payload.role
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, registro, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
