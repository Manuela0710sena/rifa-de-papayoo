"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Search, Users, Download, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"
import type { ClienteListItem, Sede } from "@/types"

interface ClientsManagementProps {
  token: string
}

export function ClientsManagement({ token }: ClientsManagementProps) {
  const [clients, setClients] = useState<ClienteListItem[]>([])
  const [sedes, setSedes] = useState<Sede[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [selectedSede, setSelectedSede] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [expandedRows, setExpandedRows] = useState<number[]>([]) // 👈 controla los códigos desplegados

  const fetchClients = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      })
      if (search) params.append("search", search)
      if (selectedSede !== "all") params.append("sede_id", selectedSede)

      const response = await fetch(`/api/internal/admin/clientes?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (response.ok) {
        setClients(data.clientes)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      } else {
        setError(data.message || "Error cargando clientes")
      }
    } catch {
      setError("Error de conexión")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSedes = async () => {
    try {
      const response = await fetch("/api/internal/admin/sedes?onlyActive=true", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) setSedes(data.sedes)
    } catch (error) {
      console.error("Error loading sedes:", error)
    }
  }

  useEffect(() => { fetchSedes() }, [token])
  useEffect(() => { fetchClients() }, [token, currentPage, search, selectedSede])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchClients()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  }

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (selectedSede !== "all") params.append("sede_id", selectedSede)

      const response = await fetch(`/api/internal/admin/clientes/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.message || "Error exportando clientes")
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `clientes_export_${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exportando CSV:", error)
      alert("Error exportando CSV")
    }
  }

  const toggleRow = (id: number) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestión de Clientes</h1>
        <p className="text-muted-foreground">Administra y visualiza todos los clientes registrados</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="mr-2 h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input placeholder="Buscar por nombre, apellido o correo..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedSede} onValueChange={setSelectedSede}>
                <SelectTrigger><SelectValue placeholder="Todas las sedes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las sedes</SelectItem>
                  {sedes.map((sede) => (
                    <SelectItem key={sede.id} value={sede.id.toString()}>{sede.nombre} - {sede.ciudad}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Clientes ({total})
              </CardTitle>
              <CardDescription>Lista de todos los clientes registrados</CardDescription>
            </div>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

          {isLoading ? (
            <div className="space-y-4">{[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse"><div className="h-10 bg-muted rounded"></div></div>
            ))}</div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No se encontraron clientes</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted text-left">
                    <th className="p-2">Nombre</th>
                    <th className="p-2">Correo</th>
                    <th className="p-2">Teléfono</th>
                    <th className="p-2">Sede</th>
                    <th className="p-2">Registro</th>
                    <th className="p-2">Códigos</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => {
                    const lastCode = client.codigos?.[client.codigos.length - 1]
                    const otherCodes = client.codigos?.slice(0, -1) || []
                    const isExpanded = expandedRows.includes(client.id)

                    return (
                      <tr key={client.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{client.nombre}</td>
                        <td className="p-2">{client.correo}</td>
                        <td className="p-2">{client.telefono}</td>
                        <td className="p-2">{client.sede}</td>
                        <td className="p-2 text-xs text-muted-foreground">{formatDate(client.fecha_registro)}</td>
                        <td className="p-2">
                          <div className="flex flex-wrap items-center gap-1">
                            {lastCode && (
                              <Badge variant="secondary" className="font-mono text-xs">#{lastCode}</Badge>
                            )}
                            {otherCodes.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => toggleRow(client.id)}
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="h-3 w-3 mr-1" /> Ocultar
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3 mr-1" /> {otherCodes.length} más
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                          {isExpanded && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {otherCodes.map((codigo, i) => (
                                <Badge key={i} variant="outline" className="font-mono text-xs">#{codigo}</Badge>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 flex-wrap gap-2">
              <p className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</p>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
                  Siguiente <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
