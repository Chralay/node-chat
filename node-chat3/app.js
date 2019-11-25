const express = require('express');
const mongoose = require('mongoose');
const swig = require('swig');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
var crypto = require('crypto');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

const app = new express();

const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

const User = require('./models/User');
const Admin = require('./models/Admin');

//静态文件托管
app.use('/public', express.static(__dirname + '/public'));
app.use('/node_modules', express.static(__dirname + '/node_modules'));

//设置模板
app.engine('html', swig.renderFile);
app.set('views', './views');
app.set('view engine', 'html');

swig.setDefaults({
    cache: false
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

/*设置cookie*/
app.use(cookieParser());
app.use(session({
    secret: '12345',
    name: 'session',
    cookie: {maxAge: 3600000 },
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({   //创建新的mongodb数据库
        url: 'mongodb://localhost/chat3'
    })
}));

app.use('/', require('./routers/index'));
app.use('/login', require('./routers/login'));
app.use('/register', require('./routers/register'));
app.use('/exit', require('./routers/exit'));

mongoose.connect('mongodb://localhost:27017/chat3', { useNewUrlParser: true, useUnifiedTopology: true},function (err, data) {
    if (err) {
        console.log('数据库连接失败！');
    } else {
        server.listen(8880, function () {
            console.log('服务器连接成功！');
            console.log('listening on *:8880'); 
        });

    }
});

// 如果管理员的db没有数据，插入一个。
Admin.find().then(function(data){
    if(data.length == 0){
        console.log('目前没有管理员，正在生成一个管理员...');
        var admin = new Admin({
            adminname: 'gly01',
            password: '111111',
            state: false
        });
        admin.save();
        console.log('管理员：'+admin.adminname+' 密码：'+admin.password);
    }else if(data.length > 0){
        Admin.find().then(function (info){
            for(let i = 0; i < info.length; i++){
                if(info[i].state == true){
                    Admin.update({
                        _id: info[i]._id
                    }, {
                        state: false
                    }).exec();
                    // 由于出现的顺序不太一样，所以没用下面三行代码
                    // .then(function(){
                    //     console.log(info[i].adminname+'已重置');
                    // })
                }
            }
            console.log('管理员数据库目前能使用的账号有：');
            for(let i = 0; i < info.length; i++){
                console.log(info[i].adminname+' '+info[i].password);
                
            }
        })
    }
});

io.on('connection', function (socket) {
    function cryptPwd(password, salt) {
        // 密码"加盐"
        var saltPassword = password + ':' + salt;
        // 加盐密码的sha256值
        var sha256 = crypto.createHash('sha256');
        var result = sha256.update(saltPassword).digest('hex');
        return result;
    }

    socket.on('login', function (data) {//登录
        var username = data.username;
        socket.username = username;
        User.find().then(function (data) {
            for (var i = 0; i < data.length; i++) {
                if (!data[i].state) {
                    data.splice(i, 1);
                    i = i-1; 
                }
            }
            socket.emit('loginSuccess', data);
            socket.broadcast.emit('user_list', data);
            socket.broadcast.emit('userIn', username);
            socket.emit('user_list', data);
            socket.emit('userIn', username);
        });

    });
    socket.on('disconnect', function (data) {//退出，socket自带的
        var name = data.username || socket.username;
        User.findOne({
            username: name
        }).then(function (userInfo) {
            if (userInfo) {
                return User.update({
                    _id: userInfo._id
                }, {
                    state: false
                })
            }else{
                console.log('管理员已退出');
                return false;
            }
        }).then(function () {
            return User.find();
        }).then(function (data) {
            for (var i = 0; i < data.length; i++) {
                if (!data[i].state) {
                    data.splice(i, 1);
                    i = i-1;
                }
            }
            socket.broadcast.emit('user_list', data);
            socket.broadcast.emit('userOut', name);
        })
    });
    socket.on('postNewMsg', function (data) {//接收到新消息
        socket.broadcast.emit('newMsg', data);
    });
    socket.on('postImg', function (data) {//接收到图片
        socket.broadcast.emit('newImg', data);
    });

    socket.on('edit', function (data) {
        var username = data.username || socket.username;
        User.findOne({
            username: username
        }).then(function (userInfo) {
            return User.update({
                _id: userInfo._id
            }, {
                username: data.newName,
                image: data.newImage
            })
        }).then(function () {
            socket.username = data.newName;
            return User.find();
        }).then(function (data) {
            for (var i = 0; i < data.length; i++) {
                if (!data[i].state) {
                    data.splice(i, 1);
                    i=i-1;
                }
            }
            socket.emit('user_list', data);
            socket.broadcast.emit('user_list', data);
        });
    });

    socket.on('editPwd',function(data){
        var username = data.username || socket.username;
        var oldPwd = data.oldPwd;
        var newPwd = data.newPwd;

        User.findOne({
            username: username
        }).then(function (userInfo) {
            var id = userInfo._id;//ok
            var salt = id.toString().slice(19);
            var saltOldPwd = cryptPwd(oldPwd, salt);
            
            if(saltOldPwd !== userInfo.password){
                socket.emit('oldPwdError');
                // return false;
            }else{
                var saltNewPwd = cryptPwd(newPwd, salt);
                User.update({//需要回调函数，不然更新失败
                    _id: id
                }, {
                    password:saltNewPwd
                }).then(function(){
                    socket.emit('editPwdSuccess');
                })
                
            }
        })
    });

    //管理员界面
    // 更新本人密码
    socket.on('editAdminPwd',function(data){
        var adminname = data.adminname;
        var oldPwd = data.oldPwd;
        var newPwd = data.newPwd;
        Admin.findOne({
            adminname: adminname
        }).then(function (userInfo) {
            if(oldPwd !== userInfo.password){
                socket.emit('oldPwdError');
                // return false;
            }else{
                Admin.update({
                    _id: userInfo._id
                }, {
                    password:newPwd
                }).then(function(){
                    socket.emit('editAdminPwdSuccess');
                })
            }
        })
    });

    // 添加新的管理员
    // socket.on('addAdmin',function(data){
    //     // {adminname:adminname, password:pwd}
    //     var adminname = data.adminname;
    //     var password = data.password;
    //     Admin.findOne({
    //         adminname: adminname
    //     }).then(function (userInfo) {
    //         if(oldPwd !== userInfo.password){
    //             socket.emit('oldPwdError');

    //         }else{
    //             return Admin.update({
    //                 _id: userInfo._id
    //             }, {
    //                 password:newPwd
    //             })
    //         }
    //     })
    // });
});




