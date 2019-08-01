var Exiled = Exiled || {};

Exiled.Game = function(){};

random = new Phaser.RandomDataGenerator()



Exiled.Game.prototype = {
    create: function() {
        this.map = this.game.add.tilemap('test_room');
        this.map.addTilesetImage('oryx_16bit_scifi_world', 'world');
        this.map.addTilesetImage('oryx_16bit_scifi_creatures_trans', 'creatures');
        this.backgroundLayer = this.map.createLayer('backgroundLayer');
        this.groundLayer = this.map.createLayer('groundLayer');
        this.blockedLayer = this.map.createLayer('blockedLayer');
        this.objectLayer = this.map.createLayer('objectLayer');

        this.map.setCollisionBetween(1, 1020, true, 'blockedLayer');
        this.backgroundLayer.resizeWorld();

        var result = this.findObjectsByType('playerStart', this.map, 'objectLayer')

        // create player
        this.player = this.game.add.sprite(result[0].x, result[0].y, 'player');
        this.player.scale.setTo(0.7);
        this.player.animations.add('left', [0,1], 10, true);
        this.player.animations.add('right', [4,5], 10, true);
        this.player.animations.add('up', [6,7], 10, true);
        this.player.animations.add('down', [2,3], 10, true);
        this.game.physics.arcade.enable(this.player);
        this.playerSpeed = 120;
        this.player.body.collideWorldBounds = true;
        this.game.camera.follow(this.player);

        // create enemy
        this.enemy = this.game.add.sprite(result[0].x+24, result[0].y+24, 'enemy');
        this.enemy.scale.setTo(0.7);
        this.enemy.animations.add('left', [0,1], 5, true);
        this.enemy.animations.add('right', [4,5], 5, true);
        this.enemy.animations.add('up', [6,7], 5, true);
        this.enemy.animations.add('down', [2,3], 5, true);
        this.enemy.collideWorldBounds = true;
        this.game.physics.arcade.enable(this.enemy);

        // create controls
        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.upKey = this.game.input.keyboard.addKey(Phaser.KeyCode.W);
        this.downKey = this.game.input.keyboard.addKey(Phaser.KeyCode.S);
        this.leftKey = this.game.input.keyboard.addKey(Phaser.KeyCode.A);
        this.rightKey = this.game.input.keyboard.addKey(Phaser.KeyCode.D);
        
        this.explosionSound = this.game.add.audio('explosion');
        this.collectSound = this.game.add.audio('collect');
        this.rifleShot = this.game.add.audio('rifle_shot');
        // this.rifleShot.override = true;
        this.shellFalling = this.game.add.audio('shell_falling');
        this.shellFalling.allowMultiple = false;
        
        // player's gun
        this.gun = this.add.weapon(10, 'playerParticle');
        this.gun.KILL_CAMERA_BOUNDS = 3;
        this.gun.trackSprite(this.player);
        this.gun.trackOffset.y = 13;
        this.gun.bulletSpeed = 600;

        //crosshair
        this.crosshair = new Phaser.Line(this.player.centerX, this.player.centerY, this.enemy.centerX, this.enemy.centerY);
        this.targetPoint = new Phaser.Point();
        this.targetFromPoint = new Phaser.Point();
    },

    findObjectsByType: function(type, map, layer){
        var result = new Array();
        map.objects[layer].forEach(function(element){
            if(element.type === type){
                element.y -= map.tileHeight;
                result.push(element);
            }
        });
        return result;
    },
    createFromTiledObject: function(element, group){
        var sprite = group.create(element.x, element.y, element.properties.sprite);

        Object.keys(element.properties).forEach(function(key){
            sprite[key] = element.properties[key];
        });
    },
    update: function() {
        this.player.body.velocity.x = 0;
        this.player.body.velocity.y = 0;

        this.game.physics.arcade.collide(this.blockedLayer, this.gun.bullets, this.bulletHitBlock, null, this);
        
        
        //player controls
        PLAYER_SPEED = 100
        
        if(this.cursors.left.isDown || this.leftKey.isDown){
            this.player.body.velocity.x -= PLAYER_SPEED;
            this.player.play('left');
        } else if(this.cursors.right.isDown || this.rightKey.isDown){
            this.player.body.velocity.x = PLAYER_SPEED;
            this.player.play('right');
        } else {
            this.player.body.acceleration.x = 0;
        }

        if(this.cursors.up.isDown || this.upKey.isDown){
            this.player.body.velocity.y -= PLAYER_SPEED;
            if( !(this.cursors.left.isDown || this.leftKey.isDown) && !(this.cursors.right.isDown || this.rightKey.isDown) ){
                this.player.play('up');
            }
        } else if(this.cursors.down.isDown || this.downKey.isDown){
            this.player.body.velocity.y = PLAYER_SPEED;
            if( !(this.cursors.left.isDown || this.leftKey.isDown) && !(this.cursors.right.isDown || this.rightKey.isDown) ){
                this.player.play('down');
            }
        } else {
            this.player.body.acceleration.y = 0;
        }
        if ( (this.player.body.velocity.x == 0) && (this.player.body.velocity.y == 0) ) {
            this.player.animations.stop();
        }
        
        if(this.game.input.activePointer.isDown){
            this.shootGun(this.gun);
            this.rifleShot.loopFull();
            // this.shellFalling.loopFull();
        }
        else{
            this.rifleShot.stop()
        }
        
        this.game.physics.arcade.overlap(this.gun.bullets, this.enemy, this.bulletHitEnemy, null, this)

        this.game.physics.arcade.collide(this.player, this.blockedLayer);
        this.game.physics.arcade.collide(this.enemy, this.blockedLayer);

        this.game.physics.arcade.collide(this.player, this.asteroids, this.hitAsteroid, null, this);
        this.game.physics.arcade.overlap(this.player, this.collectables, this.collect, null, this);

        //call the enemy patrol function
        this.chase();

    },
    
    bulletHitBlock: function(bullet, block){
        bullet.kill();
    },
    bulletHitEnemy: function(bullet, enemy){
        bullet.kill();
        var emitter = this.game.add.emitter(this.enemy.x, this.enemy.y, 50);
        emitter.makeParticles('playerParticle');
        emitter.minParticleSpeed.setTo(-500, -500);
        emitter.maxParticleSpeed.setTo(500, 500);
        emitter.gravity = 0;
        this.explosionSound.play();
        emitter.explode(100);
        this.enemy.kill();
    },
    chase: function(){
        //max safe speed 30
        CHASE_SPEED = 30
        //random.integerInRange(1,4)
        if (Math.round(this.enemy.y) == Math.round(this.player.y)) {
            this.enemy.body.velocity.y = 0;
        } else if (Math.round(this.enemy.y) > Math.round(this.player.y)){
            this.enemy.body.velocity.y = -CHASE_SPEED;
            if (this.enemy.body.velocity.x == 0){
                this.enemy.play('up');
            }
        } else {
            this.enemy.body.velocity.y = CHASE_SPEED;
            if (this.enemy.body.velocity.x == 0){
                this.enemy.play('down');
            }
        }
        if (Math.round(this.enemy.x) == Math.round(this.player.x)) {
            this.enemy.body.velocity.x = 0;
        } else if (Math.round(this.enemy.x) > Math.round(this.player.x)){
            this.enemy.body.velocity.x = -CHASE_SPEED;
            if (this.enemy.body.velocity.y == 0){
                this.enemy.play('left');
            }
        } else {
            this.enemy.body.velocity.x = CHASE_SPEED;
            if (this.enemy.body.velocity.y == 0){
                this.enemy.play('right');
            }
        }
    },
    shootGun: function(gun){
        this.gun.fireAtPointer(this.game.input.activePointer);
    },
}
