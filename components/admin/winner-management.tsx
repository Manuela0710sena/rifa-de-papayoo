"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trophy, Search, User, Phone, Mail, MapPin, Copy } from "lucide-react"
import type { WinnerResponse } from "@/types"

interface WinnerManagementProps {
  token: string
}

export function WinnerManagement({ token }: WinnerManagementProps) {
  const [numeroGanador, setNumeroGanador] = useState("")
  const [winner, setWinner] = useState<WinnerResponse["ganador"] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setWinner(null)
    setIsLoading(true)

    try {
      const response = await fetch("/api/internal/admin/ganador", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ numero_ganador: numeroGanador }),
      })

      const data = await response.json()

      if (data.success) {
        setWinner(data.ganador)
        setSuccess("¡Ganador encontrado y registrado exitosamente!")
      } else {
        setError(data.message || "Error buscando ganador")
      }
    } catch (error) {
      setError("Error de conexión")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Designar Ganador</h1>
        <p className="text-muted-foreground">Ingresa el número ganador del sorteo para encontrar al cliente</p>
      </div>

      {/* Winner Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="mr-2 h-5 w-5" />
            Buscar Ganador
          </CardTitle>
          <CardDescription>Ingresa el número de rifa ganador (5 dígitos)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="numeroGanador">Número Ganador</Label>
              <Input
                id="numeroGanador"
                type="text"
                value={numeroGanador}
                onChange={(e) => setNumeroGanador(e.target.value.replace(/\D/g, "").slice(0, 5))}
                placeholder="Ej: 03849"
                maxLength={5}
                className="font-mono text-lg text-center tracking-wider"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Solo números, exactamente 5 dígitos</p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <Trophy className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isLoading || numeroGanador.length !== 5} className="w-full">
              {isLoading ? (
                <>
                  <Search className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Trophy className="mr-2 h-4 w-4" />
                  Buscar Ganador
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Winner Details */}
      {winner && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <Trophy className="mr-2 h-6 w-6" />
              ¡Ganador Encontrado!
            </CardTitle>
            <CardDescription>Datos del cliente ganador para contacto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary bg-primary/10 rounded-lg py-4 px-6 font-mono tracking-wider inline-block">
                #{winner.numero_rifa}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre</p>
                    <p className="font-semibold">{winner.cliente.nombre}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Correo Electrónico</p>
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold">{winner.cliente.correo}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(winner.cliente.correo)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold">{winner.cliente.telefono}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(winner.cliente.telefono)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Sede</p>
                    <p className="font-semibold">{winner.cliente.sede}</p>
                  </div>
                </div>
              </div>
            </div>

            <Alert className="border-blue-200 bg-blue-50 text-blue-800">
              <AlertDescription>
                <strong>Próximos pasos:</strong> Contacta al ganador usando la información mostrada arriba. El número
                ganador ha sido registrado automáticamente en el sistema.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
