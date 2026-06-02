'use client';

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import type { ReactNode } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Props<TData, TMeta = unknown> = {
  columns: ColumnDef<TData>[];
  data: TData[];
  pageCount: number;
  pagination: PaginationState;
  sorting: SortingState;
  onPaginationChange: OnChangeFn<PaginationState>;
  onSortingChange: OnChangeFn<SortingState>;
  isLoading?: boolean;
  emptyState?: ReactNode;
  meta?: TMeta;
};

export function DataTable<TData, TMeta = unknown>({
  columns,
  data,
  pageCount,
  pagination,
  sorting,
  onPaginationChange,
  onSortingChange,
  isLoading = false,
  emptyState,
  meta,
}: Props<TData, TMeta>) {
  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: { pagination, sorting },
    manualPagination: true,
    manualSorting: true,
    onPaginationChange,
    onSortingChange,
    meta,
    getCoreRowModel: getCoreRowModel(),
  });

  const visibleColumnCount = Math.max(table.getVisibleLeafColumns().length, 1);

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {isLoading
            ? Array.from({ length: Math.max(pagination.pageSize, 5) }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  {Array.from({ length: visibleColumnCount }).map((__, cellIndex) => (
                    <TableCell key={`loading-${index}-${cellIndex}`}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}

          {!isLoading && table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={visibleColumnCount} className="py-8 text-center text-muted-foreground">
                {emptyState ?? 'No records found.'}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
