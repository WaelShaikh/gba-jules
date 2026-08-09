import { ARMCore } from "./cpu/cpu";
import { GameBoyAdvanceMMU } from "./memory/memory";
import { GameBoyAdvanceROM } from "../rom/loader";

export class GameBoyAdvance {
  cpu: ARMCore;
  mmu: GameBoyAdvanceMMU;
  rom: GameBoyAdvanceROM | null = null;
  paused: boolean = true;
  lastVblank: number = 0;
  seenFrame: boolean = false;

  // High-level emulated callbacks/triggers for hook system
  onFrameCallback?: () => void;

  constructor() {
    this.cpu = new ARMCore();
    this.mmu = new GameBoyAdvanceMMU();

    this.cpu.mmu = this.mmu;
  }

  loadRom(romBuffer: Uint8Array) {
    this.rom = new GameBoyAdvanceROM(romBuffer);
    this.mmu.loadRom(romBuffer);
    this.reset();
  }

  reset() {
    this.cpu.resetCPU();

    // High level emulation (HLE) bios skipping setup
    // Initial standard GBA register values when booting cartridge directly
    this.cpu.registers[0] = 0x08000000; // Entry point reference
    this.cpu.registers[1] = 0x000000EA;
    this.cpu.registers[13] = 0x03007F00; // SP in supervisor mode
    this.cpu.registers[15] = 0x08000000; // Direct boot PC
    this.cpu.cpsr = 0x1F; // System Mode (privileged)

    this.paused = true;
  }

  step() {
    this.cpu.step();
  }

  // A direct, highly-simple frame update cycle for v0.1 GBA
  // Executes cpu instructions until next vertical blank interval is achieved
  runFrame() {
    if (this.paused) return;

    // Standard GBA frame is 280896 cycles. For simplified execution we run 10,000 instructions per frame
    const stepsPerFrame = 10000;
    for (let i = 0; i < stepsPerFrame; i++) {
      this.step();
    }

    if (this.onFrameCallback) {
      this.onFrameCallback();
    }
  }
}
