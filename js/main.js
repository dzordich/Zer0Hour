var Exiled = Exiled || {};

Exiled.game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.AUTO, '');

Exiled.game.state.add('Boot', Exiled.Boot);
Exiled.game.state.add('Preload', Exiled.Preload);
Exiled.game.state.add('MainMenu', Exiled.MainMenu);
Exiled.game.state.add('Game', Exiled.Game);

Exiled.game.state.start('Boot');





