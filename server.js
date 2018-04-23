// BASE SETUP
// ======================================

// CALL THE PACKAGES --------------------
var express = require('express'); // call express
var app = require('express')(); // define our app using express
var bodyParser = require('body-parser'); // get body-parser
var morgan = require('morgan'); // used to see requests
var mongoose = require('mongoose');
var config = require('./config');
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var usernames = [];

// APP CONFIGURATION ==================
// ====================================
// use body parser so we can grab information from POST requests
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

// configure our app to handle CORS requests
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
  next();
});

// log all requests to the console
app.use(morgan('dev'));

// connect to our database (hosted on modulus.io)
mongoose.connect(config.database);

// set static files location
// used for requests that our frontend will make
app.use(express.static(__dirname + '/public'));

// ROUTES FOR OUR API =================
// ====================================

// API ROUTES ------------------------
var apiRoutes = require('./app/routes/api')(app, express);
app.use('/api', apiRoutes);

// MAIN CATCHALL ROUTE ---------------
// SEND USERS TO FRONTEND ------------
// has to be registered after API ROUTES
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname + '/public/app/views/index.html'));
});

// CHAT SYSTEM & GAME SYSTEM
// ====================================

// Serve the assets directory
app.use('/public/assets',express.static('assets'))
var players = {}; //Keeps a table of all players, the key is the socket id
var bullet_array = []; // Keeps track of all the bullets to update them on the server


var numUsers = 0;

// Tell Socket.io to start accepting connections
io.sockets.on('connection', function(socket){
    var addedUser = false;

    // Listen for a new player trying to connect
    socket.on('new-player',function(state){
        console.log("New player joined with state:",state);
        players[socket.id] = state;
        // Broadcast a signal to everyone containing the updated players list
        io.emit('update-players',players);
    })

    // Listen for a disconnection and update our player table
    socket.on('disconnect-game',function(state){
        delete players[socket.id];
        io.emit('update-players',players);
    })

    // Listen for move events and tell all other clients that something has moved
    socket.on('move-player',function(position_data){
        if(players[socket.id] == undefined) return; // Happens if the server restarts and a client is still connected
        players[socket.id].sprite = position_data.sprite;
        players[socket.id].x = position_data.x;
        players[socket.id].y = position_data.y;
        players[socket.id].angle = position_data.angle;
        players[socket.id].health = position_data.health;
        io.emit('update-players',players);
    })


    // Listen for shoot-bullet events and add it to our bullet array
    socket.on('shoot-bullet',function(data){
        if(players[socket.id] == undefined) return;
        var new_bullet = data;
        data.owner_id = socket.id; // Attach id of the player to the bullet
        if(Math.abs(data.speed_x) > 20 || Math.abs(data.speed_y) > 20){
            console.log("Player",socket.id,"is cheating!");
        }
        bullet_array.push(new_bullet);
    })

    socket.on('game-over',function () {

    });

    socket.on('new user', function(data, callback){
        if (addedUser) return;
        if (usernames.indexOf(data) != -1){
            callback(false);
        } else {
            callback(true)
            socket.username = data;
            ++numUsers;
            addedUser = true;
            usernames.push(socket.username);
            io.sockets.emit('usernames', usernames);
            socket.emit('login', {
                numUsers: numUsers
            });
            // echo globally (all clients) that a person has connected
            socket.broadcast.emit('user joined', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });

    socket.on('disconnect-chat', function(data){
        if(!socket.username) return;
        if(addedUser){
            --numUsers;
        }
        // echo globally that this client has left
        socket.broadcast.emit('user left', {
            username: socket.username,
            numUsers: numUsers
        });
        usernames.splice(usernames.indexOf(socket.username),1);
        io.sockets.emit('usernames', usernames);
    });

    socket.on('send message', function(data){
        io.sockets.emit('new message', {msg: data, username: socket.username});
    });
});



// Update the bullets 60 times per frame and send updates
function ServerGameLoop(){
    for(var i=0;i<bullet_array.length;i++){
        var bullet = bullet_array[i];
        bullet.x += bullet.speed_x;
        bullet.y += bullet.speed_y;

        // Check if this bullet is close enough to hit any player
        for(var id in players){
            if(bullet.owner_id != id){
                // And your own bullet shouldn't kill you
                var dx = players[id].x - bullet.x;
                var dy = players[id].y - bullet.y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if(dist < 70){
                    io.emit('player-hit',id); // Tell everyone this player got hit
                }
            }
        }

        // Remove if it goes too far off screen
        if(bullet.x < -10 || bullet.x > 1000 || bullet.y < -10 || bullet.y > 1000){
            bullet_array.splice(i,1);
            i--;
        }

    }
    // Tell everyone where all the bullets are by sending the whole array
    io.emit("bullets-update",bullet_array);
}

setInterval(ServerGameLoop, 16);



// START THE SERVER
// ====================================
http.listen(config.port);
console.log('Magic happens on port ' + config.port);




