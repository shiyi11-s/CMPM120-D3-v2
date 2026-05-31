class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  getLevelConfig(level) {
    const seedBase = 0xC0FFEE + level * 17;
    if (level === 1) {
      return {
        cols: 8, rows: 8, cellPitch: 48, seed: seedBase,
        loopFraction: 0.10,
        startCell: { x: 1, y: 0 },
        goalCell:  { x: 6, y: 7 },
        deathCells: [],
      };
    }
    if (level === 2) {
      return {
        cols: 9, rows: 9, cellPitch: 44, seed: seedBase,
        loopFraction: 0.12,
        startCell: { x: 1, y: 0 },
        goalCell:  { x: 7, y: 8 },
        deathCells: [{ x: 4, y: 4 }],
      };
    }
    return {
      cols: 10, rows: 10, cellPitch: 42, seed: seedBase,
      loopFraction: 0.15,
      startCell: { x: 1, y: 0 },
      goalCell:  { x: 8, y: 9 },
      deathCells: [{ x: 3, y: 3 }, { x: 6, y: 7 }],
    };
  }

  init(data) {
    this.level = data && data.level ? data.level : 1;
    RUN.level = this.level;
  }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.fadeIn(280, 0, 0, 0);

    this.bg = this.add.tileSprite(W / 2, H / 2, W * 2, H * 2, "bg");

    const cfg = this.getLevelConfig(this.level);
    this.cellPitch = cfg.cellPitch;
    this.wallThickness = 8;

    this.maze = MazeGen.generate(cfg.cols, cfg.rows, cfg.seed);
    MazeGen.carveLoops(this.maze, cfg.loopFraction, cfg.seed + 31);

    this.startCell = cfg.startCell;
    this.goalCell  = cfg.goalCell;
    this.maze.cells[this.startCell.y][this.startCell.x].n = false;
    this.maze.cells[this.goalCell.y][this.goalCell.x].s = false;

    const mazeW = cfg.cols * this.cellPitch;
    const mazeH = cfg.rows * this.cellPitch;
    this.mazeOriginX = W / 2 - mazeW / 2;
    this.mazeOriginY = H / 2 - mazeH / 2;
    this.mazeCenterX = W / 2;
    this.mazeCenterY = H / 2;
    this.mazeWidth   = mazeW;
    this.mazeHeight  = mazeH;

    this.floorSprite = this.add.tileSprite(
      this.mazeCenterX, this.mazeCenterY, mazeW, mazeH, "floor"
    );

    this.frameTop = this.add.tileSprite(
      this.mazeCenterX, this.mazeOriginY - this.wallThickness / 2,
      mazeW + this.wallThickness * 2, this.wallThickness, "frame"
    );
    this.frameBot = this.add.tileSprite(
      this.mazeCenterX, this.mazeOriginY + mazeH + this.wallThickness / 2,
      mazeW + this.wallThickness * 2, this.wallThickness, "frame"
    );
    this.frameLeft = this.add.tileSprite(
      this.mazeOriginX - this.wallThickness / 2, this.mazeCenterY,
      this.wallThickness, mazeH, "frame"
    );
    this.frameRight = this.add.tileSprite(
      this.mazeOriginX + mazeW + this.wallThickness / 2, this.mazeCenterY,
      this.wallThickness, mazeH, "frame"
    );

    const tog = MazeGen.pickToggleWall(this.maze, cfg.seed + 99);
    this.toggleSpec = tog;

    this.wallGroup = this.physics.add.staticGroup();
    this.wallSprites = [];
    this.buildAllWalls(tog);

    this.toggleWallSprite = null;
    if (tog) {
      this.toggleWallSprite = this.makeWallSprite(tog.x, tog.y, tog.k);
      this.toggleWallSprite.setTint(0xffaa44);
      this.toggleWallSprite.setData("toggle", true);
    }
    this.toggleOpen = false;

    const goalScreen = this.cellEdgeCenter(this.goalCell.x, this.goalCell.y, "s");
    this.goalX = goalScreen.x;
    this.goalY = goalScreen.y;
    this.goal = this.add.image(this.goalX, this.goalY, "hole");
    this.physics.add.existing(this.goal, true);
    this.goal.body.setCircle(14, 6, 6);

    this.tweens.add({
      targets: this.goal, scale: 1.15, yoyo: true,
      duration: 850, repeat: -1, ease: "sine.inOut",
    });

    this.deathGroup = this.physics.add.staticGroup();
    for (const dc of cfg.deathCells) {
      const c = this.cellCenter(dc.x, dc.y);
      const dz = this.deathGroup.create(c.x, c.y, "death");
      dz.setDisplaySize(this.cellPitch - this.wallThickness - 6,
                        this.cellPitch - this.wallThickness - 6).refreshBody();
      dz.body.setCircle((this.cellPitch - this.wallThickness - 6) / 2);
    }

    const startScreen = this.cellCenter(this.startCell.x, this.startCell.y);
    this.startX = startScreen.x;
    this.startY = startScreen.y;
    this.marble = this.physics.add.image(this.startX, this.startY - 220, "marble");
    this.marble.setCircle(10, 2, 2);
    this.marble.setBounce(0.32);
    this.marble.setDamping(true);
    this.marble.setDrag(0.985);
    this.marble.setMaxVelocity(520, 520);
    this.marble.setVelocity(0, 220);
    this.marble.setMass(1);

    this.physics.add.collider(this.marble, this.wallGroup);
    this.physics.add.overlap(this.marble, this.goal, () => this.onReachGoal(), null, this);
    this.physics.add.overlap(this.marble, this.deathGroup, () => this.onDeath(), null, this);

    this.tiltAngle = 0;
    this.draggingState = null;
    this.completed = false;
    this.deathCount = 0;
    this.elapsedMs = 0;
    this.timerActive = false;

    this.input.on("pointerdown", this.onPointerDown, this);
    this.input.on("pointermove", this.onPointerMove, this);
    this.input.on("pointerup",   this.onPointerUp,   this);

    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.keyY = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Y);
    this.keyR.on("down", () => this.resetMarble(false));
    this.keyY.on("down", () => this.toggleWall());

    this.time.delayedCall(700, () => this.timerActive = true);
  }

  cellCenter(cx, cy) {
    return {
      x: this.mazeOriginX + (cx + 0.5) * this.cellPitch,
      y: this.mazeOriginY + (cy + 0.5) * this.cellPitch,
    };
  }

  cellEdgeCenter(cx, cy, side) {
    const c = this.cellCenter(cx, cy);
    const half = this.cellPitch / 2;
    if (side === "n") return { x: c.x, y: c.y - half };
    if (side === "s") return { x: c.x, y: c.y + half };
    if (side === "w") return { x: c.x - half, y: c.y };
    return { x: c.x + half, y: c.y };
  }

  buildAllWalls(skipSpec) {
    for (let y = 0; y < this.maze.rows; y++) {
      for (let x = 0; x < this.maze.cols; x++) {
        const c = this.maze.cells[y][x];
        if (c.n && !this.matchesWall(skipSpec, x, y, "n")) this.makeWallSprite(x, y, "n");
        if (c.w && !this.matchesWall(skipSpec, x, y, "w")) this.makeWallSprite(x, y, "w");
        if (x === this.maze.cols - 1 && c.e && !this.matchesWall(skipSpec, x, y, "e")) this.makeWallSprite(x, y, "e");
        if (y === this.maze.rows - 1 && c.s && !this.matchesWall(skipSpec, x, y, "s")) this.makeWallSprite(x, y, "s");
      }
    }
  }

  matchesWall(spec, cx, cy, side) {
    return spec && spec.x === cx && spec.y === cy && spec.k === side;
  }

  makeWallSprite(cx, cy, side) {
    const T = this.wallThickness;
    const P = this.cellPitch;
    const c = this.cellCenter(cx, cy);
    const half = P / 2;

    let x, y, w, h;
    if (side === "n" || side === "s") {
      w = P + T; h = T;
      x = c.x;
      y = (side === "n") ? c.y - half : c.y + half;
    } else {
      w = T; h = P + T;
      x = (side === "w") ? c.x - half : c.x + half;
      y = c.y;
    }
    const wall = this.add.tileSprite(x, y, w, h, "wall");
    this.physics.add.existing(wall, true);
    wall.body.setSize(w, h);
    if (wall.body.updateFromGameObject) wall.body.updateFromGameObject();
    this.wallGroup.add(wall);
    this.wallSprites.push(wall);
    return wall;
  }

  pointerVecFromCenter(pointer) {
    return {
      x: pointer.x - this.scale.width / 2,
      y: pointer.y - this.scale.height / 2,
    };
  }

  onPointerDown(pointer) {
    if (this.completed) return;
    const v = this.pointerVecFromCenter(pointer);
    if (Math.hypot(v.x, v.y) < 30) { this.draggingState = null; return; }
    this.draggingState = { lastAngle: Math.atan2(v.y, v.x) };
  }

  onPointerMove(pointer) {
    if (this.completed) return;
    if (!this.draggingState || !pointer.isDown) return;
    const v = this.pointerVecFromCenter(pointer);
    if (Math.hypot(v.x, v.y) < 30) return;
    const a = Math.atan2(v.y, v.x);
    let delta = a - this.draggingState.lastAngle;
    while (delta >  Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;
    this.tiltAngle += delta;
    this.draggingState.lastAngle = a;
    this.applyTilt();
  }

  onPointerUp() {
    this.draggingState = null;
  }

  applyTilt() {
    const G = 620;
    this.cameras.main.setRotation(this.tiltAngle);
    this.physics.world.gravity.set(
      G * Math.sin(this.tiltAngle),
      G * Math.cos(this.tiltAngle)
    );
  }

  resetMarble(countAsDeath) {
    this.marble.setVelocity(0, 0);
    this.marble.setPosition(this.startX, this.startY);
    if (countAsDeath) this.deathCount += 1;
    this.cameras.main.shake(120, 0.004);
  }

  toggleWall() {
    if (!this.toggleWallSprite) return;
    this.toggleOpen = !this.toggleOpen;
    if (this.toggleOpen) {
      this.toggleWallSprite.setVisible(false);
      this.toggleWallSprite.body.enable = false;
    } else {
      this.toggleWallSprite.setVisible(true);
      this.toggleWallSprite.body.enable = true;
    }
    this.cameras.main.flash(80, 255, 200, 100, false);
  }

  onReachGoal() {
    if (this.completed) return;
    this.completed = true;

    RUN.perLevel[this.level - 1] = {
      timeMs: this.elapsedMs,
      deaths: this.deathCount,
    };
    RUN.totalTimeMs += this.elapsedMs;
    RUN.totalDeaths += this.deathCount;

    this.marble.body.enable = false;
    this.tweens.add({
      targets: this.marble,
      x: this.goalX, y: this.goalY,
      scale: 0.15, angle: 540,
      duration: 600, ease: "cubic.in",
    });

    this.time.delayedCall(750, () => this.cameras.main.fadeOut(320, 0, 0, 0));
    this.time.delayedCall(1100, () => this.scene.start("SummaryScene", { level: this.level }));
  }

  onDeath() {
    if (this.completed) return;
    this.cameras.main.flash(120, 255, 60, 60, true);
    this.cameras.main.shake(160, 0.008);
    this.resetMarble(true);
  }

  update(time, dt) {
    if (this.completed) return;

    if (this.timerActive) this.elapsedMs += dt;

    const m = this.marble;
    const safeR = Math.max(this.mazeWidth, this.mazeHeight) * 0.85;
    if (Math.hypot(m.x - this.mazeCenterX, m.y - this.mazeCenterY) > safeR) {
      this.resetMarble(true);
    }

    this.bg.tilePositionX += 0.12;
    this.bg.tilePositionY += 0.06;
  }
}
