export class RuntimePatcher {
  private mmu: any;

  constructor(mmu: any) {
    this.mmu = mmu;
  }

  write8(address: number, value: number) {
    this.mmu.store8(address, value);
  }

  write16(address: number, value: number) {
    this.mmu.store16(address, value);
  }

  write32(address: number, value: number) {
    this.mmu.store32(address, value);
  }

  writeBytes(address: number, bytes: Uint8Array) {
    for (let i = 0; i < bytes.length; i++) {
      this.mmu.store8(address + i, bytes[i]);
    }
  }
}
