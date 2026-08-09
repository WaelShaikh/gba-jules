import { GameBoyAdvance } from "../core/gba";
import { GameBoyAdvanceUtils } from "../core/utils";
import { BreakpointManager } from "../debugger/debugger";
import { SimpleDisassembler } from "../debugger/disassembler";

export class DebuggerUI {
  private gba: GameBoyAdvance;
  private breakpoints: BreakpointManager;

  constructor(gba: GameBoyAdvance, breakpoints: BreakpointManager) {
    this.gba = gba;
    this.breakpoints = breakpoints;

    this.setupTabListeners();
    this.setupMemoryControls();
  }

  private setupTabListeners() {
    const tabs = document.querySelectorAll(".tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));

        tab.classList.add("active");
        const targetId = tab.getAttribute("data-tab");
        if (targetId) {
          document.getElementById(targetId)?.classList.add("active");
        }
      });
    });
  }

  private setupMemoryControls() {
    const goBtn = document.getElementById("btn-mem-go");
    const addrInput = document.getElementById("mem-addr-input") as HTMLInputElement;

    goBtn?.addEventListener("click", () => {
      const val = parseInt(addrInput.value, 16);
      if (!isNaN(val)) {
        this.updateMemoryView(val);
      }
    });
  }

  updateCPUStats() {
    const container = document.getElementById("regs-container");
    if (!container) return;

    let html = "";
    for (let i = 0; i < 16; i++) {
      let name = `R${i}`;
      if (i === 13) name = "SP (R13)";
      if (i === 14) name = "LR (R14)";
      if (i === 15) name = "PC (R15)";

      html += `
        <div class="reg-item">
          <span class="reg-label">${name}:</span>
          <span class="reg-val">${GameBoyAdvanceUtils.hex(this.gba.cpu.registers[i])}</span>
        </div>
      `;
    }
    container.innerHTML = html;

    const cpsrVal = document.getElementById("cpsr-val");
    if (cpsrVal) {
      cpsrVal.innerText = GameBoyAdvanceUtils.hex(this.gba.cpu.cpsr);
    }
  }

  updateDisassemblyView() {
    const container = document.getElementById("disasm-container");
    if (!container) return;

    const currentPC = this.gba.cpu.registers[15];
    const isThumb = !!(this.gba.cpu.cpsr & this.gba.cpu.MASK_T);
    const instSize = isThumb ? 2 : 4;

    let html = "";
    // Display instructions around the current PC
    const startAddr = currentPC - instSize * 5;
    for (let i = 0; i < 12; i++) {
      const addr = startAddr + i * instSize;
      if (addr < 0x08000000 || addr >= 0x08000000 + this.gba.mmu.rom.length) continue;

      let rawVal = 0;
      if (isThumb) {
        rawVal = this.gba.mmu.read16(addr);
      } else {
        rawVal = this.gba.mmu.read32(addr);
      }

      const disasmText = SimpleDisassembler.disassemble(rawVal, isThumb);
      const isCurrent = addr === currentPC;
      const isBP = this.breakpoints.hasBreakpoint(addr);

      html += `
        <div class="disasm-line ${isCurrent ? 'current' : ''} ${isBP ? 'breakpoint' : ''}" data-addr="${addr}">
          <span style="color: #777;">${GameBoyAdvanceUtils.hex(addr)}:</span>
          <span style="color: #ffb74d;">${GameBoyAdvanceUtils.hex(rawVal, isThumb ? 4 : 8)}</span>
          <span style="color: #fff; margin-left: 10px;">${disasmText}</span>
        </div>
      `;
    }

    container.innerHTML = html;

    // Register toggle click triggers on instructions to add/remove breakpoints
    container.querySelectorAll(".disasm-line").forEach((line) => {
      line.addEventListener("click", () => {
        const addr = parseInt(line.getAttribute("data-addr") || "", 10);
        if (!isNaN(addr)) {
          if (this.breakpoints.hasBreakpoint(addr)) {
            this.breakpoints.removeBreakpoint(addr);
            this.log(`Removed Breakpoint at ${GameBoyAdvanceUtils.hex(addr)}`);
          } else {
            this.breakpoints.addBreakpoint(addr);
            this.log(`Added Breakpoint at ${GameBoyAdvanceUtils.hex(addr)}`);
          }
          this.updateDisassemblyView();
        }
      });
    });
  }

  updateMemoryView(baseAddr: number) {
    const container = document.getElementById("mem-container");
    if (!container) return;

    let html = "";
    for (let row = 0; row < 8; row++) {
      const rowAddr = baseAddr + row * 16;
      let hexVals = [];
      let charVals = "";

      for (let col = 0; col < 16; col++) {
        const val = this.gba.mmu.read8(rowAddr + col);
        hexVals.push(GameBoyAdvanceUtils.hex(val, 2));

        if (val >= 32 && val <= 126) {
          charVals += String.fromCharCode(val);
        } else {
          charVals += ".";
        }
      }

      html += `<span style="color: #4caf50;">${GameBoyAdvanceUtils.hex(rowAddr)}:</span>  ${hexVals.join(" ")}  <span style="color: #888;">${charVals}</span>\n`;
    }

    container.innerHTML = html;
  }

  log(message: string) {
    const consoleContainer = document.getElementById("console-logs");
    if (consoleContainer) {
      const line = document.createElement("div");
      line.innerText = `[${new Date().toLocaleTimeString()}] ${message}`;
      consoleContainer.appendChild(line);
      consoleContainer.scrollTop = consoleContainer.scrollHeight;
    }
  }
}
