const fs = require('fs');
const encrypt = require('node-file-encrypt');
 
let filePath = './input'; // source file path
let outputPath = './encrypted'; 



fs.readdir(filePath, (err, files) => {
  files.forEach(file => {
    var fileNamePath = filePath + '/' +file;
    console.log(`File enrypted at location : ${fileNamePath}`);
    let f = new encrypt.FileEncrypt(fileNamePath,outputPath); // decrypt file
    f.openSourceFile();
    f.encrypt('111111');
  });
});
