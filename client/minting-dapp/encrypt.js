const Cryptr = require('cryptr');
const cryptr = new Cryptr('123456abcdef');

const encryptedString = cryptr.encrypt('Popcorn');
const decryptedString = cryptr.decrypt("4c8ba11387d9a47e1ca54d0533fe587891cd13bea84e0c544393482492521e18a7ac6e22703648da5b880a33c47cdca5fba79fd2111befe55c67a3472a4f41b6540ecb423ca0468b4fb3bff3bbbe254d75dffcef577c655fa53304fdfd04ffd9fbed098204289b");

console.log(decryptedString);