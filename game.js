const config = {
  type: Phaser.AUTO,
  parent: "root",
  width: 800,
  height: 600,
  backgroundColor: "#000000",
  scene: [BootScene],
};

const game = new Phaser.Game(config);