import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types' // Import the Database type

// Define a proper interface for cookie options
interface CookieOptions {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
}

// In Next.js 15, cookies() is now asynchronous and needs to be awaited
export async function createClient() {
  // Get the cookie store - await it since it's now asynchronous
  const cookieStore = await cookies()
  
  // Add the Database type generic to createServerClient
  return createServerClient<Database>( 
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // This will throw in middleware, but we can
            // safely ignore it for the purpose of authentication.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // This will throw in middleware, but we can
            // safely ignore it for the purpose of authentication.
          }
        },
      },
    }
  )
}
