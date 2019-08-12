var Exiled = Exiled || {};

Exiled.Preload = function(){};
var clicked = false;
Exiled.Preload.prototype = {
    preload: function() {
        this.splash = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'logo');
        this.splash.scale.setTo(0.4);
        this.splash.anchor.setTo(0.5);

        this.preloadBar = this.add.sprite(this.game.world.centerX, this.game.world.centerY + 70, 'preloadbar');
        this.preloadBar.anchor.setTo(0.5);

        this.load.setPreloadSprite(this.preloadBar);

        this.load.tilemap('map', 'static/assets/tilemaps/final_map.json', null, Phaser.Tilemap.TILED_JSON);

        this.load.image('world', 'static/assets/images/oryx_16bit_scifi_world.png');
        this.load.image('space', 'static/assets/images/space.png');
        this.load.image('healthPickup', 'static/assets/images/healthPickup.png');
        this.load.image('energyAmmo', 'static/assets/images/energyAmmo.png');
        this.load.image('blood', 'static/assets/images/blood.png');
        this.load.image('bullet', 'static/assets/images/energy_bullet.png');
        this.load.image('knife_slash', 'static/assets/images/knife_slash.png');
        this.load.image('pickupIndicator', 'static/assets/images/pickupIndicator.png');

        this.load.spritesheet('zPlayer', 'static/assets/images/ZPlayerChar.png', 271, 351);
        this.load.spritesheet('zPlayer_knife', 'static/assets/images/ZPlayerChar_knife.png', 438, 342);
        this.load.spritesheet('ZBoss', 'static/assets/images/ZBossSmall.png', 805, 723);
        this.load.spritesheet('zombie', 'static/assets/images/zombie.png', 663, 637);
        this.load.spritesheet('survivor', 'static/assets/images/survivor.png', 113, 125);

        this.load.audio('knifeAttack', 'static/assets/audio/knifeAttack.ogg');
        this.load.audio('laser_shot', 'static/assets/audio/laser_shot.ogg');
        this.load.audio('charge_up', 'static/assets/audio/ChargeUp.ogg');
        this.load.audio('playerDeath', 'static/assets/audio/player_death.ogg');
        this.load.audio('zombieDeath', 'static/assets/audio/zombie_hurt.ogg'); 
        this.load.audio('scaryBoss', 'static/assets/audio/scary_boss_sound.ogg');
        this.load.audio('backgroundMusic', 'static/assets/audio/espionage_background_music.ogg');
        this.load.audio('titleMenuMusic', 'static/assets/audio/prologue_titlemenu_music.ogg');
    },
    create: function() {
        document.addEventListener("click", function () {
            clicked = true;
        });
    },
    update: function(){
        if (clicked){
            this.state.start('MainMenu');
        }
    }
};
