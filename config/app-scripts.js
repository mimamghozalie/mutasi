const Promise   = require('bluebird');
const fs        = require('fs');
const settings  = require('./appSettings');


function currency(amount) {
    var amount = parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&.');
    return amount;
}

module.exports.cacheCheck = async function(sendData){
    return new Promise((resolve, reject) => {
        fs.access("./cache/mutasi/mutasi-"+ sendData.account_number +".json", error => {
            if (!error) {
                fs.readFile("./cache/mutasi/mutasi-"+ sendData.account_number +".json" , 'utf8', function (err, data) {
                    console.log("LOG : Checking cache file");
                    // Handle Error
                    if(!err) {
                        const cache = JSON.parse(data)[0]
                        const d = new Date();
                        const now = d.getTime();

                        // jika masa berlaku masih ada
                        if(now < cache.expired){
                            console.log("LOG : using cache file");
                            return resolve(cache.response);
                        }
                        else {
                            return reject({
                                status: "ERROR",
                                error_code: 101,
                                error_message: 'Expired cache file',
                            });
                        }
                    }
                    else {
                        return reject({
                            status: "ERROR",
                            error_code: 102,
                            error_message: err,
                        })
                    }
                });
            } else {
                return reject({
                    status: "ERROR",
                    error_code: 103,
                    error_message: 'Cache file not found',
                });
            }
        });
    });
}

module.exports.cacheCreate = async function(sendData, result){
    return new Promise((resolve, reject) => {

        const mutasi        = result;
        const now           = new Date();
        const cache_time    = process.env.expired_time_cache || settings.expired_time_cache;
        const exp           = now.getTime() + cache_time * 60000;
        // generate cache
        const cacheMutasi = [];
        cacheMutasi.push({
            expired: exp,
            response: mutasi
        });

        console.log("LOG: Create cache file...");
        fs.writeFile("./cache/mutasi/mutasi-"+ sendData.account_number +".json", JSON.stringify(cacheMutasi), function(err) {
            if(err) 
            {
                console.log("LOG : " + err);
                return reject(err);
            }
            else 
            {
                console.log("LOG: Cache  file was saved!");
                return resolve(mutasi);
            }
        });
    });
}

module.exports.mutasi = function(sendData,mutasi){
    const fixResult = [];
    const response = mutasi.response;
    response.forEach(function(data) {

        const DateParts = sendData.date.split("/");
        const year = DateParts[2].substr(-2);
        const date = DateParts[0] + "/" + DateParts[1] + "/" + year;

        if(date !== data.date){
            return;
        }
        
        if(sendData.type){
            if(sendData.type !== data.type){
                return;
            }
        }

        if(sendData.amount){
            const amount = currency(sendData.amount);
            if(amount !== data.jumlah){
                return;
            }
        }

        fixResult.push(data);
    });

    const res = {
        nama_pemilik: mutasi.nama_pemilik,
        account_number: mutasi.account_number,
        mata_uang: mutasi.mata_uang,
        periode: mutasi.periode,
        tanggal_cetak: mutasi.tanggal_mutasi,
        response: fixResult,
    }

    return {
        status: "OK",
        messages: "",
        data:res
    };
}

module.exports.time = function(ms){
    const now = new Date();
    const millisec = ms - now.getTime();
    var seconds = (millisec / 1000).toFixed(0);
    var minutes = (millisec / (1000 * 60)).toFixed(0);
    var hours = (millisec / (1000 * 60 * 60)).toFixed(0);
    var days = (millisec / (1000 * 60 * 60 * 24)).toFixed(0);

    if (seconds < 60) {
        return seconds + " Detik";
    } else if (minutes < 60) {
        return minutes + " Menit";
    } else if (hours < 24) {
        return hours + " Jam";
    } else {
        return days + " Hari"
    }
}