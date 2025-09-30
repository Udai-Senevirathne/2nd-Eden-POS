// Remove Orders Script - Clean up all orders from database and localStorage
// Run this in browser console at http://localhost:5175/

console.log('🗑️ ORDER CLEANUP SCRIPT STARTING...');
console.log('═'.repeat(50));

async function removeAllOrders() {
  try {
    console.log('1️⃣ Checking current orders...');
    
    // Check database orders
    const { supabase } = await import('/src/lib/supabase.js');
    
    const { data: dbOrders, error: dbError } = await supabase
      .from('orders')
      .select('*');
    
    if (dbError) {
      console.error('❌ Error fetching database orders:', dbError);
    } else {
      console.log(`📦 Found ${dbOrders.length} orders in database:`, dbOrders.map(o => o.order_number));
    }
    
    // Check localStorage orders
    const localOrders = JSON.parse(localStorage.getItem('fallbackOrders') || '[]');
    console.log(`💾 Found ${localOrders.length} orders in localStorage:`, localOrders.map(o => o.id));
    
    if (dbOrders.length === 0 && localOrders.length === 0) {
      console.log('✅ No orders found to remove!');
      return;
    }
    
    // Confirm deletion
    const confirmed = confirm(`⚠️ DELETE ALL ORDERS?\n\nThis will permanently remove:\n• ${dbOrders.length} orders from database\n• ${localOrders.length} orders from localStorage\n\nThis action cannot be undone. Continue?`);
    
    if (!confirmed) {
      console.log('❌ Operation cancelled by user');
      return;
    }
    
    console.log('\n2️⃣ Removing orders from database...');
    
    // Remove from database
    if (dbOrders.length > 0) {
      // First remove order items (foreign key constraint)
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (itemsError) {
        console.error('❌ Error removing order items:', itemsError);
      } else {
        console.log('✅ Removed all order items from database');
      }
      
      // Then remove orders
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (ordersError) {
        console.error('❌ Error removing orders:', ordersError);
      } else {
        console.log('✅ Removed all orders from database');
      }
    }
    
    console.log('\n3️⃣ Removing orders from localStorage...');
    
    // Remove from localStorage
    if (localOrders.length > 0) {
      localStorage.removeItem('fallbackOrders');
      console.log('✅ Removed all orders from localStorage');
    }
    
    console.log('\n4️⃣ Triggering UI updates...');
    
    // Force update the UI
    window.dispatchEvent(new CustomEvent('ordersForceUpdate', {
      detail: { 
        orders: [], 
        timestamp: new Date(),
        source: 'cleanup_script'
      }
    }));
    
    window.dispatchEvent(new CustomEvent('dashboardUpdate', {
      detail: { 
        orders: [], 
        timestamp: new Date()
      }
    }));
    
    console.log('✅ UI update events dispatched');
    
    console.log('\n🎉 ORDER CLEANUP COMPLETE!');
    console.log('═'.repeat(50));
    console.log('✅ All orders removed from database');
    console.log('✅ All orders removed from localStorage');
    console.log('✅ UI updated to reflect changes');
    console.log('\nYou can now:');
    console.log('• Create fresh orders');
    console.log('• Test refund functionality with new orders');
    console.log('• Start with a clean slate');
    
    // Show success message
    alert('🗑️ ALL ORDERS REMOVED!\n\n✅ Database cleared\n✅ localStorage cleared\n✅ UI updated\n\nYour POS system is now clean!');
    
  } catch (error) {
    console.error('💥 Error during cleanup:', error);
    alert('❌ Error during cleanup. Check console for details.');
  }
}

// Function to remove specific order
async function removeSpecificOrder(orderNumber) {
  try {
    console.log(`🎯 Removing specific order: ${orderNumber}`);
    
    const { supabase } = await import('/src/lib/supabase.js');
    
    // Remove from database
    const { error: dbError } = await supabase
      .from('orders')
      .delete()
      .eq('order_number', orderNumber);
    
    if (dbError) {
      console.error('❌ Error removing from database:', dbError);
    } else {
      console.log('✅ Removed from database');
    }
    
    // Remove from localStorage
    const localOrders = JSON.parse(localStorage.getItem('fallbackOrders') || '[]');
    const filteredOrders = localOrders.filter(order => order.id !== orderNumber);
    localStorage.setItem('fallbackOrders', JSON.stringify(filteredOrders));
    console.log('✅ Removed from localStorage');
    
    // Update UI
    window.dispatchEvent(new CustomEvent('ordersForceUpdate', {
      detail: { timestamp: new Date() }
    }));
    
    console.log(`✅ Order ${orderNumber} removed successfully!`);
    alert(`✅ Order ${orderNumber} removed successfully!`);
    
  } catch (error) {
    console.error('💥 Error removing specific order:', error);
    alert('❌ Error removing order. Check console for details.');
  }
}

// Function to list current orders
async function listCurrentOrders() {
  try {
    console.log('📋 CURRENT ORDERS LIST');
    console.log('═'.repeat(30));
    
    const { supabase } = await import('/src/lib/supabase.js');
    
    // Database orders
    const { data: dbOrders } = await supabase
      .from('orders')
      .select('order_number, total, created_at')
      .order('created_at', { ascending: false });
    
    console.log('\n🗄️ DATABASE ORDERS:');
    if (dbOrders && dbOrders.length > 0) {
      dbOrders.forEach((order, index) => {
        console.log(`${index + 1}. #${order.order_number} - $${order.total} (${new Date(order.created_at).toLocaleString()})`);
      });
    } else {
      console.log('   No orders in database');
    }
    
    // localStorage orders
    const localOrders = JSON.parse(localStorage.getItem('fallbackOrders') || '[]');
    console.log('\n💾 LOCALSTORAGE ORDERS:');
    if (localOrders.length > 0) {
      localOrders.forEach((order, index) => {
        console.log(`${index + 1}. #${order.id} - $${order.total} (${new Date(order.timestamp).toLocaleString()})`);
      });
    } else {
      console.log('   No orders in localStorage');
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`Database: ${dbOrders?.length || 0} orders`);
    console.log(`localStorage: ${localOrders.length} orders`);
    console.log(`Total: ${(dbOrders?.length || 0) + localOrders.length} orders`);
    
  } catch (error) {
    console.error('Error listing orders:', error);
  }
}

// Make functions available globally
window.removeAllOrders = removeAllOrders;
window.removeSpecificOrder = removeSpecificOrder;
window.listCurrentOrders = listCurrentOrders;

// Auto-list current orders
listCurrentOrders();

console.log('\n🛠️ AVAILABLE FUNCTIONS:');
console.log('• removeAllOrders() - Remove all orders');
console.log('• removeSpecificOrder("ORDER_NUMBER") - Remove specific order');
console.log('• listCurrentOrders() - List all current orders');
console.log('\nExample usage:');
console.log('removeSpecificOrder("87WM67")');
console.log('removeAllOrders()');
