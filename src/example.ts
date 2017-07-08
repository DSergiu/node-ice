import {IceKey} from './IceKey';

const iceKey = new IceKey(1);
iceKey.set(new Uint8Array([0x12, 0x23, 0x34, 0x45, 0x56, 0x67, 0x78, 0x89]));

const toEncrypt = new Uint8Array([0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88]);
const encrypted = new Uint8Array(8);
const decrypted = new Uint8Array(8);

iceKey.encrypt(toEncrypt, encrypted);
iceKey.decrypt(encrypted, decrypted);

console.log(`To encrypt: ${toEncrypt}`);
console.log(`Encrypted: ${encrypted}`);
console.log(`Decrypted: ${decrypted}`);
