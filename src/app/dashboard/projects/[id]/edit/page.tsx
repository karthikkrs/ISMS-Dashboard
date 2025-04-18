import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { ProjectForm } from '@/components/projects/project-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Await params as shown in the documentation
  const { id } = await params;
  
  // Get the cookie store
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

  // Check if the user is the owner of the project
  if (project.user_id !== user.id) {
    // Redirect to dashboard if not the owner
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Button variant="outline" size="sm" asChild className="mr-2">
            <Link href={`/dashboard/projects/${id}`}>
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Project
            </Link>
          </Button>
        </div>
        
        <h1 className="text-2xl font-bold">Edit Project</h1>
        <p className="text-gray-500">Update your ISMS project details</p>
      </div>
      
      <ProjectForm project={project} isEditing={true} />
    </div>
  )
}
