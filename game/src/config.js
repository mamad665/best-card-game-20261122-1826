// Shadow Deck — Card Duel: every tuning number, card and colour in one place.
// The table is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** A duel lasts at most this many turns before the side with more HP wins. */
export const MAX_TURNS = 30;
export const START_HP = 30;
export const HAND_SIZE = 5;
export const START_MANA = 1;
export const MAX_MANA = 10;

/**
 * The four elements. Each one is told apart by BOTH a colour and a drawn
 * shape, never by text alone: Ember is a flame triangle, Tide a wave,
 * Thorn a leaf diamond, Gloom a crescent moon.
 */
export const ELEMENTS = {
  ember: { name: 'Ember', color: '#e8632c', dark: '#8a3410', glyph: 'flame' },
  tide: { name: 'Tide', color: '#2f9fd8', dark: '#14567e', glyph: 'wave' },
  thorn: { name: 'Thorn', color: '#57b25e', dark: '#2c6b31', glyph: 'leaf' },
  gloom: { name: 'Gloom', color: '#9a6fd0', dark: '#4e2f7d', glyph: 'moon' },
};

export const ELEMENT_KEYS = ['ember', 'tide', 'thorn', 'gloom'];

/**
 * The card pool. A card is { id, name, element, cost, attack, block, draw,
 * kind }. kind is 'strike' (damage), 'guard' (block), 'surge' (draw) or
 * 'echo' (combo: +2 attack when another card of the same element was
 * already played this turn). attack is damage dealt, block is shield gained.
 */
export const CARD_POOL = [
  { id: 'ember-spark', name: 'Spark Imp', element: 'ember', cost: 1, attack: 2, block: 0, draw: 0, kind: 'strike' },
  { id: 'ember-flare', name: 'Flare Hound', element: 'ember', cost: 2, attack: 4, block: 0, draw: 0, kind: 'strike' },
  { id: 'ember-blaze', name: 'Blaze Wyrm', element: 'ember', cost: 4, attack: 7, block: 0, draw: 0, kind: 'strike' },
  { id: 'ember-echo', name: 'Echo Cinder', element: 'ember', cost: 2, attack: 3, block: 0, draw: 0, kind: 'echo' },
  { id: 'tide-splash', name: 'Splash Sprite', element: 'tide', cost: 1, attack: 2, block: 0, draw: 0, kind: 'strike' },
  { id: 'tide-current', name: 'Swift Current', element: 'tide', cost: 2, attack: 3, block: 0, draw: 1, kind: 'surge' },
  { id: 'tide-torrent', name: 'Torrent Serpent', element: 'tide', cost: 4, attack: 6, block: 0, draw: 1, kind: 'surge' },
  { id: 'tide-echo', name: 'Echo Ripple', element: 'tide', cost: 2, attack: 3, block: 0, draw: 0, kind: 'echo' },
  { id: 'thorn-briar', name: 'Briar Wolf', element: 'thorn', cost: 1, attack: 2, block: 0, draw: 0, kind: 'strike' },
  { id: 'thorn-wall', name: 'Thorn Wall', element: 'thorn', cost: 2, attack: 1, block: 5, draw: 0, kind: 'guard' },
  { id: 'thorn-bloom', name: 'Bloom Golem', element: 'thorn', cost: 3, attack: 4, block: 3, draw: 0, kind: 'guard' },
  { id: 'thorn-echo', name: 'Echo Vine', element: 'thorn', cost: 2, attack: 3, block: 0, draw: 0, kind: 'echo' },
  { id: 'gloom-wisp', name: 'Gloom Wisp', element: 'gloom', cost: 1, attack: 1, block: 2, draw: 0, kind: 'guard' },
  { id: 'gloom-shade', name: 'Shade Stalker', element: 'gloom', cost: 3, attack: 5, block: 0, draw: 0, kind: 'strike' },
  { id: 'gloom-veil', name: 'Veil Phantom', element: 'gloom', cost: 2, attack: 2, block: 4, draw: 0, kind: 'guard' },
  { id: 'gloom-echo', name: 'Echo Shade', element: 'gloom', cost: 2, attack: 3, block: 0, draw: 0, kind: 'echo' },
];

/** How many copies of each pool card go into a 30-card deck. */
export const DECK_COPIES = 2;

/** Combo bonus: an echo card gains this much attack per same-element card played earlier this turn. */
export const ECHO_BONUS = 2;

export const PALETTE = {
  table: '#1d2b1f',
  tableEdge: '#101a12',
  felt: '#274a2e',
  panel: '#20242e',
  panelEdge: '#3a4152',
  text: '#f2ede1',
  muted: '#a9b0a4',
  gold: '#e8b64c',
  playerHp: '#57b25e',
  enemyHp: '#e5534b',
  mana: '#2f9fd8',
  cardBack: '#3b2d5c',
  cardFace: '#f7f3e6',
  ink: '#23201a',
  shadow: 'rgba(0,0,0,0.45)',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Card size on the table, in logical pixels. */
export const CARD = { width: 132, height: 188, radius: 12 };

/** Best result kept between visits (this browser only). */
export const BEST_KEY = 'shadow-deck.best';
