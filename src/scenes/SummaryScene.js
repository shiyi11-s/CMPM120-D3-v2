class SummaryScene extends Phaser.Scene {
  constructor() {
    super("SummaryScene");
  }

  init(data) {
    this.level = data.level;
  }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.fadeIn(280, 0, 0, 0);

    this.add.tileSprite(0, 0, W, H, "bg").setOrigin(0, 0);

    this.add.rectangle(W / 2, H / 2, 460, 320, 0x1a1230, 0.92).setStrokeStyle(3, 0xffd166);

    this.add.text(W / 2, H / 2 - 122, "level clear!", {
      fontFamily: "ui-monospace, monospace",
      fontSize: "34px",
      color: "#ffd166",
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 70, "level " + this.level, {
      fontFamily: "ui-monospace, monospace",
      fontSize: "20px",
      color: "#c2b6ff",
    }).setOrigin(0.5);

    const stats = RUN.perLevel[this.level - 1] || { timeMs: 0, deaths: 0 };
    const m  = Math.floor(stats.timeMs / 60000);
    const s  = Math.floor((stats.timeMs % 60000) / 1000);
    const cs = Math.floor((stats.timeMs % 1000) / 10);
    const tFmt = String(m).padStart(2,"0") + ":" + String(s).padStart(2,"0") + "." + String(cs).padStart(2,"0");

    this.add.text(W / 2, H / 2 - 18, "time:   " + tFmt, {
      fontFamily: "ui-monospace, monospace",
      fontSize: "24px",
      color: "#e5deff",
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 + 18, "deaths: " + stats.deaths, {
      fontFamily: "ui-monospace, monospace",
      fontSize: "24px",
      color: "#ff8b8b",
    }).setOrigin(0.5);

    let teaser = "";
    if (this.level === 1) teaser = "next: a glowing red hazard appears...";
    else if (this.level === 2) teaser = "next: two hazards, tighter corridors...";
    else teaser = "you have reached the final summary.";

    this.add.text(W / 2, H / 2 + 76, teaser, {
      fontFamily: "ui-monospace, monospace",
      fontSize: "16px",
      color: "#a89cd8",
    }).setOrigin(0.5);

    const next = this.add.text(W / 2 + 130, H / 2 + 122, "[ next → ]", {
      fontFamily: "ui-monospace, monospace",
      fontSize: "22px",
      color: "#ffd166",
      backgroundColor: "#3a2a08",
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.tweens.add({ targets: next, alpha: 0.6, yoyo: true, duration: 700, repeat: -1 });

    const advance = () => {
      this.cameras.main.fadeOut(260, 0, 0, 0);
      this.time.delayedCall(280, () => {
        if (this.level >= 3) {
          this.scene.start("EndScene");
        } else {
          this.scene.start("GameScene", { level: this.level + 1 });
        }
      });
    };

    next.on("pointerdown", advance);
    this.input.keyboard.once("keydown-ENTER", advance);
    this.input.keyboard.once("keydown-SPACE", advance);
  }
}
