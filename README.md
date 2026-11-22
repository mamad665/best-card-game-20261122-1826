# Shadow Deck — Card Duel

![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)
![rank](https://make.fun/badge/best-card-game-20261122-1826/mamad665/best-card-game-20261122-1826/rank.svg)
![reward](https://make.fun/badge/best-card-game-20261122-1826/mamad665/best-card-game-20261122-1826/reward.svg)

A turn-based card duel against the Shadow Warden, built for the
[make.fun best card game bounty](https://make.fun/bounty/best-card-game-20261122-1826).
Vanilla canvas 2D, no libraries, static files under `game/` — it runs in
desktop Chrome with no network requests.

## How to play

- Each turn your mana grows by 1 (up to 10). Click a card in your hand — or
  press 1–5 — to play it. A card costs mana.
- **Strikes** deal damage, **Guards** raise your shield (block absorbs
  damage first), **Surges** draw extra cards.
- **Echo** cards gain +2 attack when another card of the same element was
  already played this turn. Elements — Ember, Tide, Thorn, Gloom — are told
  apart by colour *and* shape (flame, wave, leaf, moon).
- Press **E** (or the End Turn button) to hand the table to the Warden. Its
  strategy is readable: it guards when hurt, echoes only off a matching
  element, and spends its mana on its biggest strike. First to 0 HP wins;
  press **R** to duel again.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Screenshots are deterministic renders of the real game:
`?shot=start|play|win|lose` (with `&seed=1`).

## Layout

- `game/index.html` — the page and canvas shell
- `game/src/config.js` — cards, elements, tuning, palette
- `game/src/deck.js` — deck, draw, and duel rules (play / damage / block)
- `game/src/ai.js` — the Warden's readable strategy
- `game/src/input.js` — mouse and keyboard, logical table coordinates
- `game/src/render.js` — everything drawn: table, cards, screens
- `game/src/shots.js` — deterministic screenshot scenes
- `game/src/main.js` — game loop, screens, turn flow
- `main.ts` — the make.fun entrypoint: copies `game/` + `screenshots/` to
  `/output` and writes `dossier.json`
- `vendor/makefun-game.ts` — the kit's library, unchanged
