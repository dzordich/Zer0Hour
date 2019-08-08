var Exiled = Exiled || {};
console.log('got here');

Exiled.Preload = function(){};

Exiled.Preload.prototype = {
    preload: function() {
        this.splash = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'logo');
        this.splash.anchor.setTo(0.5);

        this.preloadBar = this.add.sprite(this.game.world.centerX, this.game.world.centerY + 128, 'preloadbar');
        this.preloadBar.anchor.setTo(0.5);

        this.load.setPreloadSprite(this.preloadBar);

        this.load.tilemap('map', 'static/assets/tilemaps/final_map.json', null, Phaser.Tilemap.TILED_JSON);
        this.load.image('world', 'static/assets/images/oryx_16bit_scifi_world.png');
        this.load.image('space', 'static/assets/images/space.png');
        this.load.image('healthPickup', 'static/assets/images/healthPickup.png');
        this.load.image('energyAmmo', 'static/assets/images/energyAmmo.png');
        this.load.spritesheet('player', 'static/assets/images/pc1_cropped.png', 32, 32);
        this.load.spritesheet('zPlayer', 'static/assets/images/ZPlayerChar.png', 271, 351);
        this.load.spritesheet('zPlayer_knife', 'static/assets/images/ZPlayerChar_knife.png', 438, 342);
        this.load.spritesheet('enemy', 'static/assets/images/BadGuySprite.png', 32, 32);
        this.load.spritesheet('ZBoss', 'static/assets/images/ZBoss.png', 1610, 1446);
        this.load.spritesheet('zombie', 'static/assets/images/zombie.png', 663, 637);
        this.load.spritesheet('survivor', 'static/assets/images/survivor.png', 113, 125);
        this.load.image('playerParticle', 'static/assets/images/player-particle.png');
        //this.load.audio('explosion', 'static/assets/audio/explosion.ogg');
        this.load.audio('knifeAttack', 'static/assets/audio/knifeAttack.ogg');
        this.load.audio('rifle_shot', 'static/assets/audio/rifle_shot.mp3');
        this.load.audio('laser_shot', 'static/assets/audio/laser_shot.ogg');
        this.load.audio('charge_up', 'static/assets/audio/ChargeUp.ogg');
        this.load.audio('shell_falling', 'static/assets/audio/shell_falling.mp3');
        this.load.audio('zombieDeath', 'static/assets/audio/zombie_hurt.ogg');
        this.load.image('blood', 'static/assets/images/blood.png');
        //this.load.image('bullet', 'static/assets/images/bullet.png');
        this.load.image('bullet', 'static/assets/images/energy_bullet.png');
        this.load.image('knife_slash', 'static/assets/images/knife_slash.png');
    },
    create: function() {
        this.state.start('MainMenu');
    }
};
