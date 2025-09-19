const fs = require("fs")
const path = require("path")

// Cargar variables de entorno manualmente
function loadEnvVars() {
  try {
    const envPath = path.join(process.cwd(), ".env.local")
    const envContent = fs.readFileSync(envPath, "utf8")

    envContent.split("\n").forEach((line) => {
      const [key, ...valueParts] = line.split("=")
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").trim()
        process.env[key.trim()] = value.replace(/^["']|["']$/g, "")
      }
    })
  } catch (error) {
    console.log("Error cargando .env.local:", error.message)
  }
}

loadEnvVars()

const { Pool } = require("pg")
const bcrypt = require("bcryptjs")

async function testLogin() {
  console.log("🔐 PROBANDO LOGIN DIRECTO")
  console.log("========================\n")

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes("neon.tech") ? { rejectUnauthorized: false } : false,
  })

  try {
    const client = await pool.connect()

    // Obtener usuario superadmin
    const userResult = await client.query(
      "SELECT id, usuario, password_hash, rol FROM usuarios_internos WHERE usuario = $1",
      ["superadmin"],
    )

    if (userResult.rows.length === 0) {
      console.log("❌ Usuario 'superadmin' no encontrado")
      return
    }

    const user = userResult.rows[0]
    console.log(`✅ Usuario encontrado: ${user.usuario} (ID: ${user.id}, Rol: ${user.rol})`)
    console.log(`   Hash: ${user.password_hash.substring(0, 30)}...`)

    // Probar contraseñas
    const testPasswords = ["admin123", "superadmin", "123456", "password"]

    for (const testPassword of testPasswords) {
      console.log(`\n🔍 Probando contraseña: "${testPassword}"`)

      try {
        const isValid = await bcrypt.compare(testPassword, user.password_hash)

        if (isValid) {
          console.log(`✅ ¡CONTRASEÑA CORRECTA! "${testPassword}"`)

          // Probar JWT
          const jwt = require("jsonwebtoken")
          const token = jwt.sign(
            {
              userId: user.id,
              usuario: user.usuario,
              rol: user.rol,
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" },
          )

          console.log(`✅ Token JWT generado: ${token.substring(0, 50)}...`)
          break
        } else {
          console.log(`❌ Contraseña incorrecta`)
        }
      } catch (error) {
        console.log(`❌ Error comparando contraseña: ${error.message}`)
      }
    }

    client.release()
  } catch (error) {
    console.log(`❌ Error: ${error.message}`)
  } finally {
    await pool.end()
  }
}

testLogin().catch(console.error)
