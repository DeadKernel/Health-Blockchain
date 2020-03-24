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
app.get('/api/getAllPatients', function(req, res){
    var email = req.query.email;
    async function main() {
        try {
            // load the network configuration
            const ccpPath = path.resolve(__dirname, '..', '..', 'first-network', 'connection-org1.json');
            const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    
            // Create a new file system based wallet for managing identities.
            const walletPath = path.join(process.cwd(), 'wallet');
            const wallet = await Wallets.newFileSystemWallet(walletPath);
            console.log(`Wallet path: ${walletPath}`);
    
            // Check to see if we've already enrolled the user.
            const identity = await wallet.get(email);
            if (!identity) {
                console.log('An identity for the user '+email+' does not exist in the wallet');
                console.log('Run the registerUser.js application before retrying');
                return;
            }
    
            // Create a new gateway for connecting to our peer node.
            const gateway = new Gateway();
            await gateway.connect(ccp, { wallet, identity: email, discovery: { enabled: true, asLocalhost: true } });
    
            // Get the network (channel) our contract is deployed to.
            const network = await gateway.getNetwork('mychannel');
    
            // Get the contract from the network.
            const contract = network.getContract('fabcar');
    
            // Evaluate the specified transaction.
            // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
            // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')

            const result = await contract.evaluateTransaction('queryAllPatients');
            console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
            res.status(200).send({response: JSON.parse(`${result}`)})
    
        } catch (error) {
            console.error(`Failed to evaluate transaction: ${error}`);
            res.status(500).json({error: `${error}`})
            process.exit(1);
        }
    }
    
    main();
    
}) 



app.get('/api/getPatient', function(req, res){
    var email = req.query.email;
    async function main() {
        try {
            // load the network configuration
            const ccpPath = path.resolve(__dirname, '..', '..', 'first-network', 'connection-org1.json');
            const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    
            // Create a new file system based wallet for managing identities.
            const walletPath = path.join(process.cwd(), 'wallet');
            const wallet = await Wallets.newFileSystemWallet(walletPath);
            console.log(`Wallet path: ${walletPath}`);
    
            // Check to see if we've already enrolled the user.
            const identity = await wallet.get(email);
            if (!identity) {
                console.log('An identity for the user '+email+' does not exist in the wallet');
                console.log('Run the registerUser.js application before retrying');
                return;
            }
    
            // Create a new gateway for connecting to our peer node.
            const gateway = new Gateway();
            await gateway.connect(ccp, { wallet, identity: email, discovery: { enabled: true, asLocalhost: true } });
    
            // Get the network (channel) our contract is deployed to.
            const network = await gateway.getNetwork('mychannel');
    
            // Get the contract from the network.
            const contract = network.getContract('fabcar');
    
            // Evaluate the specified transaction.
            // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
            // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')

            const result = await contract.evaluateTransaction('queryPatient',email);
            console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
            res.status(200).send({response: JSON.parse(`${result}`)})
    
        } catch (error) {
            console.error(`Failed to evaluate transaction: ${error}`);
            res.status(500).json({error: `${error}`})
            process.exit(1);
        }
    }
    
    main();
    
}) 



app.post('/api/register', function(req,res){
    var email = req.body.email;
    var password = req.body.password;
    var fullName = req.body.fullName;
    var confirmPassword = req.body.confirmPassword;
    var height = req.body.height;
    var weight = req.body.weight;
    var gender = req.body.gender;
    var dob = req.body.dob;
    console.log(password)
    async function main() {
        try {
            // load the network configuration
            const ccpPath = path.resolve(__dirname, '..', '..', 'first-network', 'connection-org1.json');
            const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    
            // Create a new CA client for interacting with the CA.
            const caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;
            const ca = new FabricCAServices(caURL);
    
            // Create a new file system based wallet for managing identities.
            const walletPath = path.join(process.cwd(), 'wallet');
            const wallet = await Wallets.newFileSystemWallet(walletPath);
            console.log(`Wallet path: ${walletPath}`);
    
            // Check to see if we've already enrolled the user.
            const userIdentity = await wallet.get(email);
            if (userIdentity) {
                console.log('An identity for the user '+email+' already exists in the wallet');
                return;
            }
    
            // Check to see if we've already enrolled the admin user.
            const adminIdentity = await wallet.get('admin');
            if (!adminIdentity) {
                console.log('An identity for the admin user "admin" does not exist in the wallet');
                console.log('Run the enrollAdmin.js application before retrying');
                return;
            }
    
            // build a user object for authenticating with the CA
            const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
            const adminUser = await provider.getUserContext(adminIdentity, 'admin');
    
            // Register the user, enroll the user, and import the new identity into the wallet.
            const secret = await ca.register({
                affiliation: 'org1.department1',
                enrollmentID: email,
                role: 'client'
            }, adminUser);
            const enrollment = await ca.enroll({
                enrollmentID: email,
                enrollmentSecret: secret
            });
            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: 'Org1MSP',
                type: 'X.509',
            };
            await wallet.put(email, x509Identity);
            console.log('Successfully registered and enrolled admin user '+email+' and imported it into the wallet');

            // Create a new gateway for connecting to our peer node.
            const gateway = new Gateway();
            await gateway.connect(ccp, { wallet, identity: email, discovery: { enabled: true, asLocalhost: true } });

            // Get the network (channel) our contract is deployed to.
            const network = await gateway.getNetwork('mychannel');

            // Get the contract from the network.
            const contract = network.getContract('fabcar');

            // Submit the specified transaction.
            // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
            // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')
            let patientInfo = {
                fullName: fullName,
                email: email,
                gender: gender,
                dob: dob,
                height: height,
                weight: weight,
                auth: {
                    password: password
                },
                docType: 'patient'
            }
            await contract.submitTransaction('createPatient',JSON.stringify(patientInfo));
            console.log('Transaction has been submitted');

            // Disconnect from the gateway.
            await gateway.disconnect();

            res.status(200).json({token: 'abcdefg'});
            
    
        } catch (error) {
            console.error(`Failed to register user`+email+`: ${error}`);
            res.status(500).json({error: `${error}`})
            process.exit(1);
        }
    }
    
    main();
    
})

app.post('/api/login', function(req,res){
    let email = req.body.email;
    let password = req.body.password;
    async function main() {
        try {
            // load the network configuration
            const ccpPath = path.resolve(__dirname, '..', '..', 'first-network', 'connection-org1.json');
            const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    
            // Create a new file system based wallet for managing identities.
            const walletPath = path.join(process.cwd(), 'wallet');
            const wallet = await Wallets.newFileSystemWallet(walletPath);
            console.log(`Wallet path: ${walletPath}`);
    
            // Check to see if we've already enrolled the user.
            const identity = await wallet.get(email);
            if (!identity) {
                console.log('An identity for the user '+email+' does not exist in the wallet');
                console.log('Run the registerUser.js application before retrying');
                return;
            }
    
            // Create a new gateway for connecting to our peer node.
            const gateway = new Gateway();
            await gateway.connect(ccp, { wallet, identity: email, discovery: { enabled: true, asLocalhost: true } });
    
            // Get the network (channel) our contract is deployed to.
            const network = await gateway.getNetwork('mychannel');
    
            // Get the contract from the network.
            const contract = network.getContract('fabcar');
    
            // Evaluate the specified transaction.
            // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
            // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')

            const result = await contract.evaluateTransaction('queryPatient',email);
            console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
            let parsedResult = JSON.parse(`${result}`);
            if(password == parsedResult.auth.password) {
                console.log('Password verified');
                res.status(200).json({data:{token: parsedResult.email}});
            }
            else {
                console.log('Unable to verify password')
                res.status(500).json({error: 'Unable to verify password'})
            }
    
        } catch (error) {
            console.error(`Failed to evaluate transaction: ${error}`);
            res.status(500).json({error: `${error}`})
            process.exit(1);
        }
    }
    main();

})
app.listen(port, () => console.log(`Example app listening on port ${port}!`))