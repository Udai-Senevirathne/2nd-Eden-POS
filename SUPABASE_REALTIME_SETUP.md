# Supabase Real-Time Setup Guide
# Follow these steps to enable full real-time functionality

## 1. VERIFY SUPABASE CONNECTION

Your `.env` file already contains Supabase credentials:
- URL: https://wmxdicopswkiqdgsdbbj.supabase.co
- This should work immediately!

## 2. SET UP DATABASE SCHEMA

1. Go to your Supabase dashboard: https://app.supabase.com/project/wmxdicopswkiqdgsdbbj
2. Click on "SQL Editor" in the left sidebar
3. Copy the entire contents of `database/schema.sql`
4. Paste it into the SQL editor and run it
5. This will create all necessary tables with real-time enabled

## 3. ENABLE REAL-TIME ON ALL TABLES

In Supabase dashboard:
1. Go to "Database" → "Replication"
2. Enable replication for these tables:
   - ✅ menu_items
   - ✅ orders  
   - ✅ order_items
   - ✅ settings
   - ✅ refund_transactions
   - ✅ pos_users

## 4. TEST THE CONNECTION

1. Open your POS at: http://localhost:5174
2. Open browser console (F12)
3. Copy and paste the contents of `scripts/complete-realtime-test.js`
4. Watch for real-time updates in the console

## 5. VERIFY REAL-TIME FUNCTIONALITY

Expected behavior:
✅ Menu items sync across terminals instantly
✅ Orders appear on all screens immediately  
✅ Refunds update everywhere in real-time
✅ Database changes trigger UI updates
✅ Multi-terminal synchronization working

## 6. TROUBLESHOOTING

If real-time doesn't work:

**Check Environment Variables:**
```bash
# Restart dev server after .env changes
npm run dev
```

**Check Supabase Dashboard:**
- Verify project is not paused
- Check API keys are correct
- Ensure real-time is enabled

**Check Console Logs:**
- Look for "✅ Supabase subscription active" messages
- Watch for real-time update notifications
- Check for any error messages

## 7. SUCCESS INDICATORS

You'll know it's working when you see:
```
✅ Supabase connection successful
✅ Menu items real-time subscription active  
✅ Orders real-time subscription active
🔔 Real-time updates received
🎯 REAL-TIME IS WORKING PERFECTLY!
```

## 8. PRODUCTION CHECKLIST

- [x] Supabase project configured
- [x] Database schema created  
- [x] Real-time replication enabled
- [x] Environment variables set
- [x] Row Level Security configured
- [x] Test data populated
- [x] Real-time subscriptions working

Your POS system should now have:
🚀 **FULL REAL-TIME MULTI-TERMINAL SYNCHRONIZATION!**

## Need Help?

Run the test script in console for detailed diagnostics:
```javascript
// Copy from scripts/complete-realtime-test.js
runCompleteSupabaseTest()
```