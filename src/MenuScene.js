class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene")
    }
    create(){
        this.scene.start("GameScene");
    }
}
