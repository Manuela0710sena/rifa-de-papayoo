"use client"

import type React from "react"

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
import { Building2, Plus, Edit, Trash2, MapPin } from "lucide-react"
import type { Sede } from "@/types"

interface SedesManagementProps {
  token: string
}

export function SedesManagement({ token }: SedesManagementProps) {
  const [sedes, setSedes] = useState<Sede[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSede, setEditingSede] = useState<Sede | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    ciudad: "",
    direccion: "",
  })

  const fetchSedes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/internal/admin/sedes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        setSedes(data.sedes)
      } else {
        setError(data.message || "Error cargando sedes")
      }
    } catch (error) {
      setError("Error de conexión")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSedes()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const url = editingSede ? `/api/internal/admin/sedes/${editingSede.id}` : "/api/internal/admin/sedes"
      const method = editingSede ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setIsDialogOpen(false)
        setEditingSede(null)
        setFormData({ nombre: "", ciudad: "", direccion: "" })
        fetchSedes()
      } else {
        setError(data.message || "Error guardando sede")
      }
    } catch (error) {
      setError("Error de conexión")
    }
  }

  const handleEdit = (sede: Sede) => {
    setEditingSede(sede)
    setFormData({
      nombre: sede.nombre,
      ciudad: sede.ciudad,
      direccion: sede.direccion || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (sede: Sede) => {
    if (!window.confirm(`¿Estás seguro de que quieres desactivar la sede "${sede.nombre}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/internal/admin/sedes/${sede.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        fetchSedes()
      } else {
        setError(data.message || "Error eliminando sede")
      }
    } catch (error) {
      setError("Error de conexión")
    }
  }

  const openCreateDialog = () => {
    setEditingSede(null)
    setFormData({ nombre: "", ciudad: "", direccion: "" })
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestión de Sedes</h1>
        <p className="text-muted-foreground">Administra las ubicaciones de los locales Papayoo</p>
      </div>

      {/* Create Button */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Sede
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSede ? "Editar Sede" : "Crear Nueva Sede"}</DialogTitle>
              <DialogDescription>
                {editingSede ? "Modifica los datos de la sede" : "Ingresa los datos de la nueva sede"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  placeholder="Ej: Centro, Norte, Sur"
                />
              </div>
              <div>
                <Label htmlFor="ciudad">Ciudad *</Label>
                <Input
                  id="ciudad"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  required
                  placeholder="Ej: Bogotá, Medellín"
                />
              </div>
              <div>
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Ej: Calle 123 #45-67"
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingSede ? "Actualizar" : "Crear"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sedes List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="mr-2 h-5 w-5" />
            Sedes ({sedes.length})
          </CardTitle>
          <CardDescription>Lista de todas las sedes registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : sedes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No hay sedes registradas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sedes.map((sede) => (
                <div key={sede.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{sede.nombre}</h3>
                        <Badge variant={sede.estado === "activa" ? "default" : "secondary"}>
                          {sede.estado === "activa" ? "Activa" : "Inactiva"}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="mr-1 h-3 w-3" />
                        {sede.ciudad}
                        {sede.direccion && ` - ${sede.direccion}`}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Creada: {new Date(sede.fecha_creacion).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(sede)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {sede.estado === "activa" && (
                        <Button variant="outline" size="sm" onClick={() => handleDelete(sede)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
