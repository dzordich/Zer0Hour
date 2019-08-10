var Exiled = Exiled || {};

const menuText = document.querySelector('#mainMenu');
const highscores = document.querySelector('#highscores');

//title screen
Exiled.MainMenu = function(){};

Exiled.MainMenu.prototype = {

  create: function() {
    //show the space tile, repeated
    this.background = this.game.add.tileSprite(0, 0, this.game.width, this.game.height, 'space');
    
    //give it speed in x
    this.background.autoScroll(-20, 0);

    this.startGame = this.game.input.keyboard.addKey(Phaser.KeyCode.ENTER);

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
  },
  update: function() {
    if(this.startGame.isDown) {
      menuText.style.display = 'none';
      this.game.state.start('Game');
    }
  }
};

