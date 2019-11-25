var adminname = $('#adminname').text();
var socket = io.connect('http://localhost:8880');

// 修改密码
$('#editPwdBtn').on('click',function(){
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
        socket.emit('editAdminPwd',{adminname:adminname, oldPwd:oldPwd, newPwd:newPwd});
    }
});

//修改密码失败
socket.on('oldPwdError',function(){
    alert('原密码不正确，无法更新密码');
    $('#oldPwd').html('');
    $('#newPwd').html('');
    $('#reNewPwd').html('');
});

socket.on('editAdminPwdSuccess',function(){
    alert('修改密码成功');
})

//退出（ok）
$('#exitBtn').on('click', function () {
    location.href = 'exit';
});


// 添加管理员（已将该功能移至index.js的/adminAdd
// $('#addAdminBtn').on('click',function(){
//     var adminname = $('#adminname').val();
//     var pwd = $('#pwd').val();
//     var rePwd = $('#rePwd').val();
//     var reg = /^[a-z0-9_-]{6,18}$/;
//     if (!reg.test(pwd)) {
//         alert('请填6-12位写密码！');
//         return false;
//     }
//     if(pwd !== rePwd){
//         alert('密码不一致，请重新输入');
//         $('#pwd').html('');
//         $('#rePwd').html('');
//     }else{
//         $('#addAdmin').modal('hide');
//         socket.emit('addAdmin',{adminname:adminname, password:pwd});
//     }
// });

