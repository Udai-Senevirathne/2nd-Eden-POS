-- 2nd Eden POS Database Schema
-- Run this in your Supabase SQL Editor to set up all required tables

-- Enable Row Level Security
ALTER DATABASE postgres SET timezone TO 'UTC';

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('FOODS', 'BEVERAGES')),
  subcategory TEXT,
  description TEXT,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  table_number TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card')),
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'preparing', 'ready', 'completed')),
  refund_status TEXT DEFAULT 'none' CHECK (refund_status IN ('none', 'full_refund', 'partial_refund', 'exchanged')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create settings table for system configuration
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create refund_transactions table for audit trail
CREATE TABLE IF NOT EXISTS refund_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_id TEXT UNIQUE NOT NULL,
  original_order_id TEXT NOT NULL,
  refund_type TEXT NOT NULL CHECK (refund_type IN ('full', 'partial', 'exchange')),
  refund_amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  refund_method TEXT NOT NULL CHECK (refund_method IN ('cash', 'card_reversal', 'store_credit')),
  processed_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table for authentication and permissions
CREATE TABLE IF NOT EXISTS pos_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  pin TEXT,
  password TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
  enabled BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (Allow all operations for now - can be restricted later)
CREATE POLICY "Enable all operations on menu_items" ON menu_items FOR ALL USING (true);
CREATE POLICY "Enable all operations on orders" ON orders FOR ALL USING (true);
CREATE POLICY "Enable all operations on order_items" ON order_items FOR ALL USING (true);
CREATE POLICY "Enable all operations on settings" ON settings FOR ALL USING (true);
CREATE POLICY "Enable all operations on refund_transactions" ON refund_transactions FOR ALL USING (true);
CREATE POLICY "Enable all operations on pos_users" ON pos_users FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(available);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_refund_status ON orders(refund_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_refund_transactions_original_order_id ON refund_transactions(original_order_id);
CREATE INDEX IF NOT EXISTS idx_pos_users_role ON pos_users(role);

-- Insert default admin user
INSERT INTO pos_users (name, password, role) 
VALUES ('Admin', 'admin123', 'admin')
ON CONFLICT DO NOTHING;

-- Insert sample menu items
INSERT INTO menu_items (name, price, category, subcategory, description, available) VALUES
('Classic Burger', 12.99, 'FOODS', 'main', 'Beef patty with lettuce, tomato, and cheese', true),
('Grilled Chicken Sandwich', 11.99, 'FOODS', 'main', 'Grilled chicken breast with herbs', true),
('Caesar Salad', 9.99, 'FOODS', 'starters', 'Romaine lettuce with Caesar dressing', true),
('Margherita Pizza', 15.99, 'FOODS', 'main', 'Fresh mozzarella, tomato, and basil', true),
('French Fries', 4.99, 'FOODS', 'starters', 'Crispy golden fries', true),
('Chocolate Cake', 6.99, 'FOODS', 'desserts', 'Rich chocolate layer cake', true),

('Fresh Coffee', 3.99, 'BEVERAGES', 'coffee', 'Freshly brewed coffee', true),
('Cappuccino', 4.99, 'BEVERAGES', 'coffee', 'Espresso with steamed milk foam', true),
('Orange Juice', 3.49, 'BEVERAGES', 'fresh juices', 'Freshly squeezed orange juice', true),
('Coca Cola', 2.99, 'BEVERAGES', 'soft drinks', 'Classic Coca Cola', true),
('Iced Tea', 2.49, 'BEVERAGES', 'soft drinks', 'Refreshing iced tea', true),
('Mango Smoothie', 5.99, 'BEVERAGES', 'smoothies', 'Fresh mango smoothie', true)
ON CONFLICT DO NOTHING;

-- Insert default settings
INSERT INTO settings (key, value) VALUES
('restaurant', '{"name": "2nd Eden Restaurant", "address": "123 Main St", "phone": "(555) 123-4567", "currency": "USD"}'),
('receipt', '{"headerText": "2nd Eden Restaurant", "footerText": "Thank you for your visit!", "paperSize": "thermal-80mm", "autoPrint": true, "showLogo": false}'),
('system', '{"serviceChargeRate": 8.5, "allowDiscounts": true, "maxRefundAmount": 1000}')
ON CONFLICT DO NOTHING;

-- Create triggers to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pos_users_updated_at BEFORE UPDATE ON pos_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Database schema created successfully! All tables, indexes, and sample data are ready.' AS message;