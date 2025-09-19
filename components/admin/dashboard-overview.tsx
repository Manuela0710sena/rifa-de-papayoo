"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Users, Ticket, CheckCircle, Clock, TrendingUp, TrendingDown } from "lucide-react"
import type { DashboardStats, MonthlyMetrics } from "@/types"

interface DashboardOverviewProps {
  token: string
}

export function DashboardOverview({ token }: DashboardOverviewProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [metrics, setMetrics] = useState<MonthlyMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/internal/admin/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await response.json()

        if (response.ok) {
          setStats(data.estadisticas)
          setMetrics(data.metricas_mensuales)
        } else {
          setError(data.message || "Error cargando datos")
        }
      } catch (error) {
        setError("Error de conexión")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [token])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "activa":
        return <Badge className="bg-green-500 hover:bg-green-600">Activa</Badge>
      case "pausada":
        return <Badge variant="secondary">Pausada</Badge>
      case "cerrada":
        return <Badge variant="destructive">Cerrada</Badge>
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general del sistema de rifas Papayoo</p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.total_clientes || 0}</div>
            <p className="text-xs text-muted-foreground">Usuarios registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participaciones</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.total_participaciones || 0}</div>
            <p className="text-xs text-muted-foreground">Números de rifa asignados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Códigos Usados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.codigos_usados || 0}</div>
            <p className="text-xs text-muted-foreground">Códigos validados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Códigos Disponibles</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.codigos_disponibles || 0}</div>
            <p className="text-xs text-muted-foreground">Listos para usar</p>
          </CardContent>
        </Card>
      </div>

      {/* Raffle Status and Monthly Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Estado de la Rifa</CardTitle>
            <CardDescription>Estado actual del sistema de rifas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Estado:</span>
              {getStatusBadge(stats?.estado_rifa || "desconocido")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métricas Mensuales</CardTitle>
            <CardDescription>Comparación con el mes anterior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Clientes este mes:</span>
              <span className="font-bold">{metrics?.clientes_nuevos_mes_actual || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Mes anterior:</span>
              <span className="font-bold">{metrics?.clientes_nuevos_mes_anterior || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Crecimiento:</span>
              <div className="flex items-center space-x-1">
                {(metrics?.crecimiento_porcentual || 0) >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`font-bold ${
                    (metrics?.crecimiento_porcentual || 0) >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {metrics?.crecimiento_porcentual || 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
