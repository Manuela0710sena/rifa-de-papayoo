import { z } from "zod"

// EPICO code validation schema
export const epicoCodeSchema = z.object({
  codigo: z
    .string()
    .min(6, "Código debe tener mínimo 6 caracteres")
    .max(12, "Código debe tener máximo 12 caracteres")
    .regex(/^[A-Z0-9]+$/, "Código debe contener solo letras mayúsculas y números"),
  meta: z
    .object({
      factura_id: z.string().optional(),
      monto: z.number().positive().optional(),
      sede_id: z.number().positive().optional(),
    })
    .optional(),
})

// Client registration validation schema
export const clientRegistrationSchema = z.object({
  codigo: z.string().min(6).max(12),
  nombre: z.string().min(2, "Nombre debe tener mínimo 2 caracteres").max(100),
  apellidos: z.string().min(2, "Apellidos debe tener mínimo 2 caracteres").max(100),
  telefono: z.string().min(10, "Teléfono debe tener mínimo 10 dígitos").max(20),
  correo: z.string().email("Email inválido").max(255),
  contraseña: z.string().min(8, "Contraseña debe tener mínimo 8 caracteres"),
  sede_id: z.number().positive("Debe seleccionar una sede"),
})

// Client login validation schema
export const clientLoginSchema = z.object({
  codigo: z.string().min(6).max(12),
  correo: z.string().email(),
  contraseña: z.string().min(1),
})

// Admin login validation schema
export const adminLoginSchema = z.object({
  usuario: z.string().min(1),
  contraseña: z.string().min(1),
})

// Code validation schema
export const codeValidationSchema = z.object({
  codigo: z.string().min(6).max(12),
})

// Sede creation schema
export const sedeSchema = z.object({
  nombre: z.string().min(2).max(100),
  ciudad: z.string().min(2).max(100),
  direccion: z.string().max(150).optional(),
})

// Winner designation schema
export const winnerSchema = z.object({
  numero_ganador: z.string().length(5, "Número ganador debe tener exactamente 5 dígitos"),
})
