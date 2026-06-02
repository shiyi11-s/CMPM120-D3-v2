class EndScene extends Phaser.Scene {
  constructor() {
    super("EndScene");
  }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.fadeIn(380, 0, 0, 0);

    this.add.tileSprite(0, 0, W, H, "bg").setOrigin(0, 0);

    for (let i = 0; i < 24; i++) {
      const s = this.add.image(
        Phaser.Math.Between(40, W - 40), H + 20, "spark"
      ).setScale(Phaser.Math.FloatBetween(0.6, 1.2));
      this.tweens.add({
        targets: s,
        y: -40,
        alpha: { from: 1, to: 0 },
        duration: Phaser.Math.Between(2400, 4200),
        delay: i * 90,
        repeat: -1,
        ease: "sine.out",
      });
    }

    const marble = this.add.image(W / 2, 150, "marble").setScale(3);
    this.tweens.add({
      targets: marble, scale: 3.4, yoyo: true,
      duration: 900, repeat: -1, ease: "sine.inOut",
    });

    this.add.text(W / 2, 240, "all levels complete!", {
      fontFamily: "ui-monospace, monospace",
      fontSize: "34px",
      color: "#ffd166",
      stroke: "#3b2a08",
      strokeThickness: 4,
    }).setOrigin(0.5);

    const lines = [];
    for (let i = 0; i < RUN.perLevel.length; i++) {
      const s = RUN.perLevel[i];
      const m  = Math.floor(s.timeMs / 60000);
      const sec = Math.floor((s.timeMs % 60000) / 1000);
      const cs = Math.floor((s.timeMs % 1000) / 10);
      const t = String(m).padStart(2,"0") + ":" + String(sec).padStart(2,"0") + "." + String(cs).padStart(2,"0");
      lines.push("level " + (i + 1) + "    " + t + "    deaths " + s.deaths);
    }
    this.add.text(W / 2, 320, lines.join("\n"), {
      fontFamily: "ui-monospace, monospace",
      fontSize: "18px",
      color: "#d8d0ff",
      align: "center",
      lineSpacing: 6,
    }).setOrigin(0.5);

    const tm = Math.floor(RUN.totalTimeMs / 60000);
    const ts = Math.floor((RUN.totalTimeMs % 60000) / 1000);
    const tc = Math.floor((RUN.totalTimeMs % 1000) / 10);
    const totalT = String(tm).padStart(2,"0") + ":" + String(ts).padStart(2,"0") + "." + String(tc).padStart(2,"0");

    this.add.text(W / 2, 430, "total time:   " + totalT, {
      fontFamily: "ui-monospace, monospace",
      fontSize: "22px",
      color: "#e5deff",
    }).setOrigin(0.5);

    this.add.text(W / 2, 460, "total deaths: " + RUN.totalDeaths, {
      fontFamily: "ui-monospace, monospace",
      fontSize: "22px",
      color: "#ff8b8b",
    }).setOrigin(0.5);
  }
}
