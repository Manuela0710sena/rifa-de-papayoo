"use client"

import { useState } from "react"
import { AdminSidebar } from "./admin-sidebar"
import { DashboardOverview } from "./dashboard-overview"
import { ClientsManagement } from "./clients-management"
import { SedesManagement } from "./sedes-management"
import { WinnerManagement } from "./winner-management"
import { RaffleConfig } from "./raffle-config"

type AdminSection = "dashboard" | "clients" | "winner" | "sedes" | "config"

interface AdminDashboardProps {
  admin: {
    id: number
    usuario: string
    rol: string
  }
  token: string
  onLogout: () => void
}

export function AdminDashboard({ admin, token, onLogout }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard")

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardOverview token={token} />
      case "clients":
        return <ClientsManagement token={token} />
      case "winner":
        return <WinnerManagement token={token} />
      case "sedes":
        return <SedesManagement token={token} />
      case "config":
        return <RaffleConfig token={token} />
      default:
        return <DashboardOverview token={token} />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar
        admin={admin}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={onLogout}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{renderContent()}</div>
      </main>
    </div>
  )
}
