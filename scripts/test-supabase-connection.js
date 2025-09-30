// Real-time Supabase Connection Test
// Run this in browser console to test database connectivity

async function testSupabaseConnection() {
  try {
    console.log('🔧 Testing Supabase Connection...');
    
    // Import Supabase client
    const { supabase } = await import('/src/lib/supabase.js');
    
    // Test 1: Basic connection
    console.log('📡 Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('menu_items')
      .select('count(*)')
      .single();
    
    if (testError) {
      console.error('❌ Basic connection failed:', testError);
      return false;
    }
    console.log('✅ Basic connection successful');
    
    // Test 2: Menu items
    console.log('🍽️ Testing menu items fetch...');
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('*')
      .limit(5);
    
    if (menuError) {
      console.error('❌ Menu items fetch failed:', menuError);
    } else {
      console.log(`✅ Loaded ${menuItems.length} menu items:`, menuItems);
    }
    
    // Test 3: Orders
    console.log('📦 Testing orders fetch...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          menu_items (*)
        )
      `)
      .limit(5);
    
    if (ordersError) {
      console.error('❌ Orders fetch failed:', ordersError);
    } else {
      console.log(`✅ Loaded ${orders.length} orders:`, orders);
    }
    
    // Test 4: Settings
    console.log('⚙️ Testing settings fetch...');
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*');
    
    if (settingsError) {
      console.error('❌ Settings fetch failed:', settingsError);
    } else {
      console.log(`✅ Loaded ${settings.length} settings:`, settings);
    }
    
    // Test 5: Real-time subscription test
    console.log('🔄 Testing real-time subscriptions...');
    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'menu_items' },
        (payload) => {
          console.log('🔔 Real-time update received:', payload);
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });
    
    // Test 6: Create a test menu item to trigger real-time
    setTimeout(async () => {
      console.log('🧪 Creating test item to trigger real-time...');
      const { data: newItem, error: createError } = await supabase
        .from('menu_items')
        .insert({
          name: 'Test Item ' + Date.now(),
          price: 9.99,
          category: 'FOODS',
          subcategory: 'test',
          description: 'Real-time test item',
          available: true
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Test item creation failed:', createError);
      } else {
        console.log('✅ Test item created:', newItem);
        
        // Clean up test item after 5 seconds
        setTimeout(async () => {
          await supabase
            .from('menu_items')
            .delete()
            .eq('id', newItem.id);
          console.log('🗑️ Test item cleaned up');
        }, 5000);
      }
    }, 2000);
    
    console.log('🎉 All tests completed! Check above for results.');
    return true;
    
  } catch (error) {
    console.error('💥 Connection test failed:', error);
    return false;
  }
}

// Make function available globally
window.testSupabaseConnection = testSupabaseConnection;

// Auto-run test
testSupabaseConnection();