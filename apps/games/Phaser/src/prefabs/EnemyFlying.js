
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class EnemyFlying extends Phaser.Physics.Arcade.Sprite {

	constructor(scene, x, y, texture, frame) {
		super(scene, x ?? 626, y ?? 494, texture || "ships", frame ?? 12);

		this.flipY = true;
		scene.physics.add.existing(this, false);
		this.body.setSize(64, 64, false);

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */

	// enemy health
	health = 1;

	// minimum fire rate
	fireCounterMin = 100;

	// maximum fire rate 
	fireCounterMax = 300;

	fireCounter;

	// enemy strength
	power = 1;

	initEnemy(pathId, speed, power, shipId) {

		// choose path to follow
		this.initPath(pathId, speed); 

		this.power = power;

		this.setTexture(this.texture.key, 12 + shipId);

		this.fireCounter = Phaser.Math.RND.between(this.fireCounterMin, this.fireCounterMax); // random firing interval
	}

	getPower() {

		return this.power;
	}

	preUpdate(time, delta) {

		super.preUpdate(time, delta);

		if (this.pathIndex > 1) {

			return; // stop updating if reached end of path
		}

		// get current coordinate based on percentage moved
		this.path.getPoint(this.pathIndex, this.pathVector);

		// set position of this enemy
		this.setPosition(this.pathVector.x, this.pathVector.y);

		// increment percentage moved by pathSpeed
		this.pathIndex += this.pathSpeed;

		if (this.pathIndex > 1) {

			this.die();
		}

		// update firing interval
		if (this.fireCounter > 0) {

			this.fireCounter--;

		} else {

			this.fire();
		}
	}

	hit(damage) {

		this.health -= damage;

		if (this.health <= 0) {

			this.die();
		}
	}

	die() {

		this.scene.addExplosion(this.x, this.y);

		this.remove();
	}

	remove() {

		this.destroy(true);
	}

	fire() {

		this.fireCounter = Phaser.Math.RND.between(this.fireCounterMin, this.fireCounterMax);

		this.scene.fireEnemyBullet(this.x, this.y, this.power);
	}

	initPath(points, speed) {

		this.path = new Phaser.Curves.Spline(points);

		// current coordinates along path in pixels
		this.pathVector = new Phaser.Math.Vector2();

		// percentage of position moved along path, 0 = beginning, 1 = end
		this.pathIndex = 0;

		// speed of movement
		this.pathSpeed = speed;

		this.path.getPoint(0, this.pathVector); // get coordinates based on pathIndex

		this.setPosition(this.pathVector.x, this.pathVector.y);
	}

	getPower() {

		return this.power;
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
