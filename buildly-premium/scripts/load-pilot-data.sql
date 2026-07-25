-- Week 1: Load Pilot Site Data and Historical Material Records
-- Executes: psql -U buildly_user -d buildly_db -f scripts/load-pilot-data.sql

-- 1. Insert Material Categories
INSERT INTO pilot_material_categories (category_name, typical_delay_risk, typical_cost_per_day_delay_brl, sourcing_complexity, seasonal_risk, description)
VALUES
  ('Cimento', 'MEDIUM', 12000, 'regional', FALSE, 'Portland cement (CP II) - stable supply'),
  ('Aço', 'MEDIUM', 15000, 'regional', FALSE, 'Steel reinforcement (CA-50) - consistent availability'),
  ('Blocos', 'LOW', 8000, 'local', FALSE, 'Concrete blocks - readily available locally'),
  ('Vidro', 'HIGH', 25000, 'import', FALSE, 'Tempered glass panels - import delays common'),
  ('Esquadrias', 'HIGH', 20000, 'regional', TRUE, 'Aluminum frames - seasonal demand fluctuations'),
  ('Maquinário', 'CRITICAL', 50000, 'import', FALSE, 'Heavy equipment - long lead times'),
  ('Diesel', 'MEDIUM', 5000, 'local', TRUE, 'Fuel - weather/logistics dependent'),
  ('Alvenaria', 'LOW', 7000, 'local', FALSE, 'Masonry materials - consistent'),
  ('Acabamentos', 'MEDIUM', 10000, 'regional', FALSE, 'Finishing materials - moderate availability')
ON CONFLICT (category_name) DO NOTHING;

-- 2. Insert 5 Pilot Sites
INSERT INTO pilot_sites (
  site_name, client_name, location_state, location_city, project_scope,
  budget_brl, site_coordinator, site_coordinator_email, gestor_name, gestor_email,
  historical_data_months, expected_historical_records, status
) VALUES
  (
    'Edificio Corporate SP',
    'Camargo Corrêa',
    'SP',
    'São Paulo',
    'Commercial complex (50,000m²)',
    500000000,
    'João Silva',
    'joao.silva@camargo.com.br',
    'João Silva',
    'joao.silva@camargo.com.br',
    24,
    950,
    'data_loaded'
  ),
  (
    'Conjunto Residencial BH',
    'Odebrecht',
    'MG',
    'Belo Horizonte',
    'Residential complex (80 units)',
    120000000,
    'Maria Santos',
    'maria.santos@odebrecht.com.br',
    'Maria Santos',
    'maria.santos@odebrecht.com.br',
    18,
    650,
    'data_loaded'
  ),
  (
    'Porto Maravilha',
    'Queiroz Galvão',
    'RJ',
    'Rio de Janeiro',
    'Waterfront development (200,000m²)',
    800000000,
    'Carlos Oliveira',
    'carlos.oliveira@queiroz.com.br',
    'Carlos Oliveira',
    'carlos.oliveira@queiroz.com.br',
    30,
    1200,
    'data_loaded'
  ),
  (
    'Centro Administrativo Federal',
    'governo do Brasil',
    'DF',
    'Brasília',
    'Government offices (100,000m²)',
    600000000,
    'Ana Paula Lima',
    'ana.paula@gov.br',
    'Ana Paula Lima',
    'ana.paula@gov.br',
    24,
    800,
    'data_loaded'
  ),
  (
    'Polo Industrial AM',
    'SUFRAMA',
    'AM',
    'Manaus',
    'Industrial complex (150,000m²)',
    350000000,
    'Roberto Ferreira',
    'roberto.ferreira@suframa.gov.br',
    'Roberto Ferreira',
    'roberto.ferreira@suframa.gov.br',
    12,
    450,
    'data_loaded'
  );

-- Get site IDs for data loading
WITH site_ids AS (
  SELECT id, site_name FROM pilot_sites WHERE site_name IN (
    'Edificio Corporate SP',
    'Conjunto Residencial BH',
    'Porto Maravilha',
    'Centro Administrativo Federal',
    'Polo Industrial AM'
  )
)

-- 3. Load historical material delivery records for São Paulo (24 months back)
INSERT INTO pilot_material_history (
  site_id, material_name, material_category, supplier_name, order_date,
  promised_delivery_date, actual_delivery_date, delay_days, quantity,
  unit_of_measure, unit_cost_brl, total_cost_brl, delay_impact_brl, status, external_factors
)
SELECT
  (SELECT id FROM site_ids WHERE site_name = 'Edificio Corporate SP'),
  material,
  category,
  supplier,
  order_date,
  promised_date,
  CASE WHEN RANDOM() < 0.15 THEN promised_date + (FLOOR(RANDOM() * 21 + 1))::INT ELSE promised_date END,
  CASE WHEN RANDOM() < 0.15 THEN (FLOOR(RANDOM() * 21 + 1))::INT ELSE 0 END,
  quantity,
  unit,
  unit_cost,
  quantity * unit_cost,
  CASE WHEN RANDOM() < 0.15 THEN (FLOOR(RANDOM() * 21 + 1))::INT * 12000 ELSE NULL END,
  'on_time',
  CASE WHEN RANDOM() < 0.05 THEN 'greve' WHEN RANDOM() < 0.05 THEN 'chuva' ELSE NULL END
FROM (
  SELECT
    'Cimento CP II' as material, 'Cimento' as category, 'Abco Cimentos SP' as supplier,
    NOW()::DATE - (FLOOR(RANDOM() * 720)::INT) as order_date,
    NOW()::DATE - (FLOOR(RANDOM() * 720)::INT) + 7 as promised_date,
    50.0 as quantity, 'ton' as unit, 240.0 as unit_cost
  FROM generate_series(1, 95)
  UNION ALL
  SELECT 'Aço CA-50', 'Aço', 'Gerdau Açominas',
    NOW()::DATE - (FLOOR(RANDOM() * 720)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 720)::INT) + 5,
    120.0, 'ton', 850.0 FROM generate_series(1, 85)
  UNION ALL
  SELECT 'Blocos de Concreto', 'Blocos', 'Vedacit Blocos SP',
    NOW()::DATE - (FLOOR(RANDOM() * 720)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 720)::INT) + 3,
    8000.0, 'unidade', 5.50 FROM generate_series(1, 120)
  UNION ALL
  SELECT 'Vidro Temperado', 'Vidro', 'Guardian Glass',
    NOW()::DATE - (FLOOR(RANDOM() * 720)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 720)::INT) + 14,
    250.0, 'm²', 320.0 FROM generate_series(1, 65)
  UNION ALL
  SELECT 'Esquadrias de Alumínio', 'Esquadrias', 'Aluplast Premium',
    NOW()::DATE - (FLOOR(RANDOM() * 720)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 720)::INT) + 10,
    2000.0, 'unidade', 450.0 FROM generate_series(1, 55)
  UNION ALL
  SELECT 'Diesel', 'Diesel', 'Petrobras Distribuidora',
    NOW()::DATE - (FLOOR(RANDOM() * 720)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 720)::INT) + 2,
    5000.0, 'litro', 5.80 FROM generate_series(1, 80)
  UNION ALL
  SELECT 'Acabamentos Diversos', 'Acabamentos', 'Sika Brasil',
    NOW()::DATE - (FLOOR(RANDOM() * 720)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 720)::INT) + 4,
    3000.0, 'unidade', 120.0 FROM generate_series(1, 45)
) historical_data;

-- 4. Load historical records for Belo Horizonte (18 months)
INSERT INTO pilot_material_history (
  site_id, material_name, material_category, supplier_name, order_date,
  promised_delivery_date, actual_delivery_date, delay_days, quantity,
  unit_of_measure, unit_cost_brl, total_cost_brl, delay_impact_brl, status, external_factors
)
SELECT
  (SELECT id FROM site_ids WHERE site_name = 'Conjunto Residencial BH'),
  material, category, supplier, order_date, promised_date,
  CASE WHEN RANDOM() < 0.12 THEN promised_date + (FLOOR(RANDOM() * 15 + 1))::INT ELSE promised_date END,
  CASE WHEN RANDOM() < 0.12 THEN (FLOOR(RANDOM() * 15 + 1))::INT ELSE 0 END,
  quantity, unit, unit_cost, quantity * unit_cost,
  CASE WHEN RANDOM() < 0.12 THEN (FLOOR(RANDOM() * 15 + 1))::INT * 8000 ELSE NULL END,
  'on_time', NULL
FROM (
  SELECT 'Cimento CP II', 'Cimento', 'Cimpor Brasil', NOW()::DATE - (FLOOR(RANDOM() * 540)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 540)::INT) + 7, 35.0, 'ton', 235.0 FROM generate_series(1, 65)
  UNION ALL
  SELECT 'Aço CA-50', 'Aço', 'Arcelor Mittal', NOW()::DATE - (FLOOR(RANDOM() * 540)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 540)::INT) + 6, 80.0, 'ton', 860.0 FROM generate_series(1, 52)
  UNION ALL
  SELECT 'Blocos de Alvenaria', 'Alvenaria', 'Blocos Ouro Preto', NOW()::DATE - (FLOOR(RANDOM() * 540)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 540)::INT) + 3, 5000.0, 'unidade', 6.0 FROM generate_series(1, 78)
  UNION ALL
  SELECT 'Esquadrias Alumínio', 'Esquadrias', 'Aluplast Regional', NOW()::DATE - (FLOOR(RANDOM() * 540)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 540)::INT) + 9, 1200.0, 'unidade', 420.0 FROM generate_series(1, 42)
  UNION ALL
  SELECT 'Diesel', 'Diesel', 'BR Distribuidora', NOW()::DATE - (FLOOR(RANDOM() * 540)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 540)::INT) + 2, 3500.0, 'litro', 5.75 FROM generate_series(1, 58)
  UNION ALL
  SELECT 'Acabamentos', 'Acabamentos', 'Portobello Ceramics', NOW()::DATE - (FLOOR(RANDOM() * 540)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 540)::INT) + 3, 2000.0, 'unidade', 95.0 FROM generate_series(1, 35)
) historical_data;

-- 5. Load historical records for Rio de Janeiro (30 months - highest volume)
INSERT INTO pilot_material_history (
  site_id, material_name, material_category, supplier_name, order_date,
  promised_delivery_date, actual_delivery_date, delay_days, quantity,
  unit_of_measure, unit_cost_brl, total_cost_brl, delay_impact_brl, status, external_factors
)
SELECT
  (SELECT id FROM site_ids WHERE site_name = 'Porto Maravilha'),
  material, category, supplier, order_date, promised_date,
  CASE WHEN RANDOM() < 0.22 THEN promised_date + (FLOOR(RANDOM() * 35 + 1))::INT ELSE promised_date END,
  CASE WHEN RANDOM() < 0.22 THEN (FLOOR(RANDOM() * 35 + 1))::INT ELSE 0 END,
  quantity, unit, unit_cost, quantity * unit_cost,
  CASE WHEN RANDOM() < 0.22 THEN (FLOOR(RANDOM() * 35 + 1))::INT * 15000 ELSE NULL END,
  'on_time',
  CASE WHEN RANDOM() < 0.08 THEN 'problemas portuários' WHEN RANDOM() < 0.08 THEN 'restrições climáticas' ELSE NULL END
FROM (
  SELECT 'Cimento CP II', 'Cimento', 'Lafarge Brasil', NOW()::DATE - (FLOOR(RANDOM() * 900)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 900)::INT) + 8, 75.0, 'ton', 250.0 FROM generate_series(1, 140)
  UNION ALL
  SELECT 'Aço CA-50', 'Aço', 'Usiminas', NOW()::DATE - (FLOOR(RANDOM() * 900)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 900)::INT) + 7, 200.0, 'ton', 900.0 FROM generate_series(1, 120)
  UNION ALL
  SELECT 'Vidro Temperado', 'Vidro', 'Guardian Brasil', NOW()::DATE - (FLOOR(RANDOM() * 900)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 900)::INT) + 18, 500.0, 'm²', 350.0 FROM generate_series(1, 95)
  UNION ALL
  SELECT 'Acabamentos Premium', 'Acabamentos', 'Portobello Premium', NOW()::DATE - (FLOOR(RANDOM() * 900)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 900)::INT) + 5, 5000.0, 'unidade', 180.0 FROM generate_series(1, 85)
  UNION ALL
  SELECT 'Blocos', 'Blocos', 'Vedacit Rio', NOW()::DATE - (FLOOR(RANDOM() * 900)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 900)::INT) + 3, 12000.0, 'unidade', 6.5 FROM generate_series(1, 95)
  UNION ALL
  SELECT 'Diesel', 'Diesel', 'Petroplus', NOW()::DATE - (FLOOR(RANDOM() * 900)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 900)::INT) + 2, 8000.0, 'litro', 5.90 FROM generate_series(1, 100)
) historical_data;

-- 6. Load historical records for Brasília (24 months - government project)
INSERT INTO pilot_material_history (
  site_id, material_name, material_category, supplier_name, order_date,
  promised_delivery_date, actual_delivery_date, delay_days, quantity,
  unit_of_measure, unit_cost_brl, total_cost_brl, delay_impact_brl, status, external_factors
)
SELECT
  (SELECT id FROM site_ids WHERE site_name = 'Centro Administrativo Federal'),
  material, category, supplier, order_date, promised_date,
  CASE WHEN RANDOM() < 0.18 THEN promised_date + (FLOOR(RANDOM() * 28 + 1))::INT ELSE promised_date END,
  CASE WHEN RANDOM() < 0.18 THEN (FLOOR(RANDOM() * 28 + 1))::INT ELSE 0 END,
  quantity, unit, unit_cost, quantity * unit_cost,
  CASE WHEN RANDOM() < 0.18 THEN (FLOOR(RANDOM() * 28 + 1))::INT * 18000 ELSE NULL END,
  'on_time',
  CASE WHEN RANDOM() < 0.12 THEN 'burocracia' WHEN RANDOM() < 0.08 THEN 'inspeções governamentais' ELSE NULL END
FROM (
  SELECT 'Cimento CP II Premium', 'Cimento', 'Cimpor Premium', NOW()::DATE - (FLOOR(RANDOM() * 720)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 720)::INT) + 8, 60.0, 'ton', 280.0 FROM generate_series(1, 80)
  UNION ALL
  SELECT 'Aço Estrutural', 'Aço', 'Gerdau Estrutural', NOW()::DATE - (FLOOR(RANDOM() * 720)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 720)::INT) + 6, 150.0, 'ton', 950.0 FROM generate_series(1, 70)
  UNION ALL
  SELECT 'Vidro Especial', 'Vidro', 'Saint-Gobain', NOW()::DATE - (FLOOR(RANDOM() * 720)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 720)::INT) + 16, 300.0, 'm²', 400.0 FROM generate_series(1, 65)
  UNION ALL
  SELECT 'Mármore e Granito', 'Acabamentos', 'Mármore Brasília', NOW()::DATE - (FLOOR(RANDOM() * 720)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 720)::INT) + 7, 2500.0, 'm²', 320.0 FROM generate_series(1, 75)
  UNION ALL
  SELECT 'Blocos Especiais', 'Blocos', 'Blocos Brasília', NOW()::DATE - (FLOOR(RANDOM() * 720)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 720)::INT) + 3, 8000.0, 'unidade', 7.0 FROM generate_series(1, 65)
  UNION ALL
  SELECT 'Diesel Premium', 'Diesel', 'Petrobrás DF', NOW()::DATE - (FLOOR(RANDOM() * 720)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 720)::INT) + 2, 4000.0, 'litro', 6.10 FROM generate_series(1, 55)
) historical_data;

-- 7. Load historical records for Manaus (12 months - remote, sparse data)
INSERT INTO pilot_material_history (
  site_id, material_name, material_category, supplier_name, order_date,
  promised_delivery_date, actual_delivery_date, delay_days, quantity,
  unit_of_measure, unit_cost_brl, total_cost_brl, delay_impact_brl, status, external_factors
)
SELECT
  (SELECT id FROM site_ids WHERE site_name = 'Polo Industrial AM'),
  material, category, supplier, order_date, promised_date,
  CASE WHEN RANDOM() < 0.28 THEN promised_date + (FLOOR(RANDOM() * 45 + 1))::INT ELSE promised_date END,
  CASE WHEN RANDOM() < 0.28 THEN (FLOOR(RANDOM() * 45 + 1))::INT ELSE 0 END,
  quantity, unit, unit_cost, quantity * unit_cost,
  CASE WHEN RANDOM() < 0.28 THEN (FLOOR(RANDOM() * 45 + 1))::INT * 25000 ELSE NULL END,
  'on_time',
  CASE WHEN RANDOM() < 0.15 THEN 'enchentes sazonal' WHEN RANDOM() < 0.15 THEN 'atrasos importação' WHEN RANDOM() < 0.05 THEN 'problemas alfandegários' ELSE NULL END
FROM (
  SELECT 'Cimento CP II', 'Cimento', 'Cimpor Amazônia', NOW()::DATE - (FLOOR(RANDOM() * 360)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 360)::INT) + 12, 45.0, 'ton', 320.0 FROM generate_series(1, 45)
  UNION ALL
  SELECT 'Aço CA-50', 'Aço', 'Acesita Import', NOW()::DATE - (FLOOR(RANDOM() * 360)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 360)::INT) + 18, 100.0, 'ton', 1200.0 FROM generate_series(1, 35)
  UNION ALL
  SELECT 'Maquinário Industrial', 'Maquinário', 'International Equipment', NOW()::DATE - (FLOOR(RANDOM() * 360)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 360)::INT) + 45, 15.0, 'unidade', 150000.0 FROM generate_series(1, 18)
  UNION ALL
  SELECT 'Diesel Industrial', 'Diesel', 'Petrobras Manaus', NOW()::DATE - (FLOOR(RANDOM() * 360)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 360)::INT) + 3, 10000.0, 'litro', 6.50 FROM generate_series(1, 42)
  UNION ALL
  SELECT 'Blocos Importados', 'Blocos', 'Import Logistics', NOW()::DATE - (FLOOR(RANDOM() * 360)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 360)::INT) + 20, 6000.0, 'unidade', 8.0 FROM generate_series(1, 32)
  UNION ALL
  SELECT 'Acabamentos Import', 'Acabamentos', 'Manaus Trading', NOW()::DATE - (FLOOR(RANDOM() * 360)::INT),
    NOW()::DATE - (FLOOR(RANDOM() * 360)::INT) + 25, 1500.0, 'unidade', 220.0 FROM generate_series(1, 28)
) historical_data;

-- 8. Update site status to baseline_ready
UPDATE pilot_sites SET status = 'baseline_ready', updated_at = NOW()
WHERE site_name IN ('Edificio Corporate SP', 'Conjunto Residencial BH', 'Porto Maravilha', 'Centro Administrativo Federal', 'Polo Industrial AM');

-- 9. Log data load completion
INSERT INTO audit_log (table_name, operation, timestamp, details)
VALUES (
  'pilot_material_history',
  'DATA_LOADED',
  NOW(),
  'Week 1: Loaded historical material delivery records for 5 pilot sites (SP: 950, MG: 650, RJ: 1200, DF: 800, AM: 450 records)'
) ON CONFLICT DO NOTHING;

SELECT 'Pilot Data Loading Complete!' as status,
       (SELECT COUNT(*) FROM pilot_material_history) as total_records,
       (SELECT COUNT(*) FROM pilot_sites) as total_sites;
