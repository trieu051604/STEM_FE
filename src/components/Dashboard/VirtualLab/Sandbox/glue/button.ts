import { SimulationEngine } from '../SimulationEngine';

export const attachButton = (engine: SimulationEngine, buttonElement: HTMLElement | null, pin: number) => {
  if (!buttonElement) return;

  // Initially pull-up assumption or driven by AVR
  // The wokwi-pushbutton fires 'button-press' and 'button-release'
  buttonElement.addEventListener('button-press', () => {
    // Usually buttons pull to GND when pressed, so LOW
    engine.setPinState(pin, false);
  });

  buttonElement.addEventListener('button-release', () => {
    // Pull up, so HIGH when released
    engine.setPinState(pin, true);
  });
};
