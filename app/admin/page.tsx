"use client"

import { useState } from "react"
import { AdminLogin } from "@/components/admin/admin-login"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

interface AdminData {
  admin: {
    id: number
    usuario: string
    rol: string
  }
  token: string
}

export default function AdminPage() {
  const [adminData, setAdminData] = useState<AdminData | null>(null)

  const handleLoginSuccess = (data: AdminData) => {
    setAdminData(data)
    localStorage.setItem("papayoo_admin_token", data.token)
  }

  const handleLogout = () => {
    setAdminData(null)
    localStorage.removeItem("papayoo_admin_token")
  }

  if (!adminData) {
    return <AdminLogin onSuccess={handleLoginSuccess} />
  }

  return <AdminDashboard admin={adminData.admin} token={adminData.token} onLogout={handleLogout} />
}
