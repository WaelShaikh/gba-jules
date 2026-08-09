import { GameBoyAdvanceMMU } from "../core/memory/memory";

export class RuntimePatcher {
  private mmu: GameBoyAdvanceMMU;

  constructor(mmu: GameBoyAdvanceMMU) {
    this.mmu = mmu;
  }

  write8(address: number, value: number) {
    this.mmu.write8(address, value);
  }

  write16(address: number, value: number) {
    this.mmu.write16(address, value);
  }

  write32(address: number, value: number) {
    this.mmu.write32(address, value);
  }

  writeBytes(address: number, bytes: Uint8Array) {
    for (let i = 0; i < bytes.length; i++) {
      this.mmu.write8(address + i, bytes[i]);
    }
  }
}
