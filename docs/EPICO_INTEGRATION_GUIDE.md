# Guía de Integración EPICO - Papayoo

## Resumen
Esta guía describe cómo integrar el sistema de facturación EPICO con el sistema de rifas Papayoo para el envío automático de códigos únicos.

## Endpoint de Integración

### POST /api/integration/save-code

**URL**: `https://tu-dominio.com/api/integration/save-code`

**Método**: POST

**Autenticación**: Bearer Token (API Key proporcionada por Papayoo)

**Rate Limit**: 1000 requests por minuto

### Headers Requeridos
\`\`\`
Authorization: Bearer YOUR_API_KEY_HERE
Content-Type: application/json
\`\`\`

### Cuerpo de la Petición
\`\`\`json
{
  "codigo": "ABC12345",
  "meta": {
    "factura_id": "F001",
    "monto": 25000,
    "sede_id": 1
  }
}
\`\`\`

### Campos Obligatorios
- `codigo`: String de 6-12 caracteres, solo letras mayúsculas y números

### Campos Opcionales
- `meta.factura_id`: ID de la factura en EPICO
- `meta.monto`: Monto de la compra
- `meta.sede_id`: ID de la sede donde se realizó la compra

### Respuestas

#### Éxito (201)
\`\`\`json
{
  "success": true,
  "codigo": "ABC12345",
  "fecha_generacion": "2024-01-15T10:30:00Z",
  "trace_id": "uuid-here"
}
\`\`\`

#### Error - Código Duplicado (409)
\`\`\`json
{
  "success": false,
  "error": "Code already exists",
  "codigo": "ABC12345",
  "trace_id": "uuid-here"
}
\`\`\`

#### Error - API Key Inválida (401)
\`\`\`json
{
  "success": false,
  "error": "Invalid API key",
  "trace_id": "uuid-here"
}
\`\`\`

#### Error - Rate Limit (429)
\`\`\`json
{
  "success": false,
  "error": "Rate limit exceeded",
  "trace_id": "uuid-here"
}
\`\`\`

#### Error - Validación (400)
\`\`\`json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "code": "invalid_string",
      "message": "Código debe contener solo letras mayúsculas y números",
      "path": ["codigo"]
    }
  ],
  "trace_id": "uuid-here"
}
\`\`\`

## Health Check

### GET /api/integration/save-code

Endpoint para verificar el estado del servicio.

#### Respuesta Saludable (200)
\`\`\`json
{
  "status": "healthy",
  "service": "EPICO Integration",
  "timestamp": "2024-01-15T10:30:00Z",
  "trace_id": "uuid-here"
}
\`\`\`

#### Respuesta No Saludable (503)
\`\`\`json
{
  "status": "unhealthy",
  "service": "EPICO Integration",
  "error": "Database connection failed",
  "timestamp": "2024-01-15T10:30:00Z",
  "trace_id": "uuid-here"
}
\`\`\`

## Implementación en EPICO

### Ejemplo en Node.js
\`\`\`javascript
const axios = require('axios');

async function enviarCodigoPapayoo(codigo, facturaId, monto, sedeId) {
  try {
    const response = await axios.post(
      'https://papayoo.com/api/integration/save-code',
      {
        codigo: codigo,
        meta: {
          factura_id: facturaId,
          monto: monto,
          sede_id: sedeId
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.PAPAYOO_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );
    
    console.log('Código enviado exitosamente:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Error de respuesta:', error.response.data);
    } else if (error.request) {
      console.error('Error de red:', error.message);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}
\`\`\`

### Ejemplo en PHP
\`\`\`php
<?php
function enviarCodigoPapayoo($codigo, $facturaId, $monto, $sedeId) {
    $url = 'https://papayoo.com/api/integration/save-code';
    $apiKey = $_ENV['PAPAYOO_API_KEY'];
    
    $data = [
        'codigo' => $codigo,
        'meta' => [
            'factura_id' => $facturaId,
            'monto' => $monto,
            'sede_id' => $sedeId
        ]
    ];
    
    $options = [
        'http' => [
            'header' => [
                "Authorization: Bearer $apiKey",
                "Content-Type: application/json"
            ],
            'method' => 'POST',
            'content' => json_encode($data),
            'timeout' => 5
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    if ($result === FALSE) {
        throw new Exception('Error enviando código a Papayoo');
    }
    
    return json_decode($result, true);
}
?>
\`\`\`

## Manejo de Errores

### Estrategia de Reintentos
1. **Error 429 (Rate Limit)**: Esperar 60 segundos y reintentar
2. **Error 500**: Reintentar hasta 3 veces con backoff exponencial
3. **Error 409 (Duplicado)**: No reintentar, código ya existe
4. **Error 401**: Verificar API Key, no reintentar

### Logging Recomendado
- Registrar todos los códigos enviados exitosamente
- Registrar errores con trace_id para seguimiento
- Monitorear rate limits y ajustar frecuencia de envío

## Seguridad

### API Key
- Mantener la API Key segura y no exponerla en código cliente
- Rotar la API Key periódicamente
- Contactar a Papayoo para obtener nueva API Key si se compromete

### IPs Permitidas
- Configurar IPs permitidas en Papayoo para mayor seguridad
- Notificar cambios de IP a Papayoo

## Monitoreo

### Métricas Importantes
- Tasa de éxito de envío de códigos
- Tiempo de respuesta del endpoint
- Errores por tipo (401, 409, 429, 500)
- Códigos enviados por minuto

### Alertas Recomendadas
- Tasa de error > 5%
- Tiempo de respuesta > 2 segundos
- Rate limit alcanzado frecuentemente

## Soporte

Para soporte técnico o problemas con la integración:
- Email: soporte-tecnico@papayoo.com
- Incluir trace_id en reportes de errores
- Proporcionar logs detallados del error

## Changelog

### v1.0 (2024-01-15)
- Implementación inicial de la API de integración
- Rate limiting de 1000 req/min
- Validación de códigos alfanuméricos
- Logging completo con trace_id
