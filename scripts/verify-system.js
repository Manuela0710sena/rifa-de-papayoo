// Script de verificación completa del sistema
// Ejecutar con: node scripts/verify-system.js

const { Pool } = require("pg")
const bcrypt = require("bcryptjs")
require("dotenv").config({ path: ".env.local" })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

async function verifySystem() {
  console.log("🔍 VERIFICACIÓN COMPLETA DEL SISTEMA - PAPAYOO RAFFLE")
  console.log("=".repeat(60))

  let allTestsPassed = true
  const results = []

  try {
    const client = await pool.connect()

    // Test 1: Conexión a la base de datos
    console.log("\n1. 🔌 Probando conexión a la base de datos...")
    try {
      await client.query("SELECT NOW()")
      console.log("✅ Conexión exitosa")
      results.push({ test: "Database Connection", status: "PASS" })
    } catch (error) {
      console.log("❌ Error de conexión:", error.message)
      results.push({ test: "Database Connection", status: "FAIL", error: error.message })
      allTestsPassed = false
    }

    // Test 2: Variables de entorno
    console.log("\n2. 🔧 Verificando variables de entorno...")
    const envVars = ["DATABASE_URL", "JWT_SECRET", "EPICO_API_KEY", "NEXTAUTH_URL"]
    let envTestPassed = true

    for (const envVar of envVars) {
      if (process.env[envVar]) {
        console.log(`✅ ${envVar}: OK`)
      } else {
        console.log(`❌ ${envVar}: FALTANTE`)
        envTestPassed = false
      }
    }

    // Verificar formato de NEXTAUTH_URL
    if (process.env.NEXTAUTH_URL) {
      if (process.env.NEXTAUTH_URL.includes("locallhost")) {
        console.log('❌ NEXTAUTH_URL: Contiene "locallhost" (doble l)')
        envTestPassed = false
      } else if (!process.env.NEXTAUTH_URL.startsWith("http")) {
        console.log("❌ NEXTAUTH_URL: Falta protocolo HTTP/HTTPS")
        envTestPassed = false
      }
    }

    results.push({ test: "Environment Variables", status: envTestPassed ? "PASS" : "FAIL" })
    if (!envTestPassed) allTestsPassed = false

    // Test 3: Estructura de tablas
    console.log("\n3. 🗄️  Verificando estructura de tablas...")
    const requiredTables = [
      "usuarios_internos",
      "clientes",
      "sedes",
      "codigos",
      "participaciones",
      "configuracion_rifa",
    ]

    let tablesTestPassed = true
    for (const table of requiredTables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`)
        console.log(`✅ Tabla ${table}: OK (${result.rows[0].count} registros)`)
      } catch (error) {
        console.log(`❌ Tabla ${table}: NO EXISTE`)
        tablesTestPassed = false
      }
    }

    results.push({ test: "Database Tables", status: tablesTestPassed ? "PASS" : "FAIL" })
    if (!tablesTestPassed) allTestsPassed = false

    // Test 4: Verificar campos de contraseña
    console.log("\n4. 🔐 Verificando campos de contraseña...")
    let passwordFieldsTest = true

    try {
      const userTableCheck = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'usuarios_internos' 
        AND column_name IN ('password_hash', 'password_hashhash')
      `)

      const clientTableCheck = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'clientes' 
        AND column_name IN ('password_hash', 'password_hashhash')
      `)

      if (userTableCheck.rows.some((row) => row.column_name === "password_hash")) {
        console.log("✅ usuarios_internos.password_hash: OK")
      } else {
        console.log("❌ usuarios_internos.password_hash: FALTANTE")
        passwordFieldsTest = false
      }

      if (clientTableCheck.rows.some((row) => row.column_name === "password_hash")) {
        console.log("✅ clientes.password_hash: OK")
      } else {
        console.log("❌ clientes.password_hash: FALTANTE")
        passwordFieldsTest = false
      }
    } catch (error) {
      console.log("❌ Error verificando campos:", error.message)
      passwordFieldsTest = false
    }

    results.push({ test: "Password Fields", status: passwordFieldsTest ? "PASS" : "FAIL" })
    if (!passwordFieldsTest) allTestsPassed = false

    // Test 5: Usuario administrador
    console.log("\n5. 👤 Verificando usuario administrador...")
    try {
      const adminCheck = await client.query("SELECT usuario, rol FROM usuarios_internos WHERE usuario = 'admin'")

      if (adminCheck.rows.length > 0) {
        console.log("✅ Usuario admin existe")
        console.log(`   Rol: ${adminCheck.rows[0].rol}`)
        results.push({ test: "Admin User", status: "PASS" })
      } else {
        console.log("❌ Usuario admin no existe")
        results.push({ test: "Admin User", status: "FAIL" })
        allTestsPassed = false
      }
    } catch (error) {
      console.log("❌ Error verificando admin:", error.message)
      results.push({ test: "Admin User", status: "FAIL", error: error.message })
      allTestsPassed = false
    }

    // Test 6: Funciones de base de datos
    console.log("\n6. ⚙️  Verificando funciones de base de datos...")
    const requiredFunctions = ["generate_unique_raffle_number", "validate_and_use_code", "reset_raffle_system"]

    let functionsTest = true
    for (const func of requiredFunctions) {
      try {
        const funcCheck = await client.query(
          `
          SELECT proname FROM pg_proc WHERE proname = $1
        `,
          [func],
        )

        if (funcCheck.rows.length > 0) {
          console.log(`✅ Función ${func}: OK`)
        } else {
          console.log(`❌ Función ${func}: NO EXISTE`)
          functionsTest = false
        }
      } catch (error) {
        console.log(`❌ Error verificando función ${func}:`, error.message)
        functionsTest = false
      }
    }

    results.push({ test: "Database Functions", status: functionsTest ? "PASS" : "FAIL" })
    if (!functionsTest) allTestsPassed = false

    // Test 7: Probar login de administrador
    console.log("\n7. 🔑 Probando login de administrador...")
    try {
      const adminData = await client.query("SELECT password_hash FROM usuarios_internos WHERE usuario = 'admin'")

      if (adminData.rows.length > 0) {
        const isValidPassword = await bcrypt.compare("admin123", adminData.rows[0].password_hash)

        if (isValidPassword) {
          console.log("✅ Login de admin funciona correctamente")
          console.log("   Usuario: admin")
          console.log("   Contraseña: admin123")
          results.push({ test: "Admin Login", status: "PASS" })
        } else {
          console.log("❌ Contraseña de admin incorrecta")
          results.push({ test: "Admin Login", status: "FAIL" })
          allTestsPassed = false
        }
      } else {
        console.log("❌ No se puede probar login - admin no existe")
        results.push({ test: "Admin Login", status: "FAIL" })
        allTestsPassed = false
      }
    } catch (error) {
      console.log("❌ Error probando login:", error.message)
      results.push({ test: "Admin Login", status: "FAIL", error: error.message })
      allTestsPassed = false
    }

    client.release()

    // Resumen final
    console.log("\n" + "=".repeat(60))
    console.log("📊 RESUMEN DE VERIFICACIÓN")
    console.log("=".repeat(60))

    results.forEach((result, index) => {
      const status = result.status === "PASS" ? "✅" : "❌"
      console.log(`${index + 1}. ${status} ${result.test}: ${result.status}`)
      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }
    })

    console.log("\n" + "=".repeat(60))
    if (allTestsPassed) {
      console.log("🎉 ¡TODOS LOS TESTS PASARON!")
      console.log("✅ El sistema está listo para usar")
      console.log("\n🚀 PRÓXIMOS PASOS:")
      console.log("1. Ejecutar: npm run dev")
      console.log("2. Ir a: http://localhost:3000/admin")
      console.log("3. Login con: admin / admin123")
    } else {
      console.log("❌ ALGUNOS TESTS FALLARON")
      console.log("🔧 Revisa los errores arriba y ejecuta los scripts necesarios")
      console.log("\n💡 COMANDOS PARA CORREGIR:")
      console.log("- Scripts SQL: Ejecutar en orden 01, 02, 03")
      console.log("- Variables: Corregir .env.local")
      console.log("- Dependencias: npm install")
    }
  } catch (error) {
    console.error("❌ Error crítico durante la verificación:", error.message)
    allTestsPassed = false
  } finally {
    await pool.end()
  }

  process.exit(allTestsPassed ? 0 : 1)
}

// Ejecutar verificación
verifySystem().catch(console.error)
