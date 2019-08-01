var Exiled = Exiled || {};

Exiled.Game = function(){};

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
        this.player = this.game.add.sprite(result[0].x, result[0].y, 'playership');
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
        this.enemy = this.game.add.sprite(result[0].x, result[0].y, 'enemy');
        this.enemy.scale.setTo(0.5);
        this.enemy.animations.add('left', [0,1], 10, true);
        this.enemy.animations.add('right', [4,5], 10, true);
        this.enemy.animations.add('up', [6,7], 10, true);
        this.enemy.animations.add('down', [2,3], 10, true);
        this.game.physics.arcade.enable(this.enemy);

        // create controls
        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.upKey = this.game.input.keyboard.addKey(Phaser.KeyCode.W);
        this.downKey = this.game.input.keyboard.addKey(Phaser.KeyCode.S);
        this.leftKey = this.game.input.keyboard.addKey(Phaser.KeyCode.A);
        this.rightKey = this.game.input.keyboard.addKey(Phaser.KeyCode.D);
        
        // this.generateCollectables();
        // this.generateAsteroids();
        // this.playerScore = 0;
        
        this.explosionSound = this.game.add.audio('explosion');
        this.collectSound = this.game.add.audio('collect');
        
        // player's gun
        this.gun = this.add.weapon(10, 'playerParticle');
        this.gun.KILL_CAMERA_BOUNDS = 3;
        this.gun.trackSprite(this.player);
        this.gun.trackOffset.y = 13;

        //crosshair
        this.crosshair = new Phaser.Line(this.player.centerX, this.player.centerY, this.enemy.centerX, this.enemy.centerY);
        this.targetPoint = new Phaser.Point();
        this.targetFromPoint = new Phaser.Point();
        // this.showLabels();
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

        // this.crosshair2 = new Phaser.Line(this.player.centerX, this.player.centerY, this.enemy.centerX, this.enemy.centerY);
        // this.crosshair2.fromSprite(this.player, this.enemy, true);
        // this.targetFromPoint.copyFrom(this.player);
        // this.targetPoint.copyFrom(this.game.input.activePointer);
        // this.crosshair.fromPoints(this.targetFromPoint, this.targetPoint);

        this.crosshair.setTo(this.player.centerX, this.player.centerY, this.game.input.x, this.game.input.y);

        this.game.physics.arcade.collide(this.blockedLayer, this.gun.bullets, this.bulletHitBlock, null, this);
        this.enemy.play('left');

        if(this.cursors.up.isDown || this.upKey.isDown){
            console.log('ahhhhh')
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
        if(this.cursors.left.isDown || this.leftKey.isDown){
            this.player.body.velocity.x -= 100;
            this.player.play('left');
        } else if(this.cursors.right.isDown || this.rightKey.isDown){
            this.player.body.velocity.x = 100;
            this.player.play('right');
        } else {
            this.player.body.acceleration.x = 0;
        }
        if ( (this.player.body.velocity.x == 0) && (this.player.body.velocity.y == 0) ) {
            this.player.animations.stop();
        }

        if(this.game.input.activePointer.isDown){
            this.gun.fireAtPointer(this.game.input.activePointer);
        }

        this.game.physics.arcade.overlap(this.gun.bullets, this.enemy, this.bulletHitEnemy, null, this)
        this.game.physics.arcade.collide(this.player, this.blockedLayer);
        this.game.physics.arcade.collide(this.player, this.asteroids, this.hitAsteroid, null, this);
        this.game.physics.arcade.overlap(this.player, this.collectables, this.collect, null, this);
    },
    // generateCollectables: function() {
    //     this.collectables = this.game.add.group();

    //     this.collectables.enableBody = true;
    //     this.collectables.physicsBodyType = Phaser.Physics.ARCADE;

    //     var numCollectables = this.game.rnd.integerInRange(100, 150)
    //     var collectable;

    //     for (var i = 0; i < numCollectables; i++){
    //         collectable = this.collectables.create(this.game.world.randomX, this.game.world.randomY, 'power');
    //         collectable.animations.add('fly', [0, 1, 2, 3], 5, true);
    //         collectable.animations.play('fly');

    //     }
    // },
    // generateAsteroids: function() {
    //     this.asteroids = this.game.add.group();

    //     //enable physics
    //     this.asteroids.enableBody = true;
    //     this.asteroids.physicsBodyType = Phaser.Physics.ARCADE;

    //     var numAsteroids = this.game.rnd.integerInRange(150, 200)
    //     var asteroid;

    //     for (var i = 0; i < numAsteroids; i++) {
    //         asteroid = this.asteroids.create(this.game.world.randomX, this.game.world.randomY, 'rock');
    //         asteroid.scale.setTo(this.game.rnd.integerInRange(10, 40)/10);
            
    //         asteroid.body.velocity.x = this.game.rnd.integerInRange(-20, 20);
    //         asteroid.body.velocity.y = this.game.rnd.integerInRange(-20, 20);
    //         asteroid.body.immovable = true;
    //         asteroid.body.collideWorldBounds = true;
    //     };
    // },
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
        // emitter.scale.setTo(0.5);
        emitter.explode(100);
        this.enemy.kill();
    },
    // hitAsteroid: function(player, asteroid) {
    //     this.explosionSound.play();

    //     var emitter = this.game.add.emitter(this.player.x, this.player.y, 100);
    //     emitter.makeParticles('playerParticle');
    //     emitter.minParticleSpeed.setTo(-200, -200);
    //     emitter.maxParticleSpeed.setTo(200, 200);
    //     emitter.gravity = 0;
    //     emitter.start(true, 1000, null, 10);
    //     this.player.kill();
    //     this.game.time.events.add(800, this.gameOver, this);
    // },
    gameOver: function(){
        this.game.state.start('MainMenu', true, false, this.playerScore);
    },
    // collect: function(player, collectable){
    //     this.collectSound.play();

    //     this.playerScore++;

    //     this.scoreLabel.text = this.playerScore;

    //     collectable.destroy();
    // },
    // showLabels: function(){
    //     var text = '0';
    //     var style = { font: '20px Arial', fill: '#fff', align: 'center' };
    //     this.scoreLabel = this.game.add.text(this.game.width-50, this.game.height-50, text, style);
    //     this.scoreLabel.fixedToCamera = true;

    // },
    
}
