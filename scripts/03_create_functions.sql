-- Papayoo Raffle System - Database Functions
-- Version: 1.0
-- Description: Utility functions for the raffle system

-- Function to generate unique 5-digit raffle numbers
CREATE OR REPLACE FUNCTION generate_unique_raffle_number()
RETURNS VARCHAR(5) AS $$
DECLARE
    new_number VARCHAR(5);
    attempts INTEGER := 0;
    max_attempts INTEGER := 1000;
BEGIN
    LOOP
        -- Generate random 5-digit number (00001 to 99999)
        new_number := LPAD((RANDOM() * 99999)::INTEGER::TEXT, 5, '0');
        
        -- Check if number already exists
        IF NOT EXISTS (SELECT 1 FROM participaciones WHERE numero_rifa = new_number) THEN
            RETURN new_number;
        END IF;
        
        attempts := attempts + 1;
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique raffle number after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to validate and use a code
CREATE OR REPLACE FUNCTION validate_and_use_code(
    p_codigo VARCHAR(12),
    p_cliente_id INTEGER
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    numero_rifa VARCHAR(5)
) AS $$
DECLARE
    v_codigo_id INTEGER;
    v_raffle_state VARCHAR(20);
    v_new_number VARCHAR(5);
BEGIN
    -- Check if raffle is active
    SELECT estado INTO v_raffle_state 
    FROM configuracion_rifa 
    ORDER BY id DESC 
    LIMIT 1;
    
    IF v_raffle_state != 'activa' THEN
        RETURN QUERY SELECT FALSE, 'La rifa no está activa actualmente', NULL::VARCHAR(5);
        RETURN;
    END IF;
    
    -- Check if code exists and is valid
    SELECT id INTO v_codigo_id
    FROM codigos 
    WHERE codigo = p_codigo 
    AND estado = 'activo'
    AND (fecha_expiracion IS NULL OR fecha_expiracion > NOW());
    
    IF v_codigo_id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Código inválido, ya usado o expirado', NULL::VARCHAR(5);
        RETURN;
    END IF;
    
    -- Generate unique raffle number
    v_new_number := generate_unique_raffle_number();
    
    -- Start transaction
    BEGIN
        -- Mark code as used
        UPDATE codigos 
        SET estado = 'usado', fecha_uso = NOW()
        WHERE id = v_codigo_id;
        
        -- Create participation record
        INSERT INTO participaciones (cliente_id, codigo_id, numero_rifa)
        VALUES (p_cliente_id, v_codigo_id, v_new_number);
        
        RETURN QUERY SELECT TRUE, 'Código validado exitosamente', v_new_number;
        
    EXCEPTION WHEN OTHERS THEN
        -- Rollback will happen automatically
        RETURN QUERY SELECT FALSE, 'Error interno del sistema', NULL::VARCHAR(5);
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to reset raffle (for testing/new campaigns)
CREATE OR REPLACE FUNCTION reset_raffle_system()
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    affected_codes INTEGER,
    affected_participations INTEGER
) AS $$
DECLARE
    v_codes_count INTEGER;
    v_participations_count INTEGER;
BEGIN
    BEGIN
        -- Count affected records
        SELECT COUNT(*) INTO v_codes_count FROM codigos WHERE estado = 'usado';
        SELECT COUNT(*) INTO v_participations_count FROM participaciones;
        
        -- Reset all codes to unused
        UPDATE codigos SET estado = 'activo', fecha_uso = NULL WHERE estado = 'usado';
        
        -- Delete all participations (keeps users)
        DELETE FROM participaciones;
        
        -- Reset raffle configuration
        UPDATE configuracion_rifa SET 
            estado = 'activa',
            numero_ganador = NULL,
            fecha_cierre = NULL,
            fecha_actualizacion = NOW();
        
        RETURN QUERY SELECT TRUE, 'Sistema de rifa reiniciado exitosamente', v_codes_count, v_participations_count;
        
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT FALSE, 'Error al reiniciar el sistema', 0, 0;
    END;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Database functions created successfully!' as status;
