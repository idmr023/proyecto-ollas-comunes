INSERT INTO tenants (code, name, status)
VALUES
  ('MUNI-LIMA-CENTRO', 'Municipalidad de Lima Centro', 'active'),
  ('MUNI-SJL', 'Municipalidad de San Juan de Lurigancho', 'active'),
  ('OLLAS-SOL-NORTE', 'Programa Ollas Solidarias Norte', 'active')
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  status = EXCLUDED.status;
