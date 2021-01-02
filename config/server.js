const express             = require('express');
const bodyParser          = require('body-parser');
const expressValidator    = require('express-validator');
const errorhandler        = require('errorhandler');
const settings            = require('./appSettings');
const app                 = express();

app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb', extended: true }));
app.use(expressValidator());


const production = process.env.production || settings.ProductionMode;

if (production == false) {
    app.use(errorhandler());

    app.use(function (err, req, res, next) {
		console.log(err.message);
        res.status(err.status || 500).json({
            'errors': {
                message: err.message,
                error: err
            }
        });
    });    
}
else{

    app.use(express.static('client/build'));
    app.use(function (err, req, res, next) {
        res.status(err.status || 500).json({
            'errors': {
                message: err.message,
                error: {}
            }
        });
    });
}


const BRIRoute = require('../app/routes/BRIRoute');
app.use('/api/bri', BRIRoute);

module.exports = app;