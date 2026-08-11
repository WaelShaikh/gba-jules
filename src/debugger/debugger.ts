export class BreakpointManager {
  private gba: any;
  private breakpoints: Set<number> = new Set();

  constructor(gba: any) {
    this.gba = gba;
  }

  addBreakpoint(address: number) {
    this.breakpoints.add(address);
  }

  removeBreakpoint(address: number) {
    this.breakpoints.delete(address);
  }

  hasBreakpoint(address: number): boolean {
    return this.breakpoints.has(address);
  }

  getBreakpoints(): number[] {
    return Array.from(this.breakpoints);
  }

  checkBreakpoint(pc: number): boolean {
    if (this.breakpoints.has(pc)) {
      this.gba.paused = true;
      return true;
    }
    return false;
  }
}
export class SimpleProfiler {
  private executionCounts: Map<number, number> = new Map();

  recordExecution(pc: number) {
    const current = this.executionCounts.get(pc) || 0;
    this.executionCounts.set(pc, current + 1);
  }

  getHotspotAddresses(limit: number = 10): { address: number; count: number }[] {
    return Array.from(this.executionCounts.entries())
      .map(([address, count]) => ({ address, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  clear() {
    this.executionCounts.clear();
  }
}
