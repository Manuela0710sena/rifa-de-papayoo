// Database types
export interface Cliente {
  id: number
  nombre: string
  apellidos: string
  telefono: string
  correo: string
  sede_id: number
  password_hash: string
  fecha_registro: Date
}

export interface Sede {
  id: number
  nombre: string
  ciudad: string
  direccion?: string
  estado: "activa" | "inactiva"
  fecha_creacion: Date
}

export interface Codigo {
  id: number
  codigo: string
  estado: "activo" | "usado" | "expirado"
  generado_por: string
  meta?: any
  fecha_generacion: Date
  fecha_uso?: Date
  fecha_expiracion?: Date
}

export interface Participacion {
  id: number
  cliente_id: number
  codigo_id: number
  numero_rifa: string
  fecha_asignacion: Date
}

export interface UsuarioInterno {
  id: number
  rol: string
  usuario: string
  password_hash: string
  fecha_creacion: Date
}

export interface ConfiguracionRifa {
  id: number
  estado: "activa" | "pausada" | "cerrada"
  numero_ganador?: string
  fecha_cierre?: Date
  fecha_actualizacion: Date
}

export interface Integration {
  id: number
  name: string
  api_key_hash: string
  allowed_ips?: string[]
  rate_limit: number
  created_at: Date
  revoked_at?: Date
}

export interface IntegrationLog {
  id: number
  trace_id: string
  endpoint: string
  method: string
  integration_name?: string
  status_code: number
  error_message?: string
  metadata?: any
  created_at: Date
}

// API Request/Response types
export interface EpicoCodeRequest {
  codigo: string
  meta?: {
    factura_id?: string
    monto?: number
    sede_id?: number
  }
}

export interface EpicoCodeResponse {
  success: boolean
  codigo?: string
  fecha_generacion?: string
  trace_id: string
  error?: string
  details?: any
}

export interface CodeValidationRequest {
  codigo: string
}

export interface CodeValidationResponse {
  valid: boolean
  message: string
}

export interface ClientRegistrationRequest {
  codigo: string
  nombre: string
  apellidos: string
  telefono: string
  correo: string
  contraseña: string
  sede_id: number
}

export interface ClientLoginRequest {
  codigo: string
  correo: string
  contraseña: string
}

export interface AuthResponse {
  success: boolean
  cliente?: {
    id: number
    nombre: string
    correo: string
  }
  numero_rifa?: string
  token?: string
  message?: string
}

export interface AdminLoginRequest {
  usuario: string
  contraseña: string
}

export interface AdminAuthResponse {
  success: boolean
  admin?: {
    id: number
    usuario: string
    rol: string
  }
  token?: string
  message?: string
}

// Dashboard types
export interface DashboardStats {
  total_clientes: number
  total_participaciones: number
  codigos_usados: number
  codigos_disponibles: number
  estado_rifa: string
}

export interface MonthlyMetrics {
  clientes_nuevos_mes_actual: number
  clientes_nuevos_mes_anterior: number
  crecimiento_porcentual: number
}

export interface DashboardResponse {
  estadisticas: DashboardStats
  metricas_mensuales: MonthlyMetrics
}

// Client list types
// Client list types
export interface ClienteListItem {
  id: number
  nombre: string
  correo: string
  telefono: string
  sede: string
  fecha_registro: string
  codigos: string[]      // <- corregido: array de códigos
  numero_rifa?: string   // opcional si quieres mostrar solo un código principal
}

export interface ClientListResponse {
  clientes: ClienteListItem[]
  total: number
  page: number
  totalPages: number
}


// Winner types
export interface WinnerRequest {
  numero_ganador: string
}

export interface WinnerResponse {
  ganador?: {
    numero_rifa: string
    cliente: {
      nombre: string
      correo: string
      telefono: string
      sede: string
    }
  }
  message?: string
}
