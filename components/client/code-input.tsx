"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

interface CodeInputProps {
  onValidCode: (code: string) => void
}

export function CodeInput({ onValidCode }: CodeInputProps) {
  const [code, setCode] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setIsValidating(true)
    setError("")

    try {
      const response = await fetch("/api/auth/validate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ codigo: code.trim().toUpperCase() }),
      })

      const data = await response.json()

      if (data.valid) {
        onValidCode(code.trim().toUpperCase())
      } else {
        setError(data.message || "Código inválido")
      }
    } catch (error) {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="min-h-screen  bg-gradient-to-br from-amber-400 to-secondary/10  flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <img src="/images/papayoo-logo.png" alt="Papayoo" className="h-20 w-20 mx-auto" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">¡Bienvenido a Papayoo!</CardTitle>
          <CardDescription>Ingresa el código de tu factura para participar en la rifa por una moto</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Ingresa tu código"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="text-center text-lg font-mono tracking-wider"
                maxLength={12}
                disabled={isValidating}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isValidating || !code.trim()}>
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Validar Código
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>¿No tienes un código?</p>
            <p className="font-medium">Realiza una compra en cualquier local Papayoo</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
