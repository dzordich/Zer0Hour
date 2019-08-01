var Exiled = Exiled || {};

Exiled.Game = function(){};

var random = new Phaser.RandomDataGenerator()

Exiled.Game.prototype = {
    create: function() {
        // create map
        this.map = this.game.add.tilemap('test_room');
        this.map.addTilesetImage('oryx_16bit_scifi_world', 'world');
        this.map.addTilesetImage('oryx_16bit_scifi_creatures_trans', 'creatures');
        this.backgroundLayer = this.map.createLayer('backgroundLayer');
        this.groundLayer = this.map.createLayer('groundLayer');
        this.blockedLayer = this.map.createLayer('blockedLayer');
        this.objectLayer = this.map.createLayer('objectLayer');

        this.map.setCollisionBetween(1, 1020, true, 'blockedLayer');
        this.backgroundLayer.resizeWorld();

        // find player spawn point
        var result = this.findObjectsByType('playerStart', this.map, 'objectLayer')

        // create player
        this.player = this.game.add.sprite(result[0].x, result[0].y, 'playership');
        this.player.scale.setTo(0.7);
        this.player.animations.add('left', [0,1], 10, true);
        this.player.animations.add('right', [4,5], 10, true);
        this.player.animations.add('up', [6,7], 10, true);
        this.player.animations.add('down', [2,3], 10, true);
        this.game.physics.arcade.enable(this.player);
        this.player.body.collideWorldBounds = true;
        this.playerSpeed = 120;
        this.player.health = 100;
        this.game.camera.follow(this.player);

        // create enemies
        var num_enemies = 5;
        this.enemies = this.game.add.group();
        this.enemies.enableBody = true;
        this.enemies.physicsBodyType = Phaser.Physics.ARCADE;
        let newEnemy;
        for(let i=0; i<=num_enemies; i++){
            newEnemy = this.enemies.create(result[0].x+random.integerInRange(-24, 24), result[0].y+random.integerInRange(-24, 24), 'enemy');
            newEnemy.scale.setTo(0.7);
            newEnemy.animations.add('left', [0,1], 5, true);
            newEnemy.animations.add('right', [4,5], 5, true);
            newEnemy.animations.add('up', [6,7], 5, true);
            newEnemy.animations.add('down', [2,3], 5, true);
            newEnemy.health = 45;
        }

        // create controls
        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.upKey = this.game.input.keyboard.addKey(Phaser.KeyCode.W);
        this.downKey = this.game.input.keyboard.addKey(Phaser.KeyCode.S);
        this.leftKey = this.game.input.keyboard.addKey(Phaser.KeyCode.A);
        this.rightKey = this.game.input.keyboard.addKey(Phaser.KeyCode.D);
        
        // create sounds
        this.explosionSound = this.game.add.audio('explosion');
        this.collectSound = this.game.add.audio('collect');
        this.rifleShot = this.game.add.audio('rifle_shot');
        // this.rifleShot.override = true;
        this.shellFalling = this.game.add.audio('shell_falling');
        this.shellFalling.allowMultiple = false;
        
        // player's gun
        this.rifle = this.add.weapon(10, 'playerParticle');
        this.rifle.KILL_CAMERA_BOUNDS = 3;
        this.rifle.trackSprite(this.player);
        this.rifle.trackOffset.y = 13;
        this.rifle.bulletSpeed = 800;

        this.activeGun = this.rifle;
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

        //player controls
        if(this.cursors.left.isDown || this.leftKey.isDown){
            this.player.body.velocity.x -= 100;
            this.player.play('left');
        } else if(this.cursors.right.isDown || this.rightKey.isDown){
            this.player.body.velocity.x = 100;
            this.player.play('right');
        } else {
            this.player.body.acceleration.x = 0;
        }
        if(this.cursors.up.isDown || this.upKey.isDown){
            this.player.body.velocity.y -= 100;
            if( (!this.cursors.left.isDown || !this.leftKey.isDown) && (!this.cursors.right.isDown || !this.rightKey.isDown) ){
                this.player.play('up');
            }
        } else if(this.cursors.down.isDown || this.downKey.isDown){
            this.player.body.velocity.y = 100;
            if( (!this.cursors.left.isDown || !this.leftKey.isDown) && (!this.cursors.right.isDown || !this.rightKey.isDown) ){
                this.player.play('down');
            }
        } else {
            this.player.body.acceleration.y = 0;
        }
        if ( (this.player.body.velocity.x == 0) && (this.player.body.velocity.y == 0) ) {
            this.player.animations.stop();
        }
        
        if(this.game.input.activePointer.isDown){
            this.shootGun(this.activeGun);
            this.rifleShot.loopFull();
            // this.shellFalling.loopFull();
        }
        else{
            this.rifleShot.stop()
        }
        
        
        //environment physics
        this.game.physics.arcade.collide(this.player, this.blockedLayer);
        this.game.physics.arcade.collide(this.enemies, this.blockedLayer);
        this.game.physics.arcade.collide(this.enemies);
        this.game.physics.arcade.collide(this.blockedLayer, this.activeGun.bullets, this.bulletHitBlock, null, this);

        //combat physics
        this.game.physics.arcade.overlap(this.activeGun.bullets, this.enemies, this.bulletHitEnemy, null, this)
        
        //call the enemy patrol function
        this.enemies.forEachAlive(this.chase, this);
        
        

    },
    // bullets die when they hit blocks
    bulletHitBlock: function(bullet, block){
        bullet.kill();
    },
    // handles bullet collision with enemy
    bulletHitEnemy: function(bullet, enemy){
        bullet.kill();
        enemy.damage(15);
        if(enemy.health <= 0){
            var emitter = this.game.add.emitter(enemy.x, enemy.y, 50);
            emitter.makeParticles('playerParticle');
            emitter.minParticleSpeed.setTo(-500, -500);
            emitter.maxParticleSpeed.setTo(500, 500);
            emitter.gravity = 0;
            this.explosionSound.play();
            emitter.explode(100);
        }
    },
    // enemy movement
    chase: function(enemy){
        //max safe speed 30
        let CHASE_SPEED = random.integerInRange(24, 30);
        //random.integerInRange(1,4)
        if (Math.round(enemy.y) == Math.round(this.player.y)) {
            enemy.body.velocity.y = 0;
        } else if (Math.round(enemy.y) > Math.round(this.player.y)){
            enemy.body.velocity.y = -CHASE_SPEED;
            if (enemy.body.velocity.x == 0){
                enemy.play('up');
            }
        } else {
            enemy.body.velocity.y = CHASE_SPEED;
            if (enemy.body.velocity.x == 0){
                enemy.play('down');
            }
        }
        if (Math.round(enemy.x) == Math.round(this.player.x)) {
            enemy.body.velocity.x = 0;
        } else if (Math.round(enemy.x) > Math.round(this.player.x)){
            enemy.body.velocity.x = -CHASE_SPEED;
            if (enemy.body.velocity.y == 0){
                enemy.play('left');
            }
        } else {
            enemy.body.velocity.x = CHASE_SPEED;
            if (enemy.body.velocity.y == 0){
                enemy.play('right');
            }
        }
    },
    shootGun: function(gun){
        gun.fireAtPointer(this.game.input.activePointer);
    },
}
