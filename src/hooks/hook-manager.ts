import { ARMCore } from "../core/cpu/cpu";
import { GameBoyAdvanceMMU } from "../core/memory/memory";

export interface CPUContext {
  registers: Uint32Array;
  pc: number;
  cpsr: number;

  read8(address: number): number;
  read16(address: number): number;
  read32(address: number): number;

  write8(address: number, value: number): void;
  write16(address: number, value: number): void;
  write32(address: number, value: number): void;
}

export type ExecuteCallback = (ctx: CPUContext) => void;
export type MemoryReadCallback = (address: number, size: number) => void;
export type MemoryWriteCallback = (address: number, size: number, value: number) => void;
export type MemoryWriteRangeCallback = (address: number, oldValue: number, newValue: number) => void;

export class HookManager {
  private cpu: ARMCore;
  private mmu: GameBoyAdvanceMMU;

  private executeHooks: Map<number, ExecuteCallback[]> = new Map();
  private memoryReadHooks: Map<number, MemoryReadCallback[]> = new Map();
  private memoryWriteHooks: Map<number, MemoryWriteCallback[]> = new Map();
  private memoryWriteRangeHooks: { start: number; end: number; callback: MemoryWriteRangeCallback }[] = [];

  onFrameHooks: (() => void)[] = [];

  constructor(cpu: ARMCore, mmu: GameBoyAdvanceMMU) {
    this.cpu = cpu;
    this.mmu = mmu;

    // Set up hook callbacks inside CPU and memory
    this.cpu.onExecuteCallback = (pc: number) => this.triggerExecute(pc);
    this.mmu.onMemoryReadCallback = (addr: number, size: number) => this.triggerMemoryRead(addr, size);
    this.mmu.onMemoryWriteCallback = (addr: number, size: number, val: number) => this.triggerMemoryWrite(addr, size, val);
  }

  // Hook Registering APIs
  onExecute(address: number, callback: ExecuteCallback) {
    const list = this.executeHooks.get(address) || [];
    list.push(callback);
    this.executeHooks.set(address, list);
  }

  onMemoryRead(address: number, callback: MemoryReadCallback) {
    const list = this.memoryReadHooks.get(address) || [];
    list.push(callback);
    this.memoryReadHooks.set(address, list);
  }

  onMemoryWrite(address: number, callback: MemoryWriteCallback) {
    const list = this.memoryWriteHooks.get(address) || [];
    list.push(callback);
    this.memoryWriteHooks.set(address, list);
  }

  onMemoryWriteRange(start: number, end: number, callback: MemoryWriteRangeCallback) {
    this.memoryWriteRangeHooks.push({ start, end, callback });
  }

  onFrame(callback: () => void) {
    this.onFrameHooks.push(callback);
  }

  // Trigger Invocation handlers
  private triggerExecute(pc: number) {
    const hooks = this.executeHooks.get(pc);
    if (!hooks || hooks.length === 0) return;

    const context = this.createContext();
    for (const cb of hooks) {
      cb(context);
    }
  }

  private triggerMemoryRead(address: number, size: number) {
    const hooks = this.memoryReadHooks.get(address);
    if (hooks) {
      for (const cb of hooks) {
        cb(address, size);
      }
    }
  }

  private triggerMemoryWrite(address: number, size: number, value: number) {
    // Exact Address watchpoints
    const hooks = this.memoryWriteHooks.get(address);
    if (hooks) {
      for (const cb of hooks) {
        cb(address, size, value);
      }
    }

    // Range-based watchpoints
    for (const rangeHook of this.memoryWriteRangeHooks) {
      if (address >= rangeHook.start && address <= rangeHook.end) {
        // Read old value before compiling state
        const oldValue = 0; // Standardize for simplicity
        rangeHook.callback(address, oldValue, value);
      }
    }
  }

  private createContext(): CPUContext {
    return {
      registers: this.cpu.registers,
      pc: this.cpu.registers[15],
      cpsr: this.cpu.cpsr,
      read8: (addr) => this.mmu.read8(addr),
      read16: (addr) => this.mmu.read16(addr),
      read32: (addr) => this.mmu.read32(addr),
      write8: (addr, val) => this.mmu.write8(addr, val),
      write16: (addr, val) => this.mmu.write16(addr, val),
      write32: (addr, val) => this.mmu.write32(addr, val)
    };
  }
}
