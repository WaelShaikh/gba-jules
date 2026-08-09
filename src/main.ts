import "./frontend/style.css";
import { GameBoyAdvance } from "./core/gba";
import { HookManager } from "./hooks/hook-manager";
import { RuntimePatcher } from "./hooks/runtime-patcher";
import { BreakpointManager, SimpleProfiler } from "./debugger/debugger";
import { DebuggerUI } from "./frontend/debugger-ui";
import { ScreenRenderer } from "./frontend/screen";
import { KeypadController } from "./frontend/controls";
import { GBA_GAME_PROFILES } from "./rom/profiles";
import { GameBoyAdvanceUtils } from "./core/utils";

document.addEventListener("DOMContentLoaded", () => {
  const gba = new GameBoyAdvance();
  const hooks = new HookManager(gba.cpu, gba.mmu);
  const patcher = new RuntimePatcher(gba.mmu);
  const breakpoints = new BreakpointManager(gba);
  const profiler = new SimpleProfiler();

  const screenCanvas = document.getElementById("screen") as HTMLCanvasElement;
  const screenRenderer = new ScreenRenderer(screenCanvas, gba);
  // Keyboard keypad control configuration
  new KeypadController(gba);

  const debugUI = new DebuggerUI(gba, breakpoints);

  // Stats Counters
  let frameCount = 0;
  let lastStatsTime = performance.now();

  // Wire hooks to updates
  gba.onFrameCallback = () => {
    frameCount++;
    screenRenderer.renderFrame();

    // Trigger frame hooks
    for (const cb of hooks.onFrameHooks) {
      cb();
    }
  };

  // Setup Drag & Drop ROM load
  const dropZoneOverlay = document.getElementById("drop-zone-overlay");
  const romInput = document.getElementById("rom-input") as HTMLInputElement;

  const loadRomFile = async (file: File) => {
    debugUI.log(`Reading ROM: ${file.name}...`);
    const buffer = await file.arrayBuffer();
    gba.loadRom(new Uint8Array(buffer));

    if (gba.rom) {
      debugUI.log(`Successfully Loaded GBA Cartridge!`);
      debugUI.log(`Title: ${gba.rom.title}`);
      debugUI.log(`Game Code: ${gba.rom.gameCode}`);
      debugUI.log(`Maker Code: ${gba.rom.makerCode}`);
      debugUI.log(`Checksum: 0x${gba.rom.checksum.toString(16).toUpperCase()}`);

      // Auto check address profile
      const matchedProfile = GBA_GAME_PROFILES.find(p => gba.rom?.gameCode.includes(p.gameCode));
      if (matchedProfile) {
        debugUI.log(`Recognized cartridge: Match found in address profile databases: "${matchedProfile.name}"!`);
        loadCheatsAndWatches(matchedProfile);
      } else {
        debugUI.log(`Generic Address Maps deployed.`);
      }

      // Hide overlay
      if (dropZoneOverlay) dropZoneOverlay.style.display = "none";

      // Enable control buttons
      document.getElementById("btn-play")?.removeAttribute("disabled");
      document.getElementById("btn-pause")?.removeAttribute("disabled");
      document.getElementById("btn-step")?.removeAttribute("disabled");
      document.getElementById("btn-reset")?.removeAttribute("disabled");

      debugUI.updateCPUStats();
      debugUI.updateDisassemblyView();
      debugUI.updateMemoryView(0x02000000);
    }
  };

  // Wire buttons
  const playBtn = document.getElementById("btn-play");
  const pauseBtn = document.getElementById("btn-pause");
  const stepBtn = document.getElementById("btn-step");
  const resetBtn = document.getElementById("btn-reset");

  let mainLoopId: number | null = null;
  const loop = () => {
    if (!gba.paused) {
      gba.runFrame();

      // Update interactive debuggers periodically
      debugUI.updateCPUStats();
      debugUI.updateDisassemblyView();

      // Check breakpoints
      if (breakpoints.checkBreakpoint(gba.cpu.registers[15])) {
        gba.paused = true;
        debugUI.log(`Hit execution breakpoint at ${GameBoyAdvanceUtils.hex(gba.cpu.registers[15])}`);
      }

      // Calculate FPS
      const now = performance.now();
      if (now - lastStatsTime >= 1000) {
        const fps = (frameCount * 1000) / (now - lastStatsTime);
        const statsEl = document.getElementById("perf-stats");
        if (statsEl) {
          statsEl.innerText = `FPS: ${fps.toFixed(1)} | CPU: ${gba.paused ? 'Idle' : 'Active'}`;
        }
        frameCount = 0;
        lastStatsTime = now;
      }

      mainLoopId = requestAnimationFrame(loop);
    }
  };

  playBtn?.addEventListener("click", () => {
    gba.paused = false;
    debugUI.log("Emulator execution booted / resumed.");
    loop();
  });

  pauseBtn?.addEventListener("click", () => {
    gba.paused = true;
    if (mainLoopId) cancelAnimationFrame(mainLoopId);
    debugUI.log("Emulator paused.");
  });

  stepBtn?.addEventListener("click", () => {
    gba.step();
    // Record profiling statistics
    profiler.recordExecution(gba.cpu.registers[15]);
    debugUI.updateCPUStats();
    debugUI.updateDisassemblyView();
    debugUI.updateMemoryView(gba.cpu.registers[15]);
  });

  resetBtn?.addEventListener("click", () => {
    gba.reset();
    debugUI.log("Emulator state reset.");
    debugUI.updateCPUStats();
    debugUI.updateDisassemblyView();
    debugUI.updateMemoryView(0x02000000);
  });

  // Drag over / leave effects
  dropZoneOverlay?.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZoneOverlay.classList.add("dragover");
  });
  dropZoneOverlay?.addEventListener("dragleave", () => {
    dropZoneOverlay.classList.remove("dragover");
  });
  dropZoneOverlay?.addEventListener("drop", (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];
    if (file) loadRomFile(file);
  });

  // Click file select option
  const dropZone = document.getElementById("drop-zone");
  dropZone?.addEventListener("click", () => {
    romInput.click();
  });
  romInput.addEventListener("change", () => {
    const file = romInput.files?.[0];
    if (file) loadRomFile(file);
  });

  // Pre-loaded cheats and watches support
  const loadCheatsAndWatches = (profile: typeof GBA_GAME_PROFILES[0]) => {
    const modsContainer = document.getElementById("mods-container");
    if (!modsContainer) return;

    let html = `
      <div style="margin-bottom: 15px; color: #aaa;">Registered mod rules for <strong>${profile.name}</strong>:</div>
    `;

    // Cheat hacks list
    profile.cheats.forEach((cheat, index) => {
      html += `
        <div class="mod-card">
          <div class="mod-header">
            <span class="mod-name">${cheat.name}</span>
            <button class="btn btn-primary btn-sm btn-inject-cheat" data-index="${index}">Apply Mod</button>
          </div>
          <p class="mod-desc">Overwrites memory address 0x${cheat.address.toString(16).toUpperCase()}</p>
        </div>
      `;
    });

    // Address live watches list
    profile.watches.forEach((watch, index) => {
      html += `
        <div class="mod-card" style="border-color: #3f51b5;">
          <div class="mod-header">
            <span class="mod-name" style="color: #3f51b5;">Watch: ${watch.name}</span>
            <button class="btn btn-sm btn-add-watch" data-index="${index}">Watch Memory</button>
          </div>
          <p class="mod-desc">Triggers logs on change at 0x${watch.address.toString(16).toUpperCase()}</p>
        </div>
      `;
    });

    // Provide default generic template scripts
    html += `
      <div style="margin-top: 20px; border-top: 1px solid #333; padding-top: 15px;">
        <h4>Custom JS Mod Script Editor</h4>
        <textarea id="custom-mod-code" style="width: 100%; height: 120px; background-color: #111; color: #00ff00; border: 1px solid #444; border-radius: 4px; font-family: monospace; font-size: 0.8rem; padding: 6px;" placeholder="// Write custom javascript mod here...\n// e.g. hooks.onExecute(0x08000000, (ctx) => {\n//   console.log('Execute at Rom Entrypoint!');\n// });"></textarea>
        <button id="btn-run-custom-mod" class="btn btn-primary" style="margin-top: 10px; width: 100%;">Run Mod Script</button>
      </div>
    `;

    modsContainer.innerHTML = html;

    // Hook cheat buttons
    modsContainer.querySelectorAll(".btn-inject-cheat").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index") || "0", 10);
        const cheat = profile.cheats[idx];
        if (cheat.size === 8) patcher.write8(cheat.address, cheat.value);
        if (cheat.size === 16) patcher.write16(cheat.address, cheat.value);
        if (cheat.size === 32) patcher.write32(cheat.address, cheat.value);
        debugUI.log(`[Mod Cheat] Injected value ${cheat.value} to 0x${cheat.address.toString(16).toUpperCase()}`);
      });
    });

    // Hook live watches buttons
    modsContainer.querySelectorAll(".btn-add-watch").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index") || "0", 10);
        const watch = profile.watches[idx];
        hooks.onMemoryWrite(watch.address, (addr, val) => {
          debugUI.log(`[Watch Alert] ${watch.name} changed at ${GameBoyAdvanceUtils.hex(addr)} -> ${val}`);
        });
        debugUI.log(`[Hooks] Registered write watcher on ${watch.name} (0x${watch.address.toString(16).toUpperCase()})`);
      });
    });

    // Custom runner script button
    const btnRunCustomMod = document.getElementById("btn-run-custom-mod");
    btnRunCustomMod?.addEventListener("click", () => {
      const codeTextArea = document.getElementById("custom-mod-code") as HTMLTextAreaElement;
      const code = codeTextArea?.value;
      if (code) {
        try {
          // Expose sandbox globals
          const sandbox = {
            gba,
            hooks,
            patcher,
            console: {
              log: (msg: string) => debugUI.log(`[Mod Script] ${msg}`)
            }
          };
          const fn = new Function("gba", "hooks", "patcher", "console", code);
          fn(sandbox.gba, sandbox.hooks, sandbox.patcher, sandbox.console);
          debugUI.log("[Mod System] Mod initialized and registered successfully!");
        } catch (err: any) {
          debugUI.log(`[Mod Script Error] ${err.message}`);
        }
      }
    });
  };
});
