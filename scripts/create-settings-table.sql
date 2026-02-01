-- Create settings table for storing application configuration
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is for restaurant management)
CREATE POLICY "Allow all operations on settings" ON settings
FOR ALL USING (true) WITH CHECK (true);

-- Insert default settings if they don't exist
INSERT INTO settings (key, value) VALUES 
('restaurant', '{
  "name": "2nd Eden Restaurant",
  "address": "123 Main Street, City, State 12345",
  "phone": "+1 (555) 123-4567",
  "logoUrl": "",
  "operatingHours": {
    "open": "09:00",
    "close": "22:00"
  },
  "serviceCharge": 8.5,
  "currency": "USD",
  "autoServiceCharge": true
}'),
('receipt', '{
  "headerText": "Thank you for dining with us!",
  "footerText": "Please come again soon!",
  "paperSize": "thermal-80mm",
  "autoPrint": true,
  "showLogo": true
}'),
('system', '{
  "adminPin": "1234",
  "staffPins": ["0000", "1111"],
  "orderPrefix": "#",
  "theme": "light",
  "fontSize": "medium",
  "language": "en",
  "soundEnabled": true
}'),
('notifications', '{
  "lowStockAlert": true,
  "dailySummary": true,
  "paymentSounds": true,
  "orderSounds": true
}')
ON CONFLICT (key) DO NOTHING;