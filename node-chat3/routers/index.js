const express = require('express');
const User = require('../models/User');
const Admin = require('../models/Admin');
const router = express.Router();
var crypto = require('crypto');
const captcha = require('svg-captcha');

function cryptPwd(password, salt) {
    // 密码"加盐"
    var saltPassword = password + ':' + salt;
    // 加盐密码的sha256值
    var sha256 = crypto.createHash('sha256');
    var result = sha256.update(saltPassword).digest('hex');
    return result;
}

router.get('/', function (req, res) {
    res.redirect('/login');
});

router.get('/captcha',(req,res)=>{
    const cap = captcha.create({
        inverse: false,// 翻转颜色
        fontSize: 36,// 字体大小
        noise: 3,// 噪声线条数
        width: 80,// 宽度
        height: 30,// 高度
        size: 4,
        ignoreChars: '0o1ilOIL',
        color: true,
        background: '#cc9966'
    });
    req.session.captcha = cap.text.toLowerCase(); // session存储
    res.type('svg'); // 响应的类型
    res.send(cap.data);
});

router.get('/home', function (req, res) {
    if (!req.cookies.user) {
        res.redirect('/login');
    } else {
        if (req.session.user) {
            User.findOne({
                username: req.session.user
            }).then(function (userInfo) {
                res.render('home', {
                    username: userInfo.username,
                    image: userInfo.image
                });
            });
        } else {
            res.redirect('/exit');
        }

    }
});

router.get('/admin', function (req, res) {
    if (!req.cookies.admin) {
        res.redirect('/login');
    } else {
        if (req.session.admin) {
            Admin.findOne({
                adminname: req.session.admin
            }).then(function (userInfo) {
                res.render('admin', {
                    adminname: userInfo.adminname,
                });
            });
        } else {
            res.redirect('/exit');
        }

    }
});

// 用户自己重置密码
router.post('/resetPwd',function(req, res){
    var username = req.body.username;
    var userDOB = req.body.userDOB;
    var userHS = req.body.userHS;
    var newPwd = req.body.newPwd;
    var resData = {};
    
    User.findOne({
        username:username
    }).then(function(userInfo){
        if(!userInfo){
            resData.success = 0;
            resData.err = "用户名不存在，请注册!";
            res.json(resData);
            return false;
        }
        // 测试代码，保留
        // console.log('userInfo.userDOB:'+userInfo.userDOB+'\n');
        // console.log('req.body.userDOB:'+userDOB);
        if(userInfo.userDOB != userDOB || userInfo.userHS != userHS){
            resData.success = 0;
            resData.err = '生日或高中错误';
            res.json(resData);
            return false;
        }else{
            // 密码加密
            var id = userInfo._id;
            var salt = id.toString().slice(19);
            var saltPassword = cryptPwd(newPwd, salt);

            resData.success = 1;
            res.json(resData);
            return User.update({
                _id: id
            }, {
                password: saltPassword
            })
        }
    })
})

// 增加新管理员
router.post('/adminAdd', function (req, res) {
    var adminname = req.body.adminname;
    var password = req.body.password;
    var resData = {};
    Admin.findOne({
        adminname: adminname
    }).then(function (userInfo) {
        if (userInfo) {
            resData.success = 0;
            resData.message = "该管理员已被注册！";
            res.json(resData);
            return false;
        } else {
            var admin = new Admin({
                adminname: adminname,
                password: password,
                state: false
            });
            return admin.save();
        }
    }).then(function () {
        resData.success = 1;
        resData.message = "已成功添加管理员："+adminname;
        res.json(resData);
    })
});

// 数据库与管理员界面的连接
router.get('/search', function (req, res) {
    var result = {"total":"","rows":[]};
    User.find({},function(err, docs){
        if(!err){
            if(docs !="" && docs != null){
                for(let i = 0; i < docs.length; i++){
                    result.rows.push({user_id:docs[i]._id,username:docs[i].username,password:docs[i].password,state:docs[i].state});
                }
                result.total = result.rows.length;
                res.json(result);
                return;
            }
        }
    })
});

// 删除操作
router.post('/delete', function (req, res) {
    var id = req.body.userId;
    var resData = {};
    User.findOne({
        _id: id
    }).then(function (userInfo) {
        User.remove({_id:id}).then(function(err){
            if(err){
                resData.success = 1;
                resData.username = userInfo.username;
                res.json(resData);
            }
        });
    });
});

// 重置状态
router.post('/editState', function (req, res) {
    var id = req.body.userId;
    var resData = {};
    User.findOne({
        _id:id
    }).then(function(userInfo){
        User.update({
            _id: id
        }, {
            state: 'false'
        }).then(function(){
            resData.success = 1;
            res.json(resData);
        });
    });
});

module.exports = router;