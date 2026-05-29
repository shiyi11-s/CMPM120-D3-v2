// Small store that survives between scenes so we can carry stats forward.
const RUN = {
  level: 1,
  totalTimeMs: 0,
  totalDeaths: 0,
  perLevel: [],   // [{timeMs, deaths}]
};

const config = {
  type: Phaser.AUTO,
  parent: "root",
  width: 800,
  height: 600,
  backgroundColor: "#0a0816",
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 600 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, GameScene, SummaryScene, EndScene],
};

const game = new Phaser.Game(config);