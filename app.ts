import { DontYouFillItGame } from "./dontyoufillit";
import { DontYouFillItCssGui } from "./dontyoufillit_css_gui";
import Stats from "stats.js";

const game = new DontYouFillItGame();
const gui = new DontYouFillItCssGui(game, parseInt(localStorage.getItem('highscore') || '0', 10));

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms
stats.dom.style.removeProperty('top');
stats.dom.style.position = 'fixed';
stats.dom.style.left = '0px';
stats.dom.style.bottom = '0px';
stats.dom.style.display = 'none';
document.body.appendChild(stats.dom);

function beginStep() {
  stats.begin();
}

function endStep() {
  stats.end();
}

function setDebugMode(enabled: boolean) {
  localStorage.setItem('debug', enabled.toString());

  if (enabled) {
    stats.dom.style.display = 'block';
    gui.observable.addEventListener('beginStep', beginStep);
    gui.observable.addEventListener('endStep', endStep);
  } else {
    stats.dom.style.display = 'none';
    gui.observable.removeEventListener('beginStep', beginStep);
    gui.observable.removeEventListener('endStep', endStep);
  }
}

function asBool(v: boolean | string | null) {
  return v === true || v === 'true';
}

const query_string = {};
window.location.search.substring(1).split('&').forEach(function (e) {
  const pair = e.split('=', 2);
  query_string[pair[0]] = (pair.length === 2) ? pair[1] : true;
});


if (query_string['debug'] !== undefined) {
  setDebugMode(asBool(query_string['debug']));
} else if (localStorage.getItem('debug') !== null) {
  setDebugMode(asBool(localStorage.getItem('debug')));
} else {
  setDebugMode(false);
}


const screenContainer = document.querySelector<HTMLElement>('#screenContainer')!,
      startScreen = document.querySelector<HTMLElement>('#startScreen')!,
      optionsScreen = document.querySelector<HTMLElement>('#optionsScreen')!,
      pauseScreen = document.querySelector<HTMLElement>('#pauseScreen')!,
      gameoverScreen = document.querySelector<HTMLElement>('#gameoverScreen')!,
      licenseScreen = document.querySelector<HTMLElement>('#licenseScreen')!;

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

document.getElementById('startScreenPlayButton')!.addEventListener('click', function (evt) {
  evt.preventDefault();
  gui.resume();
  popAllScreens();
});

document.getElementById('startScreenOptionsButton')!.addEventListener('click', function (evt) {
  evt.preventDefault();
  document.querySelector<HTMLInputElement>('#framerateCheckbox')!.checked = asBool(localStorage.getItem("debug"));
  pushScreen(optionsScreen);
});

document.getElementById('optionsScreenBackButton')!.addEventListener('click', function (evt) {
  evt.preventDefault();
  popScreen();
});

document.getElementById('pauseScreenContinueButton')!.addEventListener('click', function (evt) {
  evt.preventDefault();
  gui.resume();
  popScreen();
});

document.getElementById('pauseScreenOptionsButton')!.addEventListener('click', function (evt) {
  evt.preventDefault();
  pushScreen(optionsScreen);
});

document.getElementById('gameoverScreenPlayAgainButton')!.addEventListener('click', function (evt) {
  evt.preventDefault();
  gui.reset();
  popAllScreens();
});

document.getElementById('startScreenLicenseButton')!.addEventListener('click', function (evt) {
  evt.preventDefault();
  pushScreen(licenseScreen);
});

document.getElementById('licenseScreenBackButton')!.addEventListener('click', function (evt) {
  evt.preventDefault();
  popScreen();
  licenseScreen.querySelectorAll('details').forEach(function (details) { details.open = false; });
});

document.getElementById('framerateCheckbox')!.addEventListener('change', function (this: HTMLInputElement) {
  setDebugMode(asBool(this.checked));
});

gui.observable.addEventListener('pause', () => {
  pushScreen(pauseScreen);
});

gui.observable.addEventListener('gameover', function (score) {
  const highscore = parseInt(localStorage.getItem('highscore') || '0', 10);
  const newHighscore = score > highscore;

  if (newHighscore) localStorage.setItem('highscore', score.toString(10));

  document.getElementById('gameoverScreenScoreMessage')!.style.display = (newHighscore ? 'none' : 'inline');
  document.getElementById('gameoverScreenHighscoreMessage')!.style.display = (newHighscore ? 'inline' : 'none');
  document.getElementById('gameoverScreenScore')!.innerHTML = score.toString();

  pushScreen(gameoverScreen);
});

pushScreen(startScreen);
