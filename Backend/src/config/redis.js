const {createClient} = require('redis');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: 'redis-15248.crce263.ap-south-1-1.ec2.cloud.redislabs.com',
        port: 15248
    }
});

module.exports = redisClient;

