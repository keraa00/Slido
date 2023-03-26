var pg = require('pg');





var config = {
    user: '',
    database: '',
    password: '',
    host: '',
    port: 5432,
    max: 100,
    idleTimeoutMillis: 30000,
};

module.exports = config;