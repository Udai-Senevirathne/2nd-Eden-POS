// Quick Diagnostic Script - Copy and paste into browser console
// Run this at http://localhost:5175/ with F12 console open

console.log('🔍 QUICK POS DIAGNOSTIC STARTING...');
console.log('═'.repeat(50));

async function quickDiagnose() {
  try {
    // Check 1: Environment variables
    console.log('1️⃣ Checking Environment Variables...');
    const hasSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const hasSupabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('VITE_SUPABASE_URL:', hasSupabaseUrl ? '✅ Present' : '❌ Missing');
    console.log('VITE_SUPABASE_ANON_KEY:', hasSupabaseKey ? '✅ Present' : '❌ Missing');
    
    if (!hasSupabaseUrl || !hasSupabaseKey) {
      console.log('❌ ISSUE FOUND: Environment variables missing!');
      console.log('SOLUTION: Restart your dev server with: npm run dev');
      return false;
    }
    
    // Check 2: Supabase connection
    console.log('\n2️⃣ Testing Supabase Connection...');
    const { supabase } = await import('/src/lib/supabase.js');
    
    const { data, error } = await supabase
      .from('orders')
      .select('count');
      
    if (error) {
      console.log('❌ Database connection failed:', error);
      console.log('LIKELY CAUSES:');
      console.log('- Supabase project is paused');
      console.log('- Database schema not set up');
      console.log('- Wrong credentials in .env');
      return false;
    }
    
    console.log('✅ Database connection successful');
    
    // Check 3: Orders in database
    console.log('\n3️⃣ Checking Orders in Database...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(10);
      
    if (ordersError) {
      console.log('❌ Orders table issue:', ordersError);
      console.log('SOLUTION: Run the database schema SQL in Supabase dashboard');
      return false;
    }
    
    console.log(`📦 Found ${orders.length} orders in database:`, orders.map(o => o.order_number));
    
    if (orders.length === 0) {
      console.log('⚠️ NO ORDERS IN DATABASE');
      console.log('SOLUTION: Create some orders in the POS first!');
      console.log('1. Add items to cart');
      console.log('2. Click Checkout');
      console.log('3. Complete payment');
      console.log('4. Then try Quick Refund again');
    }
    
    // Check 4: LocalStorage fallback
    console.log('\n4️⃣ Checking LocalStorage Fallback...');
    const fallbackOrders = JSON.parse(localStorage.getItem('fallbackOrders') || '[]');
    console.log(`💾 Found ${fallbackOrders.length} orders in localStorage:`, fallbackOrders.map(o => o.id));
    
    // Check 5: Real-time subscriptions
    console.log('\n5️⃣ Testing Real-time Subscriptions...');
    let realtimeWorking = false;
    
    const testChannel = supabase
      .channel('diagnostic-test')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('🔔 Real-time working! Received:', payload);
          realtimeWorking = true;
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.log('❌ Real-time subscription failed');
        }
      });
    
    // Test real-time by creating a test order
    setTimeout(async () => {
      const testOrderNumber = `TEST${Date.now()}`;
      console.log(`🧪 Creating test order ${testOrderNumber} to test real-time...`);
      
      const { error: createError } = await supabase
        .from('orders')
        .insert({
          order_number: testOrderNumber,
          table_number: 'TEST',
          payment_method: 'cash',
          total: 1.00,
          status: 'completed',
          refund_status: 'none'
        });
      
      if (createError) {
        console.log('❌ Test order creation failed:', createError);
      } else {
        console.log('✅ Test order created successfully');
        
        // Clean up after 3 seconds
        setTimeout(async () => {
          await supabase.from('orders').delete().eq('order_number', testOrderNumber);
          testChannel.unsubscribe();
          console.log('🗑️ Test order cleaned up');
        }, 3000);
      }
    }, 2000);
    
    return true;
    
  } catch (error) {
    console.log('💥 Diagnostic failed:', error);
    return false;
  }
}

// Final recommendations
function showSolutions() {
  console.log('\n🎯 QUICK SOLUTIONS:');
  console.log('═'.repeat(50));
  console.log('');
  console.log('IF NO ORDERS FOUND:');
  console.log('1️⃣ Create orders first:');
  console.log('   • Add items to cart → Checkout → Complete payment');
  console.log('   • Order numbers look like: ABC123, DEF456, etc.');
  console.log('');
  console.log('IF DATABASE CONNECTION FAILS:');
  console.log('2️⃣ Set up Supabase database:');
  console.log('   • Go to: https://app.supabase.com/project/wmxdicopswkiqdgsdbbj/sql');
  console.log('   • Run the schema from: database/schema.sql');
  console.log('');
  console.log('IF REAL-TIME NOT WORKING:');
  console.log('3️⃣ Enable real-time replication:');
  console.log('   • Go to: Database → Replication in Supabase dashboard');
  console.log('   • Enable for: orders, menu_items, order_items');
  console.log('');
  console.log('RESTART DEV SERVER:');
  console.log('4️⃣ In terminal run: npm run dev');
}

// Run diagnostic
quickDiagnose().then(() => {
  showSolutions();
});

console.log('Running diagnostic... Check results above ↑');