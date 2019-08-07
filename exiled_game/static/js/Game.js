var Exiled = Exiled || {};
Exiled.Game = function(){};
var random = new Phaser.RandomDataGenerator()
var invulnerable = 0;
var waveClearTime = 0;
var restTime = false;
var roundTextTimer = 0;

// find enemy spawn points
var enemySpawn1 = [2017, 721];
var enemySpawn2 = [290, 767];
var enemySpawn3 = [1205, 553];
var enemySpawn4 = [958, 962];

var ENEMY_CHASE_SPEED = random.integerInRange(24, 30);
const BOSS_CHASE_SPEED = 17;
const PLAYER_SPEED = 100;
var ENEMY_NUMBER = 2;
const START_BULLETS = 100;
const HEALTH_SPAWN = [526, 621];
const AMMO_SPAWN = [433, 621];
const PLAYER_MAX_HEALTH = 100;
const PICKUP_HEALTH_AMOUNT = 30;
const PICKUP_AMMO_AMOUNT = 60;
var currentMessage = '';
const ROUND_DELAY_MS = 10000;
const ITEM_DELAY_MS = 1000;

var is_game_over = false;

//temp for testing
// var enemySpawn1 = [290, 767];
// var enemySpawn3 = [290, 767];
// var enemySpawn4 = [290, 767];
//var ENEMY_NUMBER = 1;



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
        this.groundLayer.resizeWorld();

        this.timer = new Phaser.Timer(this.game, false);

        // find player spawn point
        var playerSpawn = this.findObjectsByType('playerStart', this.map, 'objectLayer');
        
        // create player
        // this.player = this.game.add.sprite(playerSpawn[0].x + 50, playerSpawn[0].y, 'player');
        // this.player.scale.setTo(0.7);
        // this.player.animations.add('left', [6,14], 10, true);
        // this.player.animations.add('right', [2,10], 10, true);
        // this.player.animations.add('up', [4,12], 10, true);
        // this.player.animations.add('down', [0,8], 10, true);
        // this.player.animations.add('up-left', [5,13], 10, true);
        // this.player.animations.add('up-right', [3,11], 10, true);
        // this.player.animations.add('down-left', [7,15], 10, true);
        // this.player.animations.add('down-right', [1,9], 10, true);
        this.player = this.game.add.sprite(playerSpawn[0].x + 50, playerSpawn[0].y, 'zPlayer');
        this.player.anchor.setTo(0.5, 0.5);
        this.player.animations.add('up', [0,1,2,3,4,5], 10, true);
        this.player.animations.add('left', [0,1,2,3,4,5], 10, true);
        this.player.animations.add('down', [0,1,2,3,4,5], 10, true);
        this.player.animations.add('right', [0,1,2,3,4,5], 10, true);
        this.player.animations.add('up-left', [0,1,2,3,4,5], 10, true);
        this.player.animations.add('up-right', [0,1,2,3,4,5], 10, true);
        this.player.animations.add('down-left', [0,1,2,3,4,5], 10, true);
        this.player.animations.add('down-right', [0,1,2,3,4,5], 10, true);

        this.player.scale.setTo(0.1);
        this.game.physics.arcade.enable(this.player);
        this.player.body.collideWorldBounds = true;
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
        this.enter = this.game.input.keyboard.addKey(Phaser.KeyCode.ENTER);


        // create sounds
        this.zombieDeathSound = this.game.add.audio('zombieDeath');
        this.collectSound = this.game.add.audio('collect');
        this.rifleShot = this.game.add.audio('laser_shot');
        this.knifeAttack = this.game.add.audio('knifeAttack');
        this.shellFalling = this.game.add.audio('shell_falling');
        this.chargeUp = this.game.add.audio('charge_up');
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
        // newEnemy.anchor.setTo(0.5, 0.5);

        for(let i=0; i<numEnemies; i++){
            newEnemy = this.enemies.create(spawn1[0]+random.integerInRange(-24, 24), spawn1[1]+random.integerInRange(-24, 24), 'zombie');
            newEnemy.scale.setTo(0.07);
            newEnemy.animations.add('walk', [0,1,2,3,4,5,6,7,8], 5, true);
            // newEnemy.animations.add('left', [0,1], 5, true);
            // newEnemy.animations.add('right', [4,5], 5, true);
            // newEnemy.animations.add('up', [6,7], 5, true);
            // newEnemy.animations.add('down', [2,3], 5, true);
            newEnemy.health = 45;
            newEnemy.play('walk');
        }
        for(let i=0; i<numEnemies; i++){
            newEnemy = this.enemies.create(spawn2[0]+random.integerInRange(-24, 24), spawn2[1]+random.integerInRange(-24, 24), 'zombie');
            newEnemy.scale.setTo(0.07);
            newEnemy.animations.add('walk', [0,1,2,3,4,5,6,7,8], 5, true);
            // newEnemy.animations.add('left', [0,1], 5, true);
            // newEnemy.animations.add('right', [4,5], 5, true);
            // newEnemy.animations.add('up', [6,7], 5, true);
            // newEnemy.animations.add('down', [2,3], 5, true);
            newEnemy.health = 45;
            newEnemy.play('walk');
        }
        for(let i=0; i<numEnemies; i++){
            newEnemy = this.enemies.create(spawn3[0]+random.integerInRange(-24, 24), spawn3[1]+random.integerInRange(-24, 24), 'zombie');
            newEnemy.scale.setTo(0.07);
            newEnemy.animations.add('walk', [0,1,2,3,4,5,6,7,8], 5, true);
            // newEnemy.animations.add('left', [0,1], 5, true);
            // newEnemy.animations.add('right', [4,5], 5, true);
            // newEnemy.animations.add('up', [6,7], 5, true);
            // newEnemy.animations.add('down', [2,3], 5, true);
            newEnemy.health = 45;
            newEnemy.play('walk');
        }
        for(let i=0; i<numEnemies; i++){
            newEnemy = this.enemies.create(spawn4[0]+random.integerInRange(-24, 24), spawn4[1]+random.integerInRange(-24, 24), 'zombie');
            newEnemy.scale.setTo(0.07);
            newEnemy.animations.add('walk', [0,1,2,3,4,5,6,7,8], 5, true);
            // newEnemy.animations.add('left', [0,1], 5, true);
            // newEnemy.animations.add('right', [4,5], 5, true);
            // newEnemy.animations.add('up', [6,7], 5, true);
            // newEnemy.animations.add('down', [2,3], 5, true);
            newEnemy.health = 45;
            newEnemy.play('walk');
        }
    },
    spawnBoss: function(x, y){
        let newBoss;
        // need sprite for boss
        newBoss = this.boss.create(x, y, 'ZBoss');
        newBoss.animations.add('walk', [0,1,2,3,4,5], 5, true);
        newBoss.play('walk');
        newBoss.scale.set(.05);
        newBoss.anchor.setTo(0.5, 0.5);
        newBoss.health = 200;
    },
    update: function() {
        if(!this.enemies.getFirstAlive() && !this.boss.getFirstAlive()){
            currentMessage = `Wave Clear! New Round in ${Math.round((ROUND_DELAY_MS - (this.game.time.now - waveClearTime))/1000)}`;
            if(!restTime){
                //spawn health and ammo
                restTime = true;
                waveClearTime = this.game.time.now;
                this.spawnHealth(HEALTH_SPAWN[0], HEALTH_SPAWN[1]);
                this.spawnAmmo(AMMO_SPAWN[0], AMMO_SPAWN[1]);
            }
            if (this.game.time.now - waveClearTime > ROUND_DELAY_MS){
                //end rest time and spawn enemies
                restTime = false;
                currentMessage = "Fight!";
                this.numEnemies = Math.round(this.numEnemies * 1.25);
                this.round += 1;
                this.numEnemies = Math.round(this.numEnemies * 1.25);
                this.spawnEnemies(this.numEnemies, enemySpawn1, enemySpawn2, enemySpawn3, enemySpawn4);
                // spawn boss every 3 rounds
                if(this.round % 3 === 0){
                    this.spawnBoss(enemySpawn1[0], enemySpawn1[1]);
                }
            }
        }

        this.scoreLabel.text = `Kills: ${this.playerScore.toString()}`;
        this.healthHUD.text = `Health: ${this.player.health.toString()}`;
        this.bulletsHUD.text = `Energy: ${this.totalAmmo}`;
        //console.log(`Round Label ${this.roundLabel.text}`);
        this.roundLabel.text = `Round: ${this.round}`;
        //for alignment and testing
        this.playerHUDMessage.text = currentMessage;
        this.player.body.velocity.x = 0;
        this.player.body.velocity.y = 0;
        
        //environment physics
        this.game.physics.arcade.collide(this.player, this.blockedLayer);
        this.game.physics.arcade.collide(this.enemies, this.blockedLayer);
        this.game.physics.arcade.collide(this.enemies);
        this.game.physics.arcade.collide(this.boss, this.blockedLayer);
        this.game.physics.arcade.overlap(this.boss, this.enemies);
        this.game.physics.arcade.collide(this.blockedLayer, this.activeGun.bullets, this.bulletHitBlock, null, this);

        //pickup physics - needs item delay for scaling bug
        if(this.game.time.now - waveClearTime > ITEM_DELAY_MS){
            this.game.physics.arcade.overlap(this.player, this.healthPickups, this.pickUpHealth, null, this);
            this.game.physics.arcade.overlap(this.player, this.ammoPickups, this.pickUpAmmo, null, this);
        }


        //combat physics
        this.game.physics.arcade.overlap(this.rifle.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.game.physics.arcade.overlap(this.rifle.bullets, this.boss, this.bulletHitEnemy, null, this);
        if (this.game.time.now - invulnerable > 2000){
            this.game.physics.arcade.collide(this.enemies, this.player, this.enemyHitPlayer, null, this);
            this.game.physics.arcade.collide(this.boss, this.player, this.bossHitPlayer, null, this);
        } else {
            this.game.physics.arcade.overlap(this.enemies, this.player);
        }

        //player facing
        this.playerTurnToFace();

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
                this.player.angle = 135;
            } else if(down){
                this.player.body.velocity.y = PLAYER_SPEED;
                this.player.body.velocity.x = -PLAYER_SPEED;
                this.player.play('down-left');
                this.player.angle = 45;
            } else {
                this.player.body.velocity.x = -PLAYER_SPEED;
                this.player.play('left');
                this.player.angle = 90;
            }
        } else if(right) {
            if(up){
                this.player.body.velocity.y = -PLAYER_SPEED;
                this.player.body.velocity.x = PLAYER_SPEED;
                this.player.play('up-right');
                this.player.angle = 225;
            } else if(down){
                this.player.body.velocity.y = PLAYER_SPEED;
                this.player.body.velocity.x = PLAYER_SPEED;
                this.player.play('down-right');
                this.player.angle = 315;
            } else {
                this.player.body.velocity.x = PLAYER_SPEED;
                this.player.play('right');
                this.player.angle = 270;
            }
        } else if(up){
            if(right){
                this.player.body.velocity.y = -PLAYER_SPEED;
                this.player.body.velocity.x = PLAYER_SPEED;
                this.player.play('up-right');
                this.player.angle = 225;
            } else if(left){
                this.player.body.velocity.y = -PLAYER_SPEED;
                this.player.body.velocity.x = -PLAYER_SPEED;
                this.player.play('up-left');
                this.player.angle = 135;
            } else {
                this.player.body.velocity.y = -PLAYER_SPEED;
                this.player.play('up');
                this.player.angle = 180;
            }
        } else if(down){
            if(right){
                this.player.body.velocity.y = PLAYER_SPEED;
                this.player.body.velocity.x = PLAYER_SPEED;
                this.player.play('down-right');
                this.player.angle = 315;
            } else if(left){
                this.player.body.velocity.y = PLAYER_SPEED;
                this.player.body.velocity.x = -PLAYER_SPEED;
                this.player.play('down-left');
                this.player.angle = 25;
            } else {
                this.player.body.velocity.y = PLAYER_SPEED;
                this.player.play('down');
                this.player.angle = 0;
            }
        } else {
            this.player.animations.stop();
        }

        // shoot gun
        this.input.onDown.add(this.shootRifle, this);
        this.rifle.onFireLimit.add(this.reloadGun, this);
        
        //call the enemy patrol function
        this.enemies.forEachAlive(this.chase, this, ENEMY_CHASE_SPEED);
        this.boss.forEachAlive(this.chase, this, BOSS_CHASE_SPEED);

        this.player.events.onKilled.add(this.gameOver, this)
        if(is_game_over){
            if(this.enter.isDown) {
                this.game.state.start('MainMenu');
            }
        }
    },
    // bullets die when they hit blocks
    bulletHitBlock: function(bullet, block){
        console.log(bullet)
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
            this.zombieDeathSound.play();
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
            this.zombieDeathSound.play();
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
            this.zombieDeathSound.play();
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
        newAmmo = this.ammoPickups.create(x, y, 'energyAmmo');
        newAmmo.scale.setTo(.15);
    },
    pickUpAmmo: function(player, ammoPickup){
        ammoPickup.destroy();
        this.chargeUp.play();
        if (this.totalAmmo <= (START_BULLETS-PICKUP_AMMO_AMOUNT)){
            this.totalAmmo += PICKUP_AMMO_AMOUNT;
        } else {
            this.totalAmmo = START_BULLETS;
        }
    },
    // enemy movement
    chase: function(enemy, speed){
        //max safe speed 30      
        enemy.anchor.setTo(0.5, 0.5); 
        enemy.play('down');

        if (Math.round(enemy.y) == Math.round(this.player.y)) {
            enemy.body.velocity.y = 0;
        } else if (Math.round(enemy.y) > Math.round(this.player.y)){
            enemy.body.velocity.y = -speed;
        } else {
            enemy.body.velocity.y = speed;
        }
        if (Math.round(enemy.x) == Math.round(this.player.x)) {
            enemy.body.velocity.x = 0;
        } else if (Math.round(enemy.x) > Math.round(this.player.x)){
            enemy.body.velocity.x = -speed;
        } else {
            enemy.body.velocity.x = speed;
        }
        this.turnToFace(enemy,this.player);
    },
    shootRifle: function(){
        console.log(this.game.input.activePointer);
        console.log(this.player);
        console.log(this.camera);
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
        this.playerHUDMessage = this.game.add.text(this.game.width-350, this.game.height-24, "", style);
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
    turnToFace: function(sprite, targetSprite){
        //find interior angle
        xDistance = targetSprite.x - sprite.x;
        yDistance = targetSprite.y - sprite.y;
        newAngle = Math.atan2(yDistance,xDistance)*(180/Math.PI);

        //convert to down facing
        sprite.angle = newAngle - 90;
    },
    playerTurnToFace: function(){
        //necessary as a separate function because the pointer x,y
        //is relative to the camera, not the map
        //find angle
        //game.camera.width / 2, game.camera.height / 2
        xDistance = this.input.activePointer.x - (this.game.camera.width / 2);
        yDistance = this.input.activePointer.y - (this.game.camera.height / 2);
        newAngle = Math.atan2(yDistance,xDistance)*(180/Math.PI);

        //convert to down facing
        this.player.angle = newAngle - 90;
    },
    gameOver: function(){
        // stop all sounds. window alerts mess them up
        this.zombieDeathSound.stop();
        this.collectSound.stop();
        this.rifleShot.stop();
        this.knifeAttack.stop();
        this.shellFalling.stop();

        is_game_over = true;
        var text = "GAME OVER";
        var style = { font: "30px Arial", fill: "#fff", align: "center" };
        var t = this.game.add.text(this.game.width/2, this.game.height/2, text, style);
        t.anchor.set(0.5);
        t.fixedToCamera = true;
        // get high scores from db
        let results = []
        fetch('http://127.0.0.1:8000/api/all_scores')
        .then(function (response) {
            return response.json()
        })
        .then(function (data) {
            for (let key of data) {
                results.push(key)
            }
            // console.log(results);
            results.sort(function(a, b){
                return a.score-b.score;
            })
            results.reverse();
            if(results.findIndex(x => x.score === this.playerScore) <= 10){
                alert("Congratulations. Your score is in the top 10!");
            }
        })
        
        let name = prompt('Enter your name to save score: ');
        name = name.slice(0, 10);
        let scoreDict = {
            "score": this.playerScore,
            "name": name
        }
        // post new score to db
        fetch('http://127.0.0.1:8000/api/all_scores', {
            method: 'POST',
            body: JSON.stringify(scoreDict),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(res => res.json())
            .then(response => console.log('Success:', JSON.stringify(response)))
            .catch(error => console.error('Error:', error));
        
        var text2 = "Press ENTER to return to Main Menu";
        var style2 = { font: "26px Arial", fill: "#fff", align: "center" };
        var t2 = this.game.add.text(this.game.width/2, this.game.height/2 + 50, text2, style2);
        t2.anchor.set(0.5);
        t2.fixedToCamera = true;
    }
}
