var express = require('express');
var User = require('../models/User');
var Admin = require('../models/Admin');

const app = new express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

var router = express.Router();

router.get('/', function (req, res) {
    if(req.cookies.user){
        res.clearCookie('user');
        req.session.destroy();
        res.redirect('/login');
    }else if(req.cookies.admin){
        // console.log('cookies.admin:'+req.cookies.admin);
        Admin.findOne({
            adminname: req.cookies.admin
        }).then(function (userInfo) {
            return Admin.update({
                _id: userInfo._id
            }, {
                state: false
            });
        }).then(function(){
            res.clearCookie('admin');
            req.session.destroy();
            res.redirect('/login');
        }) 
    }else{
        res.redirect('/login');
    }
});

module.exports = router;