const randomUseragent   = require('random-useragent');
const USER_AGENT        = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36';
const userAgent         = randomUseragent.getRandom();
const UA                = userAgent || USER_AGENT;

module.exports = {
    ProductionMode: true,
    port: 4550,
    encryption_key: 'BHjew65ftvbgKJb32pZxanYjknHKBKHnkjw',
    expired_time_token: 500, // menit
    expired_time_cache: 5, // menit
    user_agent: UA   
}
