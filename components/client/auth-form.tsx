"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Eye, EyeOff, UserPlus, LogIn } from "lucide-react"
import type { Sede } from "@/types"

interface AuthFormProps {
  code: string
  onSuccess: (data: { cliente: any; numero_rifa: string; token: string }) => void
}

export function AuthForm({ code, onSuccess }: AuthFormProps) {
  const [activeTab, setActiveTab] = useState("register")
  const [sedes, setSedes] = useState<Sede[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Registration form state
  const [registerForm, setRegisterForm] = useState({
    nombre: "",
    apellidos: "",
    telefono: "",
    correo: "",
    contraseña: "",
    confirmarContraseña: "",
    sede_id: "",
  })

  // Login form state
  const [loginForm, setLoginForm] = useState({
    correo: "",
    contraseña: "",
  })

  // Load sedes on component mount
  useEffect(() => {
    const fetchSedes = async () => {
      try {
        const response = await fetch("/api/sedes")
        const data = await response.json()
        if (data.success) {
          setSedes(data.sedes)
        }
      } catch (error) {
        console.error("Error loading sedes:", error)
      }
    }

    fetchSedes()
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate passwords match
    if (registerForm.contraseña !== registerForm.confirmarContraseña) {
      setError("Las contraseñas no coinciden")
      return
    }

    // Validate password length
    if (registerForm.contraseña.length < 8) {
      setError("La contraseña debe tener mínimo 8 caracteres")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codigo: code,
          ...registerForm,
          sede_id: Number.parseInt(registerForm.sede_id),
        }),
      })

      const data = await response.json()

      if (data.success) {
        onSuccess(data)
      } else {
        setError(data.message || "Error en el registro")
      }
    } catch (error) {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codigo: code,
          ...loginForm,
        }),
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
            <img src="/images/papayoo-logo.png" alt="Papayoo" className="h-16 w-16 mx-auto" />
          </div>
          <CardTitle className="text-xl font-bold text-primary">Código Válido ✓</CardTitle>
          <CardDescription>Código: {code}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="register">Registrarse</TabsTrigger>
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            </TabsList>

            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      type="text"
                      value={registerForm.nombre}
                      onChange={(e) => setRegisterForm({ ...registerForm, nombre: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="apellidos">Apellidos *</Label>
                    <Input
                      id="apellidos"
                      type="text"
                      value={registerForm.apellidos}
                      onChange={(e) => setRegisterForm({ ...registerForm, apellidos: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="telefono">Teléfono *</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={registerForm.telefono}
                    onChange={(e) => setRegisterForm({ ...registerForm, telefono: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="correo">Correo Electrónico *</Label>
                  <Input
                    id="correo"
                    type="email"
                    value={registerForm.correo}
                    onChange={(e) => setRegisterForm({ ...registerForm, correo: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="sede">Sede Frecuentada *</Label>
                  <Select
                    value={registerForm.sede_id}
                    onValueChange={(value) => setRegisterForm({ ...registerForm, sede_id: value })}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu sede" />
                    </SelectTrigger>
                    <SelectContent>
                      {sedes.map((sede) => (
                        <SelectItem key={sede.id} value={sede.id.toString()}>
                          {sede.nombre} - {sede.ciudad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="password">Contraseña *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={registerForm.contraseña}
                      onChange={(e) => setRegisterForm({ ...registerForm, contraseña: e.target.value })}
                      required
                      minLength={8}
                      disabled={isLoading}
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

                <div>
                  <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={registerForm.confirmarContraseña}
                      onChange={(e) => setRegisterForm({ ...registerForm, confirmarContraseña: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Registrarse
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="loginEmail">Correo Electrónico</Label>
                  <Input
                    id="loginEmail"
                    type="email"
                    value={loginForm.correo}
                    onChange={(e) => setLoginForm({ ...loginForm, correo: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="loginPassword">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="loginPassword"
                      type={showPassword ? "text" : "password"}
                      value={loginForm.contraseña}
                      onChange={(e) => setLoginForm({ ...loginForm, contraseña: e.target.value })}
                      required
                      disabled={isLoading}
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Iniciar Sesión
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
