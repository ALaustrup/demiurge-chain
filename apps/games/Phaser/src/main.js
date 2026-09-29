import Game from "./scenes/Game.js";
import Preload from "./scenes/Preload.js";

window.addEventListener('load', function () {

	var game = new Phaser.Game({
		width: 1280,
		height: 720,
		type: Phaser.AUTO,
        backgroundColor: "#242424",
		scale: {
			mode: Phaser.Scale.FIT,
			autoCenter: Phaser.Scale.CENTER_BOTH
		},
		pixelArt: true,
		roundPixels: true,
		physics: {
			default: "arcade",
			arcade: {
				gravity: 0
			}
		}
	});

	game.scene.add("Preload", Preload);
	game.scene.add("Boot", Boot, true);
	game.scene.add("Game", Game);
});

class Boot extends Phaser.Scene {

	preload() {
		
		this.load.pack("pack", "assets/preload-asset-pack.json");
	}

	create() {

		this.scene.start("Preload");
	}
}