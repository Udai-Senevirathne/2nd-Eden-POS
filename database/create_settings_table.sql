-- SQL script to create the settings table in Supabase
-- Please run this in your Supabase dashboard under "SQL Editor"

CREATE TABLE IF NOT EXISTS settings (
    id BIGSERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Insert default restaurant settings if they don't exist
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
        "taxRate": 8.5,
        "serviceCharge": 0,
        "currency": "USD",
        "autoTax": true
    }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Insert default system settings if they don't exist
INSERT INTO settings (key, value) VALUES 
    ('system', '{
        "adminPin": "1234",
        "staffPins": [],
        "orderPrefix": "ORD",
        "theme": "light",
        "fontSize": "medium",
        "language": "en",
        "soundEnabled": true
    }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Insert default receipt settings if they don't exist
INSERT INTO settings (key, value) VALUES 
    ('receipt', '{
        "headerText": "Thank you for dining with us!",
        "footerText": "Please come again soon!",
        "paperSize": "thermal-80mm",
        "autoPrint": false,
        "showLogo": true
    }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Insert default notification settings if they don't exist
INSERT INTO settings (key, value) VALUES 
    ('notifications', '{
        "lowStockAlert": true,
        "dailySummary": false,
        "paymentSounds": true,
        "orderSounds": true
    }'::jsonb)
ON CONFLICT (key) DO NOTHING;