
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class PlayerBullet extends Phaser.Physics.Arcade.Sprite {

	constructor(scene, x, y, texture, frame) {
		super(scene, x ?? 363, y ?? 273, texture || "tiles", frame ?? 0);

		scene.physics.add.existing(this, false);
		this.body.velocity.y = -1000;
		this.body.setSize(12, 32, false);

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */

	power = 0;

	setPower(power) {

		this.power = power;
	}

	getPower() {

        return this.power;
    }

	preUpdate(time, delta) {

        super.preUpdate(time, delta);

        this.checkWorldBounds();
    }

    checkWorldBounds() {

		// is this bullet above the screen?

        if (this.y < 0) {

            this.remove();
        }
    }

    remove() {

        this.destroy(true);
    }

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
