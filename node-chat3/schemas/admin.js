const mongose = require('mongoose');

const admin = mongose.Schema({
    adminname: String,
    password: String,
    state: Boolean
});

module.exports = admin;