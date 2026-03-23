/**
 * Shamir's Secret Sharing (SSS) Implementation over GF(256)
 * Based on the tactical requirement for ZMS Recovery Protocol.
 */
export class ThresholdProvider {
  // GF(256) log and antilog tables for multiplication/division
  private static readonly LOG = new Uint8Array(256);
  private static readonly EXP = new Uint8Array(256);

  static {
    // Initialize GF(256) tables
    let x = 1;
    for (let i = 0; i < 255; i++) {
      this.EXP[i] = x;
      this.LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d; // Primitive polynomial x^8 + x^4 + x^3 + x^2 + 1
    }
  }

  /**
   * Evaluates a polynomial at x using Horner's method.
   */
  private static evaluate(poly: Uint8Array, x: number): number {
    if (x === 0) return poly[0];
    let result = 0;
    for (let i = poly.length - 1; i >= 0; i--) {
      if (result === 0) {
        result = poly[i];
      } else {
        result = this.EXP[(this.LOG[x] + this.LOG[result]) % 255] ^ poly[i];
      }
    }
    return result;
  }

  /**
   * Splits a secret into N shards requiring T threshold.
   */
  static split(secret: string, n: number, t: number): string[] {
    const data = Buffer.from(secret);
    const shards: string[][] = Array.from({ length: n }, () => []);

    for (let b = 0; b < data.length; b++) {
      const poly = new Uint8Array(t);
      poly[0] = data[b];
      for (let i = 1; i < t; i++) {
        poly[i] = Math.floor(Math.random() * 256);
      }

      for (let i = 1; i <= n; i++) {
        shards[i - 1].push(this.evaluate(poly, i).toString(16).padStart(2, '0'));
      }
    }

    return shards.map((s, i) => `zms:v1:${i + 1}:${t}:${s.join("")}`);
  }

  /**
   * Reconstructs secret from shards using Lagrange Interpolation.
   */
  static reconstruct(shards: string[]): string {
    const parsed = shards.map(s => {
      const parts = s.split(":");
      return { x: parseInt(parts[2]), data: parts[4] };
    });

    const secretLen = parsed[0].data.length / 2;
    const result = Buffer.alloc(secretLen);

    for (let b = 0; b < secretLen; b++) {
      let secretByte = 0;
      for (let i = 0; i < parsed.length; i++) {
        let li = 1;
        for (let j = 0; j < parsed.length; j++) {
          if (i === j) continue;
          const num = parsed[j].x;
          const den = parsed[i].x ^ parsed[j].x;
          li = li === 0 ? 0 : this.EXP[(this.LOG[li] + this.LOG[num] - this.LOG[den] + 255) % 255];
        }
        const byte = parseInt(parsed[i].data.substring(b * 2, b * 2 + 2), 16);
        const term = byte === 0 ? 0 : this.EXP[(this.LOG[byte] + this.LOG[li]) % 255];
        secretByte ^= term;
      }
      result[b] = secretByte;
    }

    return result.toString();
  }

  /**
   * Verifies if a set of shards meets the threshold requirement.
   */
  static verifyQuorum(shards: string[]): boolean {
    if (shards.length === 0) return false;
    try {
      const parts = shards[0].split(":");
      const threshold = parseInt(parts[3]);
      return shards.length >= threshold;
    } catch {
      return false;
    }
  }
}
