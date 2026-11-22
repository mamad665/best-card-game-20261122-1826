// Shadow Deck — Card Duel: the game loop and the duel itself.
// Screens: start -> play -> win / lose. The player clicks a card (or
// presses 1-5) to play it; the card flies to the table, its attack, block
// and draw resolve, and floating numbers show what happened. End Turn
// hands the table to the Warden, whose AI plays its own cards one at a
// time, then the next turn begins with one more mana. ?shot=start|play|
// win|lose stages a deterministic scene for screenshots (see shots.js).

import { BEST_KEY, CARD, FIELD } from './config.js';
import { cardById, dealDamage, newFighter, playCard, startTurn } from './deck.js';
import { chooseAiCard } from './ai.js';
import { createInput, insideRect, takeClick, takeKey } from './input.js';
import { endTurnRect, handCardRect, render, SCREEN_LOSE, SCREEN_PLAY, SCREEN_START, SCREEN_WIN, startButtonRect } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

function fitCanvas() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;
  canvas.style.width = `${Math.floor(FIELD.width * scale)}px`;
  canvas.style.height = `${Math.floor(FIELD.height * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

const input = createInput(canvas);

/** A seeded random, so a screenshot seed always stages the same duel. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') ?? '7') || 7;
const shotName = params.get('shot');

const game = {
  screen: SCREEN_START,
  player: null,
  enemy: null,
  turn: 'player',
  turnNumber: 1,
  hovered: -1,
  selected: -1,
  flying: null,
  floaters: [],
  lastPlay: { player: null, playerAttack: 0, enemy: null, enemyAttack: 0 },
  message: 'Click a card to play it, or press 1–5.',
  log: [],
  best: Number(localStorage.getItem(BEST_KEY) ?? '0'),
  aiTimer: 0,
  aiBusy: false,
  random: mulberry32(seed),
};

function logLine(text) {
  game.log.push(text);
  if (game.log.length > 40) game.log.shift();
}

function addFloater(text, x, y, color, size = 30) {
  game.floaters.push({ text, x, y, color, size, age: 0, life: 1.1 });
}

function startDuel() {
  game.random = mulberry32(seed);
  game.player = newFighter(game.random);
  game.enemy = newFighter(game.random);
  game.turn = 'player';
  game.turnNumber = 1;
  game.flying = null;
  game.floaters = [];
  game.lastPlay = { player: null, playerAttack: 0, enemy: null, enemyAttack: 0 };
  game.log = [];
  game.message = 'Your turn — play a card, then End Turn.';
  game.screen = SCREEN_PLAY;
  logLine('The duel begins. Your turn.');
}

function checkEnd() {
  if (game.enemy.hp <= 0) {
    game.screen = SCREEN_WIN;
    game.message = 'Victory! Press R to duel again.';
    logLine(`Victory in ${game.turnNumber} turns.`);
    if (game.turnNumber > game.best) {
      game.best = game.turnNumber;
      localStorage.setItem(BEST_KEY, String(game.best));
    }
    return true;
  }
  if (game.player.hp <= 0) {
    game.screen = SCREEN_LOSE;
    game.message = 'Defeat. Press R to try again.';
    logLine('Defeat — the Warden keeps the table.');
    return true;
  }
  return false;
}

/** Play the player's card at hand index `i`, with the slide animation. */
function playPlayerCard(i) {
  if (game.screen !== SCREEN_PLAY || game.turn !== 'player' || game.flying) return;
  const card = cardById(game.player.hand[i]);
  if (!card) return;
  if (card.cost > game.player.mana) {
    game.message = `Not enough mana for ${card.name} (${card.cost} needed).`;
    return;
  }
  const from = handCardRect(i, game.player.hand.length);
  const result = playCard(game.player, game.enemy, i, game.random);
  if (!result) return;
  game.flying = {
    id: result.card.id,
    attack: result.attack,
    from: { x: from.x, y: from.y },
    to: { x: FIELD.width / 2 - 150, y: 240 },
    t: 0,
  };
  game.lastPlay.player = result.card.id;
  game.lastPlay.playerAttack = result.attack;
  if (result.attack > 0) {
    addFloater(`-${result.hpLost}`, FIELD.width / 2, 60, '#ff6b5e', 34);
    logLine(`You play ${result.card.name} for ${result.attack} damage.`);
  }
  if (result.blockGained > 0) {
    addFloater(`+${result.blockGained} shield`, FIELD.width / 2, 660, '#7fb3d5', 26);
    logLine(`You gain ${result.blockGained} shield.`);
  }
  if (result.drew > 0) logLine(`You draw ${result.drew} card${result.drew > 1 ? 's' : ''}.`);
  game.message = `Played ${result.card.name}.`;
  checkEnd();
}

/** Hand the table to the Warden; it plays until it has no good card left. */
function endPlayerTurn() {
  if (game.screen !== SCREEN_PLAY || game.turn !== 'player') return;
  game.turn = 'enemy';
  game.aiBusy = true;
  game.aiTimer = 0.6;
  game.message = "The Warden is thinking…";
  logLine('— Warden’s turn —');
}

function aiStep(dt) {
  if (!game.aiBusy) return;
  game.aiTimer -= dt;
  if (game.aiTimer > 0) return;
  const index = chooseAiCard(game.enemy, game.player);
  if (index === -1 || checkEnd()) {
    game.aiBusy = false;
    if (game.screen === SCREEN_PLAY) {
      game.turnNumber += 1;
      if (game.turnNumber > 30) {
        // Turn cap: the side with more HP takes the table.
        game.screen = game.player.hp >= game.enemy.hp ? SCREEN_WIN : SCREEN_LOSE;
        game.message = 'Turn limit reached.';
      } else {
        startTurn(game.player, game.random);
        game.turn = 'player';
        game.message = `Turn ${game.turnNumber} — your mana is ${game.player.mana}.`;
        logLine(`Turn ${game.turnNumber}: your mana grows to ${game.player.mana}.`);
      }
    }
    return;
  }
  const card = cardById(game.enemy.hand[index]);
  const result = playCard(game.enemy, game.player, index, game.random);
  if (!result) {
    game.aiBusy = false;
    return;
  }
  game.lastPlay.enemy = result.card.id;
  game.lastPlay.enemyAttack = result.attack;
  if (result.attack > 0) {
    addFloater(`-${result.hpLost}`, FIELD.width / 2, 660, '#ff6b5e', 34);
    logLine(`Warden plays ${result.card.name} for ${result.attack} damage.`);
  }
  if (result.blockGained > 0) logLine(`Warden gains ${result.blockGained} shield.`);
  game.aiTimer = 0.7;
  checkEnd();
}

function update(dt) {
  for (const floater of game.floaters) floater.age += dt;
  game.floaters = game.floaters.filter((f) => f.age < f.life);
  if (game.flying) {
    game.flying.t = Math.min(1, game.flying.t + dt * 2.4);
    if (game.flying.t >= 1) game.flying = null;
  }

  // Hover: which hand card sits under the pointer.
  game.hovered = -1;
  if (input.pointer.inside && game.screen === SCREEN_PLAY && game.player) {
    game.player.hand.forEach((_, i) => {
      const rect = handCardRect(i, game.player.hand.length);
      if (insideRect(input.pointer.x, input.pointer.y, rect)) game.hovered = i;
    });
  }

  const click = takeClick(input);
  if (click) {
    if (game.screen === SCREEN_START && insideRect(click.x, click.y, startButtonRect())) {
      startDuel();
    } else if (game.screen === SCREEN_PLAY && game.turn === 'player') {
      let played = false;
      game.player.hand.forEach((_, i) => {
        const rect = handCardRect(i, game.player.hand.length);
        if (insideRect(click.x, click.y, rect)) {
          playPlayerCard(i);
          played = true;
        }
      });
      if (!played && insideRect(click.x, click.y, endTurnRect())) endPlayerTurn();
    } else if ((game.screen === SCREEN_WIN || game.screen === SCREEN_LOSE) && click) {
      startDuel();
    }
  }

  if (takeKey(input, ' ') || takeKey(input, 'enter')) {
    if (game.screen === SCREEN_START) startDuel();
  }
  if (takeKey(input, 'e') && game.screen === SCREEN_PLAY) endPlayerTurn();
  if (takeKey(input, 'r') && (game.screen === SCREEN_WIN || game.screen === SCREEN_LOSE)) startDuel();
  for (let n = 1; n <= 5; n += 1) {
    if (takeKey(input, String(n))) playPlayerCard(n - 1);
  }
  if (takeKey(input, 'arrowleft') && game.hovered > 0) game.hovered -= 1;
  if (takeKey(input, 'arrowright') && game.hovered < game.player?.hand.length - 1) game.hovered += 1;

  if (game.screen === SCREEN_PLAY && game.turn === 'enemy') aiStep(dt);
}

function frame(now) {
  const dt = Math.min(0.05, (now - (frame.last ?? now)) / 1000);
  frame.last = now;
  update(dt);
  const view = {
    screen: game.screen,
    player: game.player ?? { hp: 30, maxHp: 30, block: 0, mana: 1, maxMana: 1, hand: [], deck: [], discard: [], playedThisTurn: [] },
    enemy: game.enemy ?? { hp: 30, maxHp: 30, block: 0, mana: 1, maxMana: 1, hand: [], deck: [], discard: [], playedThisTurn: [] },
    turn: game.turn,
    turnNumber: game.turnNumber,
    hovered: game.hovered,
    selected: game.selected,
    flying: game.flying,
    floaters: game.floaters,
    lastPlay: game.lastPlay,
    message: game.message,
    log: game.log,
    sampleHand: ['ember-blaze', 'tide-current', 'thorn-wall', 'gloom-shade', 'ember-echo'],
  };
  render(ctx, view);
  status.textContent = game.screen === SCREEN_PLAY
    ? `You ${view.player.hp} HP, Warden ${view.enemy.hp} HP, turn ${game.turnNumber}`
    : game.screen === SCREEN_START ? 'Shadow Deck — Card Duel. Press Space to duel.' : game.message;
  requestAnimationFrame(frame);
}

// A screenshot scene (?shot=...) stages a fixed duel and freezes it;
// a normal visit starts on the title screen.
if (shotName) {
  const staged = stageShot(shotName, game, { startDuel, playPlayerCard, endPlayerTurn, checkEnd });
  game.screen = staged.screen;
  window.__shotReady = true;
}
window.__game = game;
requestAnimationFrame(frame);
