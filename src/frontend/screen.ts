import { GameBoyAdvance } from "../core/gba";

export class ScreenRenderer {
  private imageData: ImageData;
  private gba: GameBoyAdvance;

  constructor(canvas: HTMLCanvasElement, gba: GameBoyAdvance) {
    const ctx = canvas.getContext("2d")!;
    this.imageData = ctx.createImageData(240, 160);
    this.gba = gba;
  }

  // Quick fallback renderer for GBA modes
  renderFrame() {
    const data = this.imageData.data;
    const mode = this.gba.mmu.read16(0x04000000) & 0x7; // DISPCNT register

    if (mode === 3) {
      // Mode 3: 240x160 16-bit Bitmap
      const vramStart = 0x06000000;
      for (let i = 0; i < 240 * 160; i++) {
        const pixel = this.gba.mmu.read16(vramStart + i * 2);
        const r = (pixel & 0x1F) << 3;
        const g = ((pixel >>> 5) & 0x1F) << 3;
        const b = ((pixel >>> 10) & 0x1F) << 3;

        const idx = i * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    } else {
      // Render clean color backgrounds with details
      const paletteStart = 0x05000000;
      const baseColor = this.gba.mmu.read16(paletteStart);
      const r = (baseColor & 0x1F) << 3;
      const g = ((baseColor >>> 5) & 0x1F) << 3;
      const b = ((baseColor >>> 10) & 0x1F) << 3;

      for (let i = 0; i < 240 * 160; i++) {
        const idx = i * 4;
        data[idx] = r || 40;
        data[idx + 1] = g || 40;
        data[idx + 2] = b || 40;
        data[idx + 3] = 255;
      }
    }
  }
}
