var Exiled = Exiled || {};

Exiled.Preload = function(){};

Exiled.Preload.prototype = {
    preload: function() {
        this.splash = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'logo');
        this.splash.anchor.setTo(0.5);

        this.preloadBar = this.add.sprite(this.game.world.centerX, this.game.world.centerY + 128, 'preloadbar');
        this.preloadBar.anchor.setTo(0.5);

        this.load.setPreloadSprite(this.preloadBar);

        this.load.tilemap('test_room', 'static/assets/tilemaps/test_map2.5.json', null, Phaser.Tilemap.TILED_JSON);
        this.load.image('world', 'static/assets/images/oryx_16bit_scifi_world.png');
        this.load.image('world_trans', 'static/assets/images/oryx_16bit_scifi_world_trans.png');
        this.load.image('creatures', 'static/assets/images/oryx_16bit_scifi_creatures_trans.png');
        this.load.image('space', 'static/assets/images/space.png');
        this.load.spritesheet('player', 'static/assets/images/pc1_cropped.png', 32, 32);
        this.load.spritesheet('enemy', 'static/assets/images/BadGuySprite.png', 32, 32);
        this.load.image('playerParticle', 'static/assets/images/player-particle.png');
        this.load.audio('explosion', 'static/assets/audio/explosion.ogg');
        this.load.audio('knifeAttack', 'static/assets/audio/knifeAttack.ogg');
        this.load.audio('rifle_shot', 'static/assets/audio/rifle_shot.mp3');
        this.load.audio('shell_falling', 'static/assets/audio/shell_falling.mp3');
        this.load.image('blood', 'static/assets/images/blood.png')
        this.load.image('bullet', 'static/assets/images/bullet.png');

    },
    create: function() {
        this.state.start('MainMenu');
    }
};
