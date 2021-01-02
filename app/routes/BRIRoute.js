var express                 = require('express');
var BRIService              = require('../services/BRIService');
var settings                = require('../../config/appSettings');
const { decrypt }           = require('../../config/crypto');
const requestIp             = require('request-ip');
var router                  = express.Router();

const ip_address = function(req) {
    const clientIp = requestIp.getClientIp(req);
    return clientIp;
};

router.post('/token', (req, res) => {

    if (!req.body.username | !req.body.password) {
        return res.status(400).json({ status: 'ERROR', messages: 'username or password not found!', data: null});
    }

    const now           = new Date();
    const exp_token     = process.env.expired_time_token || settings.expired_time_token;
    const exp           = now.getTime() + exp_token *60000;
    const token = {
        username: req.body.username,
        password: req.body.password,
        expired: exp,
        ip_address: ip_address(req)
    }

    BRIService.generateToken(token).then(function(response){
        return res.status(200).json(response);
    })
});

router.post('/mutasi', async function (req, res, next) {

    if (!req.headers.key) {
        return res.status(400).json({ status: 'ERROR', messages: 'key not found', data: null});
    }

    if (!req.headers.token) {
        return res.status(400).json({ status: 'ERROR', messages: 'token not found', data: null});
    }

    const hash = {
        key: req.headers.key,
        token: req.headers.token
    }

    const userID = decrypt(hash);

    console.log("LOG : Checking your key and token");
    if (userID == null) {
        return res.status(400).json({ status: 'ERROR', messages: 'invalid key and token send!', data: null});
    }

    if(userID.ip_address !== ip_address(req)){
        return res.status(400).json({ status: 'ERROR', messages: 'ip address changed!', data: null});
    }

    const d = new Date();
    const now = d.getTime();
    console.log("LOG : Checking expired credentials");
    if(now > userID.expired){
        return res.status(400).json({ status: 'ERROR', messages: 'expired credentials', data: null});
    }

    const date          = req.body.date.split("/");
    const day           = date[0];
    const month         = date[1];
    const year          = date[2];

    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; 
    var yyyy = today.getFullYear();
    
    if(dd<10) 
    {
        dd ='0' + dd;
    } 
    if(mm<10) 
    {
        mm ='0' + mm;
    } 

    if(year.toString().length < 4){
        return res.status(400).json({ status: 'ERROR', messages: 'year format must 4 digit', data: null}); 
    }

    if(year > yyyy){
        return res.status(400).json({ status: 'ERROR', messages: 'date not valid 1...', data: null});
    }

    if(year === yyyy){
        if(day > dd || month > mm){
            return res.status(400).json({ status: 'ERROR', messages: 'date not valid 2...', data: null});
        }
    }

    if(year == yyyy  || month == mm){
        if(day > dd){
            return res.status(400).json({ status: 'ERROR', messages: 'date not valid 3...', data: null});
        }
    }

    await BRIService.getMutasi(req.body, userID).then(function (result) {
        console.log("LOG : request completed...");
        return res.status(200).json(result);
    }).catch(err => {
        console.log("LOG : request Failed...");
        return res.status(400).json(err);
    });

});

module.exports = router;