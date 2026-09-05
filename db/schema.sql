-- UAS Ops ERP Schema

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'engineer', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  lead_time_days INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS parts (
  id SERIAL PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'ea',
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  reorder_point INTEGER NOT NULL DEFAULT 5,
  unit_cost NUMERIC(10, 2),
  supplier_id INTEGER REFERENCES suppliers(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'ordered', 'received', 'cancelled')),
  created_by INTEGER REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  notes TEXT,
  total_cost NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
  part_id INTEGER REFERENCES parts(id),
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC(10, 2) NOT NULL
);

-- Seed data
-- Default password for both accounts: password123
INSERT INTO users (email, password_hash, name, role) VALUES
  ('admin@zone5.dev', '$2b$10$k4LXureTxfPGI1gMJag0qOWFd1MIz4qYF05XPAxuUzEcQzlu5d0S6', 'Admin User', 'admin'),
  ('engineer@zone5.dev', '$2b$10$k4LXureTxfPGI1gMJag0qOWFd1MIz4qYF05XPAxuUzEcQzlu5d0S6', 'Engineer User', 'engineer')
ON CONFLICT DO NOTHING;

INSERT INTO suppliers (name, contact_name, email, phone, lead_time_days) VALUES
  ('T-Motor', 'Sales Team', 'sales@tmotor.com', '+1-800-000-0001', 14),
  ('Hobbywing', 'Support', 'support@hobbywing.com', '+1-800-000-0002', 10),
  ('Tattu Batteries', 'Orders', 'orders@grepow.com', '+1-800-000-0003', 21)
ON CONFLICT DO NOTHING;

INSERT INTO parts (sku, name, category, unit, quantity_on_hand, reorder_point, unit_cost, supplier_id) VALUES
  ('MTR-001', 'T-Motor F90 1300KV Brushless Motor', 'Motors', 'ea', 24, 8, 89.99, 1),
  ('MTR-002', 'T-Motor MN3508 380KV Motor', 'Motors', 'ea', 6, 4, 149.99, 1),
  ('ESC-001', 'Hobbywing XRotor 40A ESC', 'ESCs', 'ea', 18, 6, 49.99, 2),
  ('ESC-002', 'Hobbywing Platinum 60A ESC', 'ESCs', 'ea', 3, 4, 79.99, 2),
  ('BAT-001', 'Tattu 4S 10000mAh LiPo', 'Batteries', 'ea', 12, 4, 129.99, 3),
  ('BAT-002', 'Tattu 6S 16000mAh LiPo', 'Batteries', 'ea', 2, 3, 219.99, 3),
  ('FRM-001', 'Carbon Fiber Frame 500mm', 'Frames', 'ea', 9, 3, 199.99, NULL),
  ('PROP-001', '18x6 Carbon Fiber Propeller Pair', 'Propellers', 'pair', 40, 10, 24.99, 1),
  ('FC-001', 'Pixhawk 6C Flight Controller', 'Flight Controllers', 'ea', 5, 2, 349.99, NULL),
  ('GPS-001', 'Here3 CAN GPS Module', 'GPS', 'ea', 7, 2, 199.99, NULL)
ON CONFLICT DO NOTHING;
