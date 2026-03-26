import Stats from "stats.js";
import { BallEngineRK4 } from "../core/ball-engine/ball-engine-rk4";
import {
  BallEngineMotionEquationDelta,
  BallEngineMotionEquationAbsolute,
} from "../core/ball-engine/ball-engine-motion-equation";
import { BallEngineMath } from "../core/ball-engine/ball-engine-math";
import { MovingCannon as Cannon } from "../core/cannon";
import { LazerCollisionHandler } from "../core/collision-handler";
import { GameHandler } from "../core/game-handler";
import { addTouchOrClickEvent, asBool, selectElement } from "../core/utils";
import { HUD } from "../ui/hud";
import { CssBoard } from "../ui/css-board";
import { evaluateMoves } from "../core/evaluate-move";
import { normalizeRewards, computeRewardPath } from "../core/reward";
import { LAZER_BONUS_COST, ORACLE_BONUS_COST } from "../core/constants";

function readStoredHighscore(): number {
  return parseInt(localStorage.getItem('highscore') || '0', 10);
}

const queryParams = new URLSearchParams(window.location.search);

function makeBallEngine() {
  const engineName = queryParams.get('ball-engine') ?? 'math';
  switch (engineName) {
    case 'math':
      return new BallEngineMath({verbose: true, epsilon: 1e-10});
    case 'rk4':
      return new BallEngineRK4({verbose: true});
    case 'motion-equation-delta':
      return new BallEngineMotionEquationDelta({verbose: true});
    case 'motion-equation-absolute':
      return new BallEngineMotionEquationAbsolute({verbose: true});
    default:
      throw new Error(`Unknown ball engine: ${engineName}.`);
  }
}

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms
stats.dom.style.removeProperty('top');
stats.dom.style.position = 'fixed';
stats.dom.style.left = '0px';
stats.dom.style.bottom = '0px';
stats.dom.style.display = 'none';
document.body.appendChild(stats.dom);

const screenContainer = selectElement('#screenContainer');
const startScreen = selectElement('#start-screen');
const optionsScreen = selectElement('#optionsScreen');
const pauseScreen = selectElement('#pause-screen');
const gameoverScreen = selectElement('#gameover-screen');
const licenseScreen = selectElement('#licenseScreen');
const startWithThreeLivesButton = selectElement<HTMLInputElement>('#checkbox-start-three-lives');
const showFramerateCheckbox = selectElement<HTMLInputElement>('#showFramerateCheckbox');
const lazerBonusButton = selectElement<HTMLButtonElement>('#lazer-bonus-button');
const oracleBonusButton = selectElement<HTMLButtonElement>('#oracle-bonus-button');

selectElement('#cost', lazerBonusButton).textContent = `-${LAZER_BONUS_COST}`;
selectElement('#cost', oracleBonusButton).textContent = `-${ORACLE_BONUS_COST}`;

const cannon = new Cannon();
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const ballEngine = (window as any).ballEngine = makeBallEngine();
const game = new GameHandler({cannon, ballEngine});
game.highscore = readStoredHighscore();

const hud = new HUD();
selectElement<HTMLDivElement>('.hud').appendChild(hud);

const renderer = new CssBoard();
selectElement<HTMLDivElement>('.game').append(renderer);

Object.assign(window, {cannon, ballEngine, game, hud, renderer}); // For debug.

function showFps(enabled: boolean) {
  localStorage.setItem('show-fps', enabled.toString());
  showFramerateCheckbox.checked = enabled;
  stats.dom.style.display = enabled ? 'block' : 'none';
}

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

  // Visual feedback for lazer mode.
  const gameEl = selectElement<HTMLElement>('.game');
  gameEl.classList.toggle('lazer-mode', game.activeCollisionHandler === LazerCollisionHandler);
  gameEl.classList.toggle('oracle-active', game.oracleActive);

  if (!game.oracleActive) {
    selectElement('#RewardPath').setAttribute('d', '');
  }

  updateLazerButtonState();
  updateOracleButtonState();
});

function updateLazerButtonState() {
  const isLazerActive = game.activeCollisionHandler === LazerCollisionHandler;
  const canEnable = game.canEnableCollisionHandler(LazerCollisionHandler);

  lazerBonusButton.classList.toggle('active', isLazerActive);
  lazerBonusButton.disabled = !isLazerActive && !canEnable;
}

function updateOracleButtonState() {
  const canEnable = game.currentBall === null && game.score >= ORACLE_BONUS_COST;
  oracleBonusButton.classList.toggle('active', game.oracleActive);
  oracleBonusButton.disabled = !canEnable || game.oracleActive;
}

addTouchOrClickEvent(selectElement<HTMLElement>('.fullscreen-container'), (evt) => {
  evt.preventDefault();
  evt.stopPropagation();

  // if (this.isGhostEvent(evt)) return;
  if ((game.currentBall === null) && (game.state === GameHandler.RUNNING)) {
    // TODO Get updated cannon angle.
    game.fire();
  }
});

class MenuNavigator {
  private focusableElements: HTMLElement[] = [];

  public refresh(screen: HTMLElement) {
    this.focusableElements = Array.from(screen.querySelectorAll<HTMLElement>('button, input[type="checkbox"]'))
      .filter(el => {
        if (el instanceof HTMLButtonElement || el instanceof HTMLInputElement) {
          return !el.disabled;
        }
        return true;
      });

    // select the first of the focusable elements with data-autofocus attribute
    const autofocusElement = this.focusableElements.find(el => el.hasAttribute('data-autofocus'));
    autofocusElement?.focus();
  }

  public clear() {
    this.focusableElements = [];
  }

  public next() {
    this.moveFocus(1);
  }

  public previous() {
    this.moveFocus(-1);
  }

  private moveFocus(direction: number) {
    const currentIndex = this.focusableElements.indexOf(document.activeElement as HTMLElement);
    if (currentIndex === -1) {
      this.focusableElements[0]?.focus();
      return;
    }

    const nextIndex = (currentIndex + direction + this.focusableElements.length) % this.focusableElements.length;
    this.focusableElements[nextIndex]?.focus();
  }
}

const menuNavigator = new MenuNavigator();

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

  menuNavigator.refresh(screen);
}

function popScreen() {
  if (screens.length > 0) {
    screens.pop()!.style.display = 'none';

    if (screens.length === 0) {
      screenContainer.style.display = 'none';
      menuNavigator.clear();
    } else {
      const topScreen = screens[screens.length - 1];
      topScreen.style.display = 'block';
      menuNavigator.refresh(topScreen);
    }
  }
}

function popAllScreens() {
  while (screens.length > 0) {
    screens.pop()!.style.display = 'none';
  }

  screenContainer.style.display = 'none';
  menuNavigator.clear();
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

function resumeGame() {
  game.resume();
  popScreen();
}

selectElement('#pause-screen #continue-button').addEventListener('click', function (evt) {
  evt.preventDefault();
  resumeGame();
});

selectElement('#pause-screen #options-button').addEventListener('click', function (evt) {
  evt.preventDefault();
  pushScreen(optionsScreen);
});

lazerBonusButton.addEventListener('click', function (evt) {
  evt.preventDefault();
  if (game.canEnableCollisionHandler(LazerCollisionHandler) || game.activeCollisionHandler === LazerCollisionHandler) {
    game.toggleCollisionHandler(LazerCollisionHandler);
    updateLazerButtonState();

    game.resume();
    popScreen();
  }
});

oracleBonusButton.addEventListener('click', function (evt) {
  evt.preventDefault();
  if (game.score >= 0) {
    game.applyOracleBonus();

    const moves = evaluateMoves(game.staticBalls, { steps: [181, 91], criteria: 'hits' });
    const targets = normalizeRewards(moves);
    const d = computeRewardPath(targets);
    selectElement('#RewardPath').setAttribute('d', d);

    updateLazerButtonState();
    updateOracleButtonState();

    game.resume();
    popScreen();
  }
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

function goBackFromLicense() {
  popScreen();
  licenseScreen.querySelectorAll('details').forEach(function (details) { details.open = false; });
}

selectElement('#licenseScreenBackButton').addEventListener('click', function (evt) {
  evt.preventDefault();
  goBackFromLicense();
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

  const retryButton = selectElement<HTMLButtonElement>('#gameover-screen #retry-button');
  selectElement('#remaining-lives', retryButton).innerText = `${game.lives} ${game.lives > 1 ? 'lives' : 'life'}`;
  retryButton.disabled = !game.canUseLife();

  selectElement('#gameover-screen #play-again-button').style.display = !game.canUseLife() ? 'block' : 'none';

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

    updateLazerButtonState();

    pushScreen(pauseScreen);
  }
}

window.addEventListener('keydown', (ev: KeyboardEvent) => {
  const topScreen = screens.length > 0 ? screens[screens.length - 1] : null;

  if (ev.key === 'Escape') {
    if (!topScreen) {
      pauseGame();
    } else if (topScreen === pauseScreen) {
      resumeGame();
    } else if (topScreen === optionsScreen) {
      popScreen();
    } else if (topScreen === licenseScreen) {
      goBackFromLicense();
    }
  } else if (ev.key === ' ') {
    if (!topScreen && (game.currentBall === null) && (game.state === GameHandler.RUNNING)) {
      ev.stopPropagation();
      ev.preventDefault();
      game.fire();
    }
  } else if (topScreen) {
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      menuNavigator.next();
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      menuNavigator.previous();
    }
  }
});
