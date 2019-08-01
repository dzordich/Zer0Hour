var Exiled = Exiled || {};

Exiled.Preload = function(){};

Exiled.Preload.prototype = {
    preload: function() {
        this.splash = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'logo');
        this.splash.anchor.setTo(0.5);

        this.preloadBar = this.add.sprite(this.game.world.centerX, this.game.world.centerY + 128, 'preloadbar');
        this.preloadBar.anchor.setTo(0.5);

        this.load.setPreloadSprite(this.preloadBar);

        this.load.tilemap('test_room', 'assets/tilemaps/Map.json', null, Phaser.Tilemap.TILED_JSON);
        this.load.image('world', 'assets/images/oryx_16bit_scifi_world.png');
        this.load.image('creatures', 'assets/images/oryx_16bit_scifi_creatures_trans.png');
        this.load.image('space', 'assets/images/space.png');
        this.load.image('rock', 'assets/images/rock.png');
        this.load.spritesheet('playership', 'assets/images/CandycePlayerSprite.png', 32, 32);
        this.load.spritesheet('power', 'assets/images/power.png', 12, 12);
        this.load.spritesheet('enemy', 'assets/images/BadGuySprite.png', 32, 32);
        this.load.spritesheet('white_fireball', 'assets/images/white_fireball.png', 32, 32);
        this.load.image('playerParticle', 'assets/images/player-particle.png');
        this.load.audio('collect', 'assets/audio/collect.oog');
        this.load.audio('explosion', 'asssets/audio/explosion.oog');

        this.load.image('gun', 'assets/images/player.png');

    },
    create: function() {
        this.state.start('MainMenu');
    }
};
