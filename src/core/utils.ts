export class GameBoyAdvanceUtils {
  static hex(value: number, padding: number = 8): string {
    let s = (value >>> 0).toString(16).toUpperCase();
    while (s.length < padding) {
      s = '0' + s;
    }
    return s;
  }
}
