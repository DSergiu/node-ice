export class IceKey {
  private size: number;
  private rounds: number;
  private keySchedule: number[][];

  private static spBox: number[][];
  private static spBoxInitialised = false;

  private static sMod = [
    [333, 313, 505, 369],
    [379, 375, 319, 391],
    [361, 445, 451, 397],
    [397, 425, 395, 505]];

  private static sXor = [
    [0x83, 0x85, 0x9b, 0xcd],
    [0xcc, 0xa7, 0xad, 0x41],
    [0x4b, 0x2e, 0xd4, 0x33],
    [0xea, 0xcb, 0x2e, 0x04]];

  private static pBox = [
    0x00000001, 0x00000080, 0x00000400, 0x00002000,
    0x00080000, 0x00200000, 0x01000000, 0x40000000,
    0x00000008, 0x00000020, 0x00000100, 0x00004000,
    0x00010000, 0x00800000, 0x04000000, 0x20000000,
    0x00000004, 0x00000010, 0x00000200, 0x00008000,
    0x00020000, 0x00400000, 0x08000000, 0x10000000,
    0x00000002, 0x00000040, 0x00000800, 0x00001000,
    0x00040000, 0x00100000, 0x02000000, 0x80000000];

  private static keyrot = [
    0, 1, 2, 3, 2, 1, 3, 0,
    1, 3, 2, 0, 3, 1, 0, 2];

  // 8-bit Galois Field multiplication of a by b, modulo m.
  // Just like arithmetic multiplication, except that
  // additions and subtractions are replaced by XOR.
  private gf_mult(a: number, b: number, m: number): number {
    let res = 0;

    while (b != 0) {
      if ((b & 1) != 0)
        res ^= a;

      a <<= 1;
      b >>>= 1;

      if (a >= 256)
        a ^= m;
    }

    return (res);
  }

  // 8-bit Galois Field exponentiation.
  // Raise the base to the power of 7, modulo m.
  private gf_exp7(b: number, m: number): number {
    let x: number;

    if (b == 0)
      return (0);

    x = this.gf_mult(b, b, m);
    x = this.gf_mult(b, x, m);
    x = this.gf_mult(x, x, m);
    return (this.gf_mult(b, x, m));
  }

// Carry out the ICE 32-bit permutation.
  private perm32(x: number): number {
    let res = 0;
    let i = 0;

    while (x != 0) {
      if ((x & 1) != 0)
        res |= IceKey.pBox[i];
      i++;
      x >>>= 1;
    }

    return (res);
  }

  // Initialise the substitution/permutation boxes.
  private spBoxInit() {

    IceKey.spBox = [];

    for (let i: number = 0; i < 4; i++) {
      IceKey.spBox[i] = [];
      for (let j: number = 0; j < 1024; j++) {
        IceKey.spBox[i][j] = 0;
      }
    }

    for (let i = 0; i < 1024; i++) {
      let col = (i >>> 1) & 0xff;
      let row = (i & 0x1) | ((i & 0x200) >>> 8);
      let x;

      x = this.gf_exp7(col ^ IceKey.sXor[0][row], IceKey.sMod[0][row]) << 24;
      IceKey.spBox[0][i] = this.perm32(x);

      x = this.gf_exp7(col ^ IceKey.sXor[1][row], IceKey.sMod[1][row]) << 16;
      IceKey.spBox[1][i] = this.perm32(x);

      x = this.gf_exp7(col ^ IceKey.sXor[2][row], IceKey.sMod[2][row]) << 8;
      IceKey.spBox[2][i] = this.perm32(x);

      x = this.gf_exp7(col ^ IceKey.sXor[3][row], IceKey.sMod[3][row]);
      IceKey.spBox[3][i] = this.perm32(x);
    }
  }

  // Create a new ICE key with the specified level.
  constructor(level: number) {
    if (!IceKey.spBoxInitialised) {
      this.spBoxInit();
      IceKey.spBoxInitialised = true;
    }

    if (level < 1) {
      this.size = 1;
      this.rounds = 8;
    } else {
      this.size = level;
      this.rounds = level * 16;
    }

    this.keySchedule = [];
    for (let i: number = 0; i < this.rounds; i++) {
      this.keySchedule[i] = [];
      for (let j: number = 0; j < 3; j++) {
        this.keySchedule[i][j] = 0;
      }
    }
  }

  // Set 8 rounds [n, n+7] of the key schedule of an ICE key.
  private scheduleBuild(kb: number[], n: number, krot_idx: number) {
    let i;

    for (i = 0; i < 8; i++) {
      let j;
      let kr = IceKey.keyrot[krot_idx + i];
      let subkey = this.keySchedule[n + i];

      for (j = 0; j < 3; j++)
        this.keySchedule[n + i][j] = 0;

      for (j = 0; j < 15; j++) {
        let k;
        let curr_sk = j % 3;

        for (k = 0; k < 4; k++) {
          let curr_kb = kb[(kr + k) & 3];
          let bit = curr_kb & 1;

          subkey[curr_sk] = (subkey[curr_sk] << 1) | bit;
          kb[(kr + k) & 3] = (curr_kb >>> 1) | ((bit ^ 1) << 15);
        }
      }
    }
  }


  // Set the key schedule of an ICE key.
  public set(key: number[]) {
    let kb = [];
    for (let i = 0; i < 4; i++) {
      kb[i] = 0;
    }

    if (this.rounds == 8) {
      for (let i = 0; i < 4; i++)
        kb[3 - i] = ((key[i * 2] & 0xff) << 8)
            | (key[i * 2 + 1] & 0xff);

      this.scheduleBuild(kb, 0, 0);
      return;
    }

    for (let i = 0; i < this.size; i++) {
      let j;

      for (j = 0; j < 4; j++)
        kb[3 - j] = ((key[i * 8 + j * 2] & 0xff) << 8)
            | (key[i * 8 + j * 2 + 1] & 0xff);

      this.scheduleBuild(kb, i * 8, 0);
      this.scheduleBuild(kb, this.rounds - 8 - i * 8, 8);
    }
  }

  // Clear the key schedule to prevent memory snooping.
  public clear() {
    let i, j;

    for (i = 0; i < this.rounds; i++)
      for (j = 0; j < 3; j++)
        this.keySchedule[i][j] = 0;
  }

  // The single round ICE f function.
  private roundFunc(p: number, subkey: number[]): number {
    let tl, tr;
    let al, ar;

    tl = ((p >>> 16) & 0x3ff) | (((p >>> 14) | (p << 18)) & 0xffc00);
    tr = (p & 0x3ff) | ((p << 2) & 0xffc00);

    // al = (tr & subkey[2]) | (tl & ~subkey[2]);
    // ar = (tl & subkey[2]) | (tr & ~subkey[2]);
    al = subkey[2] & (tl ^ tr);
    ar = al ^ tr;
    al ^= tl;

    al ^= subkey[0];
    ar ^= subkey[1];

    return (IceKey.spBox[0][al >>> 10] | IceKey.spBox[1][al & 0x3ff]
    | IceKey.spBox[2][ar >>> 10] | IceKey.spBox[3][ar & 0x3ff]);
  }

  // Encrypt a block of 8 bytes of data.
  public encrypt(plaintext: number[], ciphertext: number[]) {
    let i;
    let l = 0, r = 0;

    for (i = 0; i < 4; i++) {
      l |= (plaintext[i] & 0xff) << (24 - i * 8);
      r |= (plaintext[i + 4] & 0xff) << (24 - i * 8);
    }

    for (i = 0; i < this.rounds; i += 2) {
      l ^= this.roundFunc(r, this.keySchedule[i]);
      r ^= this.roundFunc(l, this.keySchedule[i + 1]);
    }

    for (i = 0; i < 4; i++) {
      ciphertext[3 - i] = (Number)(r & 0xff);
      ciphertext[7 - i] = (Number)(l & 0xff);

      r >>>= 8;
      l >>>= 8;
    }
  }

  // Decrypt a block of 8 bytes of data.
  public decrypt(ciphertext: number[], plaintext: number[]) {
    let i;
    let l = 0, r = 0;

    for (i = 0; i < 4; i++) {
      l |= (ciphertext[i] & 0xff) << (24 - i * 8);
      r |= (ciphertext[i + 4] & 0xff) << (24 - i * 8);
    }

    for (i = this.rounds - 1; i > 0; i -= 2) {
      l ^= this.roundFunc(r, this.keySchedule[i]);
      r ^= this.roundFunc(l, this.keySchedule[i - 1]);
    }

    for (i = 0; i < 4; i++) {
      plaintext[3 - i] = (Number)(r & 0xff);
      plaintext[7 - i] = (Number)(l & 0xff);

      r >>>= 8;
      l >>>= 8;
    }
  }

  // Return the key size, in bytes.
  public keySize(): number {
    return (this.size * 8);
  }

  // Return the block size, in bytes.
  public blockSize(): number {
    return (8);
  }
}