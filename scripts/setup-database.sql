-- 2nd Eden POS Database Schema
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security
ALTER DATABASE postgres SET timezone TO 'UTC';

-- Create Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  category VARCHAR NOT NULL CHECK (category IN ('food', 'beverage')),
  subcategory VARCHAR,
  description TEXT,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR UNIQUE NOT NULL,
  table_number VARCHAR,
  payment_method VARCHAR CHECK (payment_method IN ('cash', 'card')),
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  status VARCHAR DEFAULT 'completed' CHECK (status IN ('pending', 'preparing', 'ready', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Settings Table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for Better Performance
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(available);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to update updated_at
CREATE TRIGGER update_menu_items_updated_at 
  BEFORE UPDATE ON menu_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at 
  BEFORE UPDATE ON settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert Sample Menu Items (Optional)
INSERT INTO menu_items (name, price, category, subcategory, description, image_url) VALUES
-- Foods
('Classic Burger', 12.99, 'food', 'Burgers', 'Beef patty with lettuce, tomato, and cheese', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'),
('Margherita Pizza', 14.99, 'food', 'Pizza', 'Fresh mozzarella, tomatoes, and basil', 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400'),
('Caesar Salad', 9.99, 'food', 'Salads', 'Romaine lettuce with Caesar dressing', 'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=400'),
('Fish & Chips', 16.99, 'food', 'Main Course', 'Battered fish with seasoned fries', 'https://images.unsplash.com/photo-1544982503-9f984c14501a?w=400'),
('Chocolate Cake', 7.99, 'food', 'Desserts', 'Rich chocolate layer cake', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400'),

-- Beverages
('Fresh Coffee', 3.99, 'beverage', 'Hot Drinks', 'Freshly brewed coffee', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'),
('Iced Tea', 2.99, 'beverage', 'Cold Drinks', 'Refreshing iced tea', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400'),
('Fresh Orange Juice', 4.99, 'beverage', 'Juices', 'Freshly squeezed orange juice', 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400'),
('Craft Beer', 6.99, 'beverage', 'Alcoholic', 'Local craft beer selection', 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400'),
('Sparkling Water', 2.49, 'beverage', 'Water', 'Premium sparkling water', 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400')

ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security (Optional - for multi-tenant setup later)
-- ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies (if RLS enabled)
-- CREATE POLICY "Allow all operations" ON menu_items FOR ALL USING (true);
-- CREATE POLICY "Allow all operations" ON orders FOR ALL USING (true);
-- CREATE POLICY "Allow all operations" ON order_items FOR ALL USING (true);
-- CREATE POLICY "Allow all operations" ON settings FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Success message
SELECT '🎉 Database setup complete! Your 2nd Eden POS database is ready.' as message;