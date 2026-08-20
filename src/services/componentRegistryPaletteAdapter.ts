import type { ComponentGlueRegistryEntity } from './dashboardApi';
import type { ComponentDefinition } from './componentRegistryApi';

// B1: Registry -> Palette bridge. Reads only, never writes. The real palette
// contract (verified by reading ComponentPalettePopup.tsx / CircuitBuilderTeacherMode.tsx
// / LabSandboxPage.tsx / VirtualLabPage.tsx) is NOT robotKitComponents.ts —
// it's `ComponentGlueRegistryEntity[]` fetched from the existing BE endpoint
// GET /labs/component-glue-registry. This adapter's only job is to turn
// StemFlow Component Registry entries into MORE of that same shape, then
// merge them in behind whatever the existing endpoint already returned.
// robotKitComponents.ts is untouched and unreferenced here.

// Feature flag — default OFF. Only flip VITE_USE_REGISTRY_COMPONENT_PALETTE=true
// in an isolated/test .env to exercise this; production behavior is
// unaffected until this is deliberately turned on after the vertical slice
// is verified.
export function isRegistryComponentPaletteEnabled(): boolean {
  return import.meta.env.VITE_USE_REGISTRY_COMPONENT_PALETTE === 'true';
}

// Only components the backend has actually mapped to a runnable simulation
// type are eligible — this is the exact same rule as
// componentRegistryApi.toSimulationCapability(). A component with
// simulationComponentType === null (e.g. every RGB LED variant, verified
// live in Checkpoint A) is filtered out here and therefore can never reach
// the palette through this path, by construction — not by a UI-level check
// that could be bypassed or forgotten.
export function toGlueRegistryCandidates(
  components: ComponentDefinition[]
): ComponentGlueRegistryEntity[] {
  return components
    .filter(
      (component): component is ComponentDefinition & { simulationComponentType: string } =>
        component.simulationComponentType != null && component.simulationReady
    )
    .map((component) => ({
      componentType: component.simulationComponentType,
      label: component.name,
      supported: true,
      // The existing BE ComponentGlueRegistry already owns pin-requirement
      // enforcement for this componentType (it's a reused existing
      // simulation type, e.g. "wokwi-led" — never a synthetic new one).
      // Registry doesn't restate it; the existing wiring validation on this
      // componentType already applies unchanged.
      pinRequirements: {},
      updatedAt: component.sources[0]?.importedAt ?? new Date(0).toISOString(),
    }));
}

// Existing-static-priority: a componentType already present in the real
// glue registry response is left exactly as-is (never overwritten,
// never duplicated). Registry-derived entries only fill in componentTypes
// the existing registry doesn't already have. Today every simulation type
// SimulationTypeResolver can produce (wokwi-led/wokwi-pushbutton/
// wokwi-buzzer/wokwi-servo/wokwi-l298n/wokwi-rgb-led) already exists in the
// baseline glue registry, so this is currently a no-op in practice — that's
// the correct, safe behavior, not a bug. It starts adding visible entries
// automatically the moment the backend maps a component to a simulation
// type the static catalog doesn't already cover.
export function mergeWithExistingGlueRegistry(
  existing: ComponentGlueRegistryEntity[],
  fromRegistry: ComponentGlueRegistryEntity[]
): ComponentGlueRegistryEntity[] {
  const existingTypes = new Set(existing.map((entry) => entry.componentType));
  const additions = fromRegistry.filter((entry) => !existingTypes.has(entry.componentType));
  return [...existing, ...additions];
}
