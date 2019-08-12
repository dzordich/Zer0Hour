var Exiled = Exiled || {};

const menuText = document.querySelector('#mainMenu');
const highscores = document.querySelector('#highscores');
const introText1 = document.querySelector('#gameStartText1');
const introText2 = document.querySelector('#gameStartText2');
var introTextDelay = 0;
var introTextShowing = false;

//title screen
Exiled.MainMenu = function(){};

Exiled.MainMenu.prototype = {

  create: function() {
    //show the space tile, repeated
    this.background = this.game.add.tileSprite(0, 0, this.game.width, this.game.height, 'space');
    
    //give it speed in x
    this.background.autoScroll(-20, 0);

    this.startGame = this.game.input.keyboard.addKey(Phaser.KeyCode.ENTER);

    // console.log(this.game.sound.context.state);
    // if (this.game.sound.context.state === 'suspended') {
    //       this.game.sound.context.resume();
    // }
    // console.log(this.game.sound.context.state);

    // this.input.addDownCallback(function() {
    // console.log(this.game.sound.context.state);
    // if (this.game.sound.context.state === 'suspended') {
    //     this.game.sound.context.state = 'running';
    // }
    // console.log(this.game.sound.context.state);
    // });
    // document.querySelector('#mainMenu').click()
    // this.titleMenuMusic = this.game.add.audio('titleMenuMusic');
    // this.titleMenuMusic.volume =1.0;
    // this.titleMenuMusic.play()

    menuText.style.display = 'block';
    // fetch high scores from db
    fetch('/api/all_scores')
    .then(function (response) {
        return response.json()
    })
    .then(function (data) {
      let i = 1;
      for (let key of data) {
          if(i>10){
            return;
          }
          else if(key.index_of_score === i){
            let scoreText = document.createElement('tr');
            scoreText.innerHTML = `<td>${key.name}</td><td>${key.score}</td><td>${key.game_round}</td><td>${key.kills}</td>`;
            highscores.appendChild(scoreText);
            i++;
          }
      }
    })
    document.querySelector('#mainMenu').click()
    this.titleMenuMusic = this.game.add.audio('titleMenuMusic');
    this.titleMenuMusic.volume =1.0;
    this.titleMenuMusic.play()
  },
  update: function() {
    // console.log(this.game.sound.context.state);
    if(this.startGame.isDown) {
      menuText.style.display = 'none';
      this.showIntroText();
      introTextShowing = true;
    }
    if(this.game.time.now - introTextDelay > 3000 && introTextShowing){
      introText1.style.display = 'none';
      introText2.style.display = 'block';
      // this.game.state.start('Game');
    }
    if(this.game.time.now - introTextDelay > 7500 && introTextShowing){
      introText2.style.display = 'none';
      this.titleMenuMusic.stop()
      this.game.state.start('Game');
    }
  },
  showIntroText: function(){
    introText1.style.display = 'block';
    introTextDelay = this.game.time.now;
  }
};

