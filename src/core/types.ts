// Global types definition for window object used by the legacy GBA engine

export interface GBAEngine {
  GameBoyAdvance: any;
  ARMCore: any;
  GameBoyAdvanceMMU: any;
  GameBoyAdvanceVideo: any;
  GameBoyAdvanceAudio: any;
  GameBoyAdvanceKeypad: any;
  GameBoyAdvanceInterruptHandler: any;
  GameBoyAdvanceIO: any;
  GameBoyAdvanceSIO: any;
}

declare global {
  interface Window {
    // Core Engine modules
    GameBoyAdvance: any;
    ARMCore: any;
    GameBoyAdvanceMMU: any;
    GameBoyAdvanceVideo: any;
    GameBoyAdvanceAudio: any;
    GameBoyAdvanceKeypad: any;
    GameBoyAdvanceInterruptHandler: any;
    GameBoyAdvanceIO: any;
    GameBoyAdvanceSIO: any;

    // Helper utilities
    MemoryView: any;
    BIOSView: any;
    BadMemory: any;
    ARMCoreArm: any;
    ARMCoreThumb: any;
    GameBoyAdvanceRenderProxy: any;
    GameBoyAdvanceSoftwareRenderer: any;
    GameBoyAdvanceGPIO: any;
    Serializer: any;
  }
}
