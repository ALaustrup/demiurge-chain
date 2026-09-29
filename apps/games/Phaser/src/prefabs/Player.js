
// You can write more code here

import Explosion from "./Explosion.js";

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Player extends Phaser.GameObjects.Sprite {

	constructor(scene, x, y, texture, frame) {
		super(scene, x ?? 331, y ?? 176, texture || "ships", frame ?? 8);

		scene.physics.add.existing(this, false);
		this.body.maxVelocity.x = 500;
		this.body.maxVelocity.y = 500;
		this.body.drag.x = 1000;
		this.body.drag.y = 1000;
		this.body.collideWorldBounds = true;
		this.body.setSize(64, 64, false);

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */

	fireRate = 10;
	fireCounter = 0;
	health = 1;
	velocityIncrement = 50;

	preUpdate(time, delta) {

		super.preUpdate(time, delta);

		if (this.fireCounter > 0) {

			this.fireCounter--;
		}

		this.checkInput();
	}

	checkInput() {

		// get cursors object from Game scene
		const cursors = this.scene.cursors;
		const leftKey = cursors.left.isDown;
		const rightKey = cursors.right.isDown;
		const upKey = cursors.up.isDown;
		const downKey = cursors.down.isDown;
		const spaceKey = cursors.space.isDown;

		// default move direction
		const moveDirection = { x: 0, y: 0 };

		if (leftKey) {

			moveDirection.x--;
		}

		if (rightKey) {

			moveDirection.x++;
		}

		if (upKey) {

			moveDirection.y--;
		}

		if (downKey) {

			moveDirection.y++;
		}

		if (spaceKey) {

			this.fire();
		}

		// increase horizontal velocity
		this.body.velocity.x += moveDirection.x * this.velocityIncrement;
		// increase vertical velocity 
		this.body.velocity.y += moveDirection.y * this.velocityIncrement;
	}

	fire() {

		if (this.fireCounter > 0) {

			return;
		}

		this.fireCounter = this.fireRate;

		this.scene.fireBullet(this.x, this.y);
	}

	hit(damage) {

		this.health -= damage;

		if (this.health <= 0) {

			this.die();
		}
	}

	die() {

		this.scene.addExplosion(this.x, this.y);

		this.destroy(true); // destroy sprite so it is no longer updated
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
