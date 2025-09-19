# Guía de Instalación y Despliegue - Sistema Papayoo

## Requisitos Previos

### Software Requerido
- **Node.js**: v18.0.0 o superior
- **PostgreSQL**: v13.0 o superior
- **Git**: Para clonar el repositorio

### Servicios Externos
- **Neon Database**: Base de datos PostgreSQL en la nube
- **Vercel**: Para despliegue (recomendado)

## Instalación Local

### 1. Clonar el Repositorio
\`\`\`bash
git clone <repository-url>
cd papayoo-raffle-system
\`\`\`

### 2. Instalar Dependencias
\`\`\`bash
npm install
\`\`\`

### 3. Configurar Variables de Entorno

Crear archivo `.env.local`:
\`\`\`env
# Base de datos (Neon)
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
POSTGRES_URL="postgresql://username:password@host/database?sslmode=require"

# Seguridad
JWT_SECRET="tu-jwt-secret-muy-seguro-de-al-menos-32-caracteres"
PAPAYOO_API_KEY="tu-api-key-para-epico-integration"

# Opcional: Para desarrollo
NEXT_PUBLIC_DEV_MODE="true"
\`\`\`

### 4. Configurar Base de Datos

#### Opción A: Usando Neon (Recomendado)
1. Crear cuenta en [Neon](https://neon.tech)
2. Crear nuevo proyecto
3. Copiar connection string a `DATABASE_URL`
4. Ejecutar migraciones:

\`\`\`bash
# Ejecutar scripts SQL en orden
npm run db:migrate
\`\`\`

#### Opción B: PostgreSQL Local
\`\`\`bash
# Crear base de datos
createdb papayoo_raffle

# Configurar usuario y permisos
psql -d papayoo_raffle -c "CREATE USER papayoo WITH PASSWORD 'password';"
psql -d papayoo_raffle -c "GRANT ALL PRIVILEGES ON DATABASE papayoo_raffle TO papayoo;"
\`\`\`

### 5. Ejecutar Migraciones
\`\`\`bash
# Ejecutar en orden:
npm run script scripts/01_create_database_schema.sql
npm run script scripts/02_seed_initial_data.sql  
npm run script scripts/03_create_functions.sql
\`\`\`

### 6. Iniciar Desarrollo
\`\`\`bash
npm run dev
\`\`\`

La aplicación estará disponible en `http://localhost:3000`

## Despliegue en Producción

### Opción 1: Vercel (Recomendado)

#### 1. Preparar Repositorio
\`\`\`bash
git add .
git commit -m "Initial commit"
git push origin main
\`\`\`

#### 2. Configurar Vercel
1. Conectar repositorio en [Vercel](https://vercel.com)
2. Configurar variables de entorno en Vercel Dashboard
3. Desplegar automáticamente

#### 3. Variables de Entorno en Vercel
\`\`\`env
DATABASE_URL=postgresql://...
POSTGRES_URL=postgresql://...
JWT_SECRET=tu-jwt-secret-produccion
PAPAYOO_API_KEY=tu-api-key-produccion
\`\`\`

### Opción 2: Docker

#### 1. Crear Dockerfile
\`\`\`dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

#### 2. Docker Compose
\`\`\`yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - PAPAYOO_API_KEY=${PAPAYOO_API_KEY}
    depends_on:
      - postgres
      
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: papayoo_raffle
      POSTGRES_USER: papayoo
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
volumes:
  postgres_data:
\`\`\`

## Configuración Post-Despliegue

### 1. Crear Usuario Administrador
\`\`\`sql
INSERT INTO usuarios_internos (nombre, email, password_hash, rol, activo)
VALUES (
  'Admin Principal',
  'admin@papayoo.com',
  '$2b$12$hash_de_password',
  'admin',
  true
);
\`\`\`

### 2. Configurar Rifa Inicial
\`\`\`sql
INSERT INTO configuracion_rifa (
  nombre_rifa, descripcion, fecha_inicio, fecha_fin,
  premio, activa, numeros_disponibles
) VALUES (
  'Rifa Inaugural Papayoo',
  'Primera rifa del sistema',
  NOW(),
  NOW() + INTERVAL '30 days',
  'Premio Especial',
  true,
  50000
);
\`\`\`

### 3. Configurar Sedes
Usar el panel administrativo en `/admin` para:
- Agregar sedes de Papayoo
- Configurar parámetros de rifa
- Verificar integración con EPICO

## Integración con EPICO

### Endpoint para EPICO
\`\`\`
POST https://tu-dominio.com/api/integration/save-code
Headers:
  Content-Type: application/json
  X-API-Key: tu-papayoo-api-key

Body:
{
  "codigo": "ABC123XYZ",
  "sede_id": 1,
  "monto_compra": 25000,
  "numero_factura": "FAC-001",
  "metadata": {
    "vendedor": "Juan Pérez",
    "caja": "Caja 1"
  }
}
\`\`\`

### Configurar en EPICO
1. Agregar webhook URL en sistema EPICO
2. Configurar API Key proporcionada
3. Probar integración con códigos de prueba

## Monitoreo y Mantenimiento

### Logs de Sistema
- Logs de integración: Tabla `integration_logs`
- Logs de aplicación: Vercel Dashboard o Docker logs
- Métricas de uso: Panel administrativo

### Backup de Base de Datos
\`\`\`bash
# Backup automático (configurar cron)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
psql $DATABASE_URL < backup_file.sql
\`\`\`

### Actualizaciones
\`\`\`bash
git pull origin main
npm install
npm run build
# Reiniciar servicio
\`\`\`

## Solución de Problemas

### Problemas Comunes

#### 1. Error de Conexión a Base de Datos
- Verificar `DATABASE_URL`
- Confirmar que la base de datos está accesible
- Revisar configuración de SSL

#### 2. Códigos No Se Validan
- Verificar integración con EPICO
- Revisar logs en `integration_logs`
- Confirmar que la rifa está activa

#### 3. Problemas de Autenticación
- Verificar `JWT_SECRET`
- Limpiar cookies del navegador
- Revisar logs de aplicación

### Contacto de Soporte
Para problemas técnicos:
- Email: soporte@papayoo.com
- Documentación: `/docs`
- Logs del sistema: Panel administrativo

## Seguridad

### Recomendaciones de Producción
1. **HTTPS obligatorio** en producción
2. **Firewall** configurado para PostgreSQL
3. **Backups automáticos** diarios
4. **Monitoreo** de logs de seguridad
5. **Rotación de API Keys** mensual
6. **Actualizaciones** de dependencias regulares

### Auditoría
- Todos los accesos se registran en `integration_logs`
- Panel administrativo incluye reportes de auditoría
- Logs de cambios en configuración de rifas
