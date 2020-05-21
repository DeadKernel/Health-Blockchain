const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const port = 3000
const HOST = 'localhost'
'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const FabricCAServices = require('fabric-ca-client');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

var fileUpload = require('/home/shatabdi/Health-Blockchain/fabcar/javascript/uploadToDrive/encryptAndUpload.js')
const method = fileUpload.method;

app.post('/api/encryptAndUpload', function(req, res){
    

    async function main() {
        
        const result = await method();
        
    }  
    main();
    
}) 

app.listen(port, () => console.log(`Example app listening on port ${port}!`))