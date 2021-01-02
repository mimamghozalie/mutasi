var settings = require('./config/appSettings');
var app = require('./config/server');
var port = process.env.PORT || settings.port;

app.timeout = 30000;
app.listen(port, function(){
	console.log(`Service online => http://localhost:${port}`);
});