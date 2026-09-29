
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class UIText extends Phaser.GameObjects.Text {

	constructor(scene, x, y) {
		super(scene, x ?? 0, y ?? 0, "", {});

		this.setOrigin(0.5, 0.5);
		this.text = "UI text";
		this.setStyle({ "align": "center", "fontFamily": "arial black", "fontSize": "42px", "stroke": "#000000ff", "strokeThickness": 8 });

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */

	// Write your code here.

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
