class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    this.add.rectangle(400, 10, 800, 20, 0xffffff);   // 上
    this.add.rectangle(400, 590, 800, 20, 0xffffff);  // 下
    this.add.rectangle(10, 300, 20, 600, 0xffffff);   // 左
    this.add.rectangle(790, 300, 20, 600, 0xffffff);  // 右
  }
}