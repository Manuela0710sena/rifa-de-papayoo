const fs = require("fs")
const path = require("path")

// Leer variables de entorno manualmente
function loadEnvVars() {
  const envPath = path.join(process.cwd(), ".env.local")
  const envVars = {}

  try {
    const envContent = fs.readFileSync(envPath, "utf8")
    envContent.split("\n").forEach((line) => {
      const [key, ...valueParts] = line.split("=")
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts
          .join("=")
          .trim()
          .replace(/^["']|["']$/g, "")
      }
    })
  } catch (error) {
    console.log("❌ Error leyendo .env.local:", error.message)
  }

  return envVars
}

async function resetPassword() {
  console.log("🔄 RESET DE CONTRASEÑA SIMPLE")
  console.log("==============================\n")

  const envVars = loadEnvVars()

  if (!envVars.DATABASE_URL) {
    console.log("❌ DATABASE_URL no encontrada en .env.local")
    return
  }

  console.log("✅ Variables de entorno cargadas")
  console.log("✅ DATABASE_URL encontrada")

  // Importar pg dinámicamente
  let Pool
  try {
    Pool = require("pg").Pool
  } catch (error) {
    console.log("❌ Error: pg no está instalado. Ejecuta: npm install pg")
    return
  }

  // Importar bcryptjs dinámicamente
  let bcrypt
  try {
    bcrypt = require("bcryptjs")
  } catch (error) {
    console.log("❌ Error: bcryptjs no está instalado. Ejecuta: npm install bcryptjs")
    return
  }

  const pool = new Pool({
    connectionString: envVars.DATABASE_URL,
    ssl: envVars.DATABASE_URL.includes("neon.tech") ? { rejectUnauthorized: false } : false,
  })

  try {
    const client = await pool.connect()

    // Verificar usuario superadmin
    console.log("1. Verificando usuario superadmin...")
    const userCheck = await client.query("SELECT id, usuario FROM usuarios_internos WHERE usuario = $1", ["superadmin"])

    if (userCheck.rows.length === 0) {
      console.log("❌ Usuario superadmin no encontrado")
      client.release()
      return
    }

    console.log("✅ Usuario superadmin encontrado")

    // Generar nuevo hash para "admin123"
    console.log('2. Generando nuevo hash para contraseña "admin123"...')
    const newHash = await bcrypt.hash("admin123", 12)
    console.log("✅ Hash generado")

    // Actualizar contraseña
    console.log("3. Actualizando contraseña en base de datos...")
    await client.query("UPDATE usuarios_internos SET password_hash = $1 WHERE usuario = $2", [newHash, "superadmin"])
    console.log("✅ Contraseña actualizada")

    // Verificar que funciona
    console.log("4. Verificando nueva contraseña...")
    const verification = await bcrypt.compare("admin123", newHash)

    if (verification) {
      console.log("✅ Verificación exitosa")
      console.log("\n🎉 CONTRASEÑA RESETEADA EXITOSAMENTE")
      console.log("   Usuario: superadmin")
      console.log("   Nueva contraseña: admin123")
      console.log("\n💡 Ahora puedes hacer login en el panel administrativo")
    } else {
      console.log("❌ Error en verificación")
    }

    client.release()
  } catch (error) {
    console.log("❌ Error:", error.message)
  }

  await pool.end()
}

resetPassword().catch(console.error)
