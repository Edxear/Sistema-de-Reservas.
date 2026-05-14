-- Insertar dietas iniciales
INSERT INTO dietas_catalogo (id, nombre, descripcion) VALUES
  ('dieta-blanda', 'Dieta blanda', 'Baja en irritantes, facil digestion'),
  ('dieta-hiposodica', 'Dieta hiposodica', 'Control de sodio para HTA e insuficiencia cardiaca'),
  ('dieta-diabetica', 'Dieta diabetica', 'Control de carbohidratos de absorcion rapida')
ON CONFLICT (id) DO NOTHING;

-- Insertar alergias iniciales
INSERT INTO alergias_catalogo (nombre) VALUES
  ('lactosa'),
  ('gluten'),
  ('huevo'),
  ('frutos secos'),
  ('mariscos')
ON CONFLICT (nombre) DO NOTHING;

-- Estado operativo estándar
INSERT INTO estado_operativo_estandar (modulo, motivo, actualizado_en, actualizado_por)
VALUES ('ON', 'Operacion normal', NULL, NULL)
ON CONFLICT DO NOTHING;