import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ Missing Supabase environment variables. ' +
    'Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set. ' +
    `Current values: URL=${supabaseUrl ? 'SET' : 'MISSING'}, KEY=${supabaseAnonKey ? 'SET' : 'MISSING'}`
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Database Types
export interface DbMenuItem {
  id: string
  name: string
  price: number
  category: string
  subcategory: string | null
  description: string | null
  image_url: string | null
  available: boolean
  created_at: string
}

export interface DbOrder {
  id: string
  order_number: string
  table_number: string | null
  payment_method: string
  total: number
  status: string
  created_at: string
}

export interface DbOrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  price: number
  menu_item?: DbMenuItem
}

export interface DbSettings {
  id: string
  key: string
  value: unknown
  updated_at: string
}