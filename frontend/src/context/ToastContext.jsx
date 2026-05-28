import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

let nextToastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback((toast) => {
    const id = nextToastId += 1
    setToasts((current) => [...current, { id, ...toast }])
    window.setTimeout(() => dismissToast(id), toast.duration || 3500)
    return id
  }, [dismissToast])

  const state = useMemo(() => ({ toasts, pushToast, dismissToast }), [toasts, pushToast, dismissToast])

  return (
    <ToastContext.Provider value={state}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

export function useToastState() {
  return useContext(ToastContext)
}
