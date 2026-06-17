/**
 * Client-side CSV export for dashboard charts and tables.
 *
 * No dependencies: builds a CSV string, prepends a UTF-8 BOM so Excel reads
 * accents correctly, and triggers a download via a transient object URL.
 */

export interface CsvColumn {
  key: string;
  header: string;
}

function escapeCell(value: unknown): string {
  if (value == null) return '';
  const str = String(value);
  // Quote when the value contains a delimiter, quote, or newline.
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(rows: Record<string, unknown>[], columns?: CsvColumn[]): string {
  if (rows.length === 0) return '';

  const cols: CsvColumn[] =
    columns ?? Object.keys(rows[0]).map((key) => ({ key, header: key }));

  const headerLine = cols.map((c) => escapeCell(c.header)).join(',');
  const bodyLines = rows.map((row) => cols.map((c) => escapeCell(row[c.key])).join(','));

  return [headerLine, ...bodyLines].join('\r\n');
}

export function exportCsv(
  filename: string,
  rows: Record<string, unknown>[],
  columns?: CsvColumn[],
): void {
  const csv = toCsv(rows, columns);
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
