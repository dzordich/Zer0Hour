// import { threadId } from "worker_threads";
// import { textChangeRangeIsUnchanged } from "typescript";
// what is this?

var Exiled = Exiled || {};

Exiled.Game = function(){};
console.log('DZAD cache 3');
var random = new Phaser.RandomDataGenerator()
var invulnerable = 0;
// find enemy spawn points
//var enemySpawn1 = [2017, 721];
var enemySpawn2 = [290, 767];
//var enemySpawn3 = [1205, 553];
//var enemySpawn4 = [958, 962];

const ENEMY_NUMBER = 1;
const START_BULLETS = 100;
const HEALTH_SPAWN = [526, 621];
const AMMO_SPAWN = [433, 621];

//temp for testing
var enemySpawn1 = [290, 767];
var enemySpawn3 = [290, 767];
var enemySpawn4 = [290, 767];


Exiled.Game.prototype = {
    create: function() {
        // create map
        this.map = this.game.add.tilemap('test_room');
        this.map.addTilesetImage('oryx_16bit_scifi_world', 'world');
        this.map.addTilesetImage('oryx_16bit_scifi_world_trans', 'world_trans');
        this.map.addTilesetImage('oryx_16bit_scifi_creatures_trans', 'creatures');
        this.backgroundLayer = this.map.createLayer('backgroundLayer');
        this.groundLayer = this.map.createLayer('groundLayer');
        this.detailLayer = this.map.createLayer('detailLayer');
        this.blockedLayer = this.map.createLayer('blockedLayer');
        // this.objectLayer = this.map.createLayer('objectLayer');
        
        this.map.setCollisionBetween(1, 1020, true, 'blockedLayer');
        //this.map.setCollisionBetween(1, 1020, false, 'detailLayer');
        this.backgroundLayer.resizeWorld();

        this.timer = new Phaser.Timer(this.game, false);

        // find player spawn point
        var playerSpawn = this.findObjectsByType('playerStart', this.map, 'objectLayer');
        
        // create player
        this.player = this.game.add.sprite(playerSpawn[0].x + 50, playerSpawn[0].y, 'player');
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
        this.healthPickups = this.game.add.group();
        this.healthPickups.enableBody = true;
        this.healthPickups.physicsBodyType = Phaser.Physics.ARCADE;
        this.spawnHealth(HEALTH_SPAWN[0], HEALTH_SPAWN[1]);

        // create enemies
        // this is the number of enemies per spawn point. currently we have 4 so this number would be quarter the number of enemies in a round.
        this.numEnemies = ENEMY_NUMBER; 
        this.enemies = this.game.add.group();
        this.enemies.enableBody = true;
        this.enemies.physicsBodyType = Phaser.Physics.ARCADE;
        this.spawnEnemies(this.numEnemies, enemySpawn1, enemySpawn2, enemySpawn3, enemySpawn4);
        // we will keep track of different types of enemies' stats in this object (e.g. speed, health, etc)
        this.enemies.stats = {};
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
        this.knifeAttack = this.game.add.audio('knifeAttack');
        this.shellFalling = this.game.add.audio('shell_falling');
        this.shellFalling.allowMultiple = false;
        
        // player's gun
        this.rifle = this.add.weapon(10, 'bullet');
        this.rifle.fireRate = 250;
        this.rifle.bulletRotateToVelocity = true;
        this.magCap = 10;
        this.totalAmmo = START_BULLETS;
        this.rifle.bulletSpeed = 800;

        this.activeGun = this.rifle;

        this.round = 1;

        this.showLabels(this.playerScore, null);
    },

    findObjectsByType: function(type, map, layer){
        var result = new Array();
        console.log(map);
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
    // moved into function so it can easily be called at the beginning of a new round
    // creates @param numEnemies enemies at each spawn point on the map
    spawnEnemies: function(numEnemies, spawn1, spawn2, spawn3, spawn4){
        console.log('spawned enemies');
        let newEnemy;
        for(let i=0; i<numEnemies; i++){
            newEnemy = this.enemies.create(spawn1[0]+random.integerInRange(-24, 24), spawn1[1]+random.integerInRange(-24, 24), 'enemy');
            newEnemy.scale.setTo(0.7);
            newEnemy.animations.add('left', [0,1], 5, true);
            newEnemy.animations.add('right', [4,5], 5, true);
            newEnemy.animations.add('up', [6,7], 5, true);
            newEnemy.animations.add('down', [2,3], 5, true);
            newEnemy.health = 45;
        }
        for(let i=0; i<numEnemies; i++){
            newEnemy = this.enemies.create(spawn2[0]+random.integerInRange(-24, 24), spawn2[1]+random.integerInRange(-24, 24), 'enemy');
            newEnemy.scale.setTo(0.7);
            newEnemy.animations.add('left', [0,1], 5, true);
            newEnemy.animations.add('right', [4,5], 5, true);
            newEnemy.animations.add('up', [6,7], 5, true);
            newEnemy.animations.add('down', [2,3], 5, true);
            newEnemy.health = 45;
        }
        for(let i=0; i<numEnemies; i++){
            newEnemy = this.enemies.create(spawn3[0]+random.integerInRange(-24, 24), spawn3[1]+random.integerInRange(-24, 24), 'enemy');
            newEnemy.scale.setTo(0.7);
            newEnemy.animations.add('left', [0,1], 5, true);
            newEnemy.animations.add('right', [4,5], 5, true);
            newEnemy.animations.add('up', [6,7], 5, true);
            newEnemy.animations.add('down', [2,3], 5, true);
            newEnemy.health = 45;
        }
        for(let i=0; i<numEnemies; i++){
            newEnemy = this.enemies.create(spawn4[0]+random.integerInRange(-24, 24), spawn4[1]+random.integerInRange(-24, 24), 'enemy');
            newEnemy.scale.setTo(0.7);
            newEnemy.animations.add('left', [0,1], 5, true);
            newEnemy.animations.add('right', [4,5], 5, true);
            newEnemy.animations.add('up', [6,7], 5, true);
            newEnemy.animations.add('down', [2,3], 5, true);
            newEnemy.health = 45;
        }
    },
    spawnHealth: function(x,y){
        let newHealth;
        newHealth = this.healthPickups.create(x, y, 'healthPickup');
        newHealth.scale.setTo(0.15);
    },
    update: function() {
        //console.log(`coord ${this.player.x},${this.player.y}`);
        if(!this.enemies.getFirstAlive()){
            //this.spawnHealth(HEALTH_SPAWN[0], HEALTH_SPAWN[1]);
            console.log('no cache issue 5');
            //this.spawnAmmo(AMMO_SPAWN[0], AMMO_SPAWN[1]);
            this.numEnemies = Math.round(this.numEnemies * 1.25);
            this.spawnEnemies(this.numEnemies, enemySpawn1, enemySpawn2, enemySpawn3, enemySpawn4);
        }
        this.scoreLabel.text = `Kills: ${this.playerScore.toString()}`;
        this.healthHUD.text = `Health: ${this.player.health.toString()}`;
        this.bulletsHUD.text = `Bullets: ${this.totalAmmo}`;
        //console.log(this.player.health);
        this.player.body.velocity.x = 0;
        this.player.body.velocity.y = 0;
        //environment physics
        this.game.physics.arcade.collide(this.player, this.blockedLayer);
        this.game.physics.arcade.collide(this.enemies, this.blockedLayer);
        this.game.physics.arcade.collide(this.enemies);
        this.game.physics.arcade.collide(this.blockedLayer, this.activeGun.bullets, this.bulletHitBlock, null, this);

        //pickup physics
        this.game.physics.arcade.overlap(this.player, this.healthPickups, this.pickUpHealth, null, this);

        //combat physics
        this.game.physics.arcade.overlap(this.rifle.bullets, this.enemies, this.bulletHitEnemy, null, this);
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
        // if(this.rifle.shots < 10){
        //     if(this.game.input.activePointer.isDown){
        //         this.shootGun(this.rifle);
        //         this.rifleShot.loopFull();         
        //     }
        //     else{
        //         this.rifleShot.stop()
        //     }
        // }
        // else{
        //     this.reloadGun(this.rifle, this.magCap);

        // }

        // shoot gun
        this.input.onDown.add(this.shootRifle, this);
        this.rifle.onFireLimit.add(this.reloadGun, this);
        
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
        // this.playerScore += 1;
        emitter.explode(50, 3);
        if(enemy.health <= 0){
            this.explosionSound.play();
            emitter.explode(100);
            this.playerScore += 1;
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
    
    generateCollectables: function() {
        this.collectables = this.game.add.group();
    
        //enable physics in them
        this.collectables.enableBody = true;
        this.collectables.physicsBodyType = Phaser.Physics.ARCADE;
    
        //phaser's random number generator
        var numCollectables = this.game.rnd.integerInRange(100, 150)
        var collectable;
    
        for (var i = 0; i < numCollectables; i++) {
          //add sprite
          collectable = this.collectables.create(this.game.world.randomX, this.game.world.randomY, 'power');
          collectable.animations.add('fly', [0, 1, 2, 3], 5, true);
          collectable.animations.play('fly');
        }
    
    },
    pickUpHealth: function(player, healthPickup){
        console.log("health picked up");
    },
    spawnAmmo:function(x,y){
        this.ammoPickup = this.game.add.sprite(x, y, 'ammo');
        this.ammoPickup.scale.setTo(0.15);
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
    shootRifle: function(){
        this.rifle.x = this.player.centerX;
        this.rifle.y = this.player.centerY;
        if(this.totalAmmo > 0){
            this.rifle.bulletKillType = Phaser.Weapon.KILL_NEVER;
            this.rifle.fireAtPointer(this.game.input.activePointer);
            this.rifleShot.play();
            this.totalAmmo -= 1;
        } else {
            //melee attack goes here
            this.knifeAttack.play();
            this.rifle.bulletKillType = Phaser.Weapon.KILL_DISTANCE;
            this.rifle.bulletKillDistance = 24;
            this.rifle.fireAtPointer(this.game.input.activePointer);
        }
        // gun.onFire.add(function(gun){
        //     gun.bullets.getFirstExists(1).destroy()
        // })
    },
    reloadGun: function(){
        if(this.totalAmmo === 0){
            // switch to melee
        }
        else{
            //this.totalAmmo -= this.magCap;
            this.rifle.resetShots();
            this.rifle.createBullets(10, 'bullet')
        }
        
    },
    showLabels: function(score, round){
        var text = score.toString();
        var style = { font: '15px Arial', fill: '#fff' };
        this.scoreLabel = this.game.add.text(this.game.width-70, this.game.height-24, text, style);
        this.healthHUD = this.game.add.text(this.game.width-85, this.game.height-40, 'Health: ' + this.player.health.toString(), style);
        this.bulletsHUD = this.game.add.text(this.game.width-85, this.game.height-58, 'Bullets: ' + "100", style);
        this.scoreLabel.fixedToCamera = true;
        this.healthHUD.fixedToCamera = true;
        this.bulletsHUD.fixedToCamera = true;

    },
    getAngleRadians: function(x1, y1, x2, y2){
        let angle = (x2 - x1)/(y2 - y1);
        const rad = (Math.PI) * 2;
        return angle * rad;
    },
    stopPlayer: function(player){
        player.body.acceleration.x = 0;
        player.body.acceleration.y = 0;
    },
    gameOver: function(){
        // this is where we will post to the API
        this.scoreLastGame = this.playerScore;
        this.state.start('MainMenu');
    }
}
