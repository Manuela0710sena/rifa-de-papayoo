const { Pool } = require("pg")
const bcrypt = require("bcryptjs")
require("dotenv").config({ path: ".env.local" })

async function diagnoseSystem() {
  console.log("🔍 DIAGNÓSTICO DEL SISTEMA DE RIFAS PAPAYOO")
  console.log("==========================================\n")

  // 1. Verificar variables de entorno
  console.log("1. VERIFICANDO VARIABLES DE ENTORNO:")
  const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET", "EPICO_API_KEY", "NEXTAUTH_URL"]

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar]
    if (value) {
      console.log(`✅ ${envVar}: ${envVar === "DATABASE_URL" ? "Configurado" : value.substring(0, 10) + "..."}`)
    } else {
      console.log(`❌ ${envVar}: NO CONFIGURADO`)
    }
  }
  console.log("")

  // 2. Verificar conexión a base de datos
  console.log("2. VERIFICANDO CONEXIÓN A BASE DE DATOS:")
  let pool
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("neon.tech") ? { rejectUnauthorized: false } : false,
    })

    const client = await pool.connect()
    console.log("✅ Conexión a base de datos exitosa")

    // Verificar versión de PostgreSQL
    const versionResult = await client.query("SELECT version()")
    console.log(`✅ PostgreSQL: ${versionResult.rows[0].version.split(" ")[1]}`)

    client.release()
  } catch (error) {
    console.log(`❌ Error de conexión: ${error.message}`)
    return
  }
  console.log("")

  // 3. Verificar estructura de tablas
  console.log("3. VERIFICANDO ESTRUCTURA DE TABLAS:")
  try {
    const client = await pool.connect()

    // Verificar tabla usuarios_internos
    const tableCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios_internos'
      ORDER BY ordinal_position
    `)

    if (tableCheck.rows.length > 0) {
      console.log("✅ Tabla usuarios_internos existe")
      console.log("   Columnas:")
      tableCheck.rows.forEach((row) => {
        console.log(`   - ${row.column_name} (${row.data_type})`)
      })
    } else {
      console.log("❌ Tabla usuarios_internos NO existe")
    }

    client.release()
  } catch (error) {
    console.log(`❌ Error verificando tablas: ${error.message}`)
  }
  console.log("")

  // 4. Verificar usuarios administradores
  console.log("4. VERIFICANDO USUARIOS ADMINISTRADORES:")
  try {
    const client = await pool.connect()

    const usersResult = await client.query("SELECT id, usuario, rol FROM usuarios_internos")

    if (usersResult.rows.length > 0) {
      console.log(`✅ Encontrados ${usersResult.rows.length} usuarios:`)
      usersResult.rows.forEach((user) => {
        console.log(`   - ID: ${user.id}, Usuario: ${user.usuario}, Rol: ${user.rol}`)
      })
    } else {
      console.log("❌ No se encontraron usuarios administradores")
    }

    client.release()
  } catch (error) {
    console.log(`❌ Error verificando usuarios: ${error.message}`)
  }
  console.log("")

  // 5. Probar autenticación
  console.log("5. PROBANDO AUTENTICACIÓN:")
  try {
    const client = await pool.connect()

    // Obtener usuario superadmin
    const userResult = await client.query("SELECT password_hash FROM usuarios_internos WHERE usuario = $1", [
      "superadmin",
    ])

    if (userResult.rows.length > 0) {
      const storedHash = userResult.rows[0].password_hash
      console.log("✅ Usuario superadmin encontrado")
      console.log(`   Hash almacenado: ${storedHash.substring(0, 20)}...`)

      // Probar contraseñas comunes
      const testPasswords = ["admin123", "superadmin", "123456", "password"]

      for (const testPassword of testPasswords) {
        const isValid = await bcrypt.compare(testPassword, storedHash)
        if (isValid) {
          console.log(`✅ Contraseña correcta encontrada: "${testPassword}"`)
          break
        }
      }
    } else {
      console.log("❌ Usuario superadmin no encontrado")
    }

    client.release()
  } catch (error) {
    console.log(`❌ Error probando autenticación: ${error.message}`)
  }
  console.log("")

  // 6. Verificar JWT
  console.log("6. VERIFICANDO JWT:")
  try {
    const jwt = require("jsonwebtoken")
    const testPayload = { test: true }
    const token = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: "1h" })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    console.log("✅ JWT funcionando correctamente")
  } catch (error) {
    console.log(`❌ Error con JWT: ${error.message}`)
  }

  await pool.end()
  console.log("\n🎯 DIAGNÓSTICO COMPLETADO")
}

// Ejecutar diagnóstico
diagnoseSystem().catch(console.error)
