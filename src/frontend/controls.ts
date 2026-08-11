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
  private gba: any;
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

  constructor(gba: any) {
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
    // Write directly to GBA Keypad handler instance
    const kp = this.gba.keypad;
    if (kp) {
      kp.state = 0x03FF;
      if (this.state.A) kp.state &= ~0x0001;
      if (this.state.B) kp.state &= ~0x0002;
      if (this.state.SELECT) kp.state &= ~0x0004;
      if (this.state.START) kp.state &= ~0x0008;
      if (this.state.RIGHT) kp.state &= ~0x0010;
      if (this.state.LEFT) kp.state &= ~0x0020;
      if (this.state.UP) kp.state &= ~0x0040;
      if (this.state.DOWN) kp.state &= ~0x0080;
      if (this.state.R) kp.state &= ~0x0100;
      if (this.state.L) kp.state &= ~0x0200;
    }
  }
}
