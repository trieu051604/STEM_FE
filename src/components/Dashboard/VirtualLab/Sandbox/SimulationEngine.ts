import {
  avrInstruction,
  AVRTimer,
  CPU,
  timer0Config,
  timer1Config,
  timer2Config,
  AVRIOPort,
  portBConfig,
  portCConfig,
  portDConfig,
  AVRUSART,
  usart0Config,
} from 'avr8js';

export type PinState = boolean;
export type PinStateListener = (value: PinState) => void;
export type SerialWriteListener = (data: string) => void;

export class SimulationEngine {
  private cpu: CPU | null = null;
  private portB: AVRIOPort | null = null;
  private portC: AVRIOPort | null = null;
  private portD: AVRIOPort | null = null;
  private usart: AVRUSART | null = null;
  private timer0: AVRTimer | null = null;
  private timer1: AVRTimer | null = null;
  private timer2: AVRTimer | null = null;
  
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  
  private pinListeners: Map<number, Set<PinStateListener>> = new Map();
  private serialListeners: Set<SerialWriteListener> = new Set();
  
  private lastPinStates: Map<number, boolean> = new Map();

  constructor() {}

  public loadHex(hexData: string) {
    this.stop();
    
    // Parse Intel HEX (a very simple parser for demo, typically we'd use intel-hex library,
    // but avr8js also provides a way or we can just parse it manually)
    // Actually, let's use a basic parser.
    const program = new Uint16Array(32768);
    let bytesRead = 0;
    
    // Basic intel hex parser
    const lines = hexData.split('\n');
    for (const line of lines) {
      if (line.startsWith(':')) {
        const length = parseInt(line.substring(1, 3), 16);
        const address = parseInt(line.substring(3, 7), 16);
        const type = parseInt(line.substring(7, 9), 16);
        if (type === 0) {
          for (let i = 0; i < length; i += 2) {
            const byte1 = parseInt(line.substring(9 + i * 2, 11 + i * 2), 16);
            const byte2 = parseInt(line.substring(11 + i * 2, 13 + i * 2), 16);
            program[address / 2 + i / 2] = (byte2 << 8) | byte1;
            bytesRead += 2;
          }
        }
      }
    }

    this.cpu = new CPU(program);
    this.timer0 = new AVRTimer(this.cpu, timer0Config);
    this.timer1 = new AVRTimer(this.cpu, timer1Config);
    this.timer2 = new AVRTimer(this.cpu, timer2Config);
    this.portB = new AVRIOPort(this.cpu, portBConfig);
    this.portC = new AVRIOPort(this.cpu, portCConfig);
    this.portD = new AVRIOPort(this.cpu, portDConfig);
    this.usart = new AVRUSART(this.cpu, usart0Config, 16e6);
    
    this.usart.onByteTransmit = (byte: number) => {
      const char = String.fromCharCode(byte);
      this.serialListeners.forEach(listener => listener(char));
    };
    
    // Setup pin change listeners (checking state change)
    this.portB.addListener(() => this.checkPinChanges());
    this.portC.addListener(() => this.checkPinChanges());
    this.portD.addListener(() => this.checkPinChanges());
  }
  
  private getPortAndBit(pin: number): { port: AVRIOPort | null, bit: number } {
    if (pin >= 0 && pin <= 7) return { port: this.portD, bit: pin };
    if (pin >= 8 && pin <= 13) return { port: this.portB, bit: pin - 8 };
    if (pin >= 14 && pin <= 19) return { port: this.portC, bit: pin - 14 }; // A0-A5
    return { port: null, bit: 0 };
  }

  private checkPinChanges() {
    this.pinListeners.forEach((listeners, pin) => {
      const state = this.getPinState(pin);
      if (this.lastPinStates.get(pin) !== state) {
        this.lastPinStates.set(pin, state);
        listeners.forEach(listener => listener(state));
      }
    });
  }

  public getPinState(pin: number): boolean {
    const { port, bit } = this.getPortAndBit(pin);
    if (!port) return false;
    const state = port.pinState(bit);
    return state === 1 || state === 3; // High or InputPullUp
  }
  
  public setPinState(pin: number, value: boolean) {
    const { port, bit } = this.getPortAndBit(pin);
    if (!port) return;
    // Actually, writing to input pin requires modifying the port's PIN register indirectly,
    // or if we use external pullups. For avr8js:
    if (value) {
      port.setPin(bit, true);
    } else {
      port.setPin(bit, false);
    }
  }

  public onPinChange(pin: number, listener: PinStateListener) {
    if (!this.pinListeners.has(pin)) {
      this.pinListeners.set(pin, new Set());
    }
    this.pinListeners.get(pin)!.add(listener);
    
    // Immediate callback with current state
    listener(this.getPinState(pin));
  }
  
  public onSerialWrite(listener: SerialWriteListener) {
    this.serialListeners.add(listener);
  }

  public start() {
    if (!this.cpu || this.isRunning) return;
    this.isRunning = true;
    
    const runLoop = () => {
      if (!this.isRunning || !this.cpu) return;
      
      // Run for some instructions per frame (~500k = ~8ms at 16MHz)
      const cyclesToRun = 500000;
      const startCycles = this.cpu.cycles;
      
      while (this.isRunning && this.cpu.cycles - startCycles < cyclesToRun) {
        avrInstruction(this.cpu);
      }
      
      this.animationFrameId = requestAnimationFrame(runLoop);
    };
    
    runLoop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  public getIsRunning() {
    return this.isRunning;
  }
}
