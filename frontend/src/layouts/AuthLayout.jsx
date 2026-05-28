import React from 'react'

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(15,23,42,0.1),_transparent_28%),linear-gradient(180deg,#0f172a_0%,#1e293b_45%,#f8fafc_45%,#f8fafc_100%)] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
        {children}
      </div>
    </div>
  )
}