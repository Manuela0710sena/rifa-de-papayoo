# Documentación API - Sistema Papayoo

## Autenticación

### Cliente (JWT)
\`\`\`http
POST /api/auth/login
Content-Type: application/json

{
  "email": "cliente@email.com",
  "password": "password123"
}
\`\`\`

### Administrador
\`\`\`http
POST /api/internal/admin/login
Content-Type: application/json

{
  "email": "admin@papayoo.com",
  "password": "admin123"
}
\`\`\`

## Endpoints Públicos

### Validar Código
\`\`\`http
POST /api/auth/validate-code
Content-Type: application/json

{
  "codigo": "ABC123XYZ"
}

Response:
{
  "valid": true,
  "message": "Código válido",
  "sede": {
    "id": 1,
    "nombre": "Papayoo Centro"
  }
}
\`\`\`

### Registro de Cliente
\`\`\`http
POST /api/auth/register
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "email": "juan@email.com",
  "telefono": "+57300123456",
  "cedula": "12345678",
  "sede_id": 1,
  "codigo": "ABC123XYZ",
  "password": "password123"
}
\`\`\`

## Endpoints Administrativos

### Dashboard
\`\`\`http
GET /api/internal/admin/dashboard
Authorization: Bearer <admin_token>

Response:
{
  "stats": {
    "total_participaciones": 150,
    "codigos_generados": 200,
    "codigos_usados": 150,
    "clientes_registrados": 120
  },
  "recent_activity": [...],
  "raffle_status": {...}
}
\`\`\`

### Gestión de Clientes
\`\`\`http
GET /api/internal/admin/clientes
Authorization: Bearer <admin_token>

Response:
{
  "clientes": [
    {
      "id": 1,
      "nombre": "Juan Pérez",
      "email": "juan@email.com",
      "telefono": "+57300123456",
      "participaciones": 3,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 120,
  "page": 1
}
\`\`\`

## Integración EPICO

### Guardar Código
\`\`\`http
POST /api/integration/save-code
Content-Type: application/json
X-API-Key: <papayoo_api_key>

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

Response:
{
  "success": true,
  "message": "Código guardado exitosamente",
  "codigo_id": 123,
  "trace_id": "uuid-trace-id"
}
\`\`\`

## Códigos de Error

- `400` - Bad Request (datos inválidos)
- `401` - Unauthorized (no autenticado)
- `403` - Forbidden (sin permisos)
- `404` - Not Found (recurso no encontrado)
- `409` - Conflict (código ya usado)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

## Rate Limiting

- **EPICO Integration**: 1000 req/min
- **Client API**: 100 req/min
- **Admin API**: 500 req/min
\`\`\`

```json file="" isHidden
