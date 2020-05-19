/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';
const { Contract } = require('fabric-contract-api');
const shim = require('fabric-shim');
const util = require('util');

class FabCar extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        const patients = [
            {
                fullName: 'Test Name',
                email: 'testemail@email.com',
                gender: 'Male',
                dob: '12/12/1997',
                height: '172cm',
                weight: '70kg',
                auth : {
                    password: 'password'
                },
                conditions: [
                    'Hypertension',
                    'Diabetes'
                ],
                allergies: [
                    'Peanuts',
                    'Penicillin'
                ]
            },
         
        ];

        for (let i = 0; i < patients.length; i++) {
            patients[i].docType = 'patient';
            await ctx.stub.putState(patients[i].email, Buffer.from(JSON.stringify(patients[i])));
            console.info('Added <--> ', patients[i]);
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    async queryAllUsers(ctx) {
        const startKey = 'a';
        const endKey = 'z';
        const allResults = [];
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            delete record.auth;
            allResults.push(record);
        }
        console.info(allResults);
        return JSON.stringify(allResults);
    }

    async queryAccType(ctx,opt) {
        const startKey = 'a';
        const endKey = 'z';
        const allResults = [];
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            delete record.auth;
            if(opt=="doctor")
            {
                if(record.docType=='doctor')
                    allResults.push(record);
            }
            else{
                if(record.docType=='patient')
                    allResults.push(record);
            }
        }
        console.info(allResults);
        return JSON.stringify(allResults);
    }

    async queryUser(ctx, userId) {
        const userAsBytes = await ctx.stub.getState(userId); // get the car from chaincode state
        if (!userAsBytes || userAsBytes.length === 0) {
            throw new Error(`${userId} does not exist`);
        }
        console.log(userAsBytes.toString());
        return userAsBytes.toString();
    }

    async createUser(ctx, userInfo) {
        console.info('============= START : Create User ===========');
        let userInfoObj = JSON.parse(userInfo);
        const user = {
           fullName: userInfoObj.fullName,
           email: userInfoObj.email,
           gender: userInfoObj.gender,
           dob: userInfoObj.dob,
           height: userInfoObj.height,
           weight: userInfoObj.weight,
           auth: {
               password: userInfoObj.auth.password
           }
        };
        
        await ctx.stub.putState(user.email, Buffer.from(JSON.stringify(user)));
        console.info('============= END : Create User ===========');
    }

    async addUserDetails(ctx, userInfo) {
        console.info('============= START : addUserDetails ===========');
        let userInfoObj = JSON.parse(userInfo);
        const userAsBytes = await ctx.stub.getState(userInfoObj.email); // get the car from chaincode state
        if (!userAsBytes || userAsBytes.length === 0) {
            throw new Error(`${userInfoObj.email} does not exist`);
        }
        const user = JSON.parse(userAsBytes.toString());
        if(userInfoObj.userType == 'doctor')
        {
            user.docType = 'doctor';
        }
        else if(userInfoObj.userType == 'patient')
        {
            user.docType = 'patient';
        }

        await ctx.stub.putState(userInfoObj.email, Buffer.from(JSON.stringify(user)));
        console.info('============= END : addUserDetails ===========');
    }


    async addDoctorDetails(ctx, doctorInfo) {
        console.info('============= START : addDoctorDetails ===========');
        let doctorInfoObj = JSON.parse(doctorInfo);
        const doctorAsBytes = await ctx.stub.getState(doctorInfoObj.email); // get the car from chaincode state
        if (!doctorAsBytes || doctorAsBytes.length === 0) {
            throw new Error(`${doctorInfoObj.email} does not exist`);
        }
        const doctor = JSON.parse(doctorAsBytes.toString());
        doctor.gender = doctorInfoObj.gender;
        doctor.dob = doctorInfoObj.dob;
        doctor.qualifications = doctorInfoObj.qualifications;
        doctor.docID = doctorInfoObj.docID;
        

        await ctx.stub.putState(doctorInfoObj.email, Buffer.from(JSON.stringify(doctor)));
        console.info('============= END : addDoctorDetails ===========');
    }

    async addPatientDetails(ctx, patientInfo) {
        console.info('============= START : addPatientDetails ===========');
        let patientInfoObj = JSON.parse(patientInfo);
        const patientAsBytes = await ctx.stub.getState(patientInfoObj.email); // get the car from chaincode state
        if (!patientAsBytes || patientAsBytes.length === 0) {
            throw new Error(`${patientInfoObj.email} does not exist`);
        }
        const patient = JSON.parse(patientAsBytes.toString());
        patient.gender = patientInfoObj.gender;
        patient.dob = patientInfoObj.dob;
        patient.height = patientInfoObj.height;
        patient.weight = patientInfoObj.weight;
        patient.conditions = patientInfoObj.conditions;
        patient.allergies = patientInfoObj.allergies;

        await ctx.stub.putState(patientInfoObj.email, Buffer.from(JSON.stringify(patient)));
        console.info('============= END : addPatientDetails ===========');
    }

    async getAllResults(iterator, isHistory) {
        let allResults = [];
        while (true) {
          let res = await iterator.next();
    
          if (res.value && res.value.value.toString()) {
            let jsonRes = {};
            console.log(res.value.value.toString('utf8'));
    
            if (isHistory && isHistory === true) {
              jsonRes.TxId = res.value.tx_id;
              jsonRes.Timestamp = res.value.timestamp;
              jsonRes.IsDelete = res.value.is_delete.toString();
              try {
                jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
              } catch (err) {
                console.log(err);
                jsonRes.Value = res.value.value.toString('utf8');
              }
            } else {
              jsonRes.Key = res.value.key;
              try {
                jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
              } catch (err) {
                console.log(err);
                jsonRes.Record = res.value.value.toString('utf8');
              }
            }
            allResults.push(jsonRes);
          }
          if (res.done) {
            console.log('end of data');
            await iterator.close();
            console.info(allResults);
            return allResults;
          }
        }
    }

    async getHistoryForMarble(ctx, args) {

        if (args.length < 1) {
          throw new Error('Incorrect number of arguments. Expecting 1')
        }
        let marbleName = args[0];
        console.info('- start getHistoryForMarble: %s\n', marbleName);
    
        let resultsIterator = await ctx.stub.getHistoryForKey(marbleName);
        let results = await this.getAllResults(resultsIterator, true);
    
        return Buffer.from(JSON.stringify(results));
    }




    

}

module.exports = FabCar;
