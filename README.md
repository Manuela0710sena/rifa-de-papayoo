# Sistema de Rifas Papayoo

Sistema web completo para la gestión de rifas de la empresa Papayoo, que administra múltiples locales de comida rápida. El sistema permite a los clientes participar en rifas mediante códigos únicos obtenidos en sus compras, y proporciona un panel administrativo completo para la gestión del sistema.

## 🎯 Características Principales


### Para Clientes
- ✅ Acceso mediante códigos QR de facturas
- ✅ Registro/Login con validación de códigos únicos
- ✅ Asignación automática de números de rifa
- ✅ Interfaz simple y amigable

### Para Administradores
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Gestión completa de clientes y participaciones
- ✅ CRUD de sedes/locales
- ✅ Designación de ganadores
- ✅ Exportación de datos en CSV
- ✅ Sistema de auditoría completo

### Integración Externa
- ✅ API segura para recibir códigos de EPICO
- ✅ Validación y procesamiento automático
- ✅ Rate limiting y logs de auditoría

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 15 con App Router + React 18
- **Backend**: Next.js API Routes
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT + bcrypt
- **Estilos**: Tailwind CSS v4 con colores corporativos
- **Validación**: Zod
- **Iconos**: Lucide React

## 📋 Requisitos Previos

- Node.js 18+ 
- PostgreSQL 12+
- npm o yarn

## 🚀 Instalación Local

### 1. Clonar el repositorio
\`\`\`bash
git clone <repository-url>
cd papayoo-raffle-system
\`\`\`

### 2. Instalar dependencias
\`\`\`bash
npm install
\`\`\`

### 3. Configurar base de datos
\`\`\`bash
# Crear base de datos PostgreSQL
createdb papayoo_raffle_system

# Ejecutar migraciones
npm run db:migrate

# Cargar datos iniciales
npm run db:seed
\`\`\`

### 4. Configurar variables de entorno
Crear archivo `.env.local`:
\`\`\`env
# Base de datos
DATABASE_URL=postgresql://usuario:password@localhost:5432/papayoo_raffle_system

# JWT Secret (generar uno seguro)
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui

# EPICO Integration
EPICO_API_KEY=api_key_proporcionada_por_epico

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=otro_secret_muy_seguro
\`\`\`

### 5. Ejecutar en desarrollo
\`\`\`bash
npm run dev
\`\`\`

La aplicación estará disponible en `http://localhost:3000`

## 🔐 Credenciales por Defecto

### Administrador
- **Usuario**: `admin`
- **Contraseña**: `admin123`

### Códigos de Prueba
- `TEST001`, `TEST002`, `TEST003`, `TEST004`, `TEST005`

## 📁 Estructura del Proyecto

\`\`\`
papayoo-raffle-system/
├── app/                          # Next.js App Router
│   ├── admin/                    # Panel administrativo
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Autenticación clientes
│   │   ├── integration/          # API para EPICO
│   │   └── internal/             # API administrativa
│   ├── client/                   # Interfaz de clientes
│   └── globals.css               # Estilos globales con colores Papayoo
├── components/                   # Componentes React reutilizables
├── lib/                         # Utilidades y configuraciones
├── scripts/                     # Scripts SQL y de base de datos
├── public/                      # Archivos estáticos
└── types/                       # Definiciones TypeScript
\`\`\`

## 🔄 Flujo del Sistema

### 1. Proceso de Compra
1. Cliente compra en local físico
2. EPICO genera código único + QR
3. EPICO envía código a Papayoo automáticamente
4. Cliente recibe factura con QR

### 2. Participación en Rifa
1. Cliente escanea QR → accede a Papayoo
2. Sistema valida código (existe, no usado, rifa activa)
3. Cliente se registra o inicia sesión
4. Sistema asigna número único de rifa (5 dígitos)
5. Código marcado como usado

### 3. Administración
1. Admin accede al panel con credenciales
2. Visualiza estadísticas y gestiona sistema
3. Puede designar ganadores manualmente
4. Exporta datos y gestiona sedes

## 🔒 Seguridad Implementada

- ✅ Contraseñas hasheadas con bcrypt (12 rounds)
- ✅ JWT con expiración y firma segura
- ✅ Rate limiting en endpoints críticos
- ✅ Validación estricta con Zod
- ✅ Consultas SQL parametrizadas
- ✅ Logs de auditoría completos
- ✅ API Keys hasheadas para integraciones

## 📊 API Endpoints Principales

### Clientes
- `POST /api/auth/validate-code` - Validar código único
- `POST /api/auth/register` - Registro de cliente
- `POST /api/auth/login` - Login de cliente

### Integración EPICO
- `POST /api/integration/save-code` - Recibir códigos de EPICO

### Administración
- `POST /api/internal/admin/login` - Login admin
- `GET /api/internal/admin/dashboard` - Estadísticas
- `GET /api/internal/admin/clientes` - Lista de clientes
- `POST /api/internal/admin/ganador` - Designar ganador
- CRUD completo para sedes

## 🧪 Testing

\`\`\`bash
# Ejecutar tests (cuando estén implementados)
npm test

# Verificar cobertura
npm run test:coverage
\`\`\`

## 📈 Despliegue en Producción

### Variables de Entorno Requeridas
\`\`\`env
DATABASE_URL=postgresql://...
JWT_SECRET=...
EPICO_API_KEY=...
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=...
\`\`\`

### Pasos de Despliegue
1. Configurar base de datos PostgreSQL en producción
2. Ejecutar migraciones: `npm run db:migrate`
3. Cargar datos iniciales: `npm run db:seed`
4. Configurar variables de entorno
5. Desplegar aplicación Next.js

## 🔧 Mantenimiento

### Reiniciar Rifa (Solo Administradores)
\`\`\`sql
-- Ejecutar en base de datos con precaución
SELECT * FROM reset_raffle_system();
\`\`\`

### Limpieza de Logs
\`\`\`sql
-- Eliminar logs antiguos (>30 días)
DELETE FROM integration_logs WHERE created_at < NOW() - INTERVAL '30 days';
\`\`\`

## 📞 Soporte

Para soporte técnico o reportar problemas:
- Crear issue en el repositorio
- Contactar al equipo de desarrollo

## 📄 Licencia

Propiedad de Papayoo. Todos los derechos reservados.

---

**Desarrollado con ❤️ para Papayoo**
