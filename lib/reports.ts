import { query } from "./database"

export class ReportsService {
  static async getParticipationReport(startDate: string, endDate: string, sedeId?: number) {
    try {
      let sql = `
        SELECT 
          DATE(p.created_at) as fecha,
          COUNT(*) as total_participaciones,
          COUNT(DISTINCT p.cliente_id) as clientes_unicos,
          s.nombre as sede_nombre
        FROM participaciones p
        JOIN clientes c ON p.cliente_id = c.id
        JOIN sedes s ON c.sede_id = s.id
        WHERE p.created_at BETWEEN $1 AND $2
      `

      const params = [startDate, endDate]

      if (sedeId) {
        sql += ` AND s.id = $3`
        params.push(sedeId.toString())
      }

      sql += `
        GROUP BY DATE(p.created_at), s.nombre
        ORDER BY fecha DESC
      `

      const result = await query(sql, params)
      return result.rows
    } catch (error) {
      console.error("Error generando reporte de participaciones:", error)
      throw error
    }
  }

  static async getClientReport() {
    try {
      const result = await query(`
        SELECT 
          c.id,
          c.nombre,
          c.email,
          c.telefono,
          c.cedula,
          s.nombre as sede_nombre,
          COUNT(p.id) as total_participaciones,
          c.created_at as fecha_registro
        FROM clientes c
        LEFT JOIN participaciones p ON c.id = p.cliente_id
        JOIN sedes s ON c.sede_id = s.id
        GROUP BY c.id, s.nombre
        ORDER BY total_participaciones DESC, c.created_at DESC
      `)

      return result.rows
    } catch (error) {
      console.error("Error generando reporte de clientes:", error)
      throw error
    }
  }

  static async getCodeUsageReport(startDate: string, endDate: string) {
    try {
      const result = await query(
        `
        SELECT 
          DATE(co.created_at) as fecha,
          COUNT(*) as codigos_generados,
          COUNT(co.usado_at) as codigos_usados,
          COUNT(*) - COUNT(co.usado_at) as codigos_pendientes,
          ROUND(
            (COUNT(co.usado_at)::float / COUNT(*)) * 100, 2
          ) as porcentaje_uso
        FROM codigos co
        WHERE co.created_at BETWEEN $1 AND $2
        GROUP BY DATE(co.created_at)
        ORDER BY fecha DESC
      `,
        [startDate, endDate],
      )

      return result.rows
    } catch (error) {
      console.error("Error generando reporte de códigos:", error)
      throw error
    }
  }

  static async getWinnersReport() {
    try {
      const result = await query(`
        SELECT 
          g.id,
          c.nombre as ganador_nombre,
          c.email as ganador_email,
          c.telefono as ganador_telefono,
          p.numero_rifa,
          cr.nombre_rifa,
          cr.premio,
          g.created_at as fecha_sorteo,
          g.premio_reclamado,
          g.fecha_reclamo
        FROM ganadores g
        JOIN participaciones p ON g.participacion_id = p.id
        JOIN clientes c ON p.cliente_id = c.id
        JOIN configuracion_rifa cr ON g.rifa_id = cr.id
        ORDER BY g.created_at DESC
      `)

      return result.rows
    } catch (error) {
      console.error("Error generando reporte de ganadores:", error)
      throw error
    }
  }

  static async getAuditReport(startDate: string, endDate: string) {
    try {
      const result = await query(
        `
        SELECT 
          endpoint,
          method,
          status_code,
          ip_address,
          user_agent,
          created_at,
          trace_id
        FROM integration_logs
        WHERE created_at BETWEEN $1 AND $2
        ORDER BY created_at DESC
        LIMIT 1000
      `,
        [startDate, endDate],
      )

      return result.rows
    } catch (error) {
      console.error("Error generando reporte de auditoría:", error)
      throw error
    }
  }

  static async exportToCSV(data: any[], filename: string): Promise<string> {
    try {
      if (!data.length) return ""

      const headers = Object.keys(data[0])
      const csvContent = [
        headers.join(","),
        ...data.map((row) => headers.map((header) => `"${String(row[header] || "").replace(/"/g, '""')}"`).join(",")),
      ].join("\n")

      return csvContent
    } catch (error) {
      console.error("Error exportando a CSV:", error)
      throw error
    }
  }
}
