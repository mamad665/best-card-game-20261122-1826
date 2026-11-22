// Shadow Deck — Card Duel: the AI opponent, the Shadow Warden.
// Its strategy is readable on purpose, so a player can counter it:
//  1. it guards first when its HP is low and a guard card is in hand,
//  2. it plays echo cards only after a same-element card is already down,
//  3. it spends the rest of its mana on the biggest affordable strike,
//  4. it keeps one cheap card back when it cannot end the duel this turn.
// It returns the hand index to play next, or -1 when it is done.

import { cardById, effectiveAttack } from './deck.js';

/** Would this card, played now, finish the opponent? */
function isLethal(card, actor, opponent) {
  return effectiveAttack(card, actor.playedThisTurn) >= opponent.hp + opponent.block;
}

/** A guard card's value grows as the AI's HP falls. */
function guardValue(card, actor) {
  const missing = actor.maxHp - actor.hp;
  return card.block * (1 + missing / actor.maxHp);
}

export function chooseAiCard(actor, opponent) {
  let bestIndex = -1;
  let bestScore = 0;

  for (let index = 0; index < actor.hand.length; index += 1) {
    const card = cardById(actor.hand[index]);
    if (card.cost > actor.mana) continue;
    if (card.kind === 'echo' && !actor.playedThisTurn.some((id) => cardById(id).element === card.element)) {
      // An echo with nothing to echo off is a weak play; hold it for later.
      continue;
    }

    let score = 0;
    if (isLethal(card, actor, opponent)) score += 1000;
    if (card.kind === 'guard') score += guardValue(card, actor) + 2;
    if (card.kind === 'surge') score += 3 + card.draw * 2;
    score += effectiveAttack(card, actor.playedThisTurn) * 2;
    // Prefer spending mana well: a card that leaves exactly 0 mana is efficient.
    if (actor.mana - card.cost === 0) score += 1;
    // A cheap card kept back is worth something when the duel is not ending.
    if (actor.mana - card.cost > 0 && card.cost <= 1 && !isLethal(card, actor, opponent)) score -= 1.5;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }
  return bestIndex;
}
