'use client'

import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  flexRender
} from '@tanstack/react-table'
import { useQuery, useQueryClient } from '@tanstack/react-query'; // Import query hooks
import { BoundaryType, ProjectWithStatus } from '@/types' // Remove Boundary import
import { Tables } from '@/types/database.types'; // Import Tables helper
import { getProjectById, unmarkProjectPhaseComplete } from '@/services/project-service'; // Import project service functions
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Import AlertDialog components
import { Input } from '@/components/ui/input'
import { 
  CheckCircle, 
  XCircle, 
  Pencil, 
  Trash, 
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Building2,
  Globe,
  Server,
  FileQuestion,
  Loader2 // Added Loader2
} from 'lucide-react'
import { MultiBoundaryForm } from './multi-boundary-form'
import { deleteBoundary } from '@/services/boundary-service'
import { useRouter } from 'next/navigation'

type Boundary = Tables<'boundaries'>; // Define Boundary using Tables helper

interface BoundariesTableProps {
  projectId: string
  boundaries: Boundary[] // Use the locally defined Boundary type
}

export function BoundariesTable({ projectId, boundaries }: BoundariesTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [editingBoundary, setEditingBoundary] = useState<Boundary | null>(null)
  // Replace deletingBoundary state with state for AlertDialog
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [boundaryToDelete, setBoundaryToDelete] = useState<Boundary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false)
  const queryClient = useQueryClient();

  // Fetch project data to check completion status
  const { data: project } = useQuery<ProjectWithStatus | null>({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(projectId),
    enabled: !!projectId,
    staleTime: Infinity,
  });

  // Get type icon based on boundary type
  const getTypeIcon = (type: BoundaryType) => {
    switch (type) {
      case 'Department':
        return <Building2 className="h-4 w-4 mr-2 text-blue-500" />;
      case 'System':
        return <Server className="h-4 w-4 mr-2 text-purple-500" />;
      case 'Location':
        return <Globe className="h-4 w-4 mr-2 text-green-500" />;
      case 'Other':
        return <FileQuestion className="h-4 w-4 mr-2 text-gray-500" />;
    }
  };

  // Define table columns
  const columns: ColumnDef<Boundary>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>
    },
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center">
          {getTypeIcon(row.getValue('type'))}
          <span>{row.getValue('type')}</span>
        </div>
      )
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const description = row.getValue('description') as string | null;
        return (
          <div className="max-w-xs">
            {description ? (
              <div className="line-clamp-2 whitespace-pre-wrap">{description}</div>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        );
      }
    },
    // Add Asset Value Qualitative Column
    {
      accessorKey: 'asset_value_qualitative',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Asset Value (Qual)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const value = row.getValue('asset_value_qualitative') as string | null;
        return value ? <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          value === 'High' ? 'bg-red-100 text-red-700' : 
          value === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 
          value === 'Low' ? 'bg-green-100 text-green-700' : ''
        }`}>{value}</span> : <span className="text-muted-foreground">-</span>;
      }
    },
    // Add Asset Value Quantitative Column
    {
      accessorKey: 'asset_value_quantitative',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Asset Value (Quant)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const value = row.getValue('asset_value_quantitative') as number | null;
        // Optional: Format as currency if needed
        return value !== null ? <span>{value.toLocaleString()}</span> : <span className="text-muted-foreground">-</span>;
      }
    },
    {
      accessorKey: 'included',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          In Scope
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-left">
          {row.getValue('included') ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-1.5" />
              <span>Yes</span>
            </div>
          ) : (
            <div className="flex items-center text-red-600">
              <XCircle className="h-5 w-5 mr-1.5" />
              <span>No</span>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'actions',
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => {
        const boundary = row.original
        
        return (
          <div className="flex items-center justify-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setEditingBoundary(boundary)}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleDeleteClick(boundary)} // Use new handler
              disabled={isDeleting} // Disable if any delete is in progress
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        )
      }
    }
  ]

  // Initialize table
  const table = useReactTable({
    data: boundaries,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  })

  // Function to actually perform the deletion and phase unmarking
  const performDelete = async (boundary: Boundary) => {
    if (!boundary) return;
    setIsDeleting(true);
    try {
      // 1. Delete Boundary
      await deleteBoundary(boundary.id);

      // 2. Unmark Phase (only if it was previously complete)
      if (project?.boundaries_completed_at) {
        await unmarkProjectPhaseComplete(projectId, 'boundaries_completed_at');
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      }

      router.refresh(); // Or use queryClient.invalidateQueries(['boundaries', projectId]);
      // TODO: Show success toast
    } catch (error) {
      console.error('Error deleting boundary:', error);
      // TODO: Show error toast
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
      setBoundaryToDelete(null);
    }
  };

  // Initial delete handler: checks phase status and shows confirmation if needed
  const handleDeleteClick = (boundary: Boundary) => {
    if (project?.boundaries_completed_at) {
      setBoundaryToDelete(boundary);
      setShowDeleteConfirmation(true);
    } else {
      // Use standard browser confirm if phase not complete
      if (confirm('Are you sure you want to delete this boundary? This action cannot be undone.')) {
         performDelete(boundary);
      }
    }
  };

  // Handle form close
  const handleFormClose = () => {
    setEditingBoundary(null)
  }

  return (
    <div className="space-y-4">
      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search boundaries..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8 w-full"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!table.getColumn('type')?.getFilterValue() ? 'default' : 'outline'}
            size="sm"
            onClick={() => table.getColumn('type')?.setFilterValue(undefined)}
            className="h-8"
          >
            All
          </Button>
          <Button
            variant={table.getColumn('type')?.getFilterValue() === 'Department' ? 'default' : 'outline'}
            size="sm"
            onClick={() => table.getColumn('type')?.setFilterValue('Department')}
            className="h-8"
          >
            <Building2 className="h-4 w-4 mr-1" />
            Departments
          </Button>
          <Button
            variant={table.getColumn('type')?.getFilterValue() === 'System' ? 'default' : 'outline'}
            size="sm"
            onClick={() => table.getColumn('type')?.setFilterValue('System')}
            className="h-8"
          >
            <Server className="h-4 w-4 mr-1" />
            Systems
          </Button>
          <Button
            variant={table.getColumn('type')?.getFilterValue() === 'Location' ? 'default' : 'outline'}
            size="sm"
            onClick={() => table.getColumn('type')?.setFilterValue('Location')}
            className="h-8"
          >
            <Globe className="h-4 w-4 mr-1" />
            Locations
          </Button>
          <Button
            variant={table.getColumn('type')?.getFilterValue() === 'Other' ? 'default' : 'outline'}
            size="sm"
            onClick={() => table.getColumn('type')?.setFilterValue('Other')}
            className="h-8"
          >
            <FileQuestion className="h-4 w-4 mr-1" />
            Other
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <th 
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? 'cursor-pointer select-none flex items-center'
                            : ''
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-6 text-center text-sm text-muted-foreground">
                  No boundaries found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{' '}
          of {table.getFilteredRowModel().rows.length} entries
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <div className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      </div>

      {/* Edit Modal */}
      {editingBoundary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-4xl p-4">
            <MultiBoundaryForm
              projectId={projectId}
              boundary={editingBoundary}
              isEditing={true}
              onSuccess={handleFormClose}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog using Shadcn AlertDialog */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Modification</AlertDialogTitle>
            <AlertDialogDescription>
              The &quot;Boundaries&quot; phase is marked as complete. Deleting this boundary will reset the phase status. Are you sure you want to delete &quot;{boundaryToDelete?.name}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBoundaryToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => boundaryToDelete && performDelete(boundaryToDelete)} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm & Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
