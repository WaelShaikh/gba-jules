export class ARMCore {
  // Registers array: r0 to r15
  // r13 is SP, r14 is LR, r15 is PC
  registers: Uint32Array = new Uint32Array(16);

  // CPSR and SPSR register banks
  cpsr: number = 0;
  spsr: number = 0;

  // Banks for different modes
  gprs: Uint32Array = new Uint32Array(16); // General registers
  r8_usr: Uint32Array = new Uint32Array(5);
  r13_usr: Uint32Array = new Uint32Array(2);
  r8_fiq: Uint32Array = new Uint32Array(5);
  r13_fiq: Uint32Array = new Uint32Array(2);
  spsr_fiq: number = 0;
  r13_svc: Uint32Array = new Uint32Array(2);
  spsr_svc: number = 0;
  r13_abt: Uint32Array = new Uint32Array(2);
  spsr_abt: number = 0;
  r13_irq: Uint32Array = new Uint32Array(2);
  spsr_irq: number = 0;
  r13_und: Uint32Array = new Uint32Array(2);
  spsr_und: number = 0;

  // CPU Modes
  MODE_USR = 0x10;
  MODE_FIQ = 0x11;
  MODE_IRQ = 0x12;
  MODE_SVC = 0x13;
  MODE_ABT = 0x17;
  MODE_UND = 0x1b;
  MODE_SYS = 0x1f;

  // Condition Flags
  MASK_N = 0x80000000;
  MASK_Z = 0x40000000;
  MASK_C = 0x20000000;
  MASK_V = 0x10000000;
  MASK_T = 0x00000020;
  MASK_I = 0x00000080;
  MASK_F = 0x00000040;

  // Emulator-specific pipeline
  instructionWidth: number = 4;
  page: any = null;
  pageId: number = 0;
  mmu: any = null;
  irq: any = null;

  // Hook-enabled CPU step wrapper
  onExecuteCallback?: (pc: number) => void;

  constructor() {
    this.resetCPU();
  }

  resetCPU() {
    this.registers.fill(0);
    this.cpsr = this.MODE_SYS;
    this.instructionWidth = 4;
  }

  step() {
    const pc = this.registers[15];
    if (this.onExecuteCallback) {
      this.onExecuteCallback(pc);
    }

    // High Level Emulation and direct instruction fetch
    let instruction: number;
    if (this.cpsr & this.MASK_T) {
      // Thumb mode (16-bit)
      instruction = this.mmu.read16(pc);
      this.registers[15] += 2;
      this.executeThumb();
    } else {
      // ARM mode (32-bit)
      instruction = this.mmu.read32(pc);
      this.registers[15] += 4;
      this.executeARM(instruction);
    }
  }

  // ARM Decoder Core placeholders
  executeARM(instruction: number) {
    // Basic decode of ARM operations. We can stub instructions dynamically for early ROM booting.
    const cond = (instruction >>> 28) & 0xF;
    if (!this.checkCondition(cond)) return;
  }

  executeThumb() {
    // Basic decode of THUMB operations
  }

  checkCondition(cond: number): boolean {
    const n = (this.cpsr & this.MASK_N) ? 1 : 0;
    const z = (this.cpsr & this.MASK_Z) ? 1 : 0;
    const c = (this.cpsr & this.MASK_C) ? 1 : 0;
    const v = (this.cpsr & this.MASK_V) ? 1 : 0;

    switch (cond) {
      case 0: return z === 1; // EQ
      case 1: return z === 0; // NE
      case 2: return c === 1; // CS / HS
      case 3: return c === 0; // CC / LO
      case 4: return n === 1; // MI
      case 5: return n === 0; // PL
      case 6: return v === 1; // VS
      case 7: return v === 0; // VC
      case 8: return c === 1 && z === 0; // HI
      case 9: return c === 0 || z === 1; // LS
      case 10: return n === v; // GE
      case 11: return n !== v; // LT
      case 12: return z === 0 && n === v; // GT
      case 13: return z === 1 || n !== v; // LE
      case 14: return true; // AL (Always)
      default: return true;
    }
  }
}
