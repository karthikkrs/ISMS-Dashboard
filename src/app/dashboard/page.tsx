import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // This will throw in middleware, but we can
            // safely ignore it for the purpose of authentication.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
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

  // Get the session
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Email:</span> {user.email}
              </div>
              <div>
                <span className="font-semibold">User ID:</span> {user.id}
              </div>
              <div>
                <span className="font-semibold">Last Sign In:</span> {session ? new Date().toLocaleString() : 'N/A'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
            <CardDescription>Your current session information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Status:</span> 
                <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  Authenticated
                </span>
              </div>
              <div>
                <span className="font-semibold">Session Expires:</span> {new Date(session?.expires_at ? session.expires_at * 1000 : '').toLocaleString()}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <form action={async () => {
              'use server'
              // Get the cookie store - await it since it's now asynchronous in Next.js 15
              const cookieStore = await cookies()
              
              const supabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                  cookies: {
                    get(name: string) {
                      return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: any) {
                      try {
                        cookieStore.set({ name, value, ...options })
                      } catch (error) {}
                    },
                    remove(name: string, options: any) {
                      try {
                        cookieStore.set({ name, value: '', ...options })
                      } catch (error) {}
                    },
                  },
                }
              )
              await supabase.auth.signOut()
              redirect('/')
            }}>
              <Button type="submit" variant="destructive">Sign Out</Button>
            </form>
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
