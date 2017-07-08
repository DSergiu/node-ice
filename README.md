# node-ice
Information Concealment Engine (ICE) encryption/decryption algorithm in TypeScript.

```ts
import {IceKey} from 'node-ice';

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

```

# Install

```
npm i node-ice -S
```

# Algorithm
More info about the algorithm: http://www.darkside.com.au/ice/

# Docs
An IceKey object is used to encrypt and decrypt 8-byte blocks of data using the ICE encryption algorithm. ICE, an acronym for Information Concealment Engine, is a 64-bit block cipher in the tradition of DES. However, it aims to be faster and significantly more secure than DES.

Unlike DES, ICE has various levels of encryption, where higher levels provide more security, but at the expense of speed. It also makes use of a technique called keyed permutation internally, which gives it increased resistance to differential and linear cryptanalysis.

Once an IceKey object has been created, it will usually have its key set from a password of some sort. The object can then be used to encrypt and decrypt data using that key.

## Constructors

### IceKey
```
public IceKey(int level)
```
* Creates an IceKey object. The level parameter specifies the level of ICE encryption to use, where higher levels require longer keys and are slower, but are more secure.
Level 0 uses the Thin-ICE variant of ICE, which is an 8-round cipher taking an 8-byte key. This is the fastest option, and is generally considered to be at least as secure as DES. For levels n greater than zero, a 16n-round cipher is used, taking 8n-byte keys. Although not as fast as level 0, these are very secure. 

* **Parameters:**
	*   level - the ICE level of encryption
	
## Methods

### set
```
public void set(key: Uint8Array)
```

This method sets the key schedule for the IceKey. This should be called before any encryption or 
decryption is done, or the results will not be secure. The number of key bytes used depends on the 
level of encryption set in the constructor. For levels 0 and 1, 8 bytes are used. 
For levels n > 1, 8n bytes are used.
If the key array is not large enough to contain the required number of bytes, an array bounds error will occur. 

* **Parameters:**
	* key - the key used to encrypt and decrypt data

### encrypt
```
public void encrypt(plaintext: Uint8Array, ciphertext: Uint8Array)
```

This method is called to encrypt 8 bytes of the plaintext with the key specified in the set method. 
The result is stored in the ciphertext array. 

* **Parameters:**
	* plaintext - the data to be encrypted
	* ciphertext - the resulting encrypted data

### decrypt
```
public void decrypt(ciphertext: Uint8Array, plaintext: Uint8Array)
```

This method is called to decrypt 8 bytes of the plaintext with the key specified in the set method. 
The result is stored in the plaintext array. 

* **Parameters:**
	* ciphertext - the data to be decrypted
	* plaintext - the resulting decrypted data


```
public void decryptUint8Array(cipherArray: Uint8Array, plainArray: Uint8Array, 
			      from?: number, to?: number)
```

This method is called to decrypt an entire Uint8Array of the plaintext with the key specified in the set method. 
The result is stored in the plaintext array. 

* **Parameters:**
	* cipherArray - the data array to be decrypted
	* plainArray - the resulting decrypted data array
	* from (optional) - decrypt cipherArray starting with `from` index
	* to (optional) - decrypt cipherArray until `to` index

The decrypted data is always stored in `plainArray` starting with index `0`.

### clear
```
public void clear()
```

This method zeroes out the key schedule, which prevents memory snoopers from finding key information. 
It should only be called when the key is no longer needed for encryption or decryption.

### keySize
```
public int keySize()
```

This method returns the key size, in bytes.

### blockSize
```
public int blockSize()
```

This method returns the block size, in bytes. The value is always 8.