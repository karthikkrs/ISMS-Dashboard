import { ProjectForm } from '@/components/projects/project-form'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Database } from '@/types/database.types' // Import Database type

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

export default async function NewProjectPage() {
  // Get the cookie store
  const cookieStore = await cookies()
  
  // Create a Supabase client for server components
  const supabase = createServerClient<Database>(
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Project</h1>
        <p className="text-gray-500">Create a new ISMS project to start documenting your information security management system.</p>
      </div>
      
      <ProjectForm />
    </div>
  )
}
