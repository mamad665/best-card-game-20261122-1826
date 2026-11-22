// Shadow Deck — Card Duel: the deterministic screenshot scenes behind
// ?shot=start|play|win|lose. Each one plays the real rules forward from a
// fresh duel with the same seed, so the frame is what a short game really
// looks like and the same seed always gives the same frame. The win and
// lose scenes stage the same mid-duel, then set the losing side's HP to 0
// and show that screen over the finished table.

import { cardById, playCard } from './deck.js';
import { SCREEN_LOSE, SCREEN_PLAY, SCREEN_START, SCREEN_WIN } from './render.js';

/** Play the first affordable card in `fighter`'s hand against `opponent`. */
function playFirstAffordable(game, fighter, opponent, isPlayer) {
  for (let index = 0; index < fighter.hand.length; index += 1) {
    const card = cardById(fighter.hand[index]);
    if (card.cost > fighter.mana) continue;
    const result = playCard(fighter, opponent, index, game.random);
    if (!result) continue;
    if (isPlayer) {
      game.lastPlay.player = result.card.id;
      game.lastPlay.playerAttack = result.attack;
      game.log.push(`You play ${result.card.name} for ${result.attack} damage.`);
    } else {
      game.lastPlay.enemy = result.card.id;
      game.lastPlay.enemyAttack = result.attack;
      game.log.push(`Warden plays ${result.card.name} for ${result.attack} damage.`);
    }
    return true;
  }
  return false;
}

/** A mid-duel table: a few turns in, both sides hurt, cards in hand. */
function stageMidDuel(game, actions) {
  actions.startDuel();
  game.turnNumber = 4;
  game.player.maxMana = 6;
  game.player.mana = 6;
  game.enemy.maxMana = 5;
  game.enemy.mana = 5;
  // The player opens with two cards; clear the slide between plays so the
  // staged frame is still instead of mid-flight.
  playFirstAffordable(game, game.player, game.enemy, true);
  game.flying = null;
  playFirstAffordable(game, game.player, game.enemy, true);
  game.flying = null;
  playFirstAffordable(game, game.enemy, game.player, false);
  game.player.hp = 24;
  game.enemy.hp = 19;
  game.message = 'Your turn — play a card, then End Turn.';
  game.log.push('Turn 4: your mana grows to 6.');
  return { screen: SCREEN_PLAY };
}

/**
 * Set `game` to the named scene (start, play, win or lose; any other name
 * is start) and return the screen to draw over it.
 */
export function stageShot(name, game, actions) {
  if (name === 'play') return stageMidDuel(game, actions);
  if (name === 'win') {
    stageMidDuel(game, actions);
    game.enemy.hp = 0;
    game.screen = SCREEN_WIN;
    game.message = 'Victory! Press R to duel again.';
    game.log.push('Victory in 4 turns.');
    return { screen: SCREEN_WIN };
  }
  if (name === 'lose') {
    stageMidDuel(game, actions);
    game.player.hp = 0;
    game.screen = SCREEN_LOSE;
    game.message = 'Defeat. Press R to try again.';
    game.log.push('Defeat — the Warden keeps the table.');
    return { screen: SCREEN_LOSE };
  }
  return { screen: SCREEN_START };
}
