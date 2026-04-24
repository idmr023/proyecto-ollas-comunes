ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS category varchar(100) NOT NULL DEFAULT 'Municipalidad',
  ADD COLUMN IF NOT EXISTS location varchar(100) NOT NULL DEFAULT 'Lima';

UPDATE tenants
SET
  category = CASE code
    WHEN 'MUNI-LIMA-CENTRO' THEN 'Municipalidad'
    WHEN 'MUNI-SJL' THEN 'Municipalidad'
    WHEN 'OLLAS-SOL-NORTE' THEN 'Programa social'
    ELSE category
  END,
  location = CASE code
    WHEN 'MUNI-LIMA-CENTRO' THEN 'Lima'
    WHEN 'MUNI-SJL' THEN 'Lima Este'
    WHEN 'OLLAS-SOL-NORTE' THEN 'Lima Norte'
    ELSE location
  END;
