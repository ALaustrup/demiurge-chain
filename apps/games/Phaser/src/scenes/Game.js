
// You can write more code here

/* START OF COMPILED CODE */

import Player from "../prefabs/Player.js";
import UIText from "../prefabs/UIText.js";
/* START-USER-IMPORTS */
import EnemyBullet from "../prefabs/EnemyBullet.js";
import EnemyFlying from "../prefabs/EnemyFlying.js";
import Explosion from "../prefabs/Explosion.js";
import PlayerBullet from "../prefabs/PlayerBullet.js";
import EnemyPaths from "../prefabs/EnemyPaths.js";
/* END-USER-IMPORTS */

export default class Game extends Phaser.Scene {

	constructor() {
		super("Game");

		/** @type {Phaser.Tilemaps.TilemapLayer} */
		this.groundLayer;
		/** @type {Phaser.GameObjects.Layer} */
		this.enemyBulletLayer;
		/** @type {Phaser.GameObjects.Layer} */
		this.enemyLayer;
		/** @type {Phaser.GameObjects.Layer} */
		this.playerBulletLayer;
		/** @type {Player} */
		this.player;
		/** @type {UIText} */
		this.tutorialText;
		/** @type {UIText} */
		this.scoreText;
		/** @type {UIText} */
		this.gameOverText;
		/** @type {Phaser.Tilemaps.Tilemap} */
		this.map;


		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	/** @returns {void} */
	editorCreate() {

		// map
		this.cache.tilemap.add("map_aa27c6a5-cd96-4ff4-ad38-90bb45079daa", {
			format: 1,
			data: {
				width: 34,
				height: 40,
				orientation: "orthogonal",
				tilewidth: 32,
				tileheight: 32,
				tilesets: [
					{
						columns: 12,
						margin: 0,
						spacing: 0,
						tilewidth: 32,
						tileheight: 32,
						tilecount: 120,
						firstgid: 1,
						image: "tiles",
						name: "tiles",
						imagewidth: 384,
						imageheight: 320,
					},
				],
				layers: [
					{
						type: "tilelayer",
						name: "groundLayer",
						width: 40,
						height: 34,
						opacity: 1,
						data: [51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 61, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 73, 51, 51, 73, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 37, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 73, 51, 61, 51, 51, 37, 51, 51, 85, 51, 51, 51, 51, 51, 51, 51, 73, 51, 51, 51, 61, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 61, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 37, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 61, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 61, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 37, 51, 51, 51, 51, 51, 51, 73, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 37, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 61, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 73, 51, 51, 51, 61, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 61, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 49, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 85, 51, 51, 51, 51, 51, 51, 51, 73, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 37, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 85, 51, 37, 51, 51, 51, 51, 51, 51, 51, 51, 51, 73, 51, 73, 51, 51, 51, 51, 51, 51, 61, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 49, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 85, 51, 51, 51, 37, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 73, 51, 51, 51, 51, 51, 85, 51, 51, 73, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 73, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 37, 51, 51, 51, 51, 51, 51, 51, 51, 73, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 37, 51, 51, 37, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 37, 51, 51, 51, 51, 37, 37, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 37, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 73, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 73, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 37, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 73, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 73, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 49, 51, 51, 37, 37, 51, 51, 51, 51, 51, 49, 51, 51, 51, 51, 51, 51, 51, 51, 51, 61, 51, 51, 51, 51, 61, 51, 51, 51, 51, 51, 51, 51, 51, 49, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 61, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 85, 51, 61, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 49, 51, 51, 51, 51, 51, 51, 51, 73, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 85, 51, 51, 51, 37, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 49, 51, 51, 51, 51, 51, 51, 51, 85, 51, 51, 37, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 85, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 73, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51],
					},
				],
			},
		});
		const map = this.add.tilemap("map_aa27c6a5-cd96-4ff4-ad38-90bb45079daa");
		map.addTilesetImage("tiles");

		// groundLayer
		const groundLayer = map.createLayer("groundLayer", ["tiles"], 0, -320);

		// enemyBulletLayer
		const enemyBulletLayer = this.add.layer();

		// enemyLayer
		const enemyLayer = this.add.layer();

		// playerBulletLayer
		const playerBulletLayer = this.add.layer();

		// player
		const player = new Player(this, 640, 620);
		this.add.existing(player);

		// uiLayer
		const uiLayer = this.add.layer();

		// tutorialText
		const tutorialText = new UIText(this, 640, 360);
		tutorialText.visible = true;
		tutorialText.text = "Press space to start";
		tutorialText.setStyle({});
		uiLayer.add(tutorialText);

		// scoreText
		const scoreText = new UIText(this, 20, 20);
		scoreText.setOrigin(0, 0);
		scoreText.text = "Score: 0";
		scoreText.setStyle({});
		uiLayer.add(scoreText);

		// gameOverText
		const gameOverText = new UIText(this, 640, 360);
		gameOverText.visible = false;
		gameOverText.text = "Game Over";
		gameOverText.setStyle({});
		uiLayer.add(gameOverText);

		// player_vs_enemy_bullets
		this.physics.add.overlap(player, enemyBulletLayer.list, this.hitPlayer, undefined, this);

		// player_bullets_vs_enemies
		this.physics.add.overlap(playerBulletLayer.list, enemyLayer.list, this.hitEnemy, undefined, this);

		// player_vs_enemies
		this.physics.add.overlap(player, enemyLayer.list, this.hitPlayer, undefined, this);

		this.groundLayer = groundLayer;
		this.enemyBulletLayer = enemyBulletLayer;
		this.enemyLayer = enemyLayer;
		this.playerBulletLayer = playerBulletLayer;
		this.player = player;
		this.tutorialText = tutorialText;
		this.scoreText = scoreText;
		this.gameOverText = gameOverText;
		this.map = map;

		this.events.emit("scene-awake");
	}


	/* START-USER-CODE */

	/** @type {Phaser.Types.Input.Keyboard.CursorKeys} */
	cursors;

	create() {

		this.editorCreate();

		this.initVariables();

		this.initInput();
	}

	/**
	 * 
	 * @param {Player} player 
	 * @param {EnemyFlying} obstacle 
	 */
	hitPlayer(player, obstacle) {

		this.addExplosion(player.x, player.y);

		player.hit(obstacle.getPower());

		obstacle.die();

		this.gameOver();
	}

	/**
	 * @param {PlayerBullet} bullet 
	 * @param {EnemyFlying} enemy 
	 */
	hitEnemy(bullet, enemy) {

		this.updateScore(10);

		bullet.remove();

		enemy.hit(bullet.getPower());
	}

	updateScore(points) {

		this.score += points;

		this.scoreText.setText(`Score: ${this.score}`);
	}

	startGame() {

		this.gameStarted = true;

		this.tutorialText.setVisible(false);

		this.addFlyingGroup();
	}

	addFlyingGroup() {

		// spawn next group after x seconds
		this.spawnEnemyCounter = Phaser.Math.RND.between(5, 8) * 60;
		// id to choose image in tiles.png
		const randomId = Phaser.Math.RND.between(0, 11);
		// number of enemies to spawn
		const randomCount = Phaser.Math.RND.between(5, 15);
		// delay between spawning of each enemy
		const randomInterval = Phaser.Math.RND.between(8, 12) * 100;
		// choose a path, a group follows the same path
		const randomPath = Phaser.Math.RND.between(0, 3);
		// strength of the enemy to determine damage to inflict and selecting bullet image
		const randomPower = Phaser.Math.RND.between(1, 4);
		// increment of pathSpeed in enemy
		const randomSpeed = Phaser.Math.RND.realInRange(0.0001, 0.001);

		this.time.addEvent({
			delay: randomInterval,
			callback: this.addEnemy,
			// parameters passed to addEnemy()
			args: [randomId, randomPath, randomSpeed, randomPower],
			callbackScope: this,
			repeat: randomCount
		});
	}

	addEnemy(shipId, pathId, speed, power) {

		const enemy = new EnemyFlying(this);

		const points = new EnemyPaths(this).buildPoints(pathId);

		enemy.initEnemy(points, speed, power, shipId);

		this.enemyLayer.add(enemy);
	}

	fireEnemyBullet(x, y, power) {

		const bullet = new EnemyBullet(this, x, y);
		bullet.setPower(power);

		this.enemyBulletLayer.add(bullet);
	}

	gameOver() {

		this.gameStarted = false;

		this.gameOverText.setVisible(true);

		this.cursors.space.once("down", (key, event) => {

			this.cameras.main.fadeOut(500, 0, 0, 0, (c, p) => {

				if (p === 1) {

					this.input.keyboard.off("keydown");

					this.scene.start("Game");
				}
			});
		});
	}

	initInput() {

		this.cursors = this.input.keyboard.createCursorKeys();

		// check for spacebar press only once
		this.cursors.space.once("down", (key, event) => {

			this.startGame();
		});
	}

	addExplosion(x, y) {

		this.add.existing(new Explosion(this, x, y));
	}

	fireBullet(x, y) {

		const bullet = new PlayerBullet(this, x, y);
		bullet.setPower(1);

		this.playerBulletLayer.add(bullet);
	}

	initVariables() {

		this.score = 0;

		// list of tile ids in tiles.png
		// items nearer to the beginning of the array have a higher chance of being randomly chosen when using weighted()
		this.tiles = [51, 51, 51, 51, 51, 51, 51, 51, 51, 111, 111, 111, 111, 111, 51, 51, 51, 51, 51, 51, 51, 51, 51, 111, 111, 111, 111, 111, 37, 49, 61, 73, 85];
		this.tileSize = 32; // width and height of a tile in pixels

		this.mapOffset = 10; // offset (in tiles) to move the map above the top of the screen
		this.mapTop = -this.mapOffset * this.tileSize; // offset (in pixels) to move the map above the top of the screen
		this.mapHeight = Math.ceil(this.scale.height / this.tileSize) + this.mapOffset + 1; // height of the tile map (in tiles)
		this.mapWidth = Math.ceil(this.scale.width / this.tileSize); // width of the tile map (in tiles)

		this.scrollSpeed = 1; // background scrolling speed (in pixels)
		this.scrollMovement = 0; // current scroll amount
		this.spawnEnemyCounter = 0; // timer before spawning next group of enemies        
	}

	update() {

		this.updateMap();

		if (!this.gameStarted) return;

		this.player.update();

		if (this.spawnEnemyCounter > 0) {

			this.spawnEnemyCounter--;

		} else {

			this.addFlyingGroup();
		}
	}

	// scroll the tile map
	updateMap() {

		this.scrollMovement += this.scrollSpeed;

		if (this.scrollMovement >= this.tileSize) {
			//  Create new row on top
			let tile;
			let prev;

			// loop through map from bottom to top row
			for (let y = this.mapHeight - 2; y > 0; y--) {
				// loop through map from left to right column
				for (let x = 0; x < this.mapWidth; x++) {
					tile = this.map.getTileAt(x, y - 1);
					prev = this.map.getTileAt(x, y);

					prev.index = tile.index;

					if (y === 1) { // if top row
						// randomly choose a tile id from this.tiles
						// weightedPick favours items earlier in the array
						tile.index = Phaser.Math.RND.weightedPick(this.tiles);
					}
				}
			}

			this.scrollMovement -= this.tileSize; // reset to 0
		}

		this.groundLayer.y = this.mapTop + this.scrollMovement; // move one tile up
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
