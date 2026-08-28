import { api } from './api';

// Types mirror STEM.Application/Dtos/Components/ComponentDtos.cs verbatim
// (camelCase JSON — StemDbContext/API-wide JsonSerializerOptions uses
// JsonNamingPolicy.CamelCase). simulationComponentType is deliberately
// nullable end-to-end: null means the backend has NOT mapped this component
// to any runnable simulation type — the frontend must never infer
// "runtime-supported" from category/name on its own (see
// toSimulationCapability below, the only place allowed to interpret this).

export interface ComponentPin {
  visualPinId: string;
  logicalPinId: string;
  aliases: string[];
}

export interface ComponentSource {
  provider: string;
  externalId: string;
  sourceUrl: string;
  license: string | null;
  licenseStatus: string;
  externalVersion: string | null;
  importedAt: string;
}

// Backend-computed from simulationComponentType (RuntimeCapabilityResolver,
// C#) — never derived on the frontend from name/category/provider. A
// component with simulationComponentType === null (e.g. every RGB LED
// variant) always has runtimeCapabilities === [] by construction.
export type RuntimeCapability = 'DigitalInput' | 'AnalogInput' | 'SensorInput' | 'Output';

export interface ComponentDefinition {
  id: string;
  canonicalKey: string;
  name: string;
  category: string | null;
  status: string;
  simulationComponentType: string | null;
  simulationReady: boolean;
  runtimeCapabilities: RuntimeCapability[];
  sensorKind: string | null;
  pins: ComponentPin[];
  sources: ComponentSource[];
}

export interface ExternalComponentCandidate {
  provider: string;
  externalId: string;
  name: string;
  category: string | null;
  sourceUrl: string;
  license: string | null;
  pinCount: number;
  // Preview of what SimulationTypeResolver would decide at import time —
  // computed backend-side (Normalizer + resolver), never guessed here.
  simulationTypeCandidate: string | null;
}

export const componentRegistryApi = {
  list: async (): Promise<ComponentDefinition[]> => {
    const response = await api.get<ComponentDefinition[]>('/components');
    return response.data;
  },

  get: async (id: string): Promise<ComponentDefinition> => {
    const response = await api.get<ComponentDefinition>(`/components/${id}`);
    return response.data;
  },

  // provider omitted/empty -> aggregated search across every registered
  // provider (BE ComponentsController.SearchExternal).
  searchExternal: async (query: string, provider?: string): Promise<ExternalComponentCandidate[]> => {
    const response = await api.get<ExternalComponentCandidate[]>('/components/admin/external-components/search', {
      params: { query, ...(provider ? { provider } : {}) },
    });
    return response.data;
  },

  import: async (provider: string, externalId: string): Promise<ComponentDefinition> => {
    const response = await api.post<ComponentDefinition>('/components/admin/import', { provider, externalId });
    return response.data;
  },
};

export type SimulationCapability = 'simulation-ready' | 'not-mapped';

// The ONLY place allowed to turn a ComponentDefinition into a UI capability
// label — reads simulationComponentType/simulationReady exactly as the
// backend decided them, never re-derived from category/name/pin count on
// the frontend (STEP 5's explicit rule — backend is the source of truth for
// capability, not FE inference). License review status is a separate,
// per-source fact (see ComponentSource.licenseStatus) and is rendered
// alongside this, not folded into it.
export function toSimulationCapability(component: ComponentDefinition): SimulationCapability {
  return component.simulationComponentType != null && component.simulationReady
    ? 'simulation-ready'
    : 'not-mapped';
}
