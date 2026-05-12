import type { ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Inbox } from 'lucide-react';
import { useDataTable } from '@/hooks/useDataTable';

export interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'right';
  className?: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
  truncate?: number;
}

// --- Client-side mode props ---
interface ClientSideProps<T> {
  serverSide?: false;
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchableFields?: (keyof T)[];
  defaultSort?: { key: keyof T; desc: boolean };
  isLoading?: boolean;
  emptyMessage?: string;
}

// --- Server-side mode props ---
interface ServerSideProps<T> {
  serverSide: true;
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  // External state
  search: string;
  onSearchChange: (v: string) => void;
  sortKey: keyof T | null;
  sortDesc: boolean;
  onSortChange: (key: keyof T) => void;
  page: number;
  onPageChange: (p: number) => void;
  pageCount: number;
  totalRows: number;
  showSearch?: boolean;
}

type DataTableProps<T> = ClientSideProps<T> | ServerSideProps<T>;

function TruncatedCell({ value, max }: { value: string; max: number }) {
  if (value.length <= max) return <>{value}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-default">{value.slice(0, max)}...</span>
      </TooltipTrigger>
      <TooltipContent>
        <span className="font-mono text-xs">{value}</span>
      </TooltipContent>
    </Tooltip>
  );
}

function SortIcon<T>({ column, sortKey, sortDesc }: { column: keyof T; sortKey: keyof T | null; sortDesc: boolean }) {
  if (sortKey !== column) return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" />;
  return sortDesc ? (
    <ArrowDown className="ml-1 inline h-3 w-3" />
  ) : (
    <ArrowUp className="ml-1 inline h-3 w-3" />
  );
}

function getPageNumbers(page: number, pageCount: number): (number | 'ellipsis')[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  if (page > 3) pages.push('ellipsis');
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (page < pageCount - 2) pages.push('ellipsis');
  pages.push(pageCount);
  return pages;
}

function TableRenderer<T extends Record<string, unknown>>({
  data,
  columns,
  rows,
  search,
  setSearch,
  sortKey,
  sortDesc,
  toggleSort,
  page,
  setPage,
  pageCount,
  totalRows,
  totalDataRows,
  isLoading,
  emptyMessage,
  showSearch,
}: {
  data: T[];
  columns: Column<T>[];
  rows: T[];
  search: string;
  setSearch: (v: string) => void;
  sortKey: keyof T | null;
  sortDesc: boolean;
  toggleSort: (key: keyof T) => void;
  page: number;
  setPage: (p: number) => void;
  pageCount: number;
  totalRows: number;
  totalDataRows: number;
  isLoading?: boolean;
  emptyMessage: string;
  showSearch: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {showSearch && (
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-full max-w-sm" />
            <Skeleton className="h-4 w-24" />
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={String(col.key)}
                    className={`text-xs font-medium uppercase tracking-wide text-muted-foreground ${col.align === 'right' ? 'text-right' : ''}`}
                  >
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell
                      key={String(col.key)}
                      className={col.align === 'right' ? 'text-right' : ''}
                    >
                      <Skeleton className={`h-4 ${col.align === 'right' ? 'ml-auto w-12' : 'w-24'}`} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {showSearch && (
          <div className="flex items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {totalRows} of {totalDataRows} rows
            </span>
          </div>
        )}

        {totalRows === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
            <Inbox className="h-8 w-8 opacity-50" />
            <p className="text-sm">{emptyMessage}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead
                      key={String(col.key)}
                      className={`text-xs font-medium uppercase tracking-wide text-muted-foreground ${col.align === 'right' ? 'text-right' : ''} ${col.sortable ? 'cursor-pointer select-none' : ''}`}
                      onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                    >
                      {col.label}
                      {col.sortable && <SortIcon column={col.key} sortKey={sortKey} sortDesc={sortDesc} />}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow key={i} className="hover:bg-muted/50 transition-colors">
                    {columns.map((col) => {
                      const raw = row[col.key];
                      let content: ReactNode;

                      if (col.render) {
                        content = col.render(raw, row);
                      } else if (col.truncate && typeof raw === 'string') {
                        content = <TruncatedCell value={raw} max={col.truncate} />;
                      } else {
                        content = String(raw ?? '');
                      }

                      return (
                        <TableCell
                          key={String(col.key)}
                          className={`${col.align === 'right' ? 'text-right' : ''} ${col.className ?? ''}`}
                        >
                          {content}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {pageCount > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage(Math.max(1, page - 1))}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {getPageNumbers(page, pageCount).map((p, i) =>
                p === 'ellipsis' ? (
                  <PaginationItem key={`e${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink isActive={p === page} onClick={() => setPage(p)} className="cursor-pointer">
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage(Math.min(pageCount, page + 1))}
                  className={page >= pageCount ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </TooltipProvider>
  );
}

export function DataTable<T extends Record<string, unknown>>(props: DataTableProps<T>) {
  if (props.serverSide) {
    return (
      <TableRenderer<T>
        data={props.data}
        columns={props.columns}
        rows={props.data}
        search={props.search}
        setSearch={props.onSearchChange}
        sortKey={props.sortKey}
        sortDesc={props.sortDesc}
        toggleSort={props.onSortChange}
        page={props.page}
        setPage={props.onPageChange}
        pageCount={props.pageCount}
        totalRows={props.totalRows}
        totalDataRows={props.totalRows}
        isLoading={props.isLoading}
        emptyMessage={props.emptyMessage ?? 'No data available'}
        showSearch={props.showSearch ?? true}
      />
    );
  }

  return <ClientDataTable {...(props as ClientSideProps<T>)} />;
}

function ClientDataTable<T extends Record<string, unknown>>({
  data,
  columns,
  pageSize = 10,
  searchableFields,
  defaultSort,
  isLoading,
  emptyMessage = 'No data available',
}: ClientSideProps<T>) {
  const { rows, search, setSearch, sortKey, sortDesc, toggleSort, page, setPage, pageCount, totalRows } =
    useDataTable({ data, pageSize, searchableFields, defaultSort });

  return (
    <TableRenderer<T>
      data={data}
      columns={columns}
      rows={rows}
      search={search}
      setSearch={setSearch}
      sortKey={sortKey}
      sortDesc={sortDesc}
      toggleSort={toggleSort}
      page={page}
      setPage={setPage}
      pageCount={pageCount}
      totalRows={totalRows}
      totalDataRows={data.length}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      showSearch={!!searchableFields && searchableFields.length > 0}
    />
  );
}
