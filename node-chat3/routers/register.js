const express = require('express');
const User = require('../models/User');
var crypto = require('crypto');

const router = express.Router();

function cryptPwd(password, salt) {
    // 密码"加盐"
    var saltPassword = password + ':' + salt;
    // 加盐密码的sha256值
    var sha256 = crypto.createHash('sha256');
    var result = sha256.update(saltPassword).digest('hex');
    return result;
}

router.get('/', function (req, res) {
    res.render('register.html');
});

router.post('/signUp', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var userDOB = req.body.userDOB;
    var userHS = req.body.userHS;
    var resData = {};

    User.findOne({
        username: username
    }).then(function (err,userInfo) {
        if (userInfo) {
            resData.success = 0;
            resData.err = "该用户名已被注册！";
            res.json(resData);
            return false;
        } else {
            var user = new User({
                username: username,
                password: password,
                image: '../public/img/people.png',
                state: false,
                userDOB: userDOB,
                userHS: userHS
            });
            var id = user._id;
            var salt = id.toString().slice(19);
            var saltPassword = cryptPwd(password, salt);
            user.password = saltPassword;
            user.save();
            resData.success = 1;
            res.json(resData);
        }
    })    
})
  
module.exports = router;