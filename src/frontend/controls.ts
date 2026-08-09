import { GameBoyAdvance } from "../core/gba";

export interface GBAKeypad {
  A: boolean;
  B: boolean;
  SELECT: boolean;
  START: boolean;
  RIGHT: boolean;
  LEFT: boolean;
  UP: boolean;
  DOWN: boolean;
  R: boolean;
  L: boolean;
}

export class KeypadController {
  private gba: GameBoyAdvance;
  private keyMap: { [key: string]: keyof GBAKeypad } = {
    "z": "A",
    "x": "B",
    "Enter": "START",
    "Shift": "SELECT",
    "ArrowRight": "RIGHT",
    "ArrowLeft": "LEFT",
    "ArrowUp": "UP",
    "ArrowDown": "DOWN",
    "s": "R",
    "a": "L"
  };

  state: GBAKeypad = {
    A: false,
    B: false,
    SELECT: false,
    START: false,
    RIGHT: false,
    LEFT: false,
    UP: false,
    DOWN: false,
    R: false,
    L: false
  };

  constructor(gba: GameBoyAdvance) {
    this.gba = gba;
    this.setupListeners();
  }

  private setupListeners() {
    window.addEventListener("keydown", (e) => {
      const btn = this.keyMap[e.key];
      if (btn) {
        this.state[btn] = true;
        this.updateIOKeypad();
      }
    });

    window.addEventListener("keyup", (e) => {
      const btn = this.keyMap[e.key];
      if (btn) {
        this.state[btn] = false;
        this.updateIOKeypad();
      }
    });
  }

  private updateIOKeypad() {
    // GBA KEYINPUT register (0x04000130) is active-low (0 when pressed, 1 when idle)
    let regVal = 0x03FF;
    if (this.state.A) regVal &= ~0x0001;
    if (this.state.B) regVal &= ~0x0002;
    if (this.state.SELECT) regVal &= ~0x0004;
    if (this.state.START) regVal &= ~0x0008;
    if (this.state.RIGHT) regVal &= ~0x0010;
    if (this.state.LEFT) regVal &= ~0x0020;
    if (this.state.UP) regVal &= ~0x0040;
    if (this.state.DOWN) regVal &= ~0x0080;
    if (this.state.R) regVal &= ~0x0100;
    if (this.state.L) regVal &= ~0x0200;

    // Write to memory mapped KEYINPUT
    this.gba.mmu.write16(0x04000130, regVal);
  }
}
