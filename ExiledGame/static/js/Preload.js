var Exiled = Exiled || {};

Exiled.Preload = function(){};

Exiled.Preload.prototype = {
    preload: function() {
        this.splash = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'logo');
        this.splash.anchor.setTo(0.5);

        this.preloadBar = this.add.sprite(this.game.world.centerX, this.game.world.centerY + 128, 'preloadbar');
        this.preloadBar.anchor.setTo(0.5);

        this.load.setPreloadSprite(this.preloadBar);

        this.load.tilemap('test_room', 'static/assets/tilemaps/Map.json', null, Phaser.Tilemap.TILED_JSON);
        this.load.image('world', 'static/assets/images/oryx_16bit_scifi_world.png');
        this.load.image('creatures', 'staic/assets/images/oryx_16bit_scifi_creatures_trans.png');
        this.load.image('space', 'static/assets/images/space.png');
        this.load.image('rock', 'static/assets/images/rock.png');
        this.load.spritesheet('player', 'static/assets/images/pc1_cropped.png', 32, 32);
        this.load.spritesheet('power', 'static/assets/images/power.png', 12, 12);
        this.load.spritesheet('enemy', 'static/assets/images/BadGuySprite.png', 32, 32);
        this.load.spritesheet('white_fireball', 'static/assets/images/white_fireball.png', 32, 32);
        this.load.image('playerParticle', 'static/assets/images/player-particle.png');
        this.load.audio('collect', 'static/assets/audio/collect.ogg');
        this.load.audio('explosion', 'static/asssets/audio/explosion.ogg');
        this.load.audio('rifle_shot', 'static/assets/audio/rifle_shot.mp3');
        this.load.audio('shell_falling', 'static/assets/audio/shell_falling.mp3');

        this.load.image('gun', 'static/assets/images/player.png');

    },
    create: function() {
        this.state.start('MainMenu');
    }
};
