$(function () {
    var socket = io();
    var $messageForm =$('#send-message');
    var $messageBox =$('#btn-input');
    var $chat =$('#chat');
    var $loginForm = $('#loginForm');
    var $usernameError = $('#usernameError');
    var $usernameBox = $('#username');
    var $users = $('#users');

    $loginForm.submit(function(e){
        console.log("Form Submitted")
        e.preventDefault();
        socket.emit('new user', $usernameBox.val(), function(data){
            if(data){
                // $('#usernameWrap').hide();
                // $('#contentWrap').show();
                socket.emit('add user', $usernameBox.val());
            } else {
                $usernameError.html('This user is already logged in!');
            }
        });
        $usernameBox.val('');
    });

    $messageForm.submit(function(e){
        e.preventDefault();
        socket.emit('send message', $messageBox.val());
        $messageBox.val('');
    });

    function addParticipantsMessage (data) {
        var message = '';
        if (data.numUsers === 1) {
            message += "there's 1 participant";
        } else {
            message += "there are " + data.numUsers + " participants";
        }
        console.log(message);
        $chat.append(message + "<br/>");
    }

    socket.on('usernames', function (data) {
        var html = '';
        for (i = 0; i < data.length; i++) {
            html += data[i] + '<br/>';
            $users.html(html);
        }
    });

    // Whenever the server emits 'login', log the login message
    socket.on('login', function (data) {
        connected = true;
        // Display the welcome message
        // var message = "Welcome to Chat ";
        addParticipantsMessage(data);
    });

    // Whenever the server emits 'user joined', log it in the chat body
    socket.on('user joined', function (data) {
        console.log(data.username + ' joined');
        $chat.append(data.username + ' joined' + "<br/>");
        addParticipantsMessage(data);
    });

    // Whenever the server emits 'user left', log it in the chat body
    socket.on('user left', function (data) {
        console.log(data.username + ' left');
        $chat.append(data.username + ' left' + "<br/>");
        addParticipantsMessage(data);
    });


    socket.on('new message', function (data) {
        console.log(data.msg);
        $chat.append('<strong>' + data.username + '</strong>: ' + data.msg + "<br/>");
        // $panelbody.scrollTop($panelbody.get(0).scrollHeight);
    });
});