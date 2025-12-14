import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Customer } from '../api'
import { getCurrentCustomer } from '../api'

interface AuthContextType {
  isAuthenticated: boolean
  customer: Customer | null
  loading: boolean
  setCustomer: (customer: Customer | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('jwt')
    if (token) {
      setIsAuthenticated(true)
      // Fetch current customer info
      getCurrentCustomer()
        .then((customerData) => {
          setCustomer(customerData)
        })
        .catch(() => {
          localStorage.removeItem('jwt')
          setIsAuthenticated(false)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const logout = () => {
    localStorage.removeItem('jwt')
    setIsAuthenticated(false)
    setCustomer(null)
  }

  const handleSetCustomer = (customerData: Customer | null) => {
    setCustomer(customerData)
    setIsAuthenticated(!!customerData)
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        customer,
        loading,
        setCustomer: handleSetCustomer,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

