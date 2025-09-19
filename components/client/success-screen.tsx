"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trophy, Camera, LogOut, Clock } from "lucide-react"

interface SuccessScreenProps {
  cliente: {
    id: number
    nombre: string
    correo: string
  }
  numeroRifa: string
  onLogout: () => void
}

export function SuccessScreen({ cliente, numeroRifa, onLogout }: SuccessScreenProps) {
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutes in seconds
  const [showLogoutWarning, setShowLogoutWarning] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto logout when time expires
          onLogout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [onLogout])

  useEffect(() => {
    // Show warning when 2 minutes left
    if (timeLeft === 2 * 60) {
      setShowLogoutWarning(true)
    }
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const handleLogout = () => {
    if (
      window.confirm("¿Estás seguro de que quieres cerrar sesión? Necesitarás un nuevo código para volver a ingresar.")
    ) {
      onLogout()
    }
  }

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    e.preventDefault()
    e.returnValue = "¿Estás seguro de que quieres salir? Perderás tu sesión actual."
  }

  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <div className="h-20 w-20 mx-auto bg-primary rounded-full flex items-center justify-center">
              <Trophy className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-primary">¡Felicidades!</CardTitle>
          <CardDescription>Has participado exitosamente en la rifa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Tu número de participación es:</p>
            <div className="text-4xl font-bold text-primary bg-primary/10 rounded-lg py-4 px-6 font-mono tracking-wider">
              {numeroRifa}
            </div>
          </div>

          <Alert>
            <Camera className="h-4 w-4" />
            <AlertDescription>
              <strong>¡Importante!</strong> Toma una captura de pantalla de este número. Lo necesitarás para reclamar tu
              premio si resultas ganador.
            </AlertDescription>
          </Alert>

          <div className="text-center space-y-2">
            <p className="text-sm font-medium">Hola, {cliente.nombre}!</p>
            <p className="text-xs text-muted-foreground">Correo: {cliente.correo}</p>
          </div>

          {showLogoutWarning && (
            <Alert variant="destructive">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Tu sesión expirará pronto. Asegúrate de haber guardado tu número de rifa.
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Tiempo restante de sesión:</p>
            <div className="text-lg font-mono text-primary">{formatTime(timeLeft)}</div>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Nota:</strong> Solo podrás volver a iniciar sesión con un nuevo código de compra. Esta sesión
              expirará automáticamente.
            </AlertDescription>
          </Alert>

          <Button onClick={handleLogout} variant="outline" className="w-full bg-transparent">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
