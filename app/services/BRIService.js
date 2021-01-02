const Promise = require('bluebird');
const apps = require('../../config/app-scripts');
const { encrypt }  = require('../../config/crypto');
const puppeteer = require('../../config/puppeteer');
module.exports.generateToken = function(userdata) {
    
    return new Promise((resolve, reject) => {

        console.log("LOG : Genarate token...");
        const hash      = encrypt(userdata);
        const expired   = apps.time(userdata.expired);
        const response  = { 
            status: 'OK', 
            messages: 'Token ini hanya berlaku sampai '+ expired, 
            data: hash 
        };

        return resolve(response);
        
    });
}


module.exports.getMutasi = async function(sendData, userID) {
    
    return new Promise((resolve, reject) => {
        console.log("LOG : Starting app...");
        apps.cacheCheck(sendData).then(async function (result) {
            return resolve(apps.mutasi(sendData,result));
        }).catch(err => {

            if(err.error_code === 101 | err.error_code === 103){
                console.log("LOG : " + err.error_message);
                puppeteer.ibriLogin(sendData, userID).then(async function (result) { 
                    apps.cacheCreate(sendData,result).then(async function(mutasi){
                        // get data from new cache
                        console.log("LOG : return result data to API"); 
                        return resolve(apps.mutasi(sendData,mutasi));
                    }).catch(err => {
                        console.log(err);
                        return reject(err);
                    });
                }).catch(err => {
                    if(err.error_code === 104){
                        console.log("LOG : " + err.error_message);
                    }
                    return reject(err);
                });
            }
            else {
                console.log(err);
                return reject(err);
            }
        });
    });
}
