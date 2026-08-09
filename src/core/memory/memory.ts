export class GameBoyAdvanceMMU {
  bios: Uint8Array = new Uint8Array(0x4000); // 16KB BIOS
  ewram: Uint8Array = new Uint8Array(0x40000); // 256KB EWRAM
  iwram: Uint8Array = new Uint8Array(0x8000); // 32KB IWRAM
  io: Uint8Array = new Uint8Array(0x400); // I/O registers
  palette: Uint8Array = new Uint8Array(0x400); // 1KB Palette RAM
  vram: Uint8Array = new Uint8Array(0x18000); // 96KB VRAM
  oam: Uint8Array = new Uint8Array(0x400); // 1KB OAM
  rom: Uint8Array = new Uint8Array(0); // Cartridge ROM (Game Pak)
  sram: Uint8Array = new Uint8Array(0x10000); // Save RAM

  // Reference for DMA & Hook events
  onMemoryReadCallback?: (address: number, size: number) => void;
  onMemoryWriteCallback?: (address: number, size: number, val: number) => void;

  loadRom(romData: Uint8Array) {
    this.rom = romData;
  }

  read8(addr: number): number {
    addr = addr >>> 0;
    if (this.onMemoryReadCallback) this.onMemoryReadCallback(addr, 8);

    const region = addr >>> 24;
    const offset = addr & 0xFFFFFF;

    switch (region) {
      case 0x00: return this.bios[offset & 0x3FFF] || 0;
      case 0x02: return this.ewram[offset & 0x3FFFF] || 0;
      case 0x03: return this.iwram[offset & 0x7FFF] || 0;
      case 0x04: return this.io[offset & 0x3FF] || 0;
      case 0x05: return this.palette[offset & 0x3FF] || 0;
      case 0x06: return this.vram[offset & 0x17FFF] || 0;
      case 0x07: return this.oam[offset & 0x3FF] || 0;
      case 0x08:
      case 0x09:
      case 0x0A:
      case 0x0B:
      case 0x0C:
      case 0x0D:
        return this.rom[offset] || 0;
      case 0x0E: return this.sram[offset & 0xFFFF] || 0;
      default: return 0;
    }
  }

  read16(addr: number): number {
    addr = addr >>> 0;
    return this.read8(addr) | (this.read8(addr + 1) << 8);
  }

  read32(addr: number): number {
    addr = addr >>> 0;
    return this.read16(addr) | (this.read16(addr + 2) << 16);
  }

  write8(addr: number, val: number) {
    addr = addr >>> 0;
    val = val & 0xFF;
    if (this.onMemoryWriteCallback) this.onMemoryWriteCallback(addr, 8, val);

    const region = addr >>> 24;
    const offset = addr & 0xFFFFFF;

    switch (region) {
      case 0x02: this.ewram[offset & 0x3FFFF] = val; break;
      case 0x03: this.iwram[offset & 0x7FFF] = val; break;
      case 0x04: this.io[offset & 0x3FF] = val; break;
      case 0x05: this.palette[offset & 0x3FF] = val; break;
      case 0x06: this.vram[offset & 0x17FFF] = val; break;
      case 0x07: this.oam[offset & 0x3FF] = val; break;
      case 0x0E: this.sram[offset & 0xFFFF] = val; break;
    }
  }

  write16(addr: number, val: number) {
    addr = addr >>> 0;
    this.write8(addr, val & 0xFF);
    this.write8(addr + 1, (val >>> 8) & 0xFF);
  }

  write32(addr: number, val: number) {
    addr = addr >>> 0;
    this.write16(addr, val & 0xFFFF);
    this.write16(addr + 2, (val >>> 16) & 0xFFFF);
  }
}
