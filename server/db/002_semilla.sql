-- Planes base del catálogo (datos de referencia, también válidos en producción).
INSERT INTO planes (nombre, velocidad_mbps, precio_clp) VALUES
  ('Fibra 300', 300, 15990),
  ('Fibra 600', 600, 19990),
  ('Fibra 940', 940, 24990)
ON CONFLICT (nombre) DO NOTHING;
