import { SimulationEngine } from '../SimulationEngine';

export const attachLed = (engine: SimulationEngine, ledElement: HTMLElement | null, pin: number) => {
  if (!ledElement) return;
  
  engine.onPinChange(pin, (value) => {
    // wokwi-led element accepts 'value' attribute/property
    ledElement.setAttribute('value', value ? '1' : '0');
  });
};
