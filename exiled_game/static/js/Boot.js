
var Exiled = Exiled || {};

Exiled.Boot = function(){};
Exiled.Boot.prototype = {
    preload: function() {
        
    },
    create: function(){
        // clear cache
        this.cache.destroy();
        this.game.stage.backgroundColor = '#fff';

        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;

        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        this.state.start('Preload');
        
    }
};
