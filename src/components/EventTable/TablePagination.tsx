import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-900/90 border-t border-slate-800 text-xs text-slate-400">
      <div className="flex items-center gap-2">
        <span>Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
        >
          <option value={10}>10</option>
          <option value={15}>15</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <span className="text-slate-400">
          Showing <strong className="text-slate-200 font-mono">{startItem}–{endItem}</strong> of{' '}
          <strong className="text-slate-200 font-mono">{totalItems}</strong>
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 transition-colors"
          title="First page"
          aria-label="Go to first page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 transition-colors"
          title="Previous page"
          aria-label="Go to previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-2 py-1 font-mono text-slate-200">
          Page {currentPage} of {Math.max(1, totalPages)}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 transition-colors"
          title="Next page"
          aria-label="Go to next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 transition-colors"
          title="Last page"
          aria-label="Go to last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
