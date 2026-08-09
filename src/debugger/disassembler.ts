import { GameBoyAdvanceUtils } from "../core/utils";

export class SimpleDisassembler {
  static disassemble(instruction: number, isThumb: boolean): string {
    if (isThumb) {
      return this.disassembleThumb(instruction);
    } else {
      return this.disassembleARM(instruction);
    }
  }

  private static disassembleARM(instruction: number): string {
    const condCode = (instruction >>> 28) & 0xF;
    const opCode = (instruction >>> 21) & 0xF;
    const rn = (instruction >>> 16) & 0xF;
    const rd = (instruction >>> 12) & 0xF;
    const imm = instruction & 0xFFF;

    const condNames = ["EQ", "NE", "CS", "CC", "MI", "PL", "VS", "VC", "HI", "LS", "GE", "LT", "GT", "LE", "AL", "NV"];
    const cond = condNames[condCode] === "AL" ? "" : condNames[condCode];

    // Check Data Processing Instructions
    const dataOps = ["AND", "EOR", "SUB", "RSB", "ADD", "ADC", "SBC", "RSC", "TST", "TEQ", "CMP", "CMN", "ORR", "MOV", "BIC", "MVN"];

    // Check Branch Instruction
    if (((instruction >>> 25) & 0x7) === 0x5) {
      let offset = instruction & 0xFFFFFF;
      if (offset & 0x800000) {
        offset |= 0xFF000000;
      }
      offset = offset << 2;
      const link = (instruction >>> 24) & 1;
      return `${link ? 'BL' : 'B'}${cond} #0x${GameBoyAdvanceUtils.hex(offset, 6)}`;
    }

    // Check Branch and Exchange
    if (((instruction >>> 4) & 0xFFFFFFF) === 0x12FFF1) {
      const rm = instruction & 0xF;
      return `BX${cond} r${rm}`;
    }

    // Default general decoding
    if (opCode < dataOps.length) {
      const op = dataOps[opCode];
      if (op === "MOV" || op === "MVN") {
        return `${op}${cond} r${rd}, #0x${imm.toString(16)}`;
      }
      return `${op}${cond} r${rd}, r${rn}, #0x${imm.toString(16)}`;
    }

    return `ARM (0x${GameBoyAdvanceUtils.hex(instruction, 8)})`;
  }

  private static disassembleThumb(instruction: number): string {
    // Thumb instruction set formats (simplified disassembly)

    // Format 1: Move shifted register
    if ((instruction >>> 13) === 0) {
      const rd = instruction & 0x7;
      const rs = (instruction >>> 3) & 0x7;
      const offset = (instruction >>> 6) & 0x1F;
      const subOps = ["LSL", "LSR", "ASR"];
      const subOp = subOps[(instruction >>> 11) & 0x3] || "MOV";
      return `${subOp} r${rd}, r${rs}, #${offset}`;
    }

    // Format 3: Move/Compare/Add/Subtract Immediate
    if ((instruction >>> 13) === 1) {
      const rd = (instruction >>> 8) & 0x7;
      const val = instruction & 0xFF;
      const subOps = ["MOV", "CMP", "ADD", "SUB"];
      const subOp = subOps[(instruction >>> 11) & 0x3];
      return `${subOp} r${rd}, #${val}`;
    }

    // Format 4: ALU Operations
    if ((instruction >>> 10) === 0x10) {
      const rd = instruction & 0x7;
      const rs = (instruction >>> 3) & 0x7;
      const aluOps = ["AND", "EOR", "LSL", "LSR", "ASR", "ADC", "SBC", "ROR", "TST", "NEG", "CMP", "CMN", "ORR", "MUL", "BIC", "MVN"];
      const aluOp = aluOps[(instruction >>> 6) & 0xF];
      return `${aluOp} r${rd}, r${rs}`;
    }

    // Format 18: Unconditional Branch
    if ((instruction >>> 11) === 0x1C) {
      let offset = instruction & 0x7FF;
      if (offset & 0x400) {
        offset |= 0xF800;
      }
      return `B #0x${offset.toString(16)}`;
    }

    return `THUMB (0x${GameBoyAdvanceUtils.hex(instruction, 4)})`;
  }
}
