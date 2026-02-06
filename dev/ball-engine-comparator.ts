import { BallEngineRK4 } from "../src/ball-engine-rk4";
import { BallEngineMath } from "../src/ball-engine-math";
import { MovingCannon as Cannon } from "../src/cannon";
import { CssBoard } from "../src/css-board";
import { HUD } from "../src/hud";
import { selectElement, addTouchOrClickEvent } from "../src/utils";
import { BallEngine } from "../src/ball-engine";
import * as Constants from '../src/constants';
import * as Plot from "@observablehq/plot";
import Stats from 'stats.js';
import { BallEngineMotionEquationDelta, BallEngineMotionEquationAbsolute } from "../src/ball-engine-motion-equation";
import { makeCannonBall } from "../src/ball";

const grid = selectElement('#grid');
const plotContainer = selectElement('#plot-container');

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms
stats.dom.style.removeProperty('top');
stats.dom.style.position = 'fixed';
stats.dom.style.left = '0px';
stats.dom.style.bottom = '0px';
stats.dom.style.display = 'block';
document.body.appendChild(stats.dom);

enum GameState {
  PAUSED = 1,
  RUNNING = 2,
  GAMEOVER = 3,
}

interface GameInstance {
  name: string;
  engine: BallEngine;
  state: GameState;
  score: number;
  hud: HUD;
  renderer: CssBoard;
}

const instances: GameInstance[] = [];

const engineTypes = [
  { name: 'Math', create: () => new BallEngineMath() },
  { name: 'RK4', create: () => new BallEngineRK4() },
  { name: 'Motion Eq (Delta)', create: () => new BallEngineMotionEquationDelta() },
  { name: 'Motion Eq (Absolute)', create: () => new BallEngineMotionEquationAbsolute() },
];

const engineNames = engineTypes.map(t => t.name);

// Single shared cannon
const cannon = new Cannon();

// Initialize all games
for (const type of engineTypes) {
  const cell = document.createElement('div');
  cell.className = 'cell';

  const hudContainer = document.createElement('div');
  hudContainer.className = 'hud';
  cell.appendChild(hudContainer);

  const gameContainer = document.createElement('div');
  gameContainer.className = 'game';
  cell.appendChild(gameContainer);

  grid.appendChild(cell);

  const ballEngine = type.create();

  const hud = new HUD();
  hudContainer.appendChild(hud);

  selectElement('#engine-name', hud).textContent = type.name;

  const renderer = new CssBoard();
  gameContainer.appendChild(renderer);

  instances.push({
    name: type.name,
    engine: ballEngine,
    state: GameState.RUNNING, // Start running immediately
    score: 0,
    hud,
    renderer
  });
}

function render() {
  stats.begin();
  for (const inst of instances) {
    if (inst.state === GameState.RUNNING) {
      inst.renderer.render(inst.engine, cannon);
      inst.hud.render({ score: inst.score, highscore: 0, lives: 0 });
    }
  }
  stats.end();
}

function step(frameTime: number, lastFrameTime: number) {
  // Update Shared Cannon
  cannon.update(frameTime / 1000, lastFrameTime / 1000);

  // Update All Engines
  let anyBallActive = false;
  for (const inst of instances) {
    if (inst.state === GameState.RUNNING) {
      const updateState = inst.engine.update(frameTime / 1000, lastFrameTime / 1000);

      if (inst.engine.currentBall) {
        anyBallActive = true;
        currentPlotData.push({
          x: inst.engine.currentBall.x,
          y: inst.engine.currentBall.y,
          name: inst.name
        });
      }

      inst.score += updateState.score;

      if (updateState.gameover) {
        inst.state = GameState.GAMEOVER;
        // Game over logic if needed, e.g. dispatch event or just handle internally
      }
    }
  }

  render();

  if (anyBallActive && currentPlotElement) {
    renderPlot(currentPlotElement, currentPlotData, null);
  }

  requestAnimationFrame(nextFrameTime => step(nextFrameTime, frameTime));
}

// Start Loop
requestAnimationFrame((frameTime: number) => {
  render();
  requestAnimationFrame(nextFrameTime => step(nextFrameTime, frameTime));
});

type Point = { x: number; y: number; name: string };
let currentPlotData: Point[] = [];
let currentPlotElement: HTMLElement | null = null;

function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point) {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  if (dx === 0 && dy === 0) {
    return Math.sqrt(Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2));
  }

  const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy);

  if (t < 0) {
    return Math.sqrt(Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2));
  } else if (t > 1) {
    return Math.sqrt(Math.pow(point.x - lineEnd.x, 2) + Math.pow(point.y - lineEnd.y, 2));
  } else {
    const num = Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x);
    const den = Math.sqrt(dy * dy + dx * dx);
    return num / den;
  }
}

/**
 * Simplifies a path of points using the Ramer-Douglas-Peucker algorithm.
 * Removing points that are closer than epsilon to the line segment connecting the start and end points.
 */
function simplifyPath(points: Point[], epsilon: number): Point[] {
  if (points.length < 3) return points;

  let maxDist = 0;
  let index = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end]);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyPath(points.slice(0, index + 1), epsilon);
    const right = simplifyPath(points.slice(index), epsilon);
    return left.slice(0, left.length - 1).concat(right);
  } else {
    return [points[0], points[end]];
  }
}

function renderPlot(currentPlotElement: HTMLElement, currentPlotData: Point[], highlightedEngineName: string | null) {
  const groupedData = new Map<string, Point[]>();
  for (const p of currentPlotData) {
    if (!groupedData.has(p.name)) groupedData.set(p.name, []);
    groupedData.get(p.name)!.push(p);
  }

  const simplifiedData: Point[] = [];
  for (const [, points] of groupedData) {
    simplifiedData.push(...simplifyPath(points, 0.005));
  }

  const plot = Plot.plot({
    grid: true,
    height: 400,
    aspectRatio: 1,
    x: { domain: [0, 1] },
    y: { domain: [Constants.CANNON_Y_POSITION, 1] },
    marks: [
      Plot.ruleY([0]),
      Plot.line(simplifiedData, {
        x: "x",
        y: "y",
        stroke: "name",
        strokeWidth: d => highlightedEngineName === null ? 1 : d.name === highlightedEngineName ? 2 : 0,
        // strokeOpacity: d => d.name === highlightedEngineName ? 1 : 0.5,
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
      Plot.frame()
    ],
    color: { legend: true, domain: engineNames }
  });

  currentPlotElement.replaceChildren(plot);

  // Attach listeners to legend swatches
  // Observable Plot default swatches: figure > div > span
  const swatches = plot.querySelectorAll("figure > div > span");
  swatches.forEach(swatch => {
    // The text content is usually " Name" (with a leading space) or just "Name"
    const name = swatch.textContent?.trim();
    if (name) {
      if (name === highlightedEngineName) {
        (swatch as HTMLElement).style.fontWeight = 'bold';
      }
      swatch.addEventListener('mouseenter', () => {
        if (highlightedEngineName === name) return;
        highlightedEngineName = name;
        renderPlot(currentPlotElement, currentPlotData, highlightedEngineName);
      });
      swatch.addEventListener('mouseleave', () => {
        if (highlightedEngineName === null) return;
        highlightedEngineName = null;
        renderPlot(currentPlotElement, currentPlotData, highlightedEngineName);
      });
    }
  });
}

// Global Input Handler
addTouchOrClickEvent(grid, (evt) => {
  evt.preventDefault();

  if (
    instances.some(({engine: { currentBall }}) => currentBall !== null)
    ||
    instances.every(({state}) => state === GameState.GAMEOVER)
  ) {
    return;
  }

  // Create new plot for this shot
  currentPlotData = [];
  currentPlotElement = document.createElement('div');
  plotContainer.insertBefore(currentPlotElement, plotContainer.firstChild);

  const cannonBall = makeCannonBall({ angle: cannon.getAngle() });

  for (const inst of instances) {
    if (inst.state === GameState.RUNNING) {
      inst.engine.fire(cannonBall);
    }
  }
});

(window as any).instances = instances;
