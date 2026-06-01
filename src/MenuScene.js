class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const w = this.scale.width, h = this.scale.height;

    this.add.tileSprite(0, 0, w, h, "bg").setOrigin(0, 0);

    this.add.text(w / 2, 110, "MARBLE", {
      fontFamily: "ui-monospace, monospace",
      fontSize: "84px",
      color: "#ffd166",
      stroke: "#3b2a08",
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(w / 2, 188, "MAZE", {
      fontFamily: "ui-monospace, monospace",
      fontSize: "84px",
      color: "#a080ff",
      stroke: "#1f1438",
      strokeThickness: 6,
    }).setOrigin(0.5);

    const marble = this.add.image(w / 2, 265, "marble").setScale(2);
    this.tweens.add({
      targets: marble,
      y: 285,
      yoyo: true,
      duration: 900,
      repeat: -1,
      ease: "sine.inOut",
    });

    const rules = [
      "tilt the maze so the marble drops into the dark portal at the bottom.",
      "",
      "controls:",
      "  hold + drag mouse to rotate the maze,",
      "  Y to toggle the orange shortcut wall,",
      "  R to reset marble to spawn.",
    ];
    this.add.text(w / 2, 390, rules.join("\n"), {
      fontFamily: "ui-monospace, monospace",
      fontSize: "16px",
      color: "#d8d0ff",
      align: "center",
      lineSpacing: 4,
    }).setOrigin(0.5);

    const start = this.add.text(w / 2, h - 70, "click anywhere to begin", {
      fontFamily: "ui-monospace, monospace",
      fontSize: "22px",
      color: "#ffd166",
    }).setOrigin(0.5);

    this.tweens.add({
      targets: start,
      alpha: 0.4,
      yoyo: true,
      duration: 600,
      repeat: -1,
    });

    this.input.once("pointerdown", () => {
      RUN.level = 1;
      RUN.totalTimeMs = 0;
      RUN.totalDeaths = 0;
      RUN.perLevel = [];
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(320, () => this.scene.start("GameScene", { level: 1 }));
    });
  }
}
