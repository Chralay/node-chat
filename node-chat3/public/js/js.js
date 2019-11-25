// document.cookie = 'flag=true';
var username = $('#username').text();
var socket = io.connect('http://localhost:8880');

socket.emit('login', {username: username});
socket.on('loginSuccess', function (data) {
    userUpdate(data);
});

//更新在线人数列表
socket.on('user_list', function (data) {
    userUpdate(data);
});

//有人加入
socket.on('userIn', function (data) {
    var html = '<li class="tip"><div class="text-center">@ ' + data + ' @上线</div></li>';
    $('#MsgList').append(html);
});

//有人退出
socket.on('userOut', function (data) {
    var html = '<li class="tip"><div class="text-center">@ ' + data + ' @离开</div></li>';
    $('#MsgList').append(html);
});

//退出
$('#exitBtn').on('click', function () {
    var username = $('#username').text();
    location.href = 'exit';
});

//发送消息
$('#sendBtn').on('click', function () {
    var msg = $('#msgInput').val();
    if (msg == '') {
        alert('发送内容不能为空！');
        return false;
    }
    var username = $('#username').text();
    var img = $('#userImage').attr('src');
    meSendMsg(msg, 0);
    socket.emit('postNewMsg', {msg: msg, username: username, image: img});
    $('#msgInput').val('');
});

$(document).keydown(function (e) {//这个用来干嘛
    var e = e || window.event;
    if (e.keyCode == 13 && e.ctrlKey) {
        e.preventDefault();
        $('#msgInput').val($('#msgInput').val() + '\n');
    } else if (e.keyCode == 13) {
        e.preventDefault();
        $('#sendBtn').click();
    }
});

//接收消息
socket.on('newMsg', function (data) {
    getMsg(data, 0);
});

//发送照片
$('#addImage').on('click', function (e) {
    var e = e || window.event;
    e.stopPropagation();
    $('#files').trigger('click');//触发id为files的click事件
});

//接收照片
socket.on('newImg', function (data) {
    getMsg(data, 1);
});

//修改信息
$('#editImage').on('click', function (e) {
    var e = e || window.event;
    e.stopPropagation();
    $('#fileImg').trigger('click');
});

$('#editBtn').on('click', function () {
    // alert('click edit');
    var newName = $('#newName').val();
    var newImage = $('#editImage').attr('src');
    $('#userImage').attr('src', newImage);
    $('#username').html(newName);
    $('#changeInfo').modal('hide');
    socket.emit('edit', {newName: newName, newImage: newImage, username: username});
});

// 修改密码
$('#editPwdBtn').on('click',function(){
    // alert('click editPwd');
    var oldPwd = $('#oldPwd').val();
    var newPwd = $('#newPwd').val();
    var reNewPwd = $('#reNewPwd').val();
    var reg = /^[a-z0-9_-]{6,18}$/;
    if (!reg.test(newPwd)) {
        alert('请填6-12位写密码！');
        return false;
    }
    if(newPwd !== reNewPwd){
        alert('新密码不一致，请重新输入');
        $('#newPwd').html('');
        $('#reNewPwd').html('');
    }else{
        $('#changePwd').modal('hide');
        socket.emit('editPwd',{username:username, oldPwd:oldPwd, newPwd:newPwd});
    }
    
});

socket.on('oldPwdError',function(){
    alert('原密码不正确，无法更新密码');
    $('#oldPwd').html('');
    $('#newPwd').html('');
    $('#reNewPwd').html('');
});

socket.on('editPwdSuccess',function(){
    alert('密码修改成功');
});

// 渲染表情
init();
function init() {
	for(var i = 0; i < 141; i++) {
	$('.emoji').append(`<li id = ${i}><img src = "../public/img/emoji/emoji (${i+1}).png"</li>`);
	}
}

// 发送表情显示or不显示 表情选择面板
$('#smileBtn').click(()=>{
	// 如果display的值为block那click之后则为none
    let tmp = $('.selectBox').css('display');
    // alert(tmp);
	if(tmp == 'block'){
		$('.selectBox').css('display','none');
	}else{
		$('.selectBox').css('display','block');
	}
});
    
$('#msgInput').click(()=>{
	$('.selectBox').css('display','none');
});
    
// 用户点击发送表情
$('.emoji li img').click((ev)=>{
	ev = ev||window.event;
    var src = ev.target.src;
	var emoji = src.replace(/\D*/g, '').substr(6,3);/*substr的3值3个数*/
	var old = $('#msgInput').val();
	$('#msgInput').val(old+'[emoji'+emoji+']');
	$('.selectBox').css('display', "none");
});

function editImageFn(e) {
    var e = e || window.event;
    var files = e.target.files || e.dataTransfer.files;
    var fs = new FileReader();
    fs.readAsDataURL(files[0]);
    fs.onload = function () {
        $('#editImage').attr('src', this.result);
    }
}

function changeFiles(e) {
    var e = e || window.event;
    var files = e.target.files || e.dataTransfer.files;
    var len = files.length;
    if (len === 0) return false;
    for (var i = 0; i < len; i++) {
        var fs = new FileReader();
        fs.readAsDataURL(files[i]);
        fs.onload = function () {
            var username = $('#username').text();
            var img = $('#userImage').attr('src');
            socket.emit('postImg', {imgData: this.result, username: username, image: img});
            meSendMsg(this.result, 1);
        }
    }
}

function userUpdate(data) {
    var len = data.length;
    var str = '';
    for (var i = 0; i < len; i++) {
        str += '<li>';
        str += '<img src="' + data[i].image + '" class="userImg">';
        str += '<span>' + data[i].username + '</span>'
    }
    $('#peopleList').html(str);
    $('#list-count span').html(len);
}

//自己发送消息
function meSendMsg(msg, n) {
    var src = $('#userImage').attr('src');
    var name = $('#username').text();
    
    var html = ' <li class="me">';
    html += '<div class="row">';
    html += ' <div class="userInfo col-sm-1 col-md-1 pull-right">';
    html += '<img src="' + src + '" style="width: 100%;margin-bottom: 5px">';
    html += '<p class="text-center">' + name + '</p>';
    html += '</div>';
    html += '<div class="msgInfo pull-right" style="max-width:50%">';//col-sm-5 col-md-5
    if (n == 0) {
        // 将msg进行过滤（即表情转换）
        let content = '';
        while(msg.indexOf('[') > -1) {
            var start = msg.indexOf('[');
            var end = msg.indexOf(']');
            content += `${msg.substr(0, start)}`;
            content += `<img src="../public/img/emoji/emoji%20(${msg.slice(start+6, end)}).png" class="s_emoji">`
            msg = msg.substr(end+1);
        }
        if(msg.length !== 0)content += `${msg.substr(0)}`;
        // alert(content);//用来测试
        html += content;
    } else if (n == 1) {
        html += '<img src="' + msg + '" alt="" style="max-width:100%; ">';
    }

    html += '</div></div></li>';
    $('#MsgList').append(html);
    var Li = $('#MsgList li');
    var len = Li.length;
    var LiH = Li.eq(len - 1).height();
    var h = document.getElementById('MsgList').scrollHeight;
    document.getElementById('MsgList').scrollTop = h + LiH;
}

//接收消息
function getMsg(data, n) {
    var html = ' <li >';
    html += '<div class="row">';
    html += ' <div class="userInfo col-sm-1 col-md-1">';
    html += '<img src="' + data.image + '" style="width: 100%;margin-bottom: 5px">';
    html += '<p class="text-center">' + data.username + '</p>';
    html += '</div>';
    html += '<div class="msgInfo pull-left" style="max-width:50%">';// col-sm-5 col-md-5 
    if (n == 0) {
        let msg = data.msg;
        let content = '';
        while(msg.indexOf('[') > -1) {
            var start = msg.indexOf('[');
            var end = msg.indexOf(']');
            content += `${msg.substr(0, start)}`;
            content += `<img src="../public/img/emoji/emoji%20(${msg.slice(start+6, end)}).png" class="s_emoji">`
            msg = msg.substr(end+1, msg.length);
        }
        if(msg.length !== 0)content += `${msg.substr(0)}`;
        html += content;
    } else if (n == 1) {
        html += '<img src="' + data.imgData + '" alt="" style="max-width:100%; ">';
    }
    html += '</div></div></li>';
    $('#MsgList').append(html);
    var Li = $('#MsgList li');
    var len = Li.length;
    var LiH = Li.eq(len - 1).height();
    var h = document.getElementById('MsgList').scrollHeight;
    document.getElementById('MsgList').scrollTop = h + LiH;
}