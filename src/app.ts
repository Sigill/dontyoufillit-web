import Stats from "stats.js";
import { BallEngineRK4 } from "./ball-engine-rk4";
import {
  BallEngineMotionEquationDelta,
  BallEngineMotionEquationAbsolute,
} from "./ball-engine-motion-equation";
import { BallEngineMath } from "./ball-engine-math";
import { Cannon } from "./cannon";
import { CssBoard } from "./css-board";
import { GameHandler } from "./game-handler";
import { HUD } from "./hud";
import { addTouchOrClickEvent, asBool, selectElement } from "./utils";

function readStoredHighscore(): number {
  return parseInt(localStorage.getItem('highscore') || '0', 10);
}

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms
stats.dom.style.removeProperty('top');
stats.dom.style.position = 'fixed';
stats.dom.style.left = '0px';
stats.dom.style.bottom = '0px';
stats.dom.style.display = 'none';
document.body.appendChild(stats.dom);

const screenContainer = selectElement('#screenContainer'),
      startScreen = selectElement('#start-screen'),
      optionsScreen = selectElement('#optionsScreen'),
      pauseScreen = selectElement('#pause-screen'),
      gameoverScreen = selectElement('#gameover-screen'),
      licenseScreen = selectElement('#licenseScreen'),
      startWithThreeLivesButton = selectElement<HTMLInputElement>('#checkbox-start-three-lives'),
      showFramerateCheckbox = selectElement<HTMLInputElement>('#showFramerateCheckbox');

const cannon = new Cannon();
// const ballEngine = new BallEngineRK4();
// const ballEngine = new BallEngineMotionEquationDelta();
// const ballEngine = new BallEngineMotionEquationAbsolute();
const ballEngine = new BallEngineMath();
const game = new GameHandler({cannon, ballEngine});
game.highscore = readStoredHighscore();

const hud = new HUD();
selectElement<HTMLDivElement>('.hud').appendChild(hud);

const renderer = new CssBoard();
selectElement<HTMLDivElement>('.game').appendChild(renderer);

// Object.assign(window, {cannon, ballEngine, game, hud, renderer}); // For debug.

function showFps(enabled: boolean) {
  localStorage.setItem('show-fps', enabled.toString());
  showFramerateCheckbox.checked = enabled;
  stats.dom.style.display = enabled ? 'block' : 'none';
}

const queryParams = new URLSearchParams(window.location.search);

if (queryParams.get('show-fps') !== undefined) {
  showFps(asBool(queryParams.get('show-fps')));
} else if (localStorage.getItem('show-fps') !== null) {
  showFps(asBool(localStorage.getItem('show-fps')));
} else {
  showFps(false);
}

game.observable.addEventListener('beginStep', () => {
  if (showFramerateCheckbox.checked) {
    stats.begin();
  }
});

game.observable.addEventListener('endStep', () => {
  hud.render({score: game.score, highscore: game.highscore, lives: game.lives});
  renderer.render(ballEngine, cannon);

  if (showFramerateCheckbox.checked) {
    stats.end();
  }
});

addTouchOrClickEvent(selectElement<HTMLElement>('.fullscreen-container'), (evt) => {
  evt.preventDefault();
  evt.stopPropagation();

  // if (this.isGhostEvent(evt)) return;
  if ((game.currentBall === null) && (game.state === GameHandler.RUNNING)) {
    // TODO Get updated cannon angle.
    game.fire();
  }
});

const screens = new Array<HTMLElement>;

function pushScreen(screen: HTMLElement) {
  if (screens.length !== 0) {
    screens[screens.length - 1].style.display = 'none';
  }

  screens.push(screen);
  screen.style.zIndex = screens.length.toString();
  // Prevent flickering
  screen.style.visibility = 'hidden';
  screen.style.display = 'block';
  screen.scrollTop = 0;
  screen.style.visibility = 'visible';

  screenContainer.style.display = 'block';
  screenContainer.style.backgroundColor = (screen === pauseScreen) ? 'rgba(0, 0, 0, 0.85)' : 'black';
}

function popScreen() {
  if (screens.length > 0) {
    screens.pop()!.style.display = 'none';

    if (screens.length === 0) {
      screenContainer.style.display = 'none';
    } else {
      screens[screens.length - 1].style.display = 'block';
    }
  }
}

function popAllScreens() {
  while (screens.length > 0) {
    screens.pop()!.style.display = 'none';
  }

  screenContainer.style.display = 'none';
}

selectElement('#start-screen #play-button').addEventListener('click', function (evt) {
  evt.preventDefault();
  game.lives = startWithThreeLivesButton.checked ? 3 : 0;
  game.reset();
  popAllScreens();
});

selectElement('#start-screen #options-button').addEventListener('click', function (evt) {
  evt.preventDefault();
  pushScreen(optionsScreen);
});

selectElement('#start-screen #license-button').addEventListener('click', function (evt) {
  evt.preventDefault();
  pushScreen(licenseScreen);
});

selectElement('#optionsScreenBackButton').addEventListener('click', function (evt) {
  evt.preventDefault();
  popScreen();
});

selectElement('#pause-screen #continue-button').addEventListener('click', function (evt) {
  evt.preventDefault();
  game.resume();
  popScreen();
});

selectElement('#pause-screen #options-button').addEventListener('click', function (evt) {
  evt.preventDefault();
  pushScreen(optionsScreen);
});

selectElement('#pause-screen #menu-button').addEventListener('click', function (evt) {
  evt.preventDefault();
  popScreen();
  pushScreen(startScreen);
});

selectElement('#retry-button').addEventListener('click', function (evt) {
  evt.preventDefault();
  game.useLife();
  popAllScreens();
});

selectElement('#play-again-button').addEventListener('click', function (evt) {
  evt.preventDefault();
  game.lives = startWithThreeLivesButton.checked ? 3 : 0;
  game.reset();
  popAllScreens();
});

selectElement('#gameover-screen #menu-button').addEventListener('click', function (evt) {
  evt.preventDefault();
  popScreen();
  pushScreen(startScreen);
});

selectElement('#licenseScreenBackButton').addEventListener('click', function (evt) {
  evt.preventDefault();
  popScreen();
  licenseScreen.querySelectorAll('details').forEach(function (details) { details.open = false; });
});

showFramerateCheckbox.addEventListener('change', function (this) {
  showFps(asBool(this.checked));
});

game.observable.addEventListener('gameover', function () {
  const { score, highscore } = game;

  const newHighscore = highscore > parseInt(localStorage.getItem('highscore') || '0', 10);
  if (newHighscore) {
    localStorage.setItem('highscore', score.toString(10));
  }

  selectElement('#gameover-screen #score-message').style.display = (newHighscore ? 'none' : 'inline');
  selectElement('#gameover-screen #highscore-message').style.display = (newHighscore ? 'inline' : 'none');
  selectElement('#gameover-screen #score').innerText = score.toString();

  selectElement('#gameover-screen #retry-button #remaining-lives').innerText = `${game.lives} ${game.lives > 1 ? 'lives' : 'life'}`;
  selectElement('#gameover-screen #retry-button').parentElement!.style.display = game.canUseLife() ? 'block' : 'none';

  selectElement('#gameover-screen #play-again-button').parentElement!.style.display = !game.canUseLife() ? 'block' : 'none';

  pushScreen(gameoverScreen);
});

pushScreen(startScreen);

hud.onPause = ev => {
  ev.preventDefault();
  ev.stopPropagation();
  pauseGame();
};

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    pauseGame();
  }
}, false);

function pauseGame() {
  if (game.state === GameHandler.RUNNING) {
    game.pause();
    pushScreen(pauseScreen);
  }
}
