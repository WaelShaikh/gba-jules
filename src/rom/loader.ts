export class GameBoyAdvanceROM {
  buffer: Uint8Array;
  size: number;
  title: string = "UNKNOWN";
  gameCode: string = "xxxx";
  makerCode: string = "xx";
  checksum: number = 0;

  constructor(buffer: Uint8Array) {
    this.buffer = buffer;
    this.size = buffer.length;
    this.parseHeader();
  }

  parseHeader() {
    if (this.size < 0xC0) return;

    // Game Title (12 bytes at offset 0xA0)
    let titleStr = "";
    for (let i = 0; i < 12; i++) {
      const charCode = this.buffer[0xA0 + i];
      if (charCode === 0) break;
      titleStr += String.fromCharCode(charCode);
    }
    this.title = titleStr.trim() || "UNKNOWN";

    // Game Code (4 bytes at offset 0xAC)
    let codeStr = "";
    for (let i = 0; i < 4; i++) {
      codeStr += String.fromCharCode(this.buffer[0xAC + i]);
    }
    this.gameCode = codeStr.trim() || "xxxx";

    // Maker Code (2 bytes at offset 0xB0)
    let makerStr = "";
    for (let i = 0; i < 2; i++) {
      makerStr += String.fromCharCode(this.buffer[0xB0 + i]);
    }
    this.makerCode = makerStr.trim() || "xx";

    // Header Checksum (offset 0xBD)
    this.checksum = this.buffer[0xBD];
  }
}
