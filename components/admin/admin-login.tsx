"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, Eye, EyeOff, LucideLoader2 } from "lucide-react"

interface AdminLoginProps {
  onSuccess: (data: { admin: any; token: string }) => void
}

export function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [formData, setFormData] = useState({
    usuario: "",
    contraseña: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/internal/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        onSuccess(data)
      } else {
        setError(data.message || "Error en el login")
      }
    } catch (error) {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <div className="h-16 w-16 mx-auto bg-primary rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Panel Administrativo</CardTitle>
          <CardDescription>Acceso exclusivo para administradores de Papayoo</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="usuario">Usuario</Label>
              <Input
                id="usuario"
                type="text"
                value={formData.usuario}
                onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                required
                disabled={isLoading}
                placeholder="Ingresa tu usuario"
              />
            </div>

            <div>
              <Label htmlFor="contraseña">Contraseña</Label>
              <div className="relative">
                <Input
                  id="contraseña"
                  type={showPassword ? "text" : "password"}
                  value={formData.contraseña}
                  onChange={(e) => setFormData({ ...formData, contraseña: e.target.value })}
                  required
                  disabled={isLoading}
                  placeholder="Ingresa tu contraseña"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Iniciar Sesión
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Credenciales por defecto:</p>
            <p className="font-mono text-xs">admin / admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
