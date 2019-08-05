// import { threadId } from "worker_threads";
// import { textChangeRangeIsUnchanged } from "typescript";
// what is this?

var Exiled = Exiled || {};

Exiled.Game = function(){};
var random = new Phaser.RandomDataGenerator()
var invulnerable = 0;
var roundTextTimer = 0;
// find enemy spawn points
//var enemySpawn1 = [2017, 721];
var enemySpawn2 = [290, 767];
//var enemySpawn3 = [1205, 553];
//var enemySpawn4 = [958, 962];
//var enemySpawn3 = [1205, 553];
//var enemySpawn4 = [958, 962];

var ENEMY_CHASE_SPEED = random.integerInRange(24, 30);
const BOSS_CHASE_SPEED = 17;
const PLAYER_SPEED = 100;
const ENEMY_NUMBER = 1;
const START_BULLETS = 100;
const HEALTH_SPAWN = [526, 621];
const AMMO_SPAWN = [433, 621];
const PLAYER_MAX_HEALTH = 100;
const PICKUP_HEALTH_AMOUNT = 30;
const PICKUP_AMMO_AMOUNT = 30;

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
        
        this.map.setCollisionBetween(1, 1020, true, 'blockedLayer');
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
        this.playerSpeed = 120;
        this.player.health = PLAYER_MAX_HEALTH;
        this.playerScore = 0;
        this.game.camera.follow(this.player);

        //create groups for pickups
        this.healthPickups = this.game.add.group();
        this.healthPickups.enableBody = true;
        this.healthPickups.physicsBodyType = Phaser.Physics.ARCADE;
        this.ammoPickups = this.game.add.group();
        this.ammoPickups.enableBody = true;
        this.ammoPickups.physicsBodyType = Phaser.Physics.ARCADE;

        // create enemies
        // this is the number of enemies per spawn point. currently we have 4 so this number would be quarter the number of enemies in a round.
        this.numEnemies = ENEMY_NUMBER; 
        this.enemies = this.game.add.group();
        this.enemies.enableBody = true;
        this.enemies.physicsBodyType = Phaser.Physics.ARCADE;
        this.spawnEnemies(this.numEnemies, enemySpawn1, enemySpawn2, enemySpawn3, enemySpawn4);
        // we will keep track of different types of enemies' stats in this object (e.g. speed, health, etc)
        this.enemies.stats = {};
        // create boss
        this.boss = this.game.add.group();
        this.boss.enableBody = true;
        this.boss.physicsBodyType = Phaser.Physics.ARCADE;

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
        this.rifle.bulletSpeed = 2500;
        this.activeGun = this.rifle;

        this.round = 1;
        // HUD
        this.showHUD(this.playerScore, null);
        //this.showRoundText();
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
    spawnBoss: function(x, y){
        let newBoss;
        // need sprite for boss
        newBoss = this.boss.create(x, y, 'playerParticle');
        newBoss.health = 200;
        newBoss.scale.setTo(3);
    },
    update: function() {
        if(!this.enemies.getFirstAlive()){
            this.spawnHealth(HEALTH_SPAWN[0], HEALTH_SPAWN[1]);
            this.spawnAmmo(AMMO_SPAWN[0], AMMO_SPAWN[1]);
            this.numEnemies = Math.round(this.numEnemies * 1.25);
            this.round += 1;
            this.numEnemies = Math.round(this.numEnemies * 1.25);
            this.spawnEnemies(this.numEnemies, enemySpawn1, enemySpawn2, enemySpawn3, enemySpawn4);
            // spawn boss every 3 rounds
            if(this.round % 3 === 0){
                this.spawnBoss(enemySpawn1[0], enemySpawn1[1]);
            }
        }

        this.scoreLabel.text = `Kills: ${this.playerScore.toString()}`;
        this.healthHUD.text = `Health: ${this.player.health.toString()}`;
        this.bulletsHUD.text = `Bullets: ${this.totalAmmo}`;
        console.log(`Round Label ${this.roundLabel.text}`);
        this.roundLabel.text = `Round: ${this.round}`;
        //for alignment and testing
        this.playerHUDMessage.text = "Player Message Here!";
        this.player.body.velocity.x = 0;
        this.player.body.velocity.y = 0;
        
        //environment physics
        this.game.physics.arcade.collide(this.player, this.blockedLayer);
        this.game.physics.arcade.collide(this.enemies, this.blockedLayer);
        this.game.physics.arcade.collide(this.enemies);
        this.game.physics.arcade.collide(this.boss, this.blockedLayer);
        this.game.physics.arcade.overlap(this.boss, this.enemies);
        this.game.physics.arcade.collide(this.blockedLayer, this.activeGun.bullets, this.bulletHitBlock, null, this);

        //pickup physics
        this.game.physics.arcade.overlap(this.player, this.healthPickups, this.pickUpHealth, null, this);
        this.game.physics.arcade.overlap(this.player, this.ammoPickups, this.pickUpAmmo, null, this);


        //combat physics
        this.game.physics.arcade.overlap(this.rifle.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.game.physics.arcade.overlap(this.rifle.bullets, this.boss, this.bulletHitEnemy, null, this);
        if (this.game.time.now - invulnerable > 2000){
            this.game.physics.arcade.collide(this.enemies, this.player, this.enemyHitPlayer, null, this);
            this.game.physics.arcade.collide(this.boss, this.player, this.bossHitPlayer, null, this);
        } else {
            this.game.physics.arcade.overlap(this.enemies, this.player);
        }

        //player controls
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

        // shoot gun
        this.input.onDown.add(this.shootRifle, this);
        this.rifle.onFireLimit.add(this.reloadGun, this);
        
        //call the enemy patrol function
        this.enemies.forEachAlive(this.chase, this, ENEMY_CHASE_SPEED);
        this.boss.forEachAlive(this.chase, this, BOSS_CHASE_SPEED)
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
        invulnerable  = this.game.time.now;
        var emitter = this.game.add.emitter(player.centerX, player.centerY, 25);
        player.damage(30);
        emitter.makeParticles('blood');
        emitter.particleDrag.setTo(150, 150);
        emitter.minParticleSpeed.setTo(-180, -150);
        emitter.maxParticleSpeed.setTo(180, 150);
        emitter.gravity = 0;
        emitter.explode(50, 3);
        if(player.health <= 0){
            this.explosionSound.play();
            emitter.explode(100);
        }
    },
    bossHitPlayer: function(player, boss){
        invulnerable = this.game.time.now;
        var emitter = this.game.add.emitter(player.centerX, player.centerY, 25);
        player.damage(50);
        emitter.makeParticles('blood');
        emitter.particleDrag.setTo(150, 150);
        emitter.minParticleSpeed.setTo(-180, -150);
        emitter.maxParticleSpeed.setTo(180, 150);
        emitter.gravity = 0;
        emitter.explode(50, 3);
        if(player.health <= 0){
            this.explosionSound.play();
            emitter.explode(100);
        }
    },
    spawnHealth: function(x,y){
        this.healthPickups.destroy(true, true);
        let newHealth;
        newHealth = this.healthPickups.create(x, y, 'healthPickup');
        newHealth.scale.setTo(0.15);
    },
    pickUpHealth: function(player, healthPickup){
        healthPickup.destroy();
        if (this.player.health <= (PLAYER_MAX_HEALTH-PICKUP_HEALTH_AMOUNT)){
            this.player.health += PICKUP_HEALTH_AMOUNT;
        } else {
            this.player.health = PLAYER_MAX_HEALTH;
        }
    },
    spawnAmmo: function(x,y){
        this.ammoPickups.destroy(true, true);
        let newAmmo;
        newAmmo = this.ammoPickups.create(x, y, 'ammo');
        newAmmo.scale.setTo(0.15);
    },
    pickUpAmmo: function(player, ammoPickup){
        ammoPickup.destroy();
        if (this.totalAmmo <= (START_BULLETS-PICKUP_AMMO_AMOUNT)){
            this.totalAmmo += PICKUP_AMMO_AMOUNT;
        } else {
            this.totalAmmo = START_BULLETS;
        }
    },
    // enemy movement
    chase: function(enemy, speed){
        //max safe speed 30        
        if (Math.round(enemy.y) == Math.round(this.player.y)) {
            enemy.body.velocity.y = 0;
        } else if (Math.round(enemy.y) > Math.round(this.player.y)){
            enemy.body.velocity.y = -speed;
            if (enemy.body.velocity.x == 0){
                enemy.play('up');
            }
        } else {
            enemy.body.velocity.y = speed;
            if (enemy.body.velocity.x == 0){
                enemy.play('down');
            }
        }
        if (Math.round(enemy.x) == Math.round(this.player.x)) {
            enemy.body.velocity.x = 0;
        } else if (Math.round(enemy.x) > Math.round(this.player.x)){
            enemy.body.velocity.x = -speed;
            if (enemy.body.velocity.y == 0){
                enemy.play('left');
            }
        } else {
            enemy.body.velocity.x = speed;
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
    showHUD: function(score, round){
        var style = { font: '15px Arial', fill: '#fff' };
        this.scoreLabel = this.game.add.text(this.game.width-70, this.game.height-24, score, style);
        this.healthHUD = this.game.add.text(this.game.width-85, this.game.height-40, 'Health: ' + this.player.health.toString(), style);
        this.bulletsHUD = this.game.add.text(this.game.width-85, this.game.height-58, 'Bullets: ' + this.totalAmmo.toString(), style);
        this.roundLabel = this.game.add.text(this.game.width-85, this.game.height-75, "Round: " + this.round.toString(), style);
        this.playerHUDMessage = this.game.add.text(this.game.width-350, this.game.height-24, "Message", style);
        this.scoreLabel.fixedToCamera = true;
        this.healthHUD.fixedToCamera = true;
        this.bulletsHUD.fixedToCamera = true;
        this.roundLabel.fixedToCamera = true;
        this.playerHUDMessage.fixedToCamera = true;
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
