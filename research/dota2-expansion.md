# Dota 2 custom expansion — 2026-09-11

This adds **石鳞剑士 / Pangolier** and **邪影芳灵 / Dark Willow** to Threefold. They are official Dota 2 heroes, absent from the bundled 303-card Artifact Classic catalog. These seven new entries are explicitly marked `expansion: "dota2"`; their rules and balance are custom, not Valve's Artifact or Dota 2 rules.

## Official sources and assets

- [Pangolier — Dota 2](https://www.dota2.com/hero/pangolier?l=schinese)
- [Dark Willow — Dota 2](https://www.dota2.com/hero/darkwillow?l=schinese)
- Official Chinese data feeds: hero IDs **120** and **119**, preserved in `dota2-pangolier.json` and `dota2-dark_willow.json`.
- Nine local Valve assets: two full hero render PNGs and seven ability icons. Original URLs and SHA-256 hashes are recorded in `dota2-expansion-assets.json`.
- Hero render paths were verified from the official Dota React site's `VIDEO_URL + heroes/renders/{hero}.png` poster references. Icons use Valve's Dota React ability image directory.
- Names match the official Chinese feed: 甲盾冲击, 幸运一击, 地雷滚滚, 荆棘迷宫, 暗影之境, 恐吓. The waiting Jex marker uses the official 作祟 / Bedlam icon. Artwork © Valve Corporation.

## Initial balance

| Entry | Role | Color | Stats / mana |
| --- | --- | --- | --- |
| 石鳞剑士 | Hero; 甲盾冲击 | Red | 4 attack, 0 armor, 9 health; cooldown 1 |
| 幸运一击 | Signature spell, automatically included ×3 | Red | 2 mana; 50% disarm |
| 地雷滚滚 | Ultimate spell; requires active Pangolier in this lane | Red | 5 mana |
| 邪影芳灵 | Hero; 暗影之境 | Black | 3 attack, 0 armor, 6 health; cooldown 2 |
| 荆棘迷宫 | Signature spell, automatically included ×3 | Black | 3 mana |
| 恐吓 | Ultimate spell; requires active Dark Willow in this lane | Black | 5 mana |
| 荆棘 | Temporary token | Black | 0 attack, 0 armor, 1 health |

Hero starting cooldowns follow the existing engine convention. **荆棘与剑舞** is a ready-to-play red/black preset with both heroes and three copies of each ultimate. The ordinary deck builder and multiplayer deck validation support the extension. The separate campaign keeps its existing hero progression.

## Rules resolved from the initial brief

- “乙方” means the caster's own side. One round means until the next round starts, following the existing disarm/stun rules.
- **甲盾冲击:** deals 2 normal damage to opposing slots at source position ±1. Each enemy hero that actually loses health grants 2 shield, each damaged creep grants 1. Shield absorbs subsequent damage after armor, is shared across hits (not armor per hit), and expires next round. Zero damage grants no shield.
- **幸运一击:** 2 normal damage to one enemy, then a seeded 50% chance of disarm for this round. The initial brief did not specify a probability; 50% is the initial balance choice.
- **地雷滚滚:** select an empty friendly slot in the current lane. The caster follows a seeded, sampled random curve through both ranks to that slot. All other units along the curve, including allies, can take 1 normal damage per contact, at most twice per cast. A continuously touching unit is not damaged at every sample. Each actual hit can push a unit one slot left/right if free; rooted and flipped units cannot be pushed. The caster's destination is reserved. The event stores the exact sampled path and hits; the client animates that path without choosing new randomness. Final alignment removes only columns empty on both sides.
- **荆棘迷宫:** fills existing friendly gaps without expanding the board indefinitely. A flower hit by an attack returns 1 piercing damage and roots that attacker even if the attack kills the flower; skill damage does not trigger this. Normal combat includes recoil in its forecast. Expiry at the next round is not a death and awards no bounty.
- **Root:** blocks lane movement, positional swaps, Blink Dagger, forced displacement and return-to-fountain effects, without preventing ordinary attacks or non-movement skills. Invalid player actions roll back mana, hand, random seed and state.
- **暗影之境:** prevents attacks against Dark Willow, including direct duel attacks and combat cleave, but permits spell damage under this custom brief. Her next attack gains +1 damage; each own card matching her hero color (currently Black) increases this before resolving that card, capped at +3 total. It ends after one actual attack against a unit or tower; if disarmed or unable to attack, it remains until her next attack or death/return.
- **杰克斯 / 恐吓:** choose a friendly board location, empty or occupied. Enhancement is captured when placed on a flower. Jex is a position marker, not an extra blocking unit. After the owner's next spell and its on-cast effects resolve, Jex hits the unit then occupying the directly opposing slot and disappears. The summoning card itself, items, hero abilities and enemy cards do not trigger it. No flower: 2 normal damage + disarm. Flower: 3 normal damage + fear/flip. No target: disappears without damaging a tower. Waiting markers survive save/reconnect and may wait into later rounds.
- **Flip:** remains in its slot but cannot be selected, activate abilities, provide color casting, attack, be attacked or take spell damage. The attacking hero whose target is the flipped unit attacks the tower for half its normal final tower damage; fractional damage is retained (3 → 1.5), with no rounding advantage. A creep facing a flipped unit does not attack. Flip expires next round.

## Maintenance and verification

- Edit `tools/build_expansion_data.py` for this extension's metadata. `python tools/build_data.py` includes it when regenerating Classic data. `python tools/build_expansion_data.py` updates only the seven extension records.
- `python scripts/import-dota-expansion.py` reimports the nine official assets and refreshes their source/hash manifest.
- `npm run test:expansion`: damage, shield forecast, random branches, expiry, movement rollback, shadow bonus, delayed Jex, save/projection, flip/tower damage, seeded rolling and source validation.
- `npm test`: multiplayer, touch, deck sharing, matchmaking, placement and expansion regressions.
- `node tests/engine.test.cjs`: card metadata, every spell/active ability, ordinary battle and rollback.
- `node tests/full-games.cjs`: six complete deterministic games, including the new preset on either side.
- `tests/dota-expansion-browser.html`: isolated manual browser fixture. Serve the repository on **127.0.0.1:8788**, then open that path. `?case=states` shows shield, Shadow Realm, an enhanced Jex marker and a face-down card together. It only writes test-origin saves, never the regular port-8787 save.

Release packaging uses `20260911-dota2-expansion1`; activation retains the persistent match database and the previous release for rollback.

### Verification recorded on 2026-09-11

- 20 focused expansion checks, 23 core-engine suites and the grouped `npm test` checks pass.
- Six full games terminate normally (the expansion preset was exercised as each seat), with no duplicate positions or invalid health/mana state.
- Campaign rules and campaign deck checks pass; the original 303-card subset remains intact.
- Browser checks exercised real Shield Crash activation, flower creation, placing enhanced Jex on an occupied flower, triggering fear with the next spell, and Rolling Thunder's recorded curve and displacement animation. Gallery nickname search, official art loading, persistent status presentation and the new preset selector were inspected. The regular page reported no browser errors.
- Browser/server catalogs are identical; all nine local art hashes match the provenance manifest. Local `/health` responds successfully after reloading the server. Test-origin service was stopped after verification.

- Both the archive and deck builder offer All / Classic / Dota 2 expansion filters, composable with type, color and text search. The expansion contains two heroes, four spells and one token.
- Chinese glyphs prefer local KaiTi (STKaiti / Kaiti SC / Kaiti TC alternatives); Latin typography is unchanged. Browsers without those fonts retain the existing fallback fonts.
