import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { Database } from '@/types/database.types';
// Remove incorrect ProjectHeader import
import { getProjectById } from '@/services/project-service';
import { ProjectWithStatus } from '@/types';
// Import the new report components
// Import the new report components (Keep unused ones commented for now)
// import { RiskGraphs } from '@/components/reports/RiskGraphs';
// import { MitreAttackMap } from '@/components/reports/MitreAttackMap';
// import { CrqSummary } from '@/components/reports/CrqSummary';
import { DynamicCrqSummary } from '@/components/reports/DynamicCrqSummary'; // Import the new dynamic component
// import { CrqSummaryTable } from '@/components/reports/crq-summary-table'; // Keep commented for now

// Use the standard Server Component signature again
export default async function ReportsPage({ params }: { params: { id: string } }) {
  
  const projectId = params.id; // Access id directly
  const cookieStore = await cookies(); // Await cookies

  const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: any) { try { cookieStore.set({ name, value, ...options }) } catch (error) {} },
          remove(name: string, options: any) { try { cookieStore.set({ name, value: '', ...options }) } catch (error) {} },
        },
      }
    );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth');
  }

  const project: ProjectWithStatus | null = await getProjectById(projectId, supabase);
  if (!project || project.user_id !== user.id) {
    notFound();
  }
    
  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
         <div className="flex items-center mb-4">
           <Button variant="outline" size="sm" asChild className="mr-2">
             <Link href={`/dashboard/projects/${projectId}`}>
               <ArrowLeftIcon className="h-4 w-4 mr-1" />
               Back to Project Overview
             </Link>
           </Button>
         </div>
        {/* Optional: Re-use ProjectHeader or create a specific Reports header */}
        <h1 className="text-3xl font-bold">{project.name} - Reports</h1>
        <p className="text-gray-500">View summaries and analyses of your ISMS project.</p>
      </div>

      {/* Placeholder for CRQ Report */}
      <div className="mt-8 p-6 border rounded-lg shadow-sm">
         <h2 className="text-xl font-semibold mb-4">Cyber Risk Quantification Summary</h2>
         <p className="text-muted-foreground">Quantitative risk report component will be displayed here.</p>
         {/* <CrqSummaryTable projectId={projectId} /> */}
       {/* Placeholder removed */}
      </div>

      {/* Add the dynamic CRQ summary component */}
      <DynamicCrqSummary projectId={projectId} />

       {/* Add placeholders for other future reports */}
       {/* <div className="mt-8 p-6 border rounded-lg shadow-sm">
         <h2 className="text-xl font-semibold mb-4">Compliance Overview</h2>
         <p className="text-muted-foreground">Compliance report component will be displayed here.</p>
       </div> */}

    </div>
  );
}
