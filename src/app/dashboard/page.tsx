import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
// Removed dynamic import
import { ProjectsDashboard } from '@/components/projects/projects-dashboard'; // Import directly
import { Button } from '@/components/ui/button';
// Removed Loader2Icon import as loading state is removed

// Define a proper type for cookie options
interface CookieOptions {
  name: string;
  value: string;
  maxAge?: number;
  domain?: string;
  path?: string;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

export default async function DashboardPage() {
  // Get the cookie store - await it since it's now asynchronous in Next.js 15
  const cookieStore = await cookies()
  
  // Create a Supabase client for server components
  const supabase = createServerClient(
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

  // Get the user from the session
  const { data: { user } } = await supabase.auth.getUser()

  // If there's no user, redirect to the sign-in page
  if (!user) {
    redirect('/auth')
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">ISMS Dashboard</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              Welcome, {user.email}
            </span>
            <form action={async () => {
              'use server'
              const cookieStore = await cookies()
              
              const supabase = createServerClient(
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
                      } catch {}
                    },
                    remove(name: string, options: CookieOptions) {
                      try {
                        cookieStore.set({ name, value: '', ...options })
                      } catch {}
                    },
                  },
                }
              )
              await supabase.auth.signOut()
              redirect('/')
            }}>
              <Button type="submit" variant="outline" size="sm">Sign Out</Button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Projects Dashboard */}
      <ProjectsDashboard />
    </div>
  )
}
