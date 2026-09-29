
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class EnemyPaths extends Phaser.GameObjects.Container {

	constructor(scene, x, y) {
		super(scene, x ?? 0, y ?? 0);

		// path1
		const path1 = scene.add.container(0, 0);
		this.add(path1);

		// s
		const s = scene.add.image(200, -50, "ships", 23);
		path1.add(s);

		// s1
		const s1 = scene.add.image(1080, 160, "ships", 23);
		path1.add(s1);

		// s_1
		const s_1 = scene.add.image(200, 340, "ships", 23);
		path1.add(s_1);

		// s_2
		const s_2 = scene.add.image(1080, 520, "ships", 23);
		path1.add(s_2);

		// s_3
		const s_3 = scene.add.image(200, 700, "ships", 23);
		path1.add(s_3);

		// s_4
		const s_4 = scene.add.image(1080, 780, "ships", 23);
		path1.add(s_4);

		// path2
		const path2 = scene.add.container(0, 0);
		path2.visible = false;
		this.add(path2);

		// s_5
		const s_5 = scene.add.image(-50, 200, "ships", 22);
		path2.add(s_5);

		// s_6
		const s_6 = scene.add.image(1330, 200, "ships", 22);
		path2.add(s_6);

		// s_7
		const s_7 = scene.add.image(1330, 400, "ships", 22);
		path2.add(s_7);

		// s_8
		const s_8 = scene.add.image(-50, 400, "ships", 22);
		path2.add(s_8);

		// s_9
		const s_9 = scene.add.image(-50, 600, "ships", 22);
		path2.add(s_9);

		// s_10
		const s_10 = scene.add.image(1330, 600, "ships", 22);
		path2.add(s_10);

		// path3
		const path3 = scene.add.container(0, 0);
		path3.visible = false;
		this.add(path3);

		// s_11
		const s_11 = scene.add.image(-50, 360, "ships", 21);
		path3.add(s_11);

		// s_12
		const s_12 = scene.add.image(640, 50, "ships", 21);
		path3.add(s_12);

		// s_13
		const s_13 = scene.add.image(1180, 369, "ships", 21);
		path3.add(s_13);

		// s_14
		const s_14 = scene.add.image(640, 670, "ships", 21);
		path3.add(s_14);

		// s_15
		const s_15 = scene.add.image(50, 360, "ships", 21);
		path3.add(s_15);

		// s_16
		const s_16 = scene.add.image(640, 50, "ships", 21);
		path3.add(s_16);

		// s_17
		const s_17 = scene.add.image(1180, 360, "ships", 21);
		path3.add(s_17);

		// s_18
		const s_18 = scene.add.image(640, 670, "ships", 21);
		path3.add(s_18);

		// s_19
		const s_19 = scene.add.image(-50, 360, "ships", 21);
		path3.add(s_19);

		// path4
		const path4 = scene.add.container(0, 0);
		path4.visible = false;
		this.add(path4);

		// s_20
		const s_20 = scene.add.image(1330, 360, "ships", 20);
		path4.add(s_20);

		// s_21
		const s_21 = scene.add.image(640, 50, "ships", 20);
		path4.add(s_21);

		// s_22
		const s_22 = scene.add.image(50, 360, "ships", 20);
		path4.add(s_22);

		// s_23
		const s_23 = scene.add.image(640, 670, "ships", 20);
		path4.add(s_23);

		// s_24
		const s_24 = scene.add.image(1180, 360, "ships", 20);
		path4.add(s_24);

		// s_25
		const s_25 = scene.add.image(640, 50, "ships", 20);
		path4.add(s_25);

		// s_26
		const s_26 = scene.add.image(50, 360, "ships", 20);
		path4.add(s_26);

		// s_27
		const s_27 = scene.add.image(640, 670, "ships", 20);
		path4.add(s_27);

		// s_28
		const s_28 = scene.add.image(1330, 360, "ships", 20);
		path4.add(s_28);

		// lists
		const pathList = [path1, path2, path3, path4];

		this.pathList = pathList;

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	/** @type {Phaser.GameObjects.Container[]} */
	pathList;

	/* START-USER-CODE */

	buildPoints(index) {

		const container = this.pathList[index];

		const points = container.list.map((child) => [child.x, child.y]);

		return points;
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
