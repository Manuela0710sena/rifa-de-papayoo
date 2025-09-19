"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Settings, Play, Pause, Square, RotateCcw, AlertTriangle, Eye, EyeOff } from "lucide-react"

interface RaffleConfigProps {
  token: string
}

interface RaffleConfig {
  estado: "activa" | "pausada" | "cerrada"
  numero_ganador?: string
  fecha_cierre?: string
  total_participaciones: number
}

export function RaffleConfig({ token }: RaffleConfigProps) {
  const [config, setConfig] = useState<RaffleConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [resetForm, setResetForm] = useState({
    confirmacion_1: false,
    confirmacion_2: false,
    confirmacion_3: false,
    admin_password: "",
  })
  const [showPassword, setShowPassword] = useState(false)

  const fetchConfig = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/internal/admin/config", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setConfig(data)
      } else {
        setError(data.message || "Error cargando configuración")
      }
    } catch (error) {
      setError("Error de conexión")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [token])

  const updateRaffleState = async (newState: "activa" | "pausada" | "cerrada") => {
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/internal/admin/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: newState }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message)
        fetchConfig()
      } else {
        setError(data.message || "Error actualizando estado")
      }
    } catch (error) {
      setError("Error de conexión")
    }
  }

  const handleResetRaffle = async () => {
    setError("")
    setSuccess("")

    if (!resetForm.confirmacion_1 || !resetForm.confirmacion_2 || !resetForm.confirmacion_3) {
      setError("Debes confirmar las tres casillas")
      return
    }

    if (!resetForm.admin_password) {
      setError("Debes ingresar tu contraseña de administrador")
      return
    }

    try {
      const response = await fetch("/api/internal/admin/reset-raffle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(resetForm),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(
          `Sistema reiniciado: ${data.affected_codes} códigos y ${data.affected_participations} participaciones afectadas`,
        )
        setIsResetDialogOpen(false)
        setResetForm({
          confirmacion_1: false,
          confirmacion_2: false,
          confirmacion_3: false,
          admin_password: "",
        })
        fetchConfig()
      } else {
        setError(data.message || "Error reiniciando sistema")
      }
    } catch (error) {
      setError("Error de conexión")
    }
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configuración de Rifa</h1>
        <p className="text-muted-foreground">Administra el estado y configuración del sistema de rifas</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Estado Actual
          </CardTitle>
          <CardDescription>Información del estado actual de la rifa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Estado de la Rifa:</span>
            {config && getStatusBadge(config.estado)}
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">Total de Participaciones:</span>
            <span className="text-lg font-bold text-primary">{config?.total_participaciones || 0}</span>
          </div>

          {config?.numero_ganador && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Número Ganador:</span>
              <Badge variant="outline" className="font-mono text-lg">
                #{config.numero_ganador}
              </Badge>
            </div>
          )}

          {config?.fecha_cierre && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Fecha de Cierre:</span>
              <span>{new Date(config.fecha_cierre).toLocaleString("es-ES")}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Control Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Controles de Rifa</CardTitle>
          <CardDescription>Cambia el estado de la rifa según sea necesario</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => updateRaffleState("activa")}
              disabled={config?.estado === "activa"}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="mr-2 h-4 w-4" />
              Activar Rifa
            </Button>

            <Button
              onClick={() => updateRaffleState("pausada")}
              disabled={config?.estado === "pausada"}
              variant="secondary"
            >
              <Pause className="mr-2 h-4 w-4" />
              Pausar Rifa
            </Button>

            <Button
              onClick={() => updateRaffleState("cerrada")}
              disabled={config?.estado === "cerrada"}
              variant="destructive"
            >
              <Square className="mr-2 h-4 w-4" />
              Cerrar Rifa
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reset System */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className=" flex items-center">
          
            Zona de Peligro
          </CardTitle>
          <CardDescription>Acciones irreversibles que afectan todo el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reiniciar Sistema de Rifa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className=""> Reiniciar Sistema</DialogTitle>
                <DialogDescription>
                  Esta acción es <strong>IRREVERSIBLE</strong> y realizará lo siguiente:
                </DialogDescription>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>Marcará todos los códigos como no usados</li>
                  <li>Eliminará todas las participaciones</li>
                  <li>Mantendrá usuarios registrados</li>
                  <li>Reactivará el estado de rifa</li>
                </ul>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="confirm1"
                      checked={resetForm.confirmacion_1}
                      onCheckedChange={(checked) => setResetForm({ ...resetForm, confirmacion_1: checked as boolean })}
                    />
                    <Label htmlFor="confirm1" className="text-sm">
                      Entiendo que esta acción es irreversible
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="confirm2"
                      checked={resetForm.confirmacion_2}
                      onCheckedChange={(checked) => setResetForm({ ...resetForm, confirmacion_2: checked as boolean })}
                    />
                    <Label htmlFor="confirm2" className="text-sm">
                      He realizado un respaldo de los datos importantes
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="confirm3"
                      checked={resetForm.confirmacion_3}
                      onCheckedChange={(checked) => setResetForm({ ...resetForm, confirmacion_3: checked as boolean })}
                    />
                    <Label htmlFor="confirm3" className="text-sm">
                      Confirmo que quiero reiniciar el sistema
                    </Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="adminPassword">Contraseña de Administrador</Label>
                  <div className="relative">
                    <Input
                      id="adminPassword"
                      type={showPassword ? "text" : "password"}
                      value={resetForm.admin_password}
                      onChange={(e) => setResetForm({ ...resetForm, admin_password: e.target.value })}
                      placeholder="Ingresa tu contraseña"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={handleResetRaffle}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reiniciar Sistema
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
