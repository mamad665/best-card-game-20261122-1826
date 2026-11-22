// Shadow Deck — Card Duel: the deck and the duel state.
// A deck is a shuffled pile of card ids; a fighter holds HP, block, mana,
// a hand, a deck pile and a discard pile. Playing a card resolves its
// attack, block and draw against the other fighter, then moves it to
// discard. Nothing here touches the canvas.

import { CARD_POOL, DECK_COPIES, ECHO_BONUS, HAND_SIZE, MAX_MANA, START_HP, START_MANA } from './config.js';

/** Build a fresh 30-card deck (two copies of every pool card) and shuffle it. */
export function buildDeck(random) {
  const deck = [];
  for (const card of CARD_POOL) {
    for (let copy = 0; copy < DECK_COPIES; copy += 1) deck.push(card.id);
  }
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function cardById(id) {
  return CARD_POOL.find((card) => card.id === id);
}

/** A fresh fighter: full HP, empty block, a new deck, a starting hand. */
export function newFighter(random) {
  const fighter = {
    hp: START_HP,
    maxHp: START_HP,
    block: 0,
    mana: START_MANA,
    maxMana: START_MANA,
    deck: buildDeck(random),
    hand: [],
    discard: [],
    playedThisTurn: [],
  };
  drawCards(fighter, HAND_SIZE, random);
  return fighter;
}

/**
 * Draw `count` cards into the fighter's hand. When the deck runs dry the
 * discard pile is shuffled back in; when both are empty nothing is drawn.
 */
export function drawCards(fighter, count, random) {
  for (let n = 0; n < count; n += 1) {
    if (fighter.deck.length === 0) {
      if (fighter.discard.length === 0) return;
      fighter.deck = fighter.discard;
      fighter.discard = [];
      for (let i = fighter.deck.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [fighter.deck[i], fighter.deck[j]] = [fighter.deck[j], fighter.deck[i]];
      }
    }
    fighter.hand.push(fighter.deck.pop());
  }
}

/** The attack a card deals right now: echo cards grow with same-element plays. */
export function effectiveAttack(card, playedThisTurn) {
  if (card.kind !== 'echo') return card.attack;
  const sameElement = playedThisTurn.filter((id) => cardById(id).element === card.element).length;
  return card.attack + ECHO_BONUS * sameElement;
}

/** Damage first eats block, then HP. Returns the HP actually lost. */
export function dealDamage(target, amount) {
  const absorbed = Math.min(target.block, amount);
  target.block -= absorbed;
  const hpLoss = amount - absorbed;
  target.hp = Math.max(0, target.hp - hpLoss);
  return hpLoss;
}

/**
 * Play the card at `handIndex` from `actor` onto `opponent`.
 * Returns a description of what happened, or null when it cannot be played
 * (not enough mana). The card moves to the discard pile.
 */
export function playCard(actor, opponent, handIndex, random) {
  const id = actor.hand[handIndex];
  if (id === undefined) return null;
  const card = cardById(id);
  if (actor.mana < card.cost) return null;
  actor.mana -= card.cost;
  actor.hand.splice(handIndex, 1);
  const attack = effectiveAttack(card, actor.playedThisTurn);
  const hpLost = attack > 0 ? dealDamage(opponent, attack) : 0;
  if (card.block > 0) actor.block += card.block;
  if (card.draw > 0) drawCards(actor, card.draw, random);
  actor.discard.push(id);
  actor.playedThisTurn.push(id);
  return { card, attack, hpLost, blockGained: card.block, drew: card.draw };
}

/** Start a new turn for `fighter`: mana grows by one, block fades, draw one. */
export function startTurn(fighter, random) {
  fighter.maxMana = Math.min(MAX_MANA, fighter.maxMana + 1);
  fighter.mana = fighter.maxMana;
  fighter.block = 0;
  fighter.playedThisTurn = [];
  drawCards(fighter, 1, random);
}
