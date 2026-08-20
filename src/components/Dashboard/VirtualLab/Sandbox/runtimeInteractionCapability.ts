// Maps a canonical simulation type (diagram part.type, e.g. "wokwi-pushbutton")
// to the realtime interaction CircuitCanvas already knows how to render —
// button press/release, analog slider, sensor slider. Mirrors the backend's
// RuntimeCapabilityResolver (STEM.Application/UseCases/Components/
// RuntimeCapabilityResolver.cs) one-for-one, so a Registry-imported
// component that maps to an existing type here gets the SAME interaction UI
// a static-catalog component of the same type already has, with zero extra
// wiring. Deliberately NOT derived from category/name/provider — only from
// the canonical type itself, which is exactly what CircuitCanvas already
// reads off `component.type`.
export type InteractionCapability =
  | { kind: 'digital' }
  | { kind: 'analog' }
  | { kind: 'sensor'; sensorKind: string }
  | { kind: 'output' };

const CAPABILITY_BY_TYPE: Record<string, InteractionCapability> = {
  'wokwi-pushbutton': { kind: 'digital' },
  'wokwi-potentiometer': { kind: 'analog' },
  'wokwi-photoresistor-sensor': { kind: 'sensor', sensorKind: 'light' },
  'wokwi-led': { kind: 'output' },
  'wokwi-buzzer': { kind: 'output' },
  'wokwi-servo': { kind: 'output' },
  'wokwi-relay-module': { kind: 'output' },
};

// Takes the RAW diagram type (e.g. "wokwi-pushbutton"), not the normalized
// underscore/hyphen display form other lookups in this folder use — matches
// what component.type actually holds on a LabCircuitComponent.
export function getInteractionCapability(rawComponentType: string): InteractionCapability | null {
  return CAPABILITY_BY_TYPE[rawComponentType] ?? null;
}
