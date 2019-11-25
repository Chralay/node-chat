const mongoose = require('mongoose');
const adminSchema = require('../schemas/admin');
module.exports = mongoose.model('Admin', adminSchema);