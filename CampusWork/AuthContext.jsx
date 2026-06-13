// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/services'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [role, setRole]       = useState(null)
  const [loading, setLoading] = useState(true)

  // On app load, restore session from localStorage
  useEffect(() => {
    const token      = localStorage.getItem('token')
    const savedUser  = localStorage.getItem('user')
    const savedRole  = localStorage.getItem('role')

    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
      setRole(savedRole)
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const res = await authService.login({ email, password })
    const { user, token, role } = res.data

    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('role', role)

    setUser(user)
    setRole(role)

    return role // return role so caller can redirect
  }

  const register = async (formData) => {
    const res = await authService.register(formData)
    const { user, token, role } = res.data

    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('role', role)

    setUser(user)
    setRole(role)

    return role
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch {
      // Proceed even if API call fails
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('role')
      setUser(null)
      setRole(null)
    }
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook for easy access
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
