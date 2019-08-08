var Exiled = Exiled || {};
Exiled.Game = function(){};
var random = new Phaser.RandomDataGenerator()
var invulnerable = 0;
var waveClearTime = 0;
var restTime = false;
var spawnTimer = 0;
var numSpawnsThisRd = 0;
var moveDelay = 0;
var takeHitFlashTime = 0;

// find enemy spawn points
var enemySpawn1 = [752, 17.5];
var enemySpawn2 = [37.5, 600];
var enemySpawn3 = [777, 1134];
var enemySpawn4 = [498, 586];

const DIALOG_DELAY = 3000;
var DIALOG_TIMESTAMP = 0;
const BULLET_SPEED = 2500;
const KNIFE_SPEED = 1000;
var MAX_CHASE_SPEED = 30;
var ENEMY_CHASE_SPEED = 24;
const BOSS_CHASE_SPEED = 16;
const PLAYER_SPEED = 100;
var ENEMY_NUMBER = 2;
const START_BULLETS = 120;
const HEALTH_SPAWN = [737, 592];
const AMMO_SPAWN = [789, 592];
const PLAYER_MAX_HEALTH = 100;
const PICKUP_HEALTH_AMOUNT = 40;
const PICKUP_AMMO_AMOUNT = 80;
var currentMessage = '';
const ROUND_DELAY_MS = 10000;
const ITEM_DELAY_MS = 1000;
var recentlyFired = false;
var recentlyFiredTimer = 0;
const RECENTLY_FIRED_DELAY = 500;
var CURRENT_WEAPON = 'gun';
const SURVIVOR_SPAWN = [75, 600];
const SURVIVOR_SPEED = 100;
const SURVIVOR_DROP_TRIGGER_X = 763;
var pickupsSpawned = false;
var PICKUP_TIMER = 0;

var dialogBox = document.querySelector('#dialog');
var dialogContent = document.querySelector('#dialog-content');
var playerImage = document.querySelector('#player-picture');
var survivorImage = document.querySelector('#survivor-picture');


var KILLS = 0;

var is_game_over = false;


Exiled.Game.prototype = {
    create: function() {
        // create map
        this.map = this.game.add.tilemap('map');
        this.map.addTilesetImage('oryx_16bit_scifi_world', 'world');
        this.groundLayer = this.map.createLayer('groundLayer');
        this.detailLayer2 = this.map.createLayer('detailLayer2');
        this.detailLayer = this.map.createLayer('detailLayer');
        this.blockedLayer = this.map.createLayer('blockedLayer');
        
        this.map.setCollisionBetween(1, 1020, true, 'blockedLayer');
        this.groundLayer.resizeWorld();

        this.timer = new Phaser.Timer(this.game, false);
        
        // create player
        this.player = this.game.add.sprite(770, 599, 'zPlayer');
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

        //create group for survivors
        this.survivors = this.game.add.group();
        this.survivors.enableBody = true;
        //this.survivors.physicsBodyType = Phaser.Physics.ARCADE;
        //this.spawnSurvivor();

        // create enemies
        // this is the number of enemies per spawn point. currently we have 4 so this number would be quarter the number of enemies in a round.
        this.numEnemies = ENEMY_NUMBER; 
        this.enemies = this.game.add.group();
        this.enemies.enableBody = true;
        this.enemies.physicsBodyType = Phaser.Physics.ARCADE;
        // spawns 1 enemy at each spawn point, numEnemies times, with a 3 sec delay in between
        for(let timesSpawned = 0; timesSpawned <= this.numEnemies; timesSpawned++){
            if(this.game.time.now - spawnTimer > 3000){
                this.spawnEnemies(1, enemySpawn1, enemySpawn2, enemySpawn3, enemySpawn4);
            }
        }
        numSpawnsThisRd++;
        this.spawnEnemies(1, enemySpawn1, enemySpawn2, enemySpawn3, enemySpawn4);
        // we will keep track of different types of enemies' stats in this object (e.g. speed, health, etc)
        this.enemies.stats = {};
        // create boss
        this.boss = this.game.add.group();
        this.boss.enableBody = true;
        this.boss.physicsBodyType = Phaser.Physics.ARCADE;

        // create controls
        this.game.input.keyboard.removeKey(Phaser.KeyCode.ENTER);
        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.upKey = this.game.input.keyboard.addKey(Phaser.KeyCode.W);
        this.downKey = this.game.input.keyboard.addKey(Phaser.KeyCode.S);
        this.leftKey = this.game.input.keyboard.addKey(Phaser.KeyCode.A);
        this.rightKey = this.game.input.keyboard.addKey(Phaser.KeyCode.D);
        this.returnToMenu = this.game.input.keyboard.addKey(Phaser.KeyCode.ENTER);
        this.switchWeaponKey = this.game.input.keyboard.addKey(Phaser.KeyCode.E);
        this.pauseKey = this.game.input.keyboard.addKey(Phaser.KeyCode.ESC);

        // create sounds
        this.collectSound = this.game.add.audio('collect');
        this.rifleShot = this.game.add.audio('laser_shot');
        this.knifeAttack = this.game.add.audio('knifeAttack');
        this.shellFalling = this.game.add.audio('shell_falling');
        this.chargeUp = this.game.add.audio('charge_up');
        this.shellFalling.allowMultiple = false;
        this.zombieDeathSound = this.game.add.audio('zombieDeath');
        this.zombieDeathSound.volume = 0.4;
        
        // emitter
        this.damageEmitter = this.game.add.emitter(0, 0, 25);
        this.damageEmitter.makeParticles('blood');
        this.damageEmitter.particleDrag.setTo(150, 150);
        this.damageEmitter.minParticleSpeed.setTo(-180, -150);
        this.damageEmitter.maxParticleSpeed.setTo(180, 150);
        this.damageEmitter.gravity = 0;

        // player's gun
        this.rifle = this.add.weapon(10, 'bullet');
        this.rifle.fireRate = 500;
        this.rifle.bulletRotateToVelocity = true;
        this.magCap = 10;
        this.totalAmmo = START_BULLETS;
        this.rifle.bulletSpeed = BULLET_SPEED;
        this.activeGun = this.rifle;

        this.round = 1;
        this.openingDialog();
    },
    openingDialog: function(){
        playerImage.style.display = "block";
        survivorImage.style.display = "none";
        dialogContent.innerText = "I have to clear out these zombies to let the survivors escape.";
        dialogBox.style.display="flex";
        DIALOG_TIMESTAMP = this.game.time.now;
    },
    closeDialogBox: function(){
        dialogContent.innerText = "";
        dialogBox.style.display="none";
    },
    betweenRoundPlayerDialog: function(){
        playerImage.style.display = "block";
        survivorImage.style.display = "none";
        dialogContent.innerText = "The coast is clear! Run for the shuttle!";
        dialogBox.style.display="flex";
        DIALOG_TIMESTAMP = this.game.time.now;
    },
    betweenRoundSurvivorDialog: function(){
        playerImage.style.display = "none";
        survivorImage.style.display = "block";
        dialogContent.innerText = "Thank you! Take this!";
        dialogBox.style.display="flex";
        DIALOG_TIMESTAMP = this.game.time.now;
    },
    switchWeapon: function() {
        if (CURRENT_WEAPON == 'gun'){
            CURRENT_WEAPON = 'knife';
            this.createKnifePlayer();
        } else {
            CURRENT_WEAPON = 'gun';
            this.createGunPlayer();
        }
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
    // moved into function so it can easily be called at the beginning of a new round
    // creates @param numEnemies enemies at each spawn point on the map
    spawnEnemies: function(numEnemies, spawn1, spawn2, spawn3, spawn4){
        //small bug patch
        invulnerable  = this.game.time.now;
        let newEnemy;
        // newEnemy.anchor.setTo(0.5, 0.5);

        for(let i=0; i<numEnemies; i++){
            newEnemy = this.enemies.create(spawn1[0], spawn1[1], 'zombie');
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
            newEnemy = this.enemies.create(spawn2[0], spawn2[1], 'zombie');
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
            newEnemy = this.enemies.create(spawn3[0], spawn3[1], 'zombie');
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
            newEnemy = this.enemies.create(spawn4[0], spawn4[1], 'zombie');
            newEnemy.scale.setTo(0.07);
            newEnemy.animations.add('walk', [0,1,2,3,4,5,6,7,8], 5, true);
            // newEnemy.animations.add('left', [0,1], 5, true);
            // newEnemy.animations.add('right', [4,5], 5, true);
            // newEnemy.animations.add('up', [6,7], 5, true);
            // newEnemy.animations.add('down', [2,3], 5, true);
            newEnemy.health = 45;
            newEnemy.play('walk');
        }
        this.enemies.forEach(this.killOobZombies, this);
        spawnTimer = this.game.time.now;
    },
    spawnBoss: function(x, y){
        invulnerable  = this.game.time.now;
        let newBoss;
        // need sprite for boss
        newBoss = this.boss.create(x, y, 'ZBoss');
        newBoss.animations.add('walk', [0,1,2,3,4,5], 5, true);
        newBoss.play('walk');
        newBoss.scale.set(.07);
        newBoss.anchor.setTo(0.5, 0.5);
        newBoss.health = 300;
    },
    createKnifePlayer: function(){
        playerX = this.player.x;
        playerY = this.player.y;
        health = this.player.health;
        this.oldPlayer = this.player;
        this.player = this.game.add.sprite(playerX, playerY, 'zPlayer_knife');
        //super delete oldPlayer here
        this.oldPlayer.destroy();
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
        this.player.health = health;
        this.game.camera.follow(this.player);
        
        this.rifle = this.add.weapon(10, 'knife_slash');
        this.rifle.fireRate = 250;
        this.rifle.bulletRotateToVelocity = true;
        this.magCap = 10;
        //this.totalAmmo = START_BULLETS;
        this.rifle.bulletSpeed = BULLET_SPEED;
        this.activeGun = this.rifle;
    },
    createGunPlayer: function(){
        playerX = this.player.x;
        playerY = this.player.y;
        health = this.player.health;
        this.oldPlayer = this.player;
        this.player = this.game.add.sprite(playerX, playerY, 'zPlayer');
        //super delete oldPlayer here
        this.oldPlayer.destroy();
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
        this.player.health = health;
        this.game.camera.follow(this.player);

        this.rifle = this.add.weapon(10, 'bullet');
        this.rifle.fireRate = 250;
        this.rifle.bulletRotateToVelocity = true;
        this.magCap = 10;
        //this.totalAmmo = START_BULLETS;
        this.rifle.bulletSpeed = BULLET_SPEED;
        this.activeGun = this.rifle;
    },
    killOobZombies: function(enemy){
        enemy.checkWorldBounds = true;
        enemy.outOfBoundsKill = true;
    },
    update: function() {
        //console.log(`${this.player.x}, ${this.player.y}`);
        //update HUD
        document.querySelector('#HUD').innerHTML = `<p>Energy: ${this.totalAmmo}</p>
        <p>Health: ${this.player.health}</p>
        <p>Round: ${this.round}</p>
        <p>Kills: ${KILLS}</p>
        <p>Score: ${this.playerScore}</p>
        <p>${currentMessage}</p>`;
        //close dialog box after delay
        if(this.game.time.now - DIALOG_TIMESTAMP > DIALOG_DELAY){
            this.closeDialogBox();
        }
        //check for end of wave and react
        //check for end of wave and setup new rd
        if(!this.enemies.getFirstAlive() && !this.boss.getFirstAlive()){
            numSpawnsThisRd = 0;
            currentMessage = `New round beginning in ${Math.round((ROUND_DELAY_MS - (this.game.time.now - waveClearTime))/1000)}`;
            this.enemies.forEach(this.annihilate, this);
            this.boss.forEach(this.annihilate, this);
            if(!restTime){
                //call to the survivor
                this.betweenRoundPlayerDialog();
                //spawn health and ammo
                this.spawnSurvivor();
                restTime = true;
                waveClearTime = this.game.time.now;
            }
            if(this.newSurvivor && this.newSurvivor.x > SURVIVOR_DROP_TRIGGER_X && !pickupsSpawned){
                this.betweenRoundSurvivorDialog();
                PICKUP_TIMER = this.game.time.now;
                this.spawnHealth(HEALTH_SPAWN[0], HEALTH_SPAWN[1]);
                this.spawnAmmo(AMMO_SPAWN[0], AMMO_SPAWN[1]);
                pickupsSpawned = true;
            }
            if (this.game.time.now - waveClearTime > ROUND_DELAY_MS){
                //end rest time and spawn enemies
                restTime = false;
                pickupsSpawned = false;
                currentMessage = "";
                if(this.round % 2 === 0){
                    this.numEnemies += 1;
                }
                // if(this.round % 4 === 0){
                //     MAX_CHASE_SPEED
                // }
                this.round += 1;
                // spawns 1 enemy at each spawn point, numEnemies times, with a 3 sec delay in between
                for(let timesSpawned = 0; timesSpawned <= this.numEnemies; timesSpawned++){
                    if(this.game.time.now - spawnTimer > 3000){
                        this.spawnEnemies(1, enemySpawn1, enemySpawn2, enemySpawn3, enemySpawn4);
                    }
                }
                numSpawnsThisRd++;    
                // spawn boss every 3 rounds
                if(this.round % 3 === 0){
                    this.spawnBoss(enemySpawn1[0], enemySpawn1[1]);
                    if(this.round > 6){
                        this.spawnBoss(enemySpawn2[0], enemySpawn2[1]);
                    }
                }
                if(this.round === 4 || this.round === 7 || this.round === 10){
                    ENEMY_CHASE_SPEED += 2;
                }
            }
        }
        // spawns more enemies w/in round when there are only 2 enemies left
        if(this.enemies.countLiving() <= 2 && numSpawnsThisRd !== 0 && numSpawnsThisRd <= 3){
            let tlSpawn = [this.player.centerX - (this.game.camera.width/2 - 1), this.player.centerY - (this.game.camera.height/2 - 1)];
            let trSpawn = [this.player.centerX - (this.game.camera.width/2 - 1), this.player.centerY + (this.game.camera.height/2 - 1)];
            let blSpawn = [this.player.centerX + (this.game.camera.width/2 - 1), this.player.centerY - (this.game.camera.height/2 - 1)];
            let brSpawn = [this.player.centerX + (this.game.camera.width/2 - 1), this.player.centerY + (this.game.camera.height/2 - 1)];

            // spawns 1 enemy at each spawn point, numEnemies times, with a 3 sec delay in between
            for(let timesSpawned = 0; timesSpawned <= this.numEnemies; timesSpawned++){
                if(this.game.time.now - spawnTimer > 3000){
                    this.spawnEnemies(1, tlSpawn, trSpawn, blSpawn, brSpawn);
                }
            }
            numSpawnsThisRd++; 
        }

        //update HUD (old)
        // this.scoreLabel.text = `Kills: ${this.playerScore.toString()}`;
        // this.healthHUD.text = `Health: ${this.player.health.toString()}`;
        // this.bulletsHUD.text = `Energy: ${this.totalAmmo}`;
        // this.roundLabel.text = `Round: ${this.round}`;
        // this.playerHUDMessage.text = currentMessage;

        //stop the player if they're not moving
        this.player.body.velocity.x = 0;
        this.player.body.velocity.y = 0;
        
        //environment physics
        this.game.physics.arcade.collide(this.player, this.blockedLayer);
        this.game.physics.arcade.collide(this.enemies, this.blockedLayer);
        this.game.physics.arcade.collide(this.enemies);
        this.game.physics.arcade.collide(this.boss, this.blockedLayer);
        this.game.physics.arcade.overlap(this.boss, this.enemies);
        this.game.physics.arcade.collide(this.blockedLayer, this.activeGun.bullets, this.bulletHitBlock, null, this);

        //survivor removal
        if (this.newSurvivor && this.newSurvivor.x >= 1483) {
            this.removeSurvivor();
        }
        
        //pickup physics - needs item delay for scaling bug
        if(this.game.time.now - PICKUP_TIMER > ITEM_DELAY_MS){
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
        
        //choose correct weapon
        this.switchWeaponKey.onDown.add(this.switchWeapon, this);

        if(CURRENT_WEAPON == 'gun' && this.totalAmmo == 0){
            CURRENT_WEAPON = 'knife';
            this.createKnifePlayer();
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
                if(this.game.time.now - recentlyFiredTimer > RECENTLY_FIRED_DELAY){
                    this.player.angle = 135;
                }
            } else if(down){
                this.player.body.velocity.y = PLAYER_SPEED;
                this.player.body.velocity.x = -PLAYER_SPEED;
                this.player.play('down-left');
                if(this.game.time.now - recentlyFiredTimer > RECENTLY_FIRED_DELAY){
                    this.player.angle = 45;
                }
            } else {
                this.player.body.velocity.x = -PLAYER_SPEED;
                this.player.play('left');
                if(this.game.time.now - recentlyFiredTimer > RECENTLY_FIRED_DELAY){
                    this.player.angle = 90;
                }
            }
        } else if(right) {
            if(up){
                this.player.body.velocity.y = -PLAYER_SPEED;
                this.player.body.velocity.x = PLAYER_SPEED;
                this.player.play('up-right');
                if(this.game.time.now - recentlyFiredTimer > RECENTLY_FIRED_DELAY){
                    this.player.angle = 225;
                }
            } else if(down){
                this.player.body.velocity.y = PLAYER_SPEED;
                this.player.body.velocity.x = PLAYER_SPEED;
                this.player.play('down-right');
                if(this.game.time.now - recentlyFiredTimer > RECENTLY_FIRED_DELAY){
                    this.player.angle = 315;
                }
            } else {
                this.player.body.velocity.x = PLAYER_SPEED;
                this.player.play('right');
                if(this.game.time.now - recentlyFiredTimer > RECENTLY_FIRED_DELAY){
                    this.player.angle = 270;
                }
            }
        } else if(up){
            if(right){
                this.player.body.velocity.y = -PLAYER_SPEED;
                this.player.body.velocity.x = PLAYER_SPEED;
                this.player.play('up-right');
                if(this.game.time.now - recentlyFiredTimer > RECENTLY_FIRED_DELAY){
                    this.player.angle = 225;
                }
            } else if(left){
                this.player.body.velocity.y = -PLAYER_SPEED;
                this.player.body.velocity.x = -PLAYER_SPEED;
                this.player.play('up-left');
                if(this.game.time.now - recentlyFiredTimer > RECENTLY_FIRED_DELAY){
                    this.player.angle = 135;
                }
            } else {
                this.player.body.velocity.y = -PLAYER_SPEED;
                this.player.play('up');
                if(this.game.time.now - recentlyFiredTimer > RECENTLY_FIRED_DELAY){
                    this.player.angle = 180;
                }
            }
        } else if(down){
            if(right){
                this.player.body.velocity.y = PLAYER_SPEED;
                this.player.body.velocity.x = PLAYER_SPEED;
                this.player.play('down-right');
                if(this.game.time.now - recentlyFiredTimer > RECENTLY_FIRED_DELAY){
                    this.player.angle = 315;
                }
            } else if(left){
                this.player.body.velocity.y = PLAYER_SPEED;
                this.player.body.velocity.x = -PLAYER_SPEED;
                this.player.play('down-left');
                if(this.game.time.now - recentlyFiredTimer > RECENTLY_FIRED_DELAY){
                    this.player.angle = 25;
                }
            } else {
                this.player.body.velocity.y = PLAYER_SPEED;
                this.player.play('down');
                if(this.game.time.now - recentlyFiredTimer > RECENTLY_FIRED_DELAY){
                    this.player.angle = 0;
                }
            }
        } else {
            this.player.animations.stop();
        }

        // shoot gun
        this.input.onDown.add(this.shootRifle, this);
        this.rifle.onFireLimit.add(this.reloadGun, this);
        
        //call the enemy patrol function
        // this.enemies.forEachAlive(this.chase, this, ENEMY_CHASE_SPEED);
        // this.boss.forEachAlive(this.chase, this, BOSS_CHASE_SPEED);
        if(this.game.time.now - moveDelay > 800){
            this.enemies.forEachAlive(this.chase, this, ENEMY_CHASE_SPEED);
            this.boss.forEachAlive(this.chase, this, BOSS_CHASE_SPEED);
        }

        if(this.game.time.now - takeHitFlashTime > 100){
            this.player.tint = 0xFFFFFF;
        }
        this.player.events.onKilled.add(this.gameOver, this)
        
        this.pauseKey.onDown.add(this.pauseGame, this);

        if(is_game_over){
            if(this.returnToMenu.isDown) {
                document.querySelector("#scoresubmit").style.display = 'none';
                this.game.state.start('Boot');
            }
        }
    },
    // bullets die when they hit blocks
    bulletHitBlock: function(bullet, block){
        //console.log(bullet)
        bullet.kill();
    },
    // handles bullet collision with enemy
    bulletHitEnemy: function(bullet, enemy){
        this.damageEmitter.x = enemy.centerX;
        this.damageEmitter.y = enemy.centerY;
        bullet.kill();
        enemy.damage(15);
        this.playerScore += 10;
        this.damageEmitter.explode(50, 3);
        if(enemy.health <= 0){
            this.zombieDeathSound.play()
            this.damageEmitter.explode(100);
            this.playerScore += 100;
            KILLS++;
        }
    },
    enemyHitPlayer: function(player, enemy){
        invulnerable  = this.game.time.now;
        takeHitFlashTime = this.game.time.now;
        player.tint = 0xff0000;
        this.damageEmitter.x = player.centerX;
        this.damageEmitter.y = player.centerY;
        player.damage(30);
        this.damageEmitter.explode(50, 3);
        if(player.health <= 0){
            this.damageEmitter.explode(100);
        }
    },
    bossHitPlayer: function(player, boss){
        invulnerable = this.game.time.now;
        player.tint = 0xff0000;
        this.damageEmitter.x = player.centerX;
        this.damageEmitter.y = player.centerY;
        player.damage(50);
        this.damageEmitter.explode(50, 3);
        if(player.health <= 0){
            this.zombieDeathSound.play();
            this.damageEmitter.explode(100);
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
    spawnSurvivor: function(){
        // newBoss = this.boss.create(x, y, 'ZBoss');
        // newBoss.animations.add('walk', [0,1,2,3,4,5], 5, true);
        // newBoss.play('walk');
        // newBoss.scale.set(.05);
        this.survivors.destroy(true, true);
        this.newSurvivor = this.survivors.create(SURVIVOR_SPAWN[0], SURVIVOR_SPAWN[1], 'survivor');
        this.newSurvivor.animations.add('walk', [0, 1, 2, 3, 4, 5], 8, true);
        this.newSurvivor.play('walk');
        this.newSurvivor.scale.setTo(0.4);
        this.newSurvivor.body.velocity.x = SURVIVOR_SPEED;
        this.newSurvivor.angle = 90;
    },
    removeSurvivor: function(){
        this.survivors.destroy(true, true);
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
        moveDelay = this.game.time.now;
    },
    shootRifle: function(){
        recentlyFired = true;
        recentlyFiredTimer = this.game.time.now;
        this.rifle.x = this.player.centerX;
        this.rifle.y = this.player.centerY;
        if(this.totalAmmo > 0 && CURRENT_WEAPON == 'gun'){
            //this.rifle.bulletSpeed = BULLET_SPEED;
            this.rifle.bulletKillType = Phaser.Weapon.KILL_NEVER;
            this.rifle.fireAtPointer(this.game.input.activePointer);
            this.rifleShot.play();
            this.totalAmmo -= 1;
        } else {
            //melee attack goes here
            //this.rifle.bulletSpeed = KNIFE_SPEED;
            this.knifeAttack.play();
            this.rifle.bulletKillType = Phaser.Weapon.KILL_DISTANCE;
            this.rifle.bulletKillDistance = 20;
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
            // this.rifle.createBullets(10, 'bullet')
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
    pauseGame: function(){
        if(this.game.paused === true){
            this.game.paused = false;
            return;
        }
        this.game.paused = true;
    },
    annihilate: function(thing){
        thing.destroy();
    },
    gameOver: function(){
        // stop all sounds. window alerts mess them up
        this.zombieDeathSound.stop();
        this.collectSound.stop();
        this.rifleShot.stop();
        this.knifeAttack.stop();
        this.shellFalling.stop();

        this.game.input.keyboard.removeKey(Phaser.KeyCode.W);
        this.game.input.keyboard.removeKey(Phaser.KeyCode.A);
        this.game.input.keyboard.removeKey(Phaser.KeyCode.S);
        this.game.input.keyboard.removeKey(Phaser.KeyCode.D);
        this.game.input.keyboard.removeKey(Phaser.KeyCode.E);
        this.game.input.keyboard.removeKey(Phaser.KeyCode.ESC);
        
        const score = this.playerScore;
        const game_round = this.round;
        const submit = document.querySelector("#scoresubmit");
        const menuButton = document.querySelector('#backToMenu');

        let place;
        submit.style.display = 'block';

        let submitButton = document.querySelector("#submitScore");
        submitButton.addEventListener('click', function(){
            const name = document.querySelector('#searchInput').value;
            console.log(name);
            let scoreDict = {
                "score": score,
                "name": name.toString(),
                "kills": KILLS,
                "game_round": game_round
            }
            console.log(scoreDict)
            // post new score to db
            fetch('/api/all_scores', {
                method: 'POST',
                body: JSON.stringify(scoreDict),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(function(response){
                return response.json();
            })
            .then(function(data){
                place = data.index_of_score;
                if(place <= 10){
                    alert("Congratulations. Your score is in the top 10!");
                }
                location.reload();

            })
        })
    }
}
