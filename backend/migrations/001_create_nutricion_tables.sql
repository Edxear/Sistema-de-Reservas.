-- Tabla de pacientes clínicos de nutrición
CREATE TABLE IF NOT EXISTS clinico_pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    documento VARCHAR(50) NOT NULL UNIQUE,
    edad INT,
    medico_responsable VARCHAR(200),
    enfermero_responsable VARCHAR(200),
    historia_clinica JSONB NOT NULL DEFAULT '{"resumen":"","antecedentes":[],"procesos":[]}',
    dietas JSONB NOT NULL DEFAULT '[]',
    alergias JSONB NOT NULL DEFAULT '[]',
    cocina JSONB NOT NULL DEFAULT '{"pedidos":[],"observaciones":""}',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por JSONB
);

-- Catálogo de dietas
CREATE TABLE IF NOT EXISTS dietas_catalogo (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

-- Catálogo de alergias
CREATE TABLE IF NOT EXISTS alergias_catalogo (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

-- Pedidos globales de cocina
CREATE TABLE IF NOT EXISTS cocina_pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID REFERENCES clinico_pacientes(id),
    paciente_nombre VARCHAR(200),
    menu VARCHAR(200) NOT NULL,
    turno VARCHAR(50),
    estado VARCHAR(50) DEFAULT 'pendiente',
    observaciones TEXT,
    solicitado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    solicitado_por VARCHAR(200)
);

-- Estado operativo estándar
CREATE TABLE IF NOT EXISTS estado_operativo_estandar (
    id SERIAL PRIMARY KEY,
    modulo VARCHAR(100) NOT NULL,
    motivo TEXT,
    actualizado_en TIMESTAMP,
    actualizado_por VARCHAR(200)
);