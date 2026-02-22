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
const lazerBonusButton = selectElement<HTMLElement>('#lazer-bonus-button');

const cannon = new Cannon();
const ballEngine = (window as any).ballEngine = makeBallEngine();
const game = new GameHandler({cannon, ballEngine});
game.highscore = readStoredHighscore();

const hud = new HUD();
selectElement<HTMLDivElement>('.hud').appendChild(hud);

const renderer = new CssBoard();
selectElement<HTMLDivElement>('.game').appendChild(renderer);

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
  selectElement<HTMLElement>('.game').classList.toggle('lazer-mode', game.activeCollisionHandler === LazerCollisionHandler);

  updateLazerButtonState();
});

function updateLazerButtonState() {
  const isLazerActive = game.activeCollisionHandler === LazerCollisionHandler;
  const canEnable = game.canEnableCollisionHandler(LazerCollisionHandler);

  lazerBonusButton.classList.toggle('active', isLazerActive);
  lazerBonusButton.classList.toggle('disabled', !isLazerActive && !canEnable);
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
  private selectedIndex: number = -1;
  private focusableElements: HTMLElement[] = [];

  constructor() {}

  public refresh(screen: HTMLElement) {
    this.clearSelection();
    this.focusableElements = Array.from(screen.querySelectorAll('button, input[type="checkbox"], .bonus-info-trigger'));

    // Attach click listeners to sync selection
    this.focusableElements.forEach((el) => {
      if (!(el as any).__menuListenerAttached) {
        el.addEventListener('click', () => {
          // Re-find index since focusableElements might have changed
          const currentIndex = this.focusableElements.indexOf(el);
          if (currentIndex !== -1) {
            this.setSelection(currentIndex);
          }
        }, { passive: true });
        (el as any).__menuListenerAttached = true;
      }
    });

    this.selectedIndex = this.focusableElements.findIndex(el => el.classList.contains('selected-item'));
    if (this.selectedIndex === -1 && this.focusableElements.length > 0) {
      this.setSelection(0);
    }
  }

  public clear() {
    this.clearSelection();
    this.focusableElements = [];
    this.selectedIndex = -1;
  }

  private clearSelection() {
    if (this.selectedIndex !== -1 && this.focusableElements[this.selectedIndex]) {
      this.focusableElements[this.selectedIndex].classList.remove('selected-item');
    }
  }

  private setSelection(index: number) {
    this.clearSelection();
    this.selectedIndex = (index + this.focusableElements.length) % this.focusableElements.length;
    const el = this.focusableElements[this.selectedIndex];
    if (el) {
      el.classList.add('selected-item');
      el.scrollIntoView({ block: 'nearest' });
    }
  }

  public next() {
    if (this.focusableElements.length > 0) {
      this.setSelection(this.selectedIndex + 1);
    }
  }

  public previous() {
    if (this.focusableElements.length > 0) {
      this.setSelection(this.selectedIndex - 1);
    }
  }

  public activate() {
    if (this.selectedIndex !== -1 && this.focusableElements[this.selectedIndex]) {
      const el = this.focusableElements[this.selectedIndex];
      el.click();
    }
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
  screenContainer.style.backgroundColor = (screen === pauseScreen) ? 'rgba(0, 0, 0, 0.85)' : 'black';

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
  }

  game.resume();
  popScreen();
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

  selectElement('#gameover-screen #retry-button #remaining-lives').innerText = `${game.lives} ${game.lives > 1 ? 'lives' : 'life'}`;
  selectElement('#gameover-screen #retry-button').style.display = game.canUseLife() ? 'block' : 'none';

  selectElement('#gameover-screen #play-again-button').style.display = !game.canUseLife() ? 'block' : 'none';

  pushScreen(gameoverScreen);
});

function setupCollapsible(headerSelector: string, containerSelector: string) {
  const header = selectElement(headerSelector);
  const container = selectElement(containerSelector);

  header.addEventListener('click', () => {
    container.classList.toggle('expanded');
  });
}

setupCollapsible('.bonus-info-trigger', '.bonus-header');

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
    selectElement('.bonus-header').classList.remove('expanded');

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
  } else if (topScreen) {
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      menuNavigator.next();
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      menuNavigator.previous();
    } else if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      menuNavigator.activate();
    }
  }
});
