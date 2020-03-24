/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';
const { Contract } = require('fabric-contract-api');

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
                }
            },
         
        ];

        for (let i = 0; i < patients.length; i++) {
            patients[i].docType = 'patient';
            await ctx.stub.putState(patients[i].email, Buffer.from(JSON.stringify(patients[i])));
            console.info('Added <--> ', patients[i]);
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    async queryPatient(ctx, patientId) {
        const patientAsBytes = await ctx.stub.getState(patientId); // get the car from chaincode state
        if (!patientAsBytes || patientAsBytes.length === 0) {
            throw new Error(`${patientId} does not exist`);
        }
        console.log(patientAsBytes.toString());
        return patientAsBytes.toString();
    }

    async createPatient(ctx, patientInfo) {
        console.info('============= START : Create Patient ===========');
        let patientInfoObj = JSON.parse(patientInfo);
        const patient = {
           fullName: patientInfoObj.fullName,
           email: patientInfoObj.email,
           gender: patientInfoObj.gender,
           dob: patientInfoObj.dob,
           height: patientInfoObj.height,
           weight: patientInfoObj.weight,
           auth: {
               password: patientInfoObj.auth.password
           },
           docType: 'patient'
        };

        await ctx.stub.putState(patient.email, Buffer.from(JSON.stringify(patient)));
        console.info('============= END : Create Patient ===========');
    }

    async queryAllPatients(ctx) {
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

    // async changeCarOwner(ctx, patientId, newOwner) {
    //     console.info('============= START : changeCarOwner ===========');

    //     const patientAsBytes = await ctx.stub.getState(patientId); // get the car from chaincode state
    //     if (!patientAsBytes || patientAsBytes.length === 0) {
    //         throw new Error(`${patientId} does not exist`);
    //     }
    //     const car = JSON.parse(patientAsBytes.toString());
    //     car.owner = newOwner;

    //     await ctx.stub.putState(patientId, Buffer.from(JSON.stringify(car)));
    //     console.info('============= END : changeCarOwner ===========');
    // }

}

module.exports = FabCar;
