export interface CPUContext {
  registers: Int32Array;
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
export type MemoryWriteCallback = (address: number, val: number) => void;
export type MemoryWriteRangeCallback = (address: number, oldValue: number, newValue: number) => void;

export class HookManager {
  private cpu: any;
  private mmu: any;

  private executeHooks: Map<number, ExecuteCallback[]> = new Map();
  private memoryReadHooks: Map<number, MemoryReadCallback[]> = new Map();
  private memoryWriteHooks: Map<number, MemoryWriteCallback[]> = new Map();
  private memoryWriteRangeHooks: { start: number; end: number; callback: MemoryWriteRangeCallback }[] = [];

  onFrameHooks: (() => void)[] = [];

  constructor(cpu: any, mmu: any) {
    this.cpu = cpu;
    this.mmu = mmu;

    // Hook internal core PC updates
    const self = this;
    const originalStep = this.cpu.step;
    this.cpu.step = function() {
      const pc = self.cpu.gprs[self.cpu.PC];
      self.triggerExecute(pc);
      originalStep.apply(self.cpu, arguments);
    };

    // Hook core memory reads/writes
    const originalLoadU8 = this.mmu.loadU8;
    this.mmu.loadU8 = function(addr: number) {
      self.triggerMemoryRead(addr, 8);
      return originalLoadU8.apply(self.mmu, arguments);
    };

    const originalStore8 = this.mmu.store8;
    this.mmu.store8 = function(addr: number, val: number) {
      self.triggerMemoryWrite(addr, val);
      originalStore8.apply(self.mmu, arguments);
    };
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

  private triggerMemoryWrite(address: number, value: number) {
    // Exact Address watchpoints
    const hooks = this.memoryWriteHooks.get(address);
    if (hooks) {
      for (const cb of hooks) {
        cb(address, value);
      }
    }

    // Range-based watchpoints
    for (const rangeHook of this.memoryWriteRangeHooks) {
      if (address >= rangeHook.start && address <= rangeHook.end) {
        const oldValue = 0; // Standardize for simplicity
        rangeHook.callback(address, oldValue, value);
      }
    }
  }

  private createContext(): CPUContext {
    return {
      registers: this.cpu.gprs,
      pc: this.cpu.gprs[this.cpu.PC],
      cpsr: this.cpu.cpsr,
      read8: (addr) => this.mmu.load8(addr),
      read16: (addr) => this.mmu.load16(addr),
      read32: (addr) => this.mmu.load32(addr),
      write8: (addr, val) => this.mmu.store8(addr, val),
      write16: (addr, val) => this.mmu.store16(addr, val),
      write32: (addr, val) => this.mmu.store32(addr, val)
    };
  }
}
