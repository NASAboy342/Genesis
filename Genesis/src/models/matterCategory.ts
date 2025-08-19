export class MatterCategory {
    readonly rocket: number;
    readonly static: number;

    constructor(scene: Phaser.Scene) {
        this.rocket = scene.matter.world.nextCategory();
        this.static = scene.matter.world.nextCategory();
    }
}