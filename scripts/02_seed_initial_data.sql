-- Papayoo Raffle System - Initial Data Seeding
-- Version: 1.0
-- Description: Seeds initial data for testing and production setup

-- Insert default admin user (admin/admin123)
-- Password hash for 'admin123' using bcrypt with 12 rounds
c
-- Insert sample sedes (locations)
INSERT INTO sedes (nombre, ciudad, direccion, estado) VALUES
('Centro', 'Bogotá', 'Calle 123 #45-67', 'activa'),
('Norte', 'Bogotá', 'Carrera 15 #80-20', 'activa'),
('Sur', 'Bogotá', 'Avenida 68 #40-50', 'activa'),
('Chapinero', 'Bogotá', 'Zona Rosa, Calle 82 #12-34', 'activa'),
('Medellín Centro', 'Medellín', 'Carrera 50 #50-50', 'activa')
ON CONFLICT DO NOTHING;

-- Insert EPICO integration
INSERT INTO integrations (name, api_key_hash, allowed_ips, rate_limit) 
VALUES (
    'EPICO', 
    '$2b$12$example_hash_for_epico_api_key_here', 
    ARRAY['127.0.0.1', '::1'], 
    1000
)
ON CONFLICT DO NOTHING;

-- Initialize raffle configuration
INSERT INTO configuracion_rifa (estado, fecha_actualizacion) 
VALUES ('activa', NOW())
ON CONFLICT DO NOTHING;

-- Insert sample codes for testing (these would normally come from EPICO)
INSERT INTO codigos (codigo, estado, generado_por, meta) VALUES
('TEST001', 'activo', 'EPICO', '{"factura_id": "F001", "monto": 25000}'),
('TEST002', 'activo', 'EPICO', '{"factura_id": "F002", "monto": 18500}'),
('TEST003', 'activo', 'EPICO', '{"factura_id": "F003", "monto": 32000}'),
('TEST004', 'activo', 'EPICO', '{"factura_id": "F004", "monto": 15000}'),
('TEST005', 'activo', 'EPICO', '{"factura_id": "F005", "monto": 28000}')
ON CONFLICT (codigo) DO NOTHING;

-- Success message
SELECT 'Initial data seeded successfully!' as status,
       'Admin user: admin/admin123' as admin_credentials,
       'Test codes: TEST001, TEST002, TEST003, TEST004, TEST005' as test_codes;
