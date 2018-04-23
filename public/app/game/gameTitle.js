var gameTitle = function(game){}

gameTitle.prototype = {
    create: function(){
        var gameTitle = this.game.add.sprite(375,160,"gametitle");
        gameTitle.anchor.setTo(0.5,0.5);
        var playButton = this.game.add.button(375,320,"play",this.playTheGame,this);
        playButton.anchor.setTo(0.5,0.5);
        var music = game.sound.play("theme");
        music.loopFull();
    },
    playTheGame: function(){
        this.game.state.start("TheGame");
    }
}