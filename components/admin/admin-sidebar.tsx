"use client"

import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, Trophy, Building2, Download, Settings, LogOut, User } from "lucide-react"

type AdminSection = "dashboard" | "clients" | "winner" | "sedes" | "config"

interface AdminSidebarProps {
  admin: {
    id: number
    usuario: string
    rol: string
  }
  activeSection: AdminSection
  onSectionChange: (section: AdminSection) => void
  onLogout: () => void
}

export function AdminSidebar({ admin, activeSection, onSectionChange, onLogout }: AdminSidebarProps) {
  const menuItems = [
    { id: "dashboard" as AdminSection, label: "Dashboard", icon: LayoutDashboard },
    { id: "clients" as AdminSection, label: "Clientes", icon: Users },
    { id: "winner" as AdminSection, label: "Ganador", icon: Trophy },
    { id: "sedes" as AdminSection, label: "Sedes", icon: Building2 },
    { id: "config" as AdminSection, label: "Configuración", icon: Settings },
  ]

  const handleLogout = () => {
    if (window.confirm("¿Estás seguro de que quieres cerrar sesión?")) {
      onLogout()
    }
  }

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo and Title */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <img src="/images/papayoo-logo.png" alt="Papayoo" className="h-10 w-10" />
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">Papayoo</h1>
            <p className="text-sm text-sidebar-foreground/70">Panel Admin</p>
          </div>
        </div>
      </div>

      {/* Admin Info */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-sidebar-primary rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-sidebar-foreground">{admin.usuario}</p>
            <p className="text-xs text-sidebar-foreground/70 capitalize">{admin.rol}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id

            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
                onClick={() => onSectionChange(item.id)}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.label}
              </Button>
            )
          })}
        </div>
      </nav>

      {/* Export Section */}
   

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
}
