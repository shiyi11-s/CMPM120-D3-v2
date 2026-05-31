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
    this.completed = false;
    this.deathCount = 0;
    this.elapsedMs = 0;
    this.timerActive = false;
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

  onReachGoal() {}
  onDeath() {}

  update(time, dt) {}
}
