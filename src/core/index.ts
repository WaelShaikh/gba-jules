// Bootstrap index to import and attach legacy GBA core components to the global namespace

import "./engine/util.js";
import "./engine/savedata.js";
import "./engine/video/proxy.js";
import "./engine/video/software.js";
import "./engine/video.js";
import "./engine/keypad.js";
import "./engine/gpio.js";
import "./engine/sio.js";
import "./engine/audio.js";
import "./engine/io.js";
import "./engine/irq.js";
import "./engine/mmu.js";
import "./engine/arm.js";
import "./engine/thumb.js";
import "./engine/core.js";
import "./engine/gba.js";

export const createEmulator = () => {
  return new window.GameBoyAdvance();
};
