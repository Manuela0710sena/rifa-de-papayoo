"use client"

import { useState } from "react"
import { CodeInput } from "@/components/client/code-input"
import { AuthForm } from "@/components/client/auth-form"
import { SuccessScreen } from "@/components/client/success-screen"

type AppState = "code-input" | "auth" | "success"

interface AuthData {
  cliente: {
    id: number
    nombre: string
    correo: string
  }
  numero_rifa: string
  token: string
}

export default function HomePage() {
  const [currentState, setCurrentState] = useState<AppState>("code-input")
  const [validCode, setValidCode] = useState("")
  const [authData, setAuthData] = useState<AuthData | null>(null)

  const handleValidCode = (code: string) => {
    setValidCode(code)
    setCurrentState("auth")
  }

  const handleAuthSuccess = (data: AuthData) => {
    setAuthData(data)
    // Store token in localStorage for session management
    localStorage.setItem("papayoo_token", data.token)
    setCurrentState("success")
  }

  const handleLogout = () => {
    // Clear stored data
    localStorage.removeItem("papayoo_token")
    setValidCode("")
    setAuthData(null)
    setCurrentState("code-input")
  }

  switch (currentState) {
    case "code-input":
      return <CodeInput onValidCode={handleValidCode} />

    case "auth":
      return <AuthForm code={validCode} onSuccess={handleAuthSuccess} />

    case "success":
      return authData ? (
        <SuccessScreen cliente={authData.cliente} numeroRifa={authData.numero_rifa} onLogout={handleLogout} />
      ) : null

    default:
      return <CodeInput onValidCode={handleValidCode} />
  }
}
