var Exiled = Exiled || {};

Exiled.Game = function(){};

var random = new Phaser.RandomDataGenerator()
var invulnerable = 0;


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
        var result = this.findObjectsByType('playerStart', this.map, 'objectLayer');
        //console.log(`Result ${result}`);
        
        // create player
        this.player = this.game.add.sprite(result[0].x + 50, result[0].y, 'player');
        this.player.scale.setTo(0.7);
        this.player.animations.add('left', [6,14], 10, true);
        this.player.animations.add('right', [2,10], 10, true);
        this.player.animations.add('up', [4,12], 10, true);
        this.player.animations.add('down', [0,8], 10, true);
        this.player.animations.add('up-left', [5,13], 10, true);
        this.player.animations.add('up-right', [3,11], 10, true);
        this.player.animations.add('down-left', [7,15], 10, true);
        this.player.animations.add('down-right', [1,9], 10, true);
        this.game.physics.arcade.enable(this.player);
        // this.player.body.collideWorldBounds = true;
        this.playerSpeed = 120;
        this.player.health = 100;
        this.playerScore = 0;
        this.game.camera.follow(this.player);

        // this.player.body.immovable = true;
        // this.player.body.bounce.x = 1;
        // this.player.body.bounce.y = 1;

        // create enemies
        this.numEnemies = 5;
        this.enemies = this.game.add.group();
        this.enemies.enableBody = true;
        this.enemies.physicsBodyType = Phaser.Physics.ARCADE;
        let newEnemy;
        for(let i=0; i<=this.numEnemies; i++){
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

        this.round = 1;

        this.showLabels(this.playerScore, null);
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
        
        this.scoreLabel.text = this.playerScore.toString();
        this.healthHUD.text = `HEALTH: ${this.player.health.toString()}`;
        console.log(this.player.health);
        this.player.body.velocity.x = 0;
        this.player.body.velocity.y = 0;
        //environment physics
        this.game.physics.arcade.collide(this.player, this.blockedLayer);
        this.game.physics.arcade.collide(this.enemies, this.blockedLayer);
        this.game.physics.arcade.collide(this.enemies);
        this.game.physics.arcade.collide(this.blockedLayer, this.activeGun.bullets, this.bulletHitBlock, null, this);

        //combat physics
        this.game.physics.arcade.overlap(this.activeGun.bullets, this.enemies, this.bulletHitEnemy, null, this);
        if (this.game.time.now - invulnerable > 2000){
            this.game.physics.arcade.collide(this.enemies, this.player, this.enemyHitPlayer, null, this);
        } else {
            this.game.physics.arcade.overlap(this.enemies, this.player);
        }

        //player controls
        const PLAYER_SPEED = 100
        var down = this.cursors.down.isDown || this.downKey.isDown
        var up = this.cursors.up.isDown || this.upKey.isDown
        var left = this.cursors.left.isDown || this.leftKey.isDown
        var right = this.cursors.right.isDown || this.rightKey.isDown
        
        if(left){
            if(up){
                this.player.body.velocity.y = -PLAYER_SPEED;
                this.player.body.velocity.x = -PLAYER_SPEED;
                this.player.play('up-left');
            } else if(down){
                this.player.body.velocity.y = PLAYER_SPEED;
                this.player.body.velocity.x = -PLAYER_SPEED;
                this.player.play('down-left');
            } else {
                this.player.body.velocity.x = -PLAYER_SPEED;
                this.player.play('left');
            }
        } else if(right) {
            if(up){
                this.player.body.velocity.y = -PLAYER_SPEED;
                this.player.body.velocity.x = PLAYER_SPEED;
                this.player.play('up-right');
            } else if(down){
                this.player.body.velocity.y = PLAYER_SPEED;
                this.player.body.velocity.x = PLAYER_SPEED;
                this.player.play('down-right');
            } else {
                this.player.body.velocity.x = PLAYER_SPEED;
                this.player.play('right');
            }
        } else if(up){
            if(right){
                this.player.body.velocity.y = -PLAYER_SPEED;
                this.player.body.velocity.x = PLAYER_SPEED;
                this.player.play('up-right');
            } else if(left){
                this.player.body.velocity.y = -PLAYER_SPEED;
                this.player.body.velocity.x = -PLAYER_SPEED;
                this.player.play('up-left');
            } else {
                this.player.body.velocity.y = -PLAYER_SPEED;
                this.player.play('up');
            }
        } else if(down){
            if(right){
                this.player.body.velocity.y = PLAYER_SPEED;
                this.player.body.velocity.x = PLAYER_SPEED;
                this.player.play('down-right');
            } else if(left){
                this.player.body.velocity.y = PLAYER_SPEED;
                this.player.body.velocity.x = -PLAYER_SPEED;
                this.player.play('down-left');
            } else {
                this.player.body.velocity.y = PLAYER_SPEED;
                this.player.play('down');
            }
        } else {
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
        
        
        
        //call the enemy patrol function

        this.enemies.forEachAlive(this.chase, this);
    },
    // bullets die when they hit blocks
    bulletHitBlock: function(bullet, block){
        bullet.kill();
    },
    // handles bullet collision with enemy
    bulletHitEnemy: function(bullet, enemy){
        var emitter = this.game.add.emitter(enemy.x, enemy.y, 25);
        emitter.makeParticles('blood');
        emitter.particleDrag.setTo(150, 150);
        emitter.minParticleSpeed.setTo(-180, -150);
        emitter.maxParticleSpeed.setTo(180, 150);
        emitter.gravity = 0;
        bullet.kill();
        enemy.damage(15);
        this.playerScore += 10;
        emitter.explode(50, 3);
        if(enemy.health <= 0){
            this.explosionSound.play();
            emitter.explode(100);
            this.score += 100;
        }
    },
    enemyHitPlayer: function(player, enemy){
        //this.player.reset(this.player.x + 20, this.player.y + 20)
        invulnerable  = this.game.time.now;
        // player.body.moveTo(400, 100, this.getAngleRadians(player.x, player.y, enemy.x, enemy.y));
        var emitter = this.game.add.emitter(player.centerX, player.centerY, 25);
        player.damage(30);
        emitter.makeParticles('blood');
        emitter.particleDrag.setTo(150, 150);
        emitter.minParticleSpeed.setTo(-180, -150);
        emitter.maxParticleSpeed.setTo(180, 150);
        emitter.gravity = 0;
        emitter.explode(50, 3);
        // blowback
        // var timer = new Phaser.Timer(this.game, true);
        // player.body.velocity.x = -(((enemy.centerX - player.centerX) * 100)/ ((enemy.centerY - player.centerY) * 100));
        // player.body.velocity.y = -(((enemy.centerY - player.centerY) * 100)/ ((enemy.centerX - player.centerX) * 100));
        // timer.add(500, this.stopPlayer, this, this.player);



        if(player.health <= 0){
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
    showLabels: function(score, round){
        var text = score.toString();
        var style = { font: '15px Arial', fill: '#fff', align: 'left' };
        this.scoreLabel = this.game.add.text(this.game.width-25, this.game.height-34, text, style);
        this.healthHUD = this.game.add.text(this.game.width-10, this.game.height-200, 'HEALTH: ' + this.player.health.toString(), { font: '20px Arial', fill: '#fff', align: 'left' });
        this.scoreLabel.fixedToCamera = true;
        //this.healthHUD = true;

    },
    getAngleRadians: function(x1, y1, x2, y2){
        let angle = (x2 - x1)/(y2 - y1);
        const rad = (Math.PI) * 2;
        return angle * rad;
    },
    stopPlayer: function(player){
        player.body.acceleration.x = 0;
        player.body.acceleration.y = 0;
    }
}
