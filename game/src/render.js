// Shadow Deck — Card Duel: everything the player sees.
// One canvas, flat colours, no images: the table, the fighters' HP bars,
// the mana crystals, the two hands (the AI's face-down as card backs), the
// deck and discard piles, and the start / win / lose screens. A card is
// told apart by colour AND by its element glyph (flame, wave, leaf, moon),
// never by text alone. Card motion is a simple slide: a played card lerps
// from the hand to the table over a few frames.

import { CARD, ELEMENTS, FIELD, FONT, PALETTE } from './config.js';
import { cardById, effectiveAttack } from './deck.js';

export const SCREEN_START = 'start';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSE = 'lose';

const HAND_Y = 470;
const HAND_GAP = 12;
const AI_HAND_Y = 96;
const TABLE_Y = 300;

/** Where the player's hand card `index` of `count` sits on the table. */
export function handCardRect(index, count) {
  const total = count * CARD.width + (count - 1) * HAND_GAP;
  const x = (FIELD.width - total) / 2 + index * (CARD.width + HAND_GAP);
  return { x, y: HAND_Y, w: CARD.width, h: CARD.height };
}

/** Where the AI's face-down card `index` of `count` sits. */
export function aiCardRect(index, count) {
  const w = 84;
  const h = 118;
  const total = count * w + (count - 1) * 10;
  const x = (FIELD.width - total) / 2 + index * (w + 10);
  return { x, y: AI_HAND_Y, w, h };
}

export function endTurnRect() {
  return { x: FIELD.width - 220, y: 560, w: 180, h: 56 };
}

export function startButtonRect() {
  return { x: FIELD.width / 2 - 130, y: 520, w: 260, h: 64 };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** The element glyph, drawn as a shape: flame, wave, leaf or crescent. */
export function drawGlyph(ctx, glyph, cx, cy, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.12;
  ctx.lineJoin = 'round';
  if (glyph === 'flame') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.55);
    ctx.quadraticCurveTo(cx + size * 0.5, cy - size * 0.1, cx + size * 0.3, cy + size * 0.25);
    ctx.quadraticCurveTo(cx + size * 0.15, cy + size * 0.5, cx, cy + size * 0.4);
    ctx.quadraticCurveTo(cx - size * 0.3, cy + size * 0.45, cx - size * 0.35, cy + size * 0.1);
    ctx.quadraticCurveTo(cx - size * 0.4, cy - size * 0.25, cx, cy - size * 0.55);
    ctx.fill();
  } else if (glyph === 'wave') {
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.5, cy);
    ctx.quadraticCurveTo(cx - size * 0.25, cy - size * 0.45, cx, cy);
    ctx.quadraticCurveTo(cx + size * 0.25, cy + size * 0.45, cx + size * 0.5, cy);
    ctx.quadraticCurveTo(cx + size * 0.25, cy + size * 0.2, cx, cy + size * 0.15);
    ctx.quadraticCurveTo(cx - size * 0.25, cy + size * 0.1, cx - size * 0.5, cy);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.5, cy + size * 0.3);
    ctx.quadraticCurveTo(cx - size * 0.25, cy - size * 0.05, cx, cy + size * 0.3);
    ctx.quadraticCurveTo(cx + size * 0.25, cy + size * 0.6, cx + size * 0.5, cy + size * 0.3);
    ctx.lineWidth = size * 0.09;
    ctx.stroke();
  } else if (glyph === 'leaf') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.55);
    ctx.quadraticCurveTo(cx + size * 0.5, cy - size * 0.1, cx, cy + size * 0.55);
    ctx.quadraticCurveTo(cx - size * 0.5, cy - size * 0.1, cx, cy - size * 0.55);
    ctx.fill();
    ctx.strokeStyle = PALETTE.cardFace;
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.4);
    ctx.lineTo(cx, cy + size * 0.4);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.5, Math.PI * 0.25, Math.PI * 1.65);
    ctx.quadraticCurveTo(cx + size * 0.15, cy - size * 0.15, cx + size * 0.35, cy - size * 0.45);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawCardFace(ctx, card, rect, opts) {
  const el = ELEMENTS[card.element];
  const lifted = opts.lifted ? -18 : 0;
  const x = rect.x;
  const y = rect.y + lifted;
  ctx.save();
  ctx.shadowColor = PALETTE.shadow;
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, x, y, rect.w, rect.h, CARD.radius);
  ctx.fillStyle = opts.dim ? '#cfc9b8' : PALETTE.cardFace;
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, x, y, rect.w, rect.h, CARD.radius);
  ctx.strokeStyle = el.color;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.clip();
  ctx.fillStyle = el.color;
  ctx.fillRect(x, y, rect.w, 46);
  ctx.fillStyle = '#fff';
  ctx.font = `bold 15px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(card.name, x + 10, y + 24, rect.w - 20);
  // Cost gem, top right.
  ctx.beginPath();
  ctx.arc(x + rect.w - 22, y + 58, 15, 0, Math.PI * 2);
  ctx.fillStyle = '#2f9fd8';
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `bold 16px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(String(card.cost), x + rect.w - 22, y + 59);
  // Element glyph, centre.
  drawGlyph(ctx, el.glyph, x + rect.w / 2, y + 100, 52, el.color);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `600 13px ${FONT}`;
  ctx.fillText(el.name, x + rect.w / 2, y + 136);
  // Attack, bottom left; block / draw, one row above it on the right,
  // so the two never run into each other on a narrow card.
  ctx.textAlign = 'left';
  ctx.font = `bold 20px ${FONT}`;
  ctx.fillStyle = '#b3261e';
  ctx.fillText(`ATK ${opts.attack}`, x + 12, y + rect.h - 16);
  if (card.block > 0 || card.draw > 0) {
    ctx.textAlign = 'right';
    ctx.font = `bold 15px ${FONT}`;
    ctx.fillStyle = '#2c6b31';
    const parts = [];
    if (card.block > 0) parts.push(`BLK ${card.block}`);
    if (card.draw > 0) parts.push(`+${card.draw} draw`);
    ctx.fillText(parts.join('  '), x + rect.w - 12, y + rect.h - 34);
  }
  if (card.kind === 'echo') {
    ctx.textAlign = 'center';
    ctx.font = `600 10px ${FONT}`;
    ctx.fillStyle = el.dark;
    ctx.fillText('Echo: +2 same element', x + rect.w / 2, y + rect.h - 34);
  }
  ctx.restore();
}

function drawCardBack(ctx, rect) {
  ctx.save();
  ctx.shadowColor = PALETTE.shadow;
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.fillStyle = PALETTE.cardBack;
  ctx.fill();
  ctx.restore();
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  drawGlyph(ctx, 'moon', rect.x + rect.w / 2, rect.y + rect.h / 2, 34, PALETTE.gold);
}

function drawHpBar(ctx, x, y, w, label, hp, maxHp, block, color) {
  ctx.save();
  ctx.font = `bold 17px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(label, x, y + 10);
  const barX = x + 130;
  const barW = w - 130;
  roundRect(ctx, barX, y, barW, 20, 10);
  ctx.fillStyle = '#0c0f14';
  ctx.fill();
  const frac = Math.max(0, hp / maxHp);
  if (frac > 0) {
    roundRect(ctx, barX, y, barW * frac, 20, 10);
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.font = `bold 14px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(`${hp} / ${maxHp}`, barX + barW / 2, y + 11);
  if (block > 0) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#7fb3d5';
    ctx.font = `bold 15px ${FONT}`;
    ctx.fillText(`BLK ${block}`, barX + barW + 10, y + 11);
  }
  ctx.restore();
}

function drawMana(ctx, x, y, mana, maxMana) {
  ctx.save();
  ctx.font = `bold 16px ${FONT}`;
  ctx.fillStyle = PALETTE.text;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Mana', x, y + 10);
  for (let i = 0; i < maxMana; i += 1) {
    ctx.beginPath();
    ctx.arc(x + 70 + i * 26, y + 10, 9, 0, Math.PI * 2);
    ctx.fillStyle = i < mana ? PALETTE.mana : '#2a3340';
    ctx.fill();
    ctx.strokeStyle = '#7fb3d5';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(`${mana}/${maxMana}`, x + 70 + maxMana * 26 + 8, y + 11);
  ctx.restore();
}

function drawPile(ctx, x, y, label, count, faceUp) {
  ctx.save();
  roundRect(ctx, x, y, 84, 118, 10);
  ctx.fillStyle = faceUp ? PALETTE.cardFace : PALETTE.cardBack;
  ctx.fill();
  ctx.strokeStyle = faceUp ? '#8a8272' : PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = faceUp ? PALETTE.ink : PALETTE.gold;
  ctx.font = `bold 26px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(count), x + 42, y + 52);
  ctx.font = `600 13px ${FONT}`;
  ctx.fillText(label, x + 42, y + 92);
  ctx.restore();
}

function drawTable(ctx) {
  ctx.fillStyle = PALETTE.table;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = PALETTE.felt;
  roundRect(ctx, 24, 24, FIELD.width - 48, FIELD.height - 48, 28);
  ctx.fill();
  ctx.strokeStyle = PALETTE.tableEdge;
  ctx.lineWidth = 3;
  roundRect(ctx, 24, 24, FIELD.width - 48, FIELD.height - 48, 28);
  ctx.stroke();
  // Felt centre emblem.
  ctx.save();
  ctx.globalAlpha = 0.08;
  drawGlyph(ctx, 'moon', FIELD.width / 2, TABLE_Y + 40, 220, '#ffffff');
  ctx.restore();
}

function drawBanner(ctx, title, subtitle, color) {
  ctx.save();
  ctx.fillStyle = 'rgba(10,12,16,0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.font = `bold 64px ${FONT}`;
  ctx.fillText(title, FIELD.width / 2, 300);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `24px ${FONT}`;
  ctx.fillText(subtitle, FIELD.width / 2, 350);
  ctx.restore();
}

/**
 * Draw the whole scene for `view`, the render-ready snapshot main.js
 * builds each frame: { screen, player, enemy, turn, turnNumber, mana,
 * hovered, selected, flying, lastPlay, message, log, winner }.
 */
export function render(ctx, view) {
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);
  drawTable(ctx);

  if (view.screen === SCREEN_START) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `bold 72px ${FONT}`;
    ctx.fillText('SHADOW DECK', FIELD.width / 2, 150);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `28px ${FONT}`;
    ctx.fillText('— Card Duel —', FIELD.width / 2, 196);
    ctx.font = `20px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    const lines = [
      'You face the Shadow Warden. First to 0 HP wins. Mana grows by 1 each turn.',
      'Click a card (or press 1–5) to play it. Strikes damage, Guards shield, Surges draw.',
      'Echo cards gain +2 attack when another card of the same element was played this turn. End Turn: E.',
    ];
    lines.forEach((line, i) => ctx.fillText(line, FIELD.width / 2, 232 + i * 26));
    // A sample hand on the title screen, so the cover shows real cards.
    view.sampleHand.forEach((id, i) => {
      const card = cardById(id);
      const rect = handCardRect(i, view.sampleHand.length);
      drawCardFace(ctx, card, { ...rect, y: 300 }, { attack: card.attack });
    });
    ctx.restore();
    const btn = startButtonRect();
    roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 14);
    ctx.fillStyle = PALETTE.gold;
    ctx.fill();
    ctx.fillStyle = '#23201a';
    ctx.font = `bold 26px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DUEL', btn.x + btn.w / 2, btn.y + btn.h / 2 + 1);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `15px ${FONT}`;
    ctx.fillText('Press Space or click DUEL', FIELD.width / 2, btn.y + btn.h + 28);
    return;
  }

  // --- The duel table ---
  drawHpBar(ctx, 60, 36, 560, 'Warden', view.enemy.hp, view.enemy.maxHp, view.enemy.block, PALETTE.enemyHp);
  drawHpBar(ctx, 60, 660, 560, 'You', view.player.hp, view.player.maxHp, view.player.block, PALETTE.playerHp);
  drawMana(ctx, 700, 36, view.player.mana, view.player.maxMana);
  ctx.save();
  ctx.font = `bold 20px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillStyle = view.turn === 'player' ? PALETTE.gold : PALETTE.muted;
  ctx.fillText(view.turn === 'player' ? `Your turn — Turn ${view.turnNumber}` : `Warden's turn — Turn ${view.turnNumber}`, FIELD.width - 60, 46);
  ctx.restore();

  // AI hand, face-down.
  view.enemy.hand.forEach((_, i) => drawCardBack(ctx, aiCardRect(i, view.enemy.hand.length)));

  // Last played cards, centre table.
  if (view.lastPlay.player) {
    const card = cardById(view.lastPlay.player);
    drawCardFace(ctx, card, { x: FIELD.width / 2 - 150, y: TABLE_Y - 60, w: CARD.width, h: CARD.height }, { attack: view.lastPlay.playerAttack });
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 15px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('Your last card', FIELD.width / 2 - 84, TABLE_Y - 76);
  }
  if (view.lastPlay.enemy) {
    const card = cardById(view.lastPlay.enemy);
    drawCardFace(ctx, card, { x: FIELD.width / 2 + 18, y: TABLE_Y - 60, w: CARD.width, h: CARD.height }, { attack: view.lastPlay.enemyAttack });
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 15px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText("Warden's last card", FIELD.width / 2 + 84, TABLE_Y - 76);
  }
  if (!view.lastPlay.player && !view.lastPlay.enemy) {
    ctx.save();
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `italic 18px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('Played cards land here', FIELD.width / 2, TABLE_Y + 30);
    ctx.restore();
  }

  // Deck and discard piles.
  drawPile(ctx, 60, TABLE_Y - 40, 'Deck', view.player.deck.length, false);
  drawPile(ctx, FIELD.width - 144, TABLE_Y - 40, 'Discard', view.player.discard.length, true);

  // The flying card: a played card sliding from the hand to the table.
  if (view.flying) {
    const card = cardById(view.flying.id);
    const t = view.flying.t;
    const x = view.flying.from.x + (view.flying.to.x - view.flying.from.x) * t;
    const y = view.flying.from.y + (view.flying.to.y - view.flying.from.y) * t - Math.sin(t * Math.PI) * 60;
    drawCardFace(ctx, card, { x, y, w: CARD.width, h: CARD.height }, { attack: view.flying.attack });
  }

  // Player hand.
  view.player.hand.forEach((id, i) => {
    const card = cardById(id);
    const rect = handCardRect(i, view.player.hand.length);
    const affordable = card.cost <= view.player.mana && view.turn === 'player';
    const attack = effectiveAttack(card, view.player.playedThisTurn);
    drawCardFace(ctx, card, rect, { attack, lifted: view.hovered === i || view.selected === i, dim: !affordable });
  });

  // Floating combat text.
  for (const floater of view.floaters) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - floater.age / floater.life);
    ctx.font = `bold ${floater.size}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = floater.color;
    ctx.fillText(floater.text, floater.x, floater.y - floater.age * 40);
    ctx.restore();
  }

  // Message line.
  if (view.message) {
    ctx.save();
    ctx.fillStyle = PALETTE.text;
    ctx.font = `18px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(view.message, FIELD.width / 2, 448);
    ctx.restore();
  }

  // End Turn button.
  const endBtn = endTurnRect();
  const canEnd = view.turn === 'player';
  roundRect(ctx, endBtn.x, endBtn.y, endBtn.w, endBtn.h, 12);
  ctx.fillStyle = canEnd ? PALETTE.gold : '#3a4152';
  ctx.fill();
  ctx.fillStyle = canEnd ? '#23201a' : PALETTE.muted;
  ctx.font = `bold 22px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('End Turn  (E)', endBtn.x + endBtn.w / 2, endBtn.y + endBtn.h / 2 + 1);

  // Battle log, right edge.
  ctx.save();
  ctx.textAlign = 'left';
  ctx.font = `14px ${FONT}`;
  ctx.fillStyle = PALETTE.muted;
  view.log.slice(-6).forEach((line, i) => ctx.fillText(line, FIELD.width - 330, 120 + i * 20));
  ctx.restore();

  if (view.screen === SCREEN_WIN) {
    drawBanner(ctx, 'VICTORY!', `The Shadow Warden falls. You won in ${view.turnNumber} turns — press R to duel again.`, PALETTE.gold);
  } else if (view.screen === SCREEN_LOSE) {
    drawBanner(ctx, 'DEFEAT', `The Warden keeps the table. Your HP hit 0 on turn ${view.turnNumber} — press R to try again.`, PALETTE.enemyHp);
  }
}
