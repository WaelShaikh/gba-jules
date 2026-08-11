export class ScreenRenderer {
  private canvas: HTMLCanvasElement;
  private gba: any;

  constructor(canvas: HTMLCanvasElement, gba: any) {
    this.canvas = canvas;
    this.gba = gba;
  }

  renderFrame() {
    // Legacy PPU renders directly to canvas
    // We register the target canvas directly on GBA Core to enable native rasterization
    if (this.gba.targetCanvas !== this.canvas) {
      this.gba.setCanvas(this.canvas);
    }
  }
}
