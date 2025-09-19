const fs = require("fs")
const path = require("path")

console.log("🔍 DIAGNÓSTICO SIMPLE DEL SISTEMA PAPAYOO")
console.log("==========================================\n")

// Verificar archivos esenciales
const essentialFiles = [".env.local", "app/api/internal/admin/login/route.ts", "lib/auth.ts", "lib/validation.ts"]

console.log("📁 Verificando archivos esenciales:")
essentialFiles.forEach((file) => {
  const exists = fs.existsSync(file)
  console.log(`  ${exists ? "✅" : "❌"} ${file}`)
})

// Verificar .env.local
console.log("\n🔐 Verificando variables de entorno:")
if (fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8")
  const requiredVars = ["DATABASE_URL", "JWT_SECRET"]

  requiredVars.forEach((varName) => {
    const hasVar = envContent.includes(varName)
    console.log(`  ${hasVar ? "✅" : "❌"} ${varName}`)
  })
} else {
  console.log("  ❌ Archivo .env.local no encontrado")
}

// Verificar node_modules
console.log("\n📦 Verificando dependencias:")
const nodeModulesExists = fs.existsSync("node_modules")
console.log(`  ${nodeModulesExists ? "✅" : "❌"} node_modules instalado`)

if (!nodeModulesExists) {
  console.log("\n🚨 PROBLEMA ENCONTRADO:")
  console.log("Las dependencias no están instaladas.")
  console.log("\n💡 SOLUCIÓN:")
  console.log("Ejecuta: npm install")
  console.log("Luego ejecuta: node scripts/diagnose-local.js")
}

console.log("\n✅ Diagnóstico básico completado")
console.log("Ahora puedes ejecutar: node scripts/diagnose-local.js")
