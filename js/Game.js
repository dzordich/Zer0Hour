var Exiled = Exiled || {};

Exiled.Game = function(){};

Exiled.Game.prototype = {
    create: function() {
        this.game.world.setBounds(0, 0, 1920, 1920);
        this.background = this.game.add.tileSprite(0, 0, this.game.world.width, this.game.world.height, 'space');

        this.player = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'playership');
        this.player.scale.setTo(2);

        this.player.animations.add('fly', [0, 1, 2, 3], 5, true);
        this.player.animations.play('fly');

        this.game.camera.follow(this.player);

        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.generateCollectables();
        this.generateAsteroids();
        
        this.playerScore = 0;
        
        this.game.physics.arcade.enable(this.player);
        this.playerSpeed = 120;
        this.player.body.collideWorldBounds = true;

        

        this.explosionSound = this.game.add.audio('explosion');
        this.collectSound = this.game.add.audio('collect');
        this.showLabels();
    },
    update: function() {
        this.player.body.velocity.x = 0;
        this.player.body.velocity.y = 0;


        if(this.cursors.up.isDown){
            this.player.body.velocity.y -= 50;
        } else if(this.cursors.down.isDown){
            this.player.body.velocity.y = 50;
        } else {
            this.player.body.velocity.y = 0;
        }
        if(this.cursors.left.isDown){
            this.player.body.velocity.x -= 50;
        } else if(this.cursors.right.isDown){
            this.player.body.velocity.x = 50;
        } else {
            this.player.body.velocity.x = 0;
        }

        this.game.physics.arcade.collide(this.player, this.asteroids, this.hitAsteroid, null, this);
        this.game.physics.arcade.overlap(this.player, this.collectables, this.collect, null, this);
    },
    generateCollectables: function() {
        this.collectables = this.game.add.group();

        this.collectables.enableBody = true;
        this.collectables.physicsBodyType = Phaser.Physics.ARCADE;

        var numCollectables = this.game.rnd.integerInRange(100, 150)
        var collectable;

        for (var i = 0; i < numCollectables; i++){
            collectable = this.collectables.create(this.game.world.randomX, this.game.world.randomY, 'power');
            collectable.animations.add('fly', [0, 1, 2, 3], 5, true);
            collectable.animations.play('fly');

        }
    },
    generateAsteroids: function() {
        this.asteroids = this.game.add.group();

        //enable physics
        this.asteroids.enableBody = true;
        this.asteroids.physicsBodyType = Phaser.Physics.ARCADE;

        var numAsteroids = this.game.rnd.integerInRange(150, 200)
        var asteroid;

        for (var i = 0; i < numAsteroids; i++) {
            asteroid = this.asteroids.create(this.game.world.randomX, this.game.world.randomY, 'rock');
            asteroid.scale.setTo(this.game.rnd.integerInRange(10, 40)/10);
            
            asteroid.body.velocity.x = this.game.rnd.integerInRange(-20, 20);
            asteroid.body.velocity.y = this.game.rnd.integerInRange(-20, 20);
            asteroid.body.immovable = true;
            asteroid.body.collideWorldBounds = true;
        };
    },
    hitAsteroid: function(player, asteroid) {
        this.explosionSound.play();

        var emitter = this.game.add.emitter(this.player.x, this.player.y, 100);
        emitter.makeParticles('playerParticle');
        emitter.minParticleSpeed.setTo(-200, -200);
        emitter.maxParticleSpeed.setTo(200, 200);
        emitter.gravity = 0;
        emitter.start(true, 1000, null, 100);
        this.player.kill();
        this.game.time.events.add(800, this.gameOver, this);
    },
    gameOver: function(){
        this.game.state.start('MainMenu', true, false, this.playerScore);
    },
    collect: function(player, collectable){
        this.collectSound.play();

        this.playerScore++;

        this.scoreLabel.text = this.playerScore;

        collectable.destroy();
    },
    showLabels: function(){
        var text = '0';
        var style = { font: '20px Arial', fill: '#fff', align: 'center' };
        this.scoreLabel = this.game.add.text(this.game.width-50, this.game.height-50, text, style);
        this.scoreLabel.fixedToCamera = true;

    },
    
}
