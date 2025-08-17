import Stats from "stats.js";
import { DontYouFillItGame } from "./dontyoufillit";
import { DontYouFillItCssGui } from "./dontyoufillit_css_gui";
import { selectElement } from "./utils";

import { HUD } from "./hud";
import { CssBoard } from "./css-board";

const game = (window as any).game = new DontYouFillItGame();

const hud = new HUD();
selectElement<HTMLDivElement>('.hud').appendChild(hud);

const renderer = new CssBoard();
selectElement<HTMLDivElement>('.game').appendChild(renderer);

hud.onPause = ev => {
  ev.preventDefault();
  ev.stopPropagation();
  console.log('Pause');
};

// const gui = (window as any).ui = new DontYouFillItCssGui(game, parseInt(localStorage.getItem('highscore') || '0', 10));

// const stats = new Stats();
// stats.showPanel(0); // 0: fps, 1: ms
// stats.dom.style.removeProperty('top');
// stats.dom.style.position = 'fixed';
// stats.dom.style.left = '0px';
// stats.dom.style.bottom = '0px';
// stats.dom.style.display = 'none';
// document.body.appendChild(stats.dom);

// function beginStep() {
//   stats.begin();
// }

// function endStep() {
//   stats.end();
// }

// function setDebugMode(enabled: boolean) {
//   localStorage.setItem('debug', enabled.toString());

//   if (enabled) {
//     stats.dom.style.display = 'block';
//     gui.observable.addEventListener('beginStep', beginStep);
//     gui.observable.addEventListener('endStep', endStep);
//   } else {
//     stats.dom.style.display = 'none';
//     gui.observable.removeEventListener('beginStep', beginStep);
//     gui.observable.removeEventListener('endStep', endStep);
//   }
// }

// function asBool(v: boolean | string | null) {
//   return v === true || v === 'true';
// }

// const query_string = {};
// window.location.search.substring(1).split('&').forEach(function (e) {
//   const pair = e.split('=', 2);
//   query_string[pair[0]] = (pair.length === 2) ? pair[1] : true;
// });


// if (query_string['debug'] !== undefined) {
//   setDebugMode(asBool(query_string['debug']));
// } else if (localStorage.getItem('debug') !== null) {
//   setDebugMode(asBool(localStorage.getItem('debug')));
// } else {
//   setDebugMode(false);
// }


// const screenContainer = selectElement('#screenContainer'),
//       startScreen = selectElement('#start-screen'),
//       optionsScreen = selectElement('#optionsScreen'),
//       pauseScreen = selectElement('#pause-screen'),
//       gameoverScreen = selectElement('#gameover-screen'),
//       licenseScreen = selectElement('#licenseScreen'),
//       startWithThreeLivesButton = selectElement<HTMLInputElement>('#checkbox-start-three-lives');

// const screens = new Array<HTMLElement>;

// function pushScreen(screen: HTMLElement) {
//   if (screens.length !== 0) {
//     screens[screens.length - 1].style.display = 'none';
//   }

//   screens.push(screen);
//   screen.style.zIndex = screens.length.toString();
//   // Prevent flickering
//   screen.style.visibility = 'hidden';
//   screen.style.display = 'block';
//   screen.scrollTop = 0;
//   screen.style.visibility = 'visible';

//   screenContainer.style.display = 'block';
//   screenContainer.style.backgroundColor = (screen === pauseScreen) ? 'rgba(0, 0, 0, 0.85)' : 'black';
// }

// function popScreen() {
//   if (screens.length > 0) {
//     screens.pop()!.style.display = 'none';

//     if (screens.length === 0) {
//       screenContainer.style.display = 'none';
//     } else {
//       screens[screens.length - 1].style.display = 'block';
//     }
//   }
// }

// function popAllScreens() {
//   while (screens.length > 0) {
//     screens.pop()!.style.display = 'none';
//   }

//   screenContainer.style.display = 'none';
// }

// selectElement('#start-screen #play-button').addEventListener('click', function (evt) {
//   evt.preventDefault();
//   game.lives = startWithThreeLivesButton.checked ? 3 : 0;
//   gui.reset();
//   popAllScreens();
// });

// selectElement('#start-screen #options-button').addEventListener('click', function (evt) {
//   evt.preventDefault();
//   selectElement<HTMLInputElement>('#framerateCheckbox').checked = asBool(localStorage.getItem("debug"));
//   pushScreen(optionsScreen);
// });

// selectElement('#start-screen #license-button').addEventListener('click', function (evt) {
//   evt.preventDefault();
//   pushScreen(licenseScreen);
// });

// selectElement('#optionsScreenBackButton').addEventListener('click', function (evt) {
//   evt.preventDefault();
//   popScreen();
// });

// selectElement('#pause-screen #continue-button').addEventListener('click', function (evt) {
//   evt.preventDefault();
//   gui.resume();
//   popScreen();
// });

// selectElement('#pause-screen #options-button').addEventListener('click', function (evt) {
//   evt.preventDefault();
//   pushScreen(optionsScreen);
// });

// selectElement('#pause-screen #menu-button').addEventListener('click', function (evt) {
//   evt.preventDefault();
//   popScreen();
//   pushScreen(startScreen);
// });

// selectElement('#retry-button').addEventListener('click', function (evt) {
//   evt.preventDefault();

//   game.useLife();
//   gui.resume();

//   popAllScreens();
// });

// selectElement('#play-again-button').addEventListener('click', function (evt) {
//   evt.preventDefault();
//   game.lives = startWithThreeLivesButton.checked ? 3 : 0;
//   gui.reset();
//   popAllScreens();
// });

// selectElement('#gameover-screen #menu-button').addEventListener('click', function (evt) {
//   evt.preventDefault();
//   popScreen();
//   pushScreen(startScreen);
// });

// selectElement('#licenseScreenBackButton').addEventListener('click', function (evt) {
//   evt.preventDefault();
//   popScreen();
//   licenseScreen.querySelectorAll('details').forEach(function (details) { details.open = false; });
// });

// selectElement('#framerateCheckbox').addEventListener('change', function (this: HTMLInputElement) {
//   setDebugMode(asBool(this.checked));
// });

// gui.observable.addEventListener('pause', () => {
//   pushScreen(pauseScreen);
// });

// gui.observable.addEventListener('gameover', function (score) {
//   const highscore = parseInt(localStorage.getItem('highscore') || '0', 10);
//   const newHighscore = score > highscore;

//   if (newHighscore) {
//     localStorage.setItem('highscore', score.toString(10));
//   }

//   selectElement('#gameover-screen #score-message').style.display = (newHighscore ? 'none' : 'inline');
//   selectElement('#gameover-screen #highscore-message').style.display = (newHighscore ? 'inline' : 'none');
//   selectElement('#gameover-screen #score').innerText = score.toString();

//   selectElement('#gameover-screen #retry-button #remaining-lives').innerText = `${game.lives} ${game.lives > 1 ? 'lives' : 'life'}`;
//   selectElement('#gameover-screen #retry-button').parentElement!.style.display = game.canUseLife() ? 'block' : 'none';

//   selectElement('#gameover-screen #play-again-button').parentElement!.style.display = !game.canUseLife() ? 'block' : 'none';

//   pushScreen(gameoverScreen);
// });

// pushScreen(startScreen);
