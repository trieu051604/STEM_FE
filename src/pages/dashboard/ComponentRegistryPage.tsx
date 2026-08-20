import { useEffect, useState } from 'react';
import { CheckCircle2, CircuitBoard, Loader2, Search, X, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  componentRegistryApi,
  toSimulationCapability,
  type ComponentDefinition,
  type ExternalComponentCandidate,
} from '@/services/componentRegistryApi';

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'response' in error) {
    const data = (error as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message) return data.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function CapabilityBadge({ component }: { component: ComponentDefinition }) {
  const capability = toSimulationCapability(component);
  if (capability === 'simulation-ready') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Simulation Ready ({component.simulationComponentType})
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2 py-0.5 text-xs font-medium text-slate-500">
      <XCircle className="w-3.5 h-3.5" />
      Not Mapped / Registry Only
    </span>
  );
}

export const ComponentRegistryPage = () => {
  const [components, setComponents] = useState<ComponentDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');

  const [detailComponent, setDetailComponent] = useState<ComponentDefinition | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const loadRegistry = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await componentRegistryApi.list();
      setComponents(data);
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Không tải được Component Registry.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRegistry();
  }, []);

  const filtered = components.filter((c) =>
    filterText.trim().length === 0
      ? true
      : c.name.toLowerCase().includes(filterText.toLowerCase()) ||
        (c.category ?? '').toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#0f4c5c]/10 flex items-center justify-center text-[#0f4c5c]">
            <CircuitBoard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0f4c5c]">Component Registry</h1>
            <p className="text-xs text-muted-foreground">
              Linh kiện đã import từ Fritzing/KiCad — nguồn nội bộ StemFlow, không đụng tới palette Circuit Builder hiện tại.
            </p>
          </div>
        </div>
        <Button onClick={() => setIsImportOpen(true)} className="bg-[#0f4c5c] hover:bg-[#0a3540] text-white rounded-full">
          Import Component
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-3 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search registry..."
              className="pl-9"
            />
          </div>
        </div>

        {isLoading && <div className="p-8 text-center text-sm text-muted-foreground">Đang tải...</div>}
        {loadError && <div className="p-4 text-sm text-red-600">{loadError}</div>}

        {!isLoading && !loadError && filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Chưa có linh kiện nào trong registry. Bấm "Import Component" để bắt đầu.
          </div>
        )}

        {!isLoading && !loadError && filtered.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Sources</th>
                <th className="px-4 py-2">Pins</th>
                <th className="px-4 py-2">Simulation Capability</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((component) => (
                <tr key={component.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium text-foreground">{component.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{component.category ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {component.sources.map((s) => (
                        <span key={`${s.provider}-${s.externalId}`} className="rounded bg-muted px-1.5 py-0.5 text-xs capitalize">
                          {s.provider}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{component.pins.length}</td>
                  <td className="px-4 py-3">
                    <CapabilityBadge component={component} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{component.status}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setDetailComponent(component)}
                      className="text-xs font-medium text-[#0f4c5c] hover:underline"
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ImportComponentDialog
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImported={() => void loadRegistry()}
      />

      <ComponentDetailDialog component={detailComponent} onClose={() => setDetailComponent(null)} />
    </div>
  );
};

function ImportComponentDialog({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<ExternalComponentCandidate[]>([]);
  const [importingKey, setImportingKey] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importedComponent, setImportedComponent] = useState<ComponentDefinition | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setSearchError(null);
      setImportMessage(null);
      setImportedComponent(null);
    }
  }, [open]);

  const runSearch = async () => {
    setIsSearching(true);
    setSearchError(null);
    setImportMessage(null);
    try {
      // provider omitted -> aggregated search across every registered
      // provider. If every provider is down the backend still answers 200
      // with an empty array — never a crash/500 (verified live, Multi-
      // Provider phase).
      const candidates = await componentRegistryApi.searchExternal(query);
      setResults(candidates);
      if (candidates.length === 0) {
        setSearchError('Không tìm thấy linh kiện từ các nguồn hiện khả dụng.');
      }
    } catch (error) {
      setResults([]);
      setSearchError(getErrorMessage(error, 'Không tìm kiếm được — vui lòng thử lại.'));
    } finally {
      setIsSearching(false);
    }
  };

  const handleImport = async (candidate: ExternalComponentCandidate) => {
    const key = `${candidate.provider}:${candidate.externalId}`;
    setImportingKey(key);
    setImportMessage(null);
    try {
      const component = await componentRegistryApi.import(candidate.provider, candidate.externalId);
      setImportedComponent(component);
      // The API doesn't return a distinct "created" vs "linked-to-existing"
      // flag — showing the honest resulting state (source count) instead of
      // inventing a distinction the backend doesn't expose.
      setImportMessage(
        component.sources.length > 1
          ? `Đã liên kết nguồn "${candidate.provider}" vào linh kiện đã có: "${component.name}" (${component.sources.length} sources).`
          : `Đã import thành công: "${component.name}".`
      );
      onImported();
    } catch (error) {
      setImportMessage(getErrorMessage(error, 'Import thất bại — vui lòng thử lại.'));
    } finally {
      setImportingKey(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogHeader className="flex items-center justify-between flex-row">
        <DialogTitle>Import Component</DialogTitle>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </DialogHeader>
      <DialogContent>
        <div className="flex gap-2 mb-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void runSearch()}
            placeholder="Search external providers (LED, Buzzer, SW_Push...)"
          />
          <Button onClick={() => void runSearch()} disabled={isSearching}>
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </Button>
        </div>

        {importMessage && (
          <div
            className={`mb-3 rounded-lg px-3 py-2 text-sm ${
              importedComponent ? 'bg-emerald-500/10 text-emerald-700' : 'bg-red-500/10 text-red-700'
            }`}
          >
            {importMessage}
          </div>
        )}

        {searchError && !isSearching && (
          <div className="mb-3 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700">{searchError}</div>
        )}

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {results.map((candidate) => {
            const key = `${candidate.provider}:${candidate.externalId}`;
            return (
              <div key={key} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{candidate.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Provider: <span className="capitalize">{candidate.provider}</span> · Category:{' '}
                    {candidate.category ?? '—'} · Pins: {candidate.pinCount}
                    {candidate.license ? ` · License: ${candidate.license}` : ''}
                  </p>
                  <p className="text-xs mt-0.5">
                    {candidate.simulationTypeCandidate ? (
                      <span className="text-emerald-600 font-medium">Simulation: {candidate.simulationTypeCandidate}</span>
                    ) : (
                      <span className="text-slate-400">Simulation: NotMapped</span>
                    )}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={importingKey === key}
                  onClick={() => void handleImport(candidate)}
                >
                  {importingKey === key ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Import'}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Đóng
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function ComponentDetailDialog({
  component,
  onClose,
}: {
  component: ComponentDefinition | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={component != null} onOpenChange={(next) => !next && onClose()}>
      {component && (
        <>
          <DialogHeader className="flex items-center justify-between flex-row">
            <DialogTitle>{component.name}</DialogTitle>
            <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </DialogHeader>
          <DialogContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
              <dt className="text-muted-foreground">Canonical Key</dt>
              <dd className="font-mono text-xs">{component.canonicalKey}</dd>
              <dt className="text-muted-foreground">Category</dt>
              <dd>{component.category ?? '—'}</dd>
              <dt className="text-muted-foreground">Simulation Component Type</dt>
              <dd>{component.simulationComponentType ?? <span className="text-slate-400">NotMapped</span>}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd>{component.status}</dd>
            </dl>

            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Pins</p>
            <div className="flex flex-wrap gap-1 mb-4">
              {component.pins.map((pin) => (
                <span key={pin.visualPinId} className="rounded bg-muted px-2 py-0.5 text-xs">
                  {pin.logicalPinId}
                  {pin.aliases.length > 0 ? ` (${pin.aliases.join(', ')})` : ''}
                </span>
              ))}
              {component.pins.length === 0 && <span className="text-xs text-muted-foreground">Không có pin.</span>}
            </div>

            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Sources ({component.sources.length})
            </p>
            <div className="space-y-2">
              {component.sources.map((source) => (
                <div key={`${source.provider}-${source.externalId}`} className="rounded-lg border border-border p-3 text-xs space-y-1">
                  <p className="font-medium capitalize">{source.provider}</p>
                  <p className="text-muted-foreground">ExternalId: {source.externalId}</p>
                  <p className="text-muted-foreground truncate">
                    Source: <a href={source.sourceUrl} target="_blank" rel="noreferrer" className="text-[#0f4c5c] hover:underline">{source.sourceUrl}</a>
                  </p>
                  <p className="text-muted-foreground">
                    License: {source.license ?? '—'} ({source.licenseStatus})
                  </p>
                  {source.externalVersion && <p className="text-muted-foreground">Version: {source.externalVersion}</p>}
                </div>
              ))}
            </div>
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </DialogFooter>
        </>
      )}
    </Dialog>
  );
}
