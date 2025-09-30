-- Update existing menu items with correct subcategories
-- Run this in Supabase SQL Editor

-- Clear existing menu items and insert new ones with your preferred subcategories
DELETE FROM menu_items;

-- Insert sample menu items with your subcategory structure
INSERT INTO menu_items (name, price, category, subcategory, description, image_url, available) VALUES

-- Food - Starters
('Caesar Salad', 8.99, 'FOODS', 'Starters', 'Crisp romaine lettuce with Caesar dressing and croutons', 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300', true),
('Garlic Bread', 5.99, 'FOODS', 'Starters', 'Fresh baked bread with garlic butter', 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=300', true),
('Chicken Wings', 9.99, 'FOODS', 'Starters', 'Spicy buffalo chicken wings with ranch dip', 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=300', true),

-- Food - Breakfast  
('Pancakes', 7.99, 'FOODS', 'Breakfast', 'Fluffy pancakes with maple syrup and butter', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300', true),
('Eggs Benedict', 12.99, 'FOODS', 'Breakfast', 'Poached eggs on English muffin with hollandaise', 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=300', true),
('Avocado Toast', 8.99, 'FOODS', 'Breakfast', 'Smashed avocado on sourdough with lime', 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=300', true),

-- Food - Main
('Classic Burger', 14.99, 'FOODS', 'Main', 'Juicy beef patty with lettuce, tomato, and cheese', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300', true),
('Margherita Pizza', 16.99, 'FOODS', 'Main', 'Fresh mozzarella, tomato sauce, and basil', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300', true),
('Grilled Salmon', 18.99, 'FOODS', 'Main', 'Atlantic salmon with lemon butter sauce', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300', true),
('Chicken Parmesan', 17.99, 'FOODS', 'Main', 'Breaded chicken with marinara and mozzarella', 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300', true),

-- Food - Desserts
('Chocolate Cake', 6.99, 'FOODS', 'Desserts', 'Rich chocolate cake with frosting', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300', true),
('Cheesecake', 7.99, 'FOODS', 'Desserts', 'New York style cheesecake with berry sauce', 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300', true),
('Ice Cream Sundae', 5.99, 'FOODS', 'Desserts', 'Vanilla ice cream with chocolate sauce and nuts', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300', true),

-- Beverages - Coffee
('Espresso', 2.99, 'BEVERAGES', 'Coffee', 'Strong Italian coffee shot', 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=300', true),
('Cappuccino', 4.99, 'BEVERAGES', 'Coffee', 'Espresso with steamed milk and foam', 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=300', true),
('Latte', 4.99, 'BEVERAGES', 'Coffee', 'Espresso with steamed milk', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300', true),

-- Beverages - Smoothies
('Berry Smoothie', 6.99, 'BEVERAGES', 'Smoothies', 'Mixed berries with yogurt and honey', 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=300', true),
('Green Smoothie', 7.99, 'BEVERAGES', 'Smoothies', 'Spinach, banana, and apple smoothie', 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=300', true),
('Mango Smoothie', 6.99, 'BEVERAGES', 'Smoothies', 'Fresh mango with coconut milk', 'https://images.unsplash.com/photo-1623065422902-3a9b8229bbe7?w=300', true),

-- Beverages - Soft Drinks
('Coca Cola', 2.99, 'BEVERAGES', 'Soft Drinks', 'Classic Coca Cola', 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300', true),
('Sprite', 2.99, 'BEVERAGES', 'Soft Drinks', 'Lemon-lime soda', 'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=300', true),
('Sparkling Water', 2.49, 'BEVERAGES', 'Soft Drinks', 'Premium sparkling water with lime', 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=300', true),

-- Beverages - Fresh Juices
('Orange Juice', 4.99, 'BEVERAGES', 'Fresh Juices', 'Freshly squeezed orange juice', 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=300', true),
('Apple Juice', 4.49, 'BEVERAGES', 'Fresh Juices', 'Fresh pressed apple juice', 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=300', true),
('Carrot Juice', 5.99, 'BEVERAGES', 'Fresh Juices', 'Fresh carrot juice with ginger', 'https://images.unsplash.com/photo-1600898773299-2b48439b6b70?w=300', true);

-- Success message
SELECT 'Menu updated with your preferred subcategories! 🎉' as message;