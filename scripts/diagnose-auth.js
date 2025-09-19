// Script de diagnóstico para problemas de autenticación
// Ejecutar con: node scripts/diagnose-auth.js

const { Pool } = require("pg")
const bcrypt = require("bcryptjs")
require("dotenv").config({ path: ".env.local" })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

async function diagnoseAuth() {
  console.log("🔍 DIAGNÓSTICO DE AUTENTICACIÓN - PAPAYOO RAFFLE SYSTEM")
  console.log("=".repeat(60))

  try {
    // 1. Verificar conexión a la base de datos
    console.log("\n1. 🔌 Verificando conexión a la base de datos...")
    const client = await pool.connect()
    console.log("✅ Conexión exitosa a la base de datos")

    // 2. Verificar variables de entorno
    console.log("\n2. 🔧 Verificando variables de entorno...")
    const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET", "EPICO_API_KEY", "NEXTAUTH_URL"]

    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        console.log(`✅ ${envVar}: Configurado`)
      } else {
        console.log(`❌ ${envVar}: FALTANTE`)
      }
    }

    // Verificar NEXTAUTH_URL específicamente
    if (process.env.NEXTAUTH_URL) {
      if (process.env.NEXTAUTH_URL.includes("locallhost")) {
        console.log('⚠️  NEXTAUTH_URL: Contiene "locallhost" (doble l) - debería ser "localhost"')
      } else if (!process.env.NEXTAUTH_URL.startsWith("http")) {
        console.log("⚠️  NEXTAUTH_URL: Falta protocolo HTTP/HTTPS")
      } else {
        console.log("✅ NEXTAUTH_URL: Formato correcto")
      }
    }

    // 3. Verificar estructura de tablas
    console.log("\n3. 🗄️  Verificando estructura de tablas...")

    // Verificar tabla usuarios_internos
    const tableCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios_internos' 
      ORDER BY ordinal_position
    `)

    if (tableCheck.rows.length === 0) {
      console.log("❌ Tabla usuarios_internos no existe")
      console.log("💡 Ejecuta: node scripts/01_create_database_schema.sql")
    } else {
      console.log("✅ Tabla usuarios_internos existe")

      const hasPasswordHash = tableCheck.rows.some((row) => row.column_name === "password_hash")
      const hasContrasenaHash = tableCheck.rows.some((row) => row.column_name === "password_hashhash")

      if (hasPasswordHash) {
        console.log("✅ Campo password_hash encontrado")
      } else if (hasContrasenaHash) {
        console.log("⚠️  Campo password_hashhash encontrado (necesita migración a password_hash)")
        console.log("💡 Ejecuta: node scripts/04_fix_password_field.sql")
      } else {
        console.log("❌ No se encontró campo de contraseña")
      }
    }

    // 4. Verificar usuarios administradores
    console.log("\n4. 👤 Verificando usuarios administradores...")

    try {
      const adminQuery = await client.query("SELECT id, usuario, rol FROM usuarios_internos")

      if (adminQuery.rows.length === 0) {
        console.log("❌ No hay usuarios administradores registrados")
        console.log("💡 Ejecuta: node scripts/02_seed_initial_data.sql")
      } else {
        console.log(`✅ Encontrados ${adminQuery.rows.length} usuario(s) administrador(es):`)
        adminQuery.rows.forEach((admin) => {
          console.log(`   - Usuario: ${admin.usuario}, Rol: ${admin.rol}`)
        })
      }
    } catch (error) {
      console.log("❌ Error consultando usuarios:", error.message)
    }

    // 5. Probar hash de contraseña
    console.log("\n5. 🔐 Probando sistema de hash de contraseñas...")

    try {
      const testPassword = "admin123"
      const hashedPassword = await bcrypt.hash(testPassword, 12)
      const isValid = await bcrypt.compare(testPassword, hashedPassword)

      if (isValid) {
        console.log("✅ Sistema de hash de contraseñas funcionando correctamente")
      } else {
        console.log("❌ Error en el sistema de hash de contraseñas")
      }
    } catch (error) {
      console.log("❌ Error probando hash de contraseñas:", error.message)
    }

    // 6. Verificar configuración de rifa
    console.log("\n6. 🎲 Verificando configuración de rifa...")

    try {
      const raffleConfig = await client.query("SELECT * FROM configuracion_rifa ORDER BY id DESC LIMIT 1")

      if (raffleConfig.rows.length === 0) {
        console.log("❌ No hay configuración de rifa")
        console.log("💡 Ejecuta: node scripts/02_seed_initial_data.sql")
      } else {
        const config = raffleConfig.rows[0]
        console.log(`✅ Estado de la rifa: ${config.estado}`)
        if (config.numero_ganador) {
          console.log(`🏆 Número ganador: ${config.numero_ganador}`)
        }
      }
    } catch (error) {
      console.log("❌ Error consultando configuración:", error.message)
    }

    client.release()

    console.log("\n" + "=".repeat(60))
    console.log("🎯 RESUMEN DEL DIAGNÓSTICO COMPLETADO")
    console.log("Si hay errores marcados con ❌, corrígelos antes de intentar hacer login.")

    console.log("\n📋 PASOS PARA CORREGIR PROBLEMAS:")
    console.log("1. Corrige tu archivo .env.local:")
    console.log("   NEXTAUTH_URL=http://localhost:3000")
    console.log("2. Ejecuta los scripts SQL en orden:")
    console.log("   - Ejecuta el script 01_create_database_schema.sql")
    console.log("   - Ejecuta el script 02_seed_initial_data.sql")
    console.log("3. Vuelve a ejecutar este diagnóstico")
  } catch (error) {
    console.error("❌ Error durante el diagnóstico:", error.message)

    if (error.message.includes("ENOTFOUND") || error.message.includes("connection")) {
      console.log("\n💡 SUGERENCIAS:")
      console.log("- Verifica que DATABASE_URL esté correctamente configurado")
      console.log("- Asegúrate de que la base de datos esté accesible")
      console.log("- Revisa que no haya errores de tipeo en la URL de conexión")
    }
  } finally {
    await pool.end()
  }
}

// Ejecutar diagnóstico
diagnoseAuth().catch(console.error)
