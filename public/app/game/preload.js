var preload = function(game){}

preload.prototype = {
    preload: function(){
        var ASSET_URL = "assets/"
        var loadingBar = this.add.sprite(375,240,"loading");
        loadingBar.anchor.setTo(0.5,0.5);
        this.load.setPreloadSprite(loadingBar);
        this.game.load.image("gametitle","assets/gametitle.png");
        this.game.load.image("play","assets/play.png");
        this.game.load.image("gameover","assets/gameover.png");
            game.load.crossOrigin = "Anonymous";
            game.stage.backgroundColor = "#3399DA";

            //Adding Audio
            //Theme song - https://freesound.org/people/rhavinga/sounds/107821/
            game.load.audio("theme","assets/theme.mp3");
            //Explosion sound - https://phaser.io/examples/v2/audio/sound-complete
            game.load.audio("explosion","assets/explosion.mp3");
            //Ship sound - https://freesound.org/people/FunWithSound/sounds/390723/
            game.load.audio("shiphit","assets/shiphit.mp3");

            // Load all the ships
            for(var i=1;i<=6;i++){
                game.load.image('ship'+String(i) +'_1', ASSET_URL + 'ship'+String(i)+'_1.png');
                game.load.image('ship'+String(i) +'_2', ASSET_URL + 'ship'+String(i)+'_2.png');
                game.load.image('ship'+String(i) +'_3', ASSET_URL + 'ship'+String(i)+'_3.png');
                game.load.image('ship'+String(i) +'_4', ASSET_URL + 'ship'+String(i)+'_4.png');
            }

            game.load.image('bullet', ASSET_URL + 'cannon_ball.png');
            game.load.image('water', ASSET_URL + 'water_tile.png');
        for(var i=1;i<=9;i++){
            game.load.image('tile_0'+String(i), ASSET_URL + 'tiles/tile_0'+String(i)+'.png');
        }
        for(var i=10;i<=88;i++){
            game.load.image('tile_'+String(i), ASSET_URL + 'tiles/tile_'+String(i)+'.png');
        }
    },
    create: function(){
        this.game.state.start("GameTitle");
    }
}