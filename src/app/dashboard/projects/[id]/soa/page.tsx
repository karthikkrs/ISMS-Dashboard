// Remove "use client"

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
// Remove DndProvider and HTML5Backend imports
import { SoaPageClient } from '@/components/soa/SoaPageClient' // Import the new client component
import { Database } from '@/types/database.types' // Import Database type

export default async function SoaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Await params as shown in the documentation
  const { id } = await params;
  
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

  // Fetch the project
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  // If there's an error or no project, show 404
  if (error || !project) {
    notFound()
  }

  // Render the client component, passing the fetched data
  return <SoaPageClient project={project} projectId={id} />
}
