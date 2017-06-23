import {IceKey} from './IceKey';

const iceKey = new IceKey(1);
const key = string2Bin('e8MTuLq3');
iceKey.set(key);

const toEncrypt = string2Bin('ananas12');

const encrypted = [];
iceKey.encrypt(toEncrypt, encrypted);

const decrypted = [];
iceKey.decrypt(encrypted, decrypted);

console.log(bin2String(decrypted));


function string2Bin(str) {
  const result = [];
  for (let i = 0; i < str.length; i++) {
    result.push(str.charCodeAt(i));
  }
  return result;
}

function bin2String(array) {
  return String.fromCharCode.apply(String, array);
}