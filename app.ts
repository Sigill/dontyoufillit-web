import Stats from "stats.js";
import { DontYouFillItGame } from "./dontyoufillit";
import { DontYouFillItCssGui } from "./dontyoufillit_css_gui";
import { selectElement } from "./utils";

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


const screenContainer = selectElement('#screenContainer'),
      startScreen = selectElement('#startScreen'),
      optionsScreen = selectElement('#optionsScreen'),
      pauseScreen = selectElement('#pauseScreen'),
      gameoverScreen = selectElement('#gameoverScreen'),
      licenseScreen = selectElement('#licenseScreen');

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

selectElement('#startScreenPlayButton').addEventListener('click', function (evt) {
  evt.preventDefault();
  gui.resume();
  popAllScreens();
});

selectElement('#startScreenOptionsButton').addEventListener('click', function (evt) {
  evt.preventDefault();
  selectElement<HTMLInputElement>('#framerateCheckbox').checked = asBool(localStorage.getItem("debug"));
  pushScreen(optionsScreen);
});

selectElement('#optionsScreenBackButton').addEventListener('click', function (evt) {
  evt.preventDefault();
  popScreen();
});

selectElement('#pauseScreenContinueButton').addEventListener('click', function (evt) {
  evt.preventDefault();
  gui.resume();
  popScreen();
});

selectElement('#pauseScreenOptionsButton').addEventListener('click', function (evt) {
  evt.preventDefault();
  pushScreen(optionsScreen);
});

selectElement('#gameoverScreenPlayAgainButton').addEventListener('click', function (evt) {
  evt.preventDefault();
  gui.reset();
  popAllScreens();
});

selectElement('#startScreenLicenseButton').addEventListener('click', function (evt) {
  evt.preventDefault();
  pushScreen(licenseScreen);
});

selectElement('#licenseScreenBackButton').addEventListener('click', function (evt) {
  evt.preventDefault();
  popScreen();
  licenseScreen.querySelectorAll('details').forEach(function (details) { details.open = false; });
});

selectElement('#framerateCheckbox').addEventListener('change', function (this: HTMLInputElement) {
  setDebugMode(asBool(this.checked));
});

gui.observable.addEventListener('pause', () => {
  pushScreen(pauseScreen);
});

gui.observable.addEventListener('gameover', function (score) {
  const highscore = parseInt(localStorage.getItem('highscore') || '0', 10);
  const newHighscore = score > highscore;

  if (newHighscore) localStorage.setItem('highscore', score.toString(10));

  selectElement('#gameoverScreenScoreMessage').style.display = (newHighscore ? 'none' : 'inline');
  selectElement('#gameoverScreenHighscoreMessage').style.display = (newHighscore ? 'inline' : 'none');
  selectElement('#gameoverScreenScore').innerHTML = score.toString();

  pushScreen(gameoverScreen);
});

pushScreen(startScreen);
