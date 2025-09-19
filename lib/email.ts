export class EmailService {
  static async sendWelcomeEmail(cliente: any): Promise<boolean> {
    try {
      // En producción, integrar con servicio de email (SendGrid, etc.)
      console.log(`[v0] Enviando email de bienvenida a ${cliente.email}`)

      const emailContent = `
        ¡Bienvenido a Papayoo, ${cliente.nombre}!
        
        Tu cuenta ha sido creada exitosamente.
        Ya puedes participar en nuestras rifas con tus códigos de compra.
        
        Datos de tu cuenta:
        - Email: ${cliente.email}
        - Teléfono: ${cliente.telefono}
        
        ¡Gracias por ser parte de la familia Papayoo!
      `

      // Simular envío de email
      await new Promise((resolve) => setTimeout(resolve, 100))

      return true
    } catch (error) {
      console.error("Error enviando email de bienvenida:", error)
      return false
    }
  }

  static async sendParticipationConfirmation(cliente: any, numeroRifa: string, sede: any): Promise<boolean> {
    try {
      console.log(`[v0] Enviando confirmación de participación a ${cliente.email}`)

      const emailContent = `
        ¡Participación Confirmada!
        
        Hola ${cliente.nombre},
        
        Tu participación en la rifa de Papayoo ha sido registrada exitosamente.
        
        Detalles de tu participación:
        - Número de rifa: ${numeroRifa}
        - Sede: ${sede.nombre}
        - Fecha: ${new Date().toLocaleDateString()}
        
        ¡Mantente atento al sorteo!
        
        Equipo Papayoo
      `

      await new Promise((resolve) => setTimeout(resolve, 100))
      return true
    } catch (error) {
      console.error("Error enviando confirmación:", error)
      return false
    }
  }

  static async sendWinnerNotification(ganador: any, premio: string): Promise<boolean> {
    try {
      console.log(`[v0] Enviando notificación de ganador a ${ganador.email}`)

      const emailContent = `
        🎉 ¡FELICITACIONES! ¡HAS GANADO! 🎉
        
        Estimado/a ${ganador.nombre},
        
        ¡Tenemos excelentes noticias! Has sido seleccionado/a como ganador/a 
        de nuestra rifa de Papayoo.
        
        Premio ganado: ${premio}
        Número ganador: ${ganador.numero_rifa}
        
        Para reclamar tu premio:
        1. Presenta tu cédula de identidad
        2. Menciona tu número de rifa: ${ganador.numero_rifa}
        3. Tienes 30 días calendario para reclamar
        
        Contacto para reclamo:
        - Teléfono: +57 (1) 234-5678
        - Email: premios@papayoo.com
        
        ¡Felicitaciones nuevamente!
        
        Equipo Papayoo
      `

      await new Promise((resolve) => setTimeout(resolve, 100))
      return true
    } catch (error) {
      console.error("Error enviando notificación de ganador:", error)
      return false
    }
  }
}
