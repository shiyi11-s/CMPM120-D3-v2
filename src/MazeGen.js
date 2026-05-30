const MazeGen = (function () {
  // Direction deltas
  const DIR = {
    n: { dx: 0, dy: -1, opp: "s" },
    e: { dx: 1, dy: 0, opp: "w" },
    s: { dx: 0, dy: 1, opp: "n" },
    w: { dx: -1, dy: 0, opp: "e" },
  };

  function makeCell() {
    return { n: true, e: true, s: true, w: true, visited: false };
  }

  /**
   * Generate a perfect maze.
   * @param {number} cols
   * @param {number} rows
   * @param {number} [seed] optional seed for deterministic output
   * @returns {{cols:number, rows:number, cells:Array<Array<Object>>}}
   */
  function generate(cols, rows, seed) {
    const rand = mulberry32(seed != null ? seed : (Math.random() * 1e9) | 0);

    // 2D grid: cells[y][x]
    const cells = [];
    for (let y = 0; y < rows; y++) {
      const row = [];
      for (let x = 0; x < cols; x++) row.push(makeCell());
      cells.push(row);
    }

    // Iterative recursive backtracker (DFS).
    const stack = [];
    cells[0][0].visited = true;
    stack.push([0, 0]);

    while (stack.length) {
      const [x, y] = stack[stack.length - 1];
      const neighbors = [];
      for (const k of ["n", "e", "s", "w"]) {
        const nx = x + DIR[k].dx;
        const ny = y + DIR[k].dy;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !cells[ny][nx].visited) {
          neighbors.push([k, nx, ny]);
        }
      }
      if (neighbors.length === 0) {
        stack.pop();
        continue;
      }
      const [k, nx, ny] = neighbors[Math.floor(rand() * neighbors.length)];
      // knock down wall between (x,y) and (nx,ny)
      cells[y][x][k] = false;
      cells[ny][nx][DIR[k].opp] = false;
      cells[ny][nx].visited = true;
      stack.push([nx, ny]);
    }

    return { cols, rows, cells };
  }

  // placeholder — Step 3.2
  function carveLoops(maze, fraction, seed) {}

  // placeholder — Step 3.3
  function pickToggleWall(maze, seed) { return null; }

  // PRNG: mulberry32 — small, deterministic, plenty good for level layouts.
  function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
      t = (t + 0x6d2b79f5) | 0;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  return { generate, carveLoops, pickToggleWall };
})();
