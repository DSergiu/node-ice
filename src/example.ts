import {IceKey} from './IceKey';

export class example {
  static string2Bin(str) {
    const result = [];
    for (let i = 0; i < str.length; i++) {
      result.push(str.charCodeAt(i));
    }
    return result;
  }

  static bin2String(array) {
    return String.fromCharCode.apply(String, array);
  }


  static main() {
    const iceKey = new IceKey(1);
    const key = example.string2Bin('e8MTuLq3');
    iceKey.set(key);

    const toEncrypt = example.string2Bin('ananas12');
    const encrypted = [];
    const decrypted = [];
    iceKey.encrypt(toEncrypt, encrypted);
    iceKey.decrypt(encrypted, decrypted);

    console.log(example.bin2String(decrypted));
  }
}
