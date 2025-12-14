import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Snackbar, Alert } from '@mui/material'

type AlertSeverity = 'error' | 'info' | 'success' | 'warning'

interface ToastContextType {
  showToast: (message: string, severity?: AlertSeverity) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState<AlertSeverity>('info')

  const showToast = (msg: string, sev: AlertSeverity = 'info') => {
    setMessage(msg)
    setSeverity(sev)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

