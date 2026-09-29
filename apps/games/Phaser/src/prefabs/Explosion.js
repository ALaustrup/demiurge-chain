
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Explosion extends Phaser.GameObjects.Sprite {

	constructor(scene, x, y, texture, frame) {
		super(scene, x ?? 340, y ?? 221, texture || "tiles", frame ?? 4);

		this.play("explosion");

		/* START-USER-CTR-CODE */

		this.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {

			this.destroy();

		});
		/* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */

	// Write your code here.

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
