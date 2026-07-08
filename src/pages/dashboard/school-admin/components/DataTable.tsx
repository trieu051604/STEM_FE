import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/Icon';
import { X, AlertTriangle } from 'lucide-react';

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  rowKey: keyof T | ((row: T) => string);
}

export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Không có dữ liệu',
  onRowClick,
  rowKey,
}: DataTableProps<T>) {
  const getRowKey = (row: T): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row);
    }
    return String(row[rowKey]);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-sm font-semibold">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-t border-border">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
          <Icon name="Inbox" className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-sm font-semibold ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row, index) => (
              <tr
                key={getRowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={`transition-colors ${
                  onRowClick ? 'cursor-pointer hover:bg-accent' : ''
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-sm ${col.className || ''}`}>
                    {col.render ? col.render(row) : String((row as any)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-card rounded-xl border border-border shadow-xl w-full ${sizeClasses[size]}`}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <Icon name="X" className="w-5 h-5" />
                </button>
              </div>
              <div className="px-6 py-4 max-h-[80vh] overflow-y-auto">{children}</div>
              {footer && (
                <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end gap-3">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// Confirm Dialog
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: 'bg-destructive text-white hover:bg-destructive/90',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700',
    default: 'bg-primary text-white hover:opacity-90',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="sm"
    >
      <div className="text-center">
        <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${
          variant === 'danger' ? 'bg-destructive/10' : 'bg-yellow-100'
        }`}>
          <AlertTriangle className={`w-6 h-6 ${
            variant === 'danger' ? 'text-destructive' : 'text-yellow-600'
          }`} />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{message}</p>
      </div>
      <div className="flex gap-3 mt-6">
        <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          className={`flex-1 ${variantStyles[variant]}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Đang xử lý...' : confirmText}
        </Button>
      </div>
    </Modal>
  );
}

// Search Input Component
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Tìm kiếm...', className = '' }: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
        >
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

// Pagination Component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      <div className="text-sm text-muted-foreground">
        Hiển thị {startItem} - {endItem} của {totalItems} kết quả
      </div>
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 px-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
            <option value={100}>100 / trang</option>
          </select>
        )}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <Icon name="ChevronLeft" className="w-4 h-4" />
          </Button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let page: number;
            if (totalPages <= 5) {
              page = i + 1;
            } else if (currentPage <= 3) {
              page = i + 1;
            } else if (currentPage >= totalPages - 2) {
              page = totalPages - 4 + i;
            } else {
              page = currentPage - 2 + i;
            }
            return (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="icon"
                className="size-8"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <Icon name="ChevronRight" className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Status Badge Component
interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

export function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
  const variantStyles = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
  };

  const getVariant = (s: string): typeof variantStyles[keyof typeof variantStyles] => {
    const lower = s.toLowerCase();
    if (lower.includes('active') || lower.includes('approved') || lower.includes('success') || lower.includes('online')) return variantStyles.success;
    if (lower.includes('pending') || lower.includes('processing') || lower.includes('waiting')) return variantStyles.warning;
    if (lower.includes('inactive') || lower.includes('rejected') || lower.includes('failed') || lower.includes('error')) return variantStyles.danger;
    return variantStyles.default;
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variant !== 'default' ? variantStyles[variant] : getVariant(status)}`}>
      {status}
    </span>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon name={icon} className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && <p className="text-muted-foreground mb-4 max-w-sm">{description}</p>}
      {action && (
        <Button onClick={action.onClick}>
          <Icon name="Plus" className="w-4 h-4" />
          {action.label}
        </Button>
      )}
    </div>
  );
}
