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
import { Boundary, BoundaryType } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  PencilIcon, 
  TrashIcon, 
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from 'lucide-react'
import { BoundaryForm } from './boundary-form'
import { deleteBoundary } from '@/services/boundary-service'
import { useRouter } from 'next/navigation'

interface BoundariesTableProps {
  projectId: string
  boundaries: Boundary[]
}

export function BoundariesTable({ projectId, boundaries }: BoundariesTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [editingBoundary, setEditingBoundary] = useState<Boundary | null>(null)
  const [deletingBoundary, setDeletingBoundary] = useState<Boundary | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Define table columns
  const columns: ColumnDef<Boundary>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <div>{row.getValue('type')}</div>
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => <div className="truncate max-w-xs">{row.getValue('description') || '-'}</div>
    },
    {
      accessorKey: 'included',
      header: 'Included',
      cell: ({ row }) => (
        <div className="flex justify-center">
          {row.getValue('included') ? (
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          ) : (
            <XCircleIcon className="h-5 w-5 text-red-500" />
          )}
        </div>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const boundary = row.original
        
        return (
          <div className="flex items-center justify-end space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setEditingBoundary(boundary)}
              className="h-8 w-8 p-0"
            >
              <PencilIcon className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setDeletingBoundary(boundary)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <TrashIcon className="h-4 w-4" />
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

  // Handle boundary deletion
  const handleDelete = async () => {
    if (!deletingBoundary) return
    
    setIsDeleting(true)
    
    try {
      await deleteBoundary(deletingBoundary.id)
      setDeletingBoundary(null)
      router.refresh()
    } catch (error) {
      console.error('Error deleting boundary:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle form close
  const handleFormClose = () => {
    setEditingBoundary(null)
  }

  return (
    <div className="space-y-4">
      {/* Search and filter */}
      <div className="flex items-center justify-between">
        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search boundaries..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8"
          />
        </div>
        <div>
          <select
            value={(table.getColumn('type')?.getFilterValue() as string) ?? ''}
            onChange={(e) => table.getColumn('type')?.setFilterValue(e.target.value || undefined)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">All Types</option>
            <option value="Department">Department</option>
            <option value="System">System</option>
            <option value="Location">Location</option>
            <option value="Other">Other</option>
          </select>
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
      <div className="flex items-center justify-between">
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
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Edit Modal */}
      {editingBoundary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md p-4">
            <BoundaryForm
              projectId={projectId}
              boundary={editingBoundary}
              isEditing={true}
              onSuccess={handleFormClose}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBoundary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md p-4">
            <Card>
              <CardHeader>
                <CardTitle>Confirm Deletion</CardTitle>
                <CardDescription>
                  Are you sure you want to delete this boundary? This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{deletingBoundary.name}</p>
                <p className="text-sm text-muted-foreground">{deletingBoundary.type}</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setDeletingBoundary(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
