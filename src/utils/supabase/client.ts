import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types' // Import the Database type

export const createClient = () => {
  // Add the Database type generic to createBrowserClient
  return createBrowserClient<Database>( 
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
