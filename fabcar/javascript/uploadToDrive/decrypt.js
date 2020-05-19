const fs = require('fs');
const encrypt = require('node-file-encrypt');
 

let encryptPath = './encrypted';
let decryptPath = './decrypted';

fs.readdir(encryptPath, (err, files) => {
  files.forEach(file => {
    var encryptFilePath = encryptPath + '/' +file;
    console.log(`File decrypted at location : ${encryptFilePath}`);
    let f = new encrypt.FileEncrypt(encryptFilePath,decryptPath); // decrypt file
    f.openSourceFile();
    f.decrypt('111111');
  });
});
