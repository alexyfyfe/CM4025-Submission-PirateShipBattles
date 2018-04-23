var theGame = function(game){
    spriteNumber = null;
    number = 0;
    workingButtons = true;
    higher = true;
    score = 0;
    WORLD_SIZE = {w:750,h:500};






}



theGame.prototype = {
    create: function(){
        water_tiles = [];
        // Create water tiles
        for(var i=0;i<=WORLD_SIZE.w/64+1;i++){
            for(var j=0;j<=WORLD_SIZE.h/64+1;j++){
                var tile_sprite = game.add.sprite(i * 64, j * 64, 'water');
                tile_sprite.anchor.setTo(0.5,0.5);
                tile_sprite.alpha = 0.5;
                water_tiles.push(tile_sprite);
            }
        }



        game.stage.disableVisibilityChange = true;

        bullet_array = [];


        socket = io(); // This triggers the 'connection' event on the server
        other_players = {};
        player = {
            sprite:null,//Will hold the sprite when it's created
            speed_x:0,// This is the speed it's currently moving at
            speed_y:0,
            speed:0.5, // This is the parameter for how fast it should move
            friction:0.95,
            shot:false,
            hit_counter:0,
            health:1,
            update: function(){

                // Lerp rotation towards mouse
                var dx = (game.input.mousePointer.x + game.camera.x) - this.sprite.x;
                var dy = (game.input.mousePointer.y + game.camera.y) - this.sprite.y;
                var angle = Math.atan2(dy,dx) - Math.PI/2;
                var dir = (angle - this.sprite.rotation) / (Math.PI * 2);
                dir -= Math.round(dir);
                dir = dir * Math.PI * 2;
                this.sprite.rotation += dir * 0.1;

                // Move forward
                if(game.input.keyboard.isDown(Phaser.Keyboard.W) || game.input.keyboard.isDown(Phaser.Keyboard.UP)){
                    this.speed_x += Math.cos(this.sprite.rotation + Math.PI/2) * this.speed;
                    this.speed_y += Math.sin(this.sprite.rotation + Math.PI/2) * this.speed;
                }

                this.sprite.x += this.speed_x;
                this.sprite.y += this.speed_y;

                this.speed_x *= this.friction;
                this.speed_y *= this.friction;

                // Shoot bullet
                if(game.input.activePointer.leftButton.isDown && !this.shot && this.health!==4){
                    var speed_x = Math.cos(this.sprite.rotation + Math.PI/2) * 20;
                    var speed_y = Math.sin(this.sprite.rotation + Math.PI/2) * 20;
                    /* The server is now simulating the bullets, clients are just rendering bullet locations, so no need to do this anymore
                    var bullet = {};
                    bullet.speed_x = speed_x;
                    bullet.speed_y = speed_y;
                    bullet.sprite = game.add.sprite(this.sprite.x + bullet.speed_x,this.sprite.y + bullet.speed_y,'bullet');
                    bullet_array.push(bullet);
                    */
                    this.shot = true;
                    // Tell the server we shot a bullet
                    game.sound.play("explosion");
                    socket.emit('shoot-bullet',{x:this.sprite.x,y:this.sprite.y,angle:this.sprite.rotation,speed_x:speed_x,speed_y:speed_y})
                }
                if(!game.input.activePointer.leftButton.isDown) this.shot = false;

                // To make player flash when they are hit, set player.spite.alpha = 0
                if(this.health<4){
                    if (this.sprite.alpha < 1) {
                        this.sprite.alpha += (1 - this.sprite.alpha) * 0.16;
                    } else {
                        this.sprite.alpha = 1;
                    }
                }


                    // Tell the server we've moved
                    socket.emit('move-player',{x:this.sprite.x,y:this.sprite.y,angle:this.sprite.rotation,health:this.health})

            }


        };



        // Create player
        var player_ship_type = String(1);
        player.sprite = game.add.sprite(Math.random() * WORLD_SIZE.w/2 + WORLD_SIZE.w/2,Math.random() * WORLD_SIZE.h/2 + WORLD_SIZE.h/2,'ship'+player_ship_type+'_1');
        player.sprite.anchor.setTo(0.5,0.5);

        game.world.setBounds(0, 0, WORLD_SIZE.w, WORLD_SIZE.h);

        game.camera.x = player.sprite.x - WINDOW_WIDTH/2;
        game.camera.y = player.sprite.y - WINDOW_HEIGHT/2;

        // function CreateShip(type,health,x,y,angle){
        //     // type is an int that can be between 1 and 6 inclusive
        //     // returns the sprite just created
        //     var sprite = game.add.sprite(x,y,'ship' + String(type) + '_' + String(health));
        //     sprite.rotation = angle;
        //     sprite.anchor.setTo(0.5,0.5);
        //     return sprite;
        // }

        socket.emit('new-player',{x:player.sprite.x,y:player.sprite.y,angle:player.sprite.rotation,type:1,health:1})
        // Listen for other players connecting
        socket.on('update-players',function(players_data){
            var players_found = {};
            // Loop over all the player data received
            for(var id in players_data){
                // If the player hasn't been created yet
                if(other_players[id] == undefined && id != socket.id){ // Make sure you don't create yourself
                    var data = players_data[id];
                    // var p = CreateShip(data.type,data.health,data.x,data.y,data.angle);
                    var p = game.add.sprite(data.x,data.y,'ship' + String(data.type) + '_' + String(data.health));
                    p.rotation = data.angle;
                    p.anchor.setTo(0.5,0.5);
                    other_players[id] = p;
                    console.log("Created new player at (" + data.x + ", " + data.y + ")");
                }
                players_found[id] = true;

                // Update positions of other players
                if(id != socket.id){
                    other_players[id].target_x  = players_data[id].x; // Update target, not actual position, so we can interpolate
                    other_players[id].target_y  = players_data[id].y;
                    other_players[id].target_rotation  = players_data[id].angle;
                    other_players[id].health = players_data[id].health;
                }


            }
            // Check if a player is missing and delete them
            for(var id in other_players){
                if(!players_found[id]){
                    other_players[id].destroy();
                    delete other_players[id];
                }
            }

        })

        // Listen for bullet update events
        socket.on('bullets-update',function(server_bullet_array){
            // If there's not enough bullets on the client, create them
            for(var i=0;i<server_bullet_array.length;i++){
                if(bullet_array[i] == undefined){
                    bullet_array[i] = game.add.sprite(server_bullet_array[i].x,server_bullet_array[i].y,'bullet');
                } else {
                    //Otherwise, just update it!
                    bullet_array[i].x = server_bullet_array[i].x;
                    bullet_array[i].y = server_bullet_array[i].y;
                }
            }
            // Otherwise if there's too many, delete the extra
            for(var i=server_bullet_array.length;i<bullet_array.length;i++){
                bullet_array[i].destroy();
                bullet_array.splice(i,1);
                i--;
            }

        })

        // Listen for any player hit events and make that player flash
        socket.on('player-hit',function(id){
            if(id == socket.id){
                if(player.health!=4){
                    //If this is you
                    player.sprite.alpha = 0;
                    player.hit_counter+=1;
                    if(player.hit_counter>500){
                        player.health=4;
                    }else if(player.hit_counter>400){
                        player.health=3;
                    }else if(player.hit_counter>250){
                        player.health=2;
                    }else{
                        player.health=1;
                    }
                }
                game.sound.play("shiphit");
                player.sprite.loadTexture('ship' + String(1) + '_' + String(player.health));
            } else {
                // Find the right player
                if(other_players[id].health==4){
                    console.log("Dead player hit");
                    game.time.events.add(1000, function() {game.add.tween( other_players[id]).to({alpha: 0}, 1500, Phaser.Easing.Linear.None, true);}, this);
                }else{
                    other_players[id].alpha = 0;
                    other_players[id].hit_counter++;
                    score++;
                    console.log(other_players[id].health);
                }
                game.sound.play("shiphit");
                other_players[id].loadTexture('ship' + String(1) + '_' + String(other_players[id].health));
            }
        })
    },
    update: function(){
        player.update();
        if(player.health==4){
            player.sprite.alpha=1;
            game.time.events.add(1000, function() {game.add.tween(player.sprite).to({alpha: 0}, 1500, Phaser.Easing.Linear.None, true);}, this);
            game.time.events.add(6000, function() { this.game.state.start("GameOver",true,false,score);});

        }
        // Move camera with player
        var camera_x = player.sprite.x - WINDOW_WIDTH/2;
        var camera_y = player.sprite.y - WINDOW_HEIGHT/2;
        game.camera.x += (camera_x - game.camera.x) * 0.08;
        game.camera.y += (camera_y - game.camera.y) * 0.08;

        // Each player is responsible for bringing their alpha back up on their own client
        // Make sure other players flash back to alpha = 1 when they're hit
        for(var id in other_players){
                if(other_players[id].health!=4) {
                    if (other_players[id].alpha < 1) {
                        other_players[id].alpha += (1 - other_players[id].alpha) * 0.16;
                        // console.log("increase alpha");
                    }
                    else {
                        other_players[id].alpha = 1;
                        // console.log("Reset alpha");
                    }
                }
        }

        // Interpolate all players to where they should be
        for(var id in other_players){
            var p = other_players[id];
            if(p.target_x != undefined){
                p.x += (p.target_x - p.x) * 0.16;
                p.y += (p.target_y - p.y) * 0.16;
                // Intepolate angle while avoiding the positive/negative issue
                var angle = p.target_rotation;
                var dir = (angle - p.rotation) / (Math.PI * 2);
                dir -= Math.round(dir);
                dir = dir * Math.PI * 2;
                p.rotation += dir * 0.16;
            }
        }
    }


};

