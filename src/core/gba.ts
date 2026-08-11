import { GameBoyAdvanceROM } from "./utils";

export interface GBAEngine {
  cpu: any;
  mmu: any;
  paused: boolean;
  rom: GameBoyAdvanceROM | null;
  loadRom(romBuffer: ArrayBuffer, callback?: () => void): void;
  reset(): void;
  step(): void;
}
