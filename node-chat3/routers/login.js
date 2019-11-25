var express = require('express');
var User = require('../models/User');
var Admin = require('../models/Admin');
var crypto = require('crypto');

var router = express.Router();

function cryptPwd(password, salt) {
    // 密码"加盐"
    var saltPassword = password + ':' + salt;
    // 加盐密码的sha256值
    var sha256 = crypto.createHash('sha256');
    var result = sha256.update(saltPassword).digest('hex');
    return result;
}

router.get('/', function (req, res) {
    res.render('login.html');
});

router.post('/signIn', function (req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    var kind = req.body.kind;
    var captcha = req.body.captcha;
    var resData = {};
    if(captcha != req.session.captcha){
        resData.err = '验证码有误，请重新输入';
        res.json(resData);
        return false;
    }else{
        if(kind == 'user'){
        User.findOne({
            username: username
        }).then(function (userInfo) {
            if (!userInfo) {
                resData.success = 0;
                resData.err = "用户名不存在，请注册!";
                res.json(resData);
                return false;
            } else {
                var id = userInfo._id;//ok
                var salt = id.toString().slice(19);
                var saltPassword = cryptPwd(password, salt);

                if(userInfo.password !== saltPassword){
                    resData.success = 0;
                    resData.err = "密码错误!";
                    res.json(resData);
                    return false;
                }
                if(userInfo.state){
                    resData.success = 0;
                    resData.err = "该用户已登录!";
                    res.json(resData);
                    return false;
                }else{
                    User.update({
                        _id: userInfo._id
                    }, {
                        state: true
                    }).then(function () {
                        resData.success = 1;
                        resData.err = "登录成功!";
                        res.cookie("user", userInfo.username, {maxAge: 1000 * 60 * 60});
                        req.session.user = userInfo.username;
                        res.json(resData);
                        next();
                        
                    })
                }
            }
        });
    }else if(kind == 'admin'){
        Admin.findOne({
            adminname: username
        }).then(function (userInfo) {
            if (!userInfo) {
                resData.success = 0;
                resData.err = "该管理员不存在!";
                res.json(resData);
                return false;
            } else {
                if(userInfo.password !== password){
                    resData.success = 0;
                    resData.err = "密码错误!";
                    res.json(resData);
                    return false;
                }
                if(userInfo.state){
                    resData.success = 0;
                    resData.err = "该管理员已登录!";
                    res.json(resData);
                    return false;
                }else{
                    Admin.update({
                        _id: userInfo._id
                    }, {
                        state: true
                    }).then(function () {
                        resData.success = 2;
                        resData.err = "登录成功!";
                        res.cookie("admin", userInfo.adminname,{maxAge: 1000 * 60 * 60});//, {maxAge: 1000 * 60 * 60}
                        req.session.admin = userInfo.adminname;
                        res.json(resData);
                        next();
                    })
                }
            }
        })
    }
    }
    
    
});

module.exports = router;