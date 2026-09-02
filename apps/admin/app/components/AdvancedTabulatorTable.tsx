'use client';

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Search, ArrowUpDown, ArrowUp, ArrowDown, Download, FileSpreadsheet, 
  FileText, Copy, Printer, CheckSquare, Square, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Columns, Filter, Check, RefreshCw
} from 'lucide-react';

export interface TabulatorColumn<T> {
  key: string;
  title: string;
  render?: (row: T, index: number) => React.ReactNode;
  getValue?: (row: T) => any;
  sortable?: boolean;
  filterable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  isNumeric?: boolean;
  defaultVisible?: boolean;
}

interface AdvancedTabulatorTableProps<T> {
  data: T[];
  columns: TabulatorColumn<T>[];
  keyField: keyof T | ((row: T) => string);
  title?: string;
  subtitle?: string;
  defaultPageSize?: number;
  onRowClick?: (row: T) => void;
  batchActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    variant?: 'primary' | 'danger' | 'default';
    action: (selectedRows: T[]) => void;
  }>;
  onRefresh?: () => void;
  isLoading?: boolean;
  customFilterComponent?: React.ReactNode;
  emptyStateComponent?: React.ReactNode;
}

export function AdvancedTabulatorTable<T extends Record<string, any>>({
  data,
  columns,
  keyField,
  title,
  subtitle,
  defaultPageSize = 10,
  onRowClick,
  batchActions = [],
  onRefresh,
  isLoading = false,
  customFilterComponent,
  emptyStateComponent,
}: AdvancedTabulatorTableProps<T>) {
  // Global & Column Search
  const [globalSearch, setGlobalSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showColumnFilterRow, setShowColumnFilterRow] = useState(false);

  // Column Visibility
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    columns.forEach((col) => {
      map[col.key] = col.defaultVisible !== false;
    });
    return map;
  });
  const [showColPicker, setShowColPicker] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);
  const [jumpPageInput, setJumpPageInput] = useState('');

  // Row Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Copy Feedback
  const [copySuccess, setCopySuccess] = useState(false);

  const getRowKey = (row: T, idx: number): string => {
    if (typeof keyField === 'function') return keyField(row);
    return (row[keyField] as string) || String(idx);
  };

  // 1. Filtering Logic
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // Global Search
      if (globalSearch.trim()) {
        const q = globalSearch.toLowerCase();
        const matchesGlobal = columns.some((col) => {
          const val = col.getValue ? col.getValue(row) : row[col.key];
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(q);
        });
        if (!matchesGlobal) return false;
      }

      // Column Filters
      for (const [key, filterVal] of Object.entries(columnFilters)) {
        if (!filterVal.trim()) continue;
        const q = filterVal.toLowerCase();
        const col = columns.find((c) => c.key === key);
        const val = col && col.getValue ? col.getValue(row) : row[key];
        if (val === null || val === undefined) return false;
        if (!String(val).toLowerCase().includes(q)) return false;
      }

      return true;
    });
  }, [data, columns, globalSearch, columnFilters]);

  // 2. Sorting Logic
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    const col = columns.find((c) => c.key === sortField);
    const sorted = [...filteredData].sort((a, b) => {
      const valA = col && col.getValue ? col.getValue(a) : a[sortField];
      const valB = col && col.getValue ? col.getValue(b) : b[sortField];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredData, sortField, sortDirection, columns]);

  // 3. Pagination Logic
  const totalRecords = sortedData.length;
  const isAllPages = pageSize === -1;
  const effectivePageSize = isAllPages ? totalRecords || 1 : pageSize;
  const totalPages = isAllPages ? 1 : Math.ceil(totalRecords / effectivePageSize) || 1;

  const paginatedData = useMemo(() => {
    if (isAllPages) return sortedData;
    const start = (currentPage - 1) * effectivePageSize;
    return sortedData.slice(start, start + effectivePageSize);
  }, [sortedData, currentPage, effectivePageSize, isAllPages]);

  // Page index range
  const startRecordIndex = totalRecords === 0 ? 0 : (currentPage - 1) * effectivePageSize + 1;
  const endRecordIndex = isAllPages ? totalRecords : Math.min(currentPage * effectivePageSize, totalRecords);

  // Sorting Header Click
  const handleSort = (key: string) => {
    if (sortField === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
      }
    } else {
      setSortField(key);
      setSortDirection('asc');
    }
  };

  // Selection
  const allCurrentPageSelected = paginatedData.length > 0 && paginatedData.every((r, idx) => selectedIds.has(getRowKey(r, idx)));
  const someCurrentPageSelected = paginatedData.some((r, idx) => selectedIds.has(getRowKey(r, idx)));

  const handleToggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (allCurrentPageSelected) {
      paginatedData.forEach((r, idx) => next.delete(getRowKey(r, idx)));
    } else {
      paginatedData.forEach((r, idx) => next.add(getRowKey(r, idx)));
    }
    setSelectedIds(next);
  };

  const handleToggleSelectRow = (rowKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(rowKey)) {
      next.delete(rowKey);
    } else {
      next.add(rowKey);
    }
    setSelectedIds(next);
  };

  const getSelectedRows = (): T[] => {
    return data.filter((r, idx) => selectedIds.has(getRowKey(r, idx)));
  };

  // EXPORTS
  const prepareExportData = (rowsToExport: T[]) => {
    const activeCols = columns.filter((col) => visibleColumns[col.key]);
    return rowsToExport.map((row) => {
      const obj: Record<string, any> = {};
      activeCols.forEach((col) => {
        const raw = col.getValue ? col.getValue(row) : row[col.key];
        obj[col.title] = raw ?? '';
      });
      return obj;
    });
  };

  // 1. Export to Excel (.xlsx)
  const handleExportExcel = (selectedOnly = false) => {
    const rows = selectedOnly ? getSelectedRows() : sortedData;
    if (rows.length === 0) return;
    const formatted = prepareExportData(rows);

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    
    // Auto column widths
    const wscols = columns
      .filter((col) => visibleColumns[col.key])
      .map((col) => ({ wch: Math.max(col.title.length + 4, 15) }));
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, `${title?.toLowerCase().replace(/\s+/g, '_') || 'tabulator_export'}_${Date.now()}.xlsx`);
  };

  // 2. Export to CSV (.csv)
  const handleExportCSV = (selectedOnly = false) => {
    const rows = selectedOnly ? getSelectedRows() : sortedData;
    if (rows.length === 0) return;
    const formatted = prepareExportData(rows);

    const ws = XLSX.utils.json_to_sheet(formatted);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title?.toLowerCase().replace(/\s+/g, '_') || 'tabulator_export'}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 3. Copy to Clipboard (TSV for Excel / Sheets paste)
  const handleCopyClipboard = () => {
    const rows = selectedIds.size > 0 ? getSelectedRows() : sortedData;
    const activeCols = columns.filter((col) => visibleColumns[col.key]);
    const headerRow = activeCols.map((c) => c.title).join('\t');
    const bodyRows = rows.map((r) =>
      activeCols
        .map((c) => {
          const val = c.getValue ? c.getValue(r) : r[c.key];
          return val !== null && val !== undefined ? String(val).replace(/\t|\n/g, ' ') : '';
        })
        .join('\t')
    );
    const text = [headerRow, ...bodyRows].join('\n');
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // 4. Print Table View
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 text-[#2D1F0E] animate-fade-in">
      {/* TOOLBAR HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-3xl border border-[#EAD9B8] shadow-sm">
        <div>
          {title && <h3 className="text-lg font-serif font-bold text-[#2D1F0E]">{title}</h3>}
          {subtitle && <p className="text-xs text-[#6E5336] mt-0.5">{subtitle}</p>}
        </div>

        {/* Global Search & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Search Box */}
          <div className="flex items-center space-x-2 bg-[#FAF6EE] px-3 py-2 rounded-2xl border border-[#EAD9B8] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-[#8C6019]" />
            <input
              type="text"
              placeholder="Search table records..."
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs text-[#2D1F0E] placeholder-[#6E5336]/60 focus:outline-none w-full sm:w-56"
            />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch('')}
                className="text-[10px] text-[#6E5336] hover:text-[#2D1F0E] font-bold px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Toggle Column Search Row */}
          <button
            onClick={() => setShowColumnFilterRow(!showColumnFilterRow)}
            className={`p-2.5 rounded-2xl border transition text-xs font-bold flex items-center space-x-1 ${
              showColumnFilterRow
                ? 'bg-[#D99427] text-white border-[#D99427]'
                : 'bg-white hover:bg-[#FAF6EE] border-[#EAD9B8] text-[#6E5336]'
            }`}
            title="Toggle Per-Column Filters"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>

          {/* Column Visibility Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowColPicker(!showColPicker)}
              className="p-2.5 rounded-2xl bg-white hover:bg-[#FAF6EE] border border-[#EAD9B8] text-[#6E5336] transition flex items-center space-x-1 text-xs font-bold"
              title="Select Columns"
            >
              <Columns className="w-3.5 h-3.5 text-[#D99427]" />
              <span className="hidden sm:inline">Columns</span>
            </button>

            {showColPicker && (
              <div className="absolute right-0 top-12 z-30 bg-white border-2 border-[#EAD9B8] rounded-2xl p-4 shadow-xl w-60 space-y-2 text-xs">
                <div className="font-bold text-[#2D1F0E] border-b border-[#EAD9B8] pb-1.5 flex justify-between items-center">
                  <span>Toggle Columns</span>
                  <button
                    onClick={() => {
                      const allOn: Record<string, boolean> = {};
                      columns.forEach((c) => (allOn[c.key] = true));
                      setVisibleColumns(allOn);
                    }}
                    className="text-[10px] text-[#D99427] hover:underline font-bold"
                  >
                    Reset All
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1.5 pt-1">
                  {columns.map((col) => (
                    <label key={col.key} className="flex items-center space-x-2 cursor-pointer hover:bg-[#FAF6EE] p-1 rounded-lg">
                      <input
                        type="checkbox"
                        checked={visibleColumns[col.key]}
                        onChange={(e) => {
                          setVisibleColumns({ ...visibleColumns, [col.key]: e.target.checked });
                        }}
                        className="rounded accent-[#D99427]"
                      />
                      <span className="text-[#2D1F0E]">{col.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Export to Excel Button */}
          <button
            onClick={() => handleExportExcel(selectedIds.size > 0)}
            className="px-3.5 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center space-x-1.5 transition shadow-sm"
            title="Export to Excel Spreadsheet (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Excel {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}</span>
          </button>

          {/* Export to CSV Button */}
          <button
            onClick={() => handleExportCSV(selectedIds.size > 0)}
            className="px-3.5 py-2 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-800 font-bold text-xs flex items-center space-x-1.5 transition shadow-sm"
            title="Export to CSV (.csv)"
          >
            <FileText className="w-3.5 h-3.5 text-blue-700" />
            <span>CSV</span>
          </button>

          {/* Copy Table to Clipboard */}
          <button
            onClick={handleCopyClipboard}
            className="p-2.5 rounded-2xl bg-white hover:bg-[#FAF6EE] border border-[#EAD9B8] text-[#6E5336] transition flex items-center space-x-1 text-xs font-bold"
            title="Copy Table to Clipboard (TSV)"
          >
            {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#D99427]" />}
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="p-2.5 rounded-2xl bg-white hover:bg-[#FAF6EE] border border-[#EAD9B8] text-[#6E5336] transition flex items-center space-x-1 text-xs font-bold"
            title="Print Table View"
          >
            <Printer className="w-3.5 h-3.5 text-[#D99427]" />
          </button>

          {/* Refresh Data */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2.5 rounded-2xl bg-white hover:bg-[#FAF6EE] border border-[#EAD9B8] text-[#6E5336] transition flex items-center space-x-1 text-xs font-bold"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#D99427] ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* CUSTOM FILTER COMPONENT (IF PROVIDED) */}
      {customFilterComponent && (
        <div className="bg-white p-4 rounded-2xl border border-[#EAD9B8] shadow-sm">
          {customFilterComponent}
        </div>
      )}

      {/* BATCH ACTION BAR (WHEN ROWS ARE SELECTED) */}
      {selectedIds.size > 0 && (
        <div className="p-3.5 rounded-2xl bg-[#FFF5DC] border-2 border-[#E5A93C] flex flex-wrap items-center justify-between gap-3 shadow-md animate-fade-in text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold text-[#8C6019] bg-white px-2.5 py-1 rounded-xl border border-[#EAD9B8]">
              {selectedIds.size} Selected
            </span>
            <span className="text-[#6E5336]">Apply batch operations to selected items:</span>
          </div>

          <div className="flex items-center space-x-2">
            {batchActions.map((ba, idx) => (
              <button
                key={idx}
                onClick={() => ba.action(getSelectedRows())}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 text-xs shadow-sm ${
                  ba.variant === 'primary'
                    ? 'bg-[#D99427] text-white hover:opacity-95'
                    : ba.variant === 'danger'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-white hover:bg-[#FAF6EE] border border-[#EAD9B8] text-[#2D1F0E]'
                }`}
              >
                {ba.icon}
                <span>{ba.label}</span>
              </button>
            ))}

            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF6EE] border border-[#EAD9B8] text-[#6E5336] font-semibold"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* DATA TABLE CONTAINER */}
      <div className="overflow-x-auto rounded-3xl border border-[#EAD9B8] bg-white shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          {/* HEADER */}
          <thead className="bg-[#FAF6EE] text-[#8C6019] uppercase tracking-wider font-mono text-[10px] border-b border-[#EAD9B8]">
            <tr>
              {/* Checkbox Column */}
              <th className="p-3.5 w-10 text-center">
                <button
                  onClick={handleToggleSelectAll}
                  className="text-[#8C6019] hover:text-[#2D1F0E] focus:outline-none"
                  title="Select / Deselect Page"
                >
                  {allCurrentPageSelected ? (
                    <CheckSquare className="w-4 h-4 text-[#D99427]" />
                  ) : someCurrentPageSelected ? (
                    <Square className="w-4 h-4 text-[#D99427] opacity-60" />
                  ) : (
                    <Square className="w-4 h-4 opacity-40" />
                  )}
                </button>
              </th>

              {columns.map((col) => {
                if (!visibleColumns[col.key]) return null;
                const isSorted = sortField === col.key;
                const alignClass = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';

                return (
                  <th
                    key={col.key}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                    style={{ width: col.width }}
                    className={`p-3.5 select-none transition ${alignClass} ${
                      col.sortable !== false ? 'cursor-pointer hover:bg-[#F3ECE0]' : ''
                    }`}
                  >
                    <div className={`inline-flex items-center space-x-1.5 ${col.align === 'right' ? 'flex-row-reverse' : ''}`}>
                      <span className="font-bold">{col.title}</span>
                      {col.sortable !== false && (
                        <span className="text-[#D99427]">
                          {isSorted ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>

            {/* OPTIONAL PER-COLUMN FILTER INPUT ROW */}
            {showColumnFilterRow && (
              <tr className="bg-[#FFFDF9] border-t border-[#EAD9B8]">
                <th className="p-2 text-center text-[10px] text-[#6E5336]">Filter</th>
                {columns.map((col) => {
                  if (!visibleColumns[col.key]) return null;
                  return (
                    <th key={col.key} className="p-2">
                      <input
                        type="text"
                        placeholder={`Filter ${col.title}...`}
                        value={columnFilters[col.key] || ''}
                        onChange={(e) => {
                          setColumnFilters({ ...columnFilters, [col.key]: e.target.value });
                          setCurrentPage(1);
                        }}
                        className="w-full px-2 py-1 rounded-lg bg-white border border-[#EAD9B8] text-[11px] text-[#2D1F0E] font-normal focus:border-[#D99427] outline-none"
                      />
                    </th>
                  );
                })}
              </tr>
            )}
          </thead>

          {/* BODY */}
          <tbody className="divide-y divide-[#EAD9B8] text-[#2D1F0E]">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.filter((c) => visibleColumns[c.key]).length + 1}
                  className="p-8 text-center text-[#6E5336] text-xs font-serif"
                >
                  {isLoading ? 'Loading records...' : (emptyStateComponent || 'No matching records found.')}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => {
                const rKey = getRowKey(row, idx);
                const isSelected = selectedIds.has(rKey);

                return (
                  <tr
                    key={rKey}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`transition hover:bg-[#FFFDF9] ${isSelected ? 'bg-[#FFF9EE]' : ''} ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3.5 text-center" onClick={(e) => handleToggleSelectRow(rKey, e)}>
                      <button className="focus:outline-none">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#D99427]" />
                        ) : (
                          <Square className="w-4 h-4 text-[#6E5336]/40" />
                        )}
                      </button>
                    </td>

                    {/* Columns */}
                    {columns.map((col) => {
                      if (!visibleColumns[col.key]) return null;
                      const alignClass = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';
                      const cellContent = col.render ? col.render(row, idx) : (col.getValue ? col.getValue(row) : row[col.key]);

                      return (
                        <td key={col.key} className={`p-3.5 ${alignClass}`}>
                          {cellContent ?? '—'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ADVANCED TABULATOR PAGINATION FOOTER */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-3xl border border-[#EAD9B8] text-xs text-[#6E5336] shadow-sm">
        {/* Record count summary & page size */}
        <div className="flex flex-wrap items-center gap-3">
          <span>
            Showing <strong className="text-[#2D1F0E]">{startRecordIndex}–{endRecordIndex}</strong> of{' '}
            <strong className="text-[#2D1F0E]">{totalRecords}</strong> records
            {totalRecords !== data.length && ` (filtered from ${data.length})`}
          </span>

          <div className="flex items-center space-x-1.5 pl-2 border-l border-[#EAD9B8]">
            <span>Page Size:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-xs font-semibold focus:border-[#D99427] outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={-1}>All ({totalRecords})</option>
            </select>
          </div>
        </div>

        {/* Navigation & Direct Page Jump */}
        {!isAllPages && (
          <div className="flex items-center space-x-2">
            {/* First Page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] hover:bg-[#F3ECE0] disabled:opacity-40 transition"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Prev Page */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] hover:bg-[#F3ECE0] disabled:opacity-40 transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-mono font-bold text-[#2D1F0E] px-2">
              Page {currentPage} of {totalPages}
            </span>

            {/* Next Page */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] hover:bg-[#F3ECE0] disabled:opacity-40 transition"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last Page */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] hover:bg-[#F3ECE0] disabled:opacity-40 transition"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>

            {/* Jump to Page Input */}
            <div className="flex items-center space-x-1 pl-2 border-l border-[#EAD9B8]">
              <span>Go to:</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const p = parseInt(jumpPageInput, 10);
                    if (p >= 1 && p <= totalPages) {
                      setCurrentPage(p);
                      setJumpPageInput('');
                    }
                  }
                }}
                placeholder={String(currentPage)}
                className="w-12 px-2 py-1 rounded-xl bg-[#FAF6EE] border border-[#EAD9B8] text-xs font-mono text-center focus:border-[#D99427] outline-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
