/* eslint-disable no-mixed-spaces-and-tabs */
var Exiled = Exiled || {};
let results = []
let bool = false;
//title screen
Exiled.MainMenu = function(){};

Exiled.MainMenu.prototype = {

  create: function() {
    //show the space tile, repeated
    this.background = this.game.add.tileSprite(0, 0, this.game.width, this.game.height, 'space');
    
    //give it speed in x
    this.background.autoScroll(-20, 0);

    // fetch high scores from db
    results = [];
    fetch('/api/all_scores')
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
        results = results.slice(0, 10);
        bool = true;
        console.log('go')
    })
  	

    //start game text
    var text = "Click to start new game";
    var style = { font: "30px Arial", fill: "#fff", align: "center" };
    var t = this.game.add.text(this.game.width/2, this.game.height/2 - 85, text, style);
    t.anchor.set(0.5);
  },
  update: function() {
    if(bool){
      const style = { font: "15px Arial", fill: "#fff", align: "center" };
      let height = -10;
      let z = this.game.add.text(this.game.width/2, this.game.height/2 - 35, "High Scores", style);
      z.anchor.set(0.5);
      for(let x of results){
        let text = (x.name || "player") + " | " + x.score.toString();
        let t = this.game.add.text(this.game.width/2, this.game.height/2 + height, text, style);
        t.anchor.set(0.5);
        height += 19;
      }
      bool = false;
    }
    if(this.game.input.activePointer.justPressed()) {
      console.log('click')
      this.game.state.start('Game');
    }
  }
};

