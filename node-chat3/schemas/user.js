const mongose = require('mongoose');

const user = mongose.Schema({
    username: String,
    password: String,
    image: String,
    state: Boolean,
    userDOB: String,
    userHS: String
});

module.exports = user;
