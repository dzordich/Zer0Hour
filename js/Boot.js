
var Exiled = Exiled || {};

Exiled.Boot = function(){};
Exiled.Boot.prototype = {
    preload: function() {
        this.load.image('logo', 'assets/images/logo.png');
        this.load.image('preloadbar', 'assets/images/preloader-bar.png');
    },
    create: function(){
        this.game.stage.backgroundColor = '#fff';

        this.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;

        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;
        // this.scale.setMaximum();
        // this.scale.setScreenSize(true);

        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        this.state.start('Preload');
        
    }
};
