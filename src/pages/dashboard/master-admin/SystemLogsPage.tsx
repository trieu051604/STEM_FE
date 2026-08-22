import { Fragment, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  ScrollText,
  Loader2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ShieldAlert,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { systemLogApi, SystemLogItem } from '@/services/systemLogApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const levelBadge: Record<string, { label: string; className: string; icon: typeof Info }> = {
  Information: { label: 'Information', className: 'bg-blue-100 text-blue-700', icon: Info },
  Warning: { label: 'Warning', className: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  Critical: { label: 'Critical', className: 'bg-red-100 text-red-700', icon: ShieldAlert },
};

function MetadataView({ raw }: { raw?: string | null }) {
  if (!raw) return <p className="text-xs text-muted-foreground">Không có metadata.</p>;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Invalid/unexpected metadata must never crash the viewer.
    return <p className="text-xs text-muted-foreground italic">Metadata không hợp lệ (raw): {raw}</p>;
  }

  return (
    <pre className="text-xs bg-muted rounded-lg p-3 overflow-x-auto">
      {JSON.stringify(parsed, null, 2)}
    </pre>
  );
}

export const SystemLogsPage = () => {
  const [pageNumber, setPageNumber] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filters, setFilters] = useState({ action: '', level: '', from: '', to: '' });

  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['system-logs', pageNumber, filters],
    queryFn: () =>
      systemLogApi.getAll({
        pageNumber,
        pageSize,
        action: filters.action || undefined,
        level: filters.level || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      }),
  });

  const logs = data?.items ?? [];

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPageNumber(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ScrollText className="w-6 h-6" />
          System Logs
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Nhật ký các hành động nghiệp vụ quan trọng (audit trail) — chỉ Master Admin xem được.
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Action</label>
          <Input
            className="w-48"
            placeholder="VD: SyllabusCreated"
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Level</label>
          <select
            className="h-9 w-40 rounded-md border border-input bg-transparent px-3 text-sm"
            value={filters.level}
            onChange={(e) => handleFilterChange('level', e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="Information">Information</option>
            <option value="Warning">Warning</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Từ ngày</label>
          <input
            type="date"
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            value={filters.from}
            onChange={(e) => handleFilterChange('from', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Đến ngày</label>
          <input
            type="date"
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            value={filters.to}
            onChange={(e) => handleFilterChange('to', e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-25" />
            <p className="text-sm">Chưa có nhật ký nào phù hợp bộ lọc.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Thời gian</TableHead>
                <TableHead>Người thực hiện</TableHead>
                <TableHead>Hành động</TableHead>
                <TableHead>Đối tượng</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Mức độ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: SystemLogItem) => {
                const badge = levelBadge[log.level] || { label: log.level, className: 'bg-gray-100 text-gray-700', icon: Info };
                const BadgeIcon = badge.icon;
                const isExpanded = expandedId === log.id;
                return (
                  <Fragment key={log.id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    >
                      <TableCell>
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: vi })}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{log.actorName || `User #${log.actorUserId ?? '—'}`}</p>
                        <p className="text-xs text-muted-foreground">{log.actorRole || '—'}</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">{log.action}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.entityType ? `${log.entityType} #${log.entityId}` : '—'}
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">{log.description}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                          <BadgeIcon className="w-3 h-3" />
                          {badge.label}
                        </span>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/30">
                          <MetadataView raw={log.metadata} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Trang {data.pageNumber}/{data.totalPages} · {data.totalCount} bản ghi
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pageNumber >= data.totalPages}
                onClick={() => setPageNumber((p) => p + 1)}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemLogsPage;
