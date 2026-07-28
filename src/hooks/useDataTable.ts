import { useMemo, useState, useCallback, useEffect, useRef } from 'react';

// --- useSearch ---

export interface UseSearchOptions<T> {
  data: T[];
  fields?: (keyof T)[];
}

export function useSearch<T extends Record<string, unknown>>({ data, fields }: UseSearchOptions<T>) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim() || !fields?.length) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      fields.some((field) => String(row[field]).toLowerCase().includes(q)),
    );
  }, [data, search, fields]);

  return { filtered, search, setSearch };
}

// --- useSort ---

export interface UseSortOptions<T> {
  data: T[];
  defaultSort?: { key: keyof T; desc: boolean };
}

export function useSort<T extends Record<string, unknown>>({ data, defaultSort }: UseSortOptions<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(defaultSort?.key ?? null);
  const [sortDesc, setSortDesc] = useState(defaultSort?.desc ?? false);

  const toggleSort = useCallback(
    (key: keyof T) => {
      setSortKey((prev) => {
        if (prev === key) {
          setSortDesc((d) => !d);
          return prev;
        }
        setSortDesc(false);
        return key;
      });
    },
    [],
  );

  const sorted = useMemo(() => {
    if (sortKey == null) return data;
    const copy = [...data];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      let cmp: number;
      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = av - bv;
      } else {
        cmp = String(av).localeCompare(String(bv));
      }
      return sortDesc ? -cmp : cmp;
    });
    return copy;
  }, [data, sortKey, sortDesc]);

  return { sorted, sortKey, sortDesc, toggleSort };
}

// --- usePagination ---

export interface UsePaginationOptions<T> {
  data: T[];
  pageSize?: number;
}

export function usePagination<T>({ data, pageSize = 10 }: UsePaginationOptions<T>) {
  const [page, setPage] = useState(1);

  const totalRows = data.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(page, pageCount);

  const rows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, safePage, pageSize]);

  const resetPage = useCallback(() => setPage(1), []);

  return { rows, page: safePage, setPage, pageCount, totalRows, resetPage };
}

// --- useDataTable (composer) ---

/**
 * Composes search, sort, and pagination over an in-memory row set — the hook
 * behind DataTable's client-side mode.
 *
 * Choosing between the two hooks in this file:
 *   - useDataTable when you HAVE all the rows and want them filtered and paged.
 *   - useServerDataTable when the API pages for you and you only need the state
 *     to send it.
 *
 * The individual useSearch/useSort/usePagination hooks are exported for the rare
 * case that needs one in isolation; prefer this composer.
 */
export interface UseDataTableOptions<T> {
  data: T[];
  pageSize?: number;
  searchableFields?: (keyof T)[];
  defaultSort?: { key: keyof T; desc: boolean };
}

export interface UseDataTableReturn<T> {
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
}

export function useDataTable<T extends Record<string, unknown>>({
  data,
  pageSize = 10,
  searchableFields,
  defaultSort,
}: UseDataTableOptions<T>): UseDataTableReturn<T> {
  const { filtered, search, setSearch: setSearchRaw } = useSearch({ data, fields: searchableFields });
  const { sorted, sortKey, sortDesc, toggleSort: toggleSortRaw } = useSort({ data: filtered, defaultSort });
  const { rows, page, setPage, pageCount, totalRows, resetPage } = usePagination({ data: sorted, pageSize });

  // Reset page when search or sort changes
  const prevSearch = useRef(search);
  const prevSortKey = useRef(sortKey);
  const prevSortDesc = useRef(sortDesc);

  useEffect(() => {
    if (prevSearch.current !== search || prevSortKey.current !== sortKey || prevSortDesc.current !== sortDesc) {
      resetPage();
      prevSearch.current = search;
      prevSortKey.current = sortKey;
      prevSortDesc.current = sortDesc;
    }
  }, [search, sortKey, sortDesc, resetPage]);

  const setSearch = useCallback((v: string) => {
    setSearchRaw(v);
  }, [setSearchRaw]);

  const toggleSort = useCallback((key: keyof T) => {
    toggleSortRaw(key);
  }, [toggleSortRaw]);

  return {
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
  };
}

// --- useServerDataTable (state-only, for server-side pagination) ---

/**
 * State-only variant for server-paginated tables: it tracks search, sort, and
 * page but never touches rows, because it has none.
 *
 * Its return shape is deliberately the prop shape DataTable's ServerSideProps
 * expects, so the two spread together. Note the page-reset-on-search/sort
 * behaviour that useDataTable provides must be reproduced by the caller here —
 * changing a filter while on page 5 otherwise requests page 5 of a result set that
 * may only have one page.
 */
export interface UseServerDataTableOptions<T> {
  pageSize?: number;
  defaultSort?: { key: keyof T; desc: boolean };
}

export interface UseServerDataTableReturn<T> {
  search: string;
  setSearch: (v: string) => void;
  sortKey: keyof T | null;
  sortDesc: boolean;
  toggleSort: (key: keyof T) => void;
  page: number;
  setPage: (p: number) => void;
}

export function useServerDataTable<T>({
  defaultSort,
}: UseServerDataTableOptions<T> = {}): UseServerDataTableReturn<T> {
  const [search, setSearchRaw] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | null>(defaultSort?.key ?? null);
  const [sortDesc, setSortDesc] = useState(defaultSort?.desc ?? false);
  const [page, setPage] = useState(1);

  const setSearch = useCallback((v: string) => {
    setSearchRaw(v);
    setPage(1);
  }, []);

  const toggleSort = useCallback(
    (key: keyof T) => {
      setSortKey((prev) => {
        if (prev === key) {
          setSortDesc((d) => !d);
          return prev;
        }
        setSortDesc(false);
        return key;
      });
      setPage(1);
    },
    [],
  );

  return { search, setSearch, sortKey, sortDesc, toggleSort, page, setPage };
}
