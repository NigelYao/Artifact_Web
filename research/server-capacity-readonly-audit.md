# Read-only capacity audit — 2026-09-09

No user database or remote server was opened by this audit. `node research/snapshot-capacity-audit.cjs` generates four deterministic legal AI games in memory and measures the actual Colyseus encoder. Results: `snapshot-capacity-audit.json`. The representative fourth-round middle-lane state is `perf-midgame-state.json`. AI chooses actions only to generate representative states: the production multiplayer server does not run the AI planner.

## Measured outbound snapshots

637 states, four completed games lasting 8–11 rounds. MessagePack payloads include Colyseus message headers, exclude WebSocket/TCP framing. Server transport defaults `perMessageDeflate=false`; therefore these are meaningful on-wire application sizes, not JSON-size estimates. Shop purchases were grouped while sampling; samples are not weighted by human thinking time.

| Stage | Per-player median bytes | Per-player p95 bytes | Both players, mean Mbps at one total action / 5 sec |
|---|---:|---:|---:|
| Rounds 1–2 | 15,232 | 21,213 | 0.0467 |
| Rounds 3–5 | 39,096 | 49,938 | 0.1210 |
| Rounds 6+ | 57,880 | 68,728 | 0.1864 |
| All samples | 48,753 | 65,580 | 0.1404 |

All-sample per-player mean is 43,879 bytes, maximum 74,342. Both-player per-action p95 becomes 0.2101 Mbps at the assumed cadence. Each spectator adds mean 43,172 bytes per action, or 0.0691 Mbps at that cadence. If **each player** acts every five seconds, rather than one action per match every five seconds, the rates double and capacities halve.

Representative seed: round 4, middle lane, 31 units, 216 log entries. Player snapshot: JSON 49,684 bytes, actual protocol 36,945 bytes. Removing only `state.log` reduces wire to 8,652 bytes; removing `state.events` too gives 8,138. Repeated history is **76.6% of that snapshot**. The full log (up to 240 entries) is retransmitted every action even though most entries were already seen.

## 7 Mbps and 800 GB/month

Reserve 30% of the uplink: 4.9 Mbps for gameplay. Pure gameplay bandwidth capacity (not a server-load guarantee):

| Assumption | Matches | Players |
|---|---:|---:|
| Sample mean | 34 | 68 |
| Late-game mean | 26 | 52 |
| Sample p95 | 23 | 46 |

40–50 simultaneous players is a conservative bandwidth planning range before measured CPU/latency limits; synchronized cold asset downloads can still overload that allocation. These are not concurrent-login or idle-visitor limits.

Decimal GB, 30-day month, gameplay only, using sample mean 0.0631863 GB per match-hour:

| Simultaneously active matches | 2 h/day | 4 h/day | 8 h/day | 24 h/day |
|---|---:|---:|---:|---:|
| 20 (40 players) | 75.8 GB | 151.6 GB | 303.3 GB | 909.9 GB |
| 30 (60 players) | 113.7 GB | 227.5 GB | 454.9 GB | 1,364.8 GB |

For 30 matches × 8 h/day: late-game mean 604.0 GB/month, p95 assumption 680.6 GB/month. The 800 GB allowance corresponds to 12,661 match-hours at sample mean before assets; reserving 30% of the monthly quota leaves approximately 8,863 match-hours, or 12.3 matches continuously 24×7. Provider accounting (GB vs GiB, ingress/egress rules) may differ.

## Static/audio demand

Source-level cold-fetch inventory, not a browser network trace:

- Formal battle HTML plus referenced JS/CSS and dynamically loaded scripts: 954,946 bytes uncompressed, including vendor SDK.
- Representative midgame unit/hand artwork: 427,442 bytes across 24 unique images. Both preset decks' unique artwork: 639,848 bytes across 34 images.
- Entire scene-image directory: 372,764 bytes.
- Initial battle track `two-towers.mp3`: 4,649,578 bytes. Combined rough cold battle budget ~6.4 MB plus skill icons and on-demand effects.
- Menu `immortal-dreams.mp3`: 5,396,124 bytes; intro `opening.mp3`: 392,051; first shop `caravan.mp3`: 4,187,786. Visiting these scenes can add roughly 10 MB before browser reuse/range loading.
- Nine soundtrack files together ~30.7 MB; they are not all requested immediately. `audio.js` constructs an `Audio` with `preload='auto'` for the selected scene, rotates four battle tracks, and requests effects on demand. Browser buffering/range/cache policy determines actual transfer.
- The same Node HTTP endpoint serves media and gameplay; no application gzip/CDN is configured. Static files have ETags, but default `max-age=0`, while HTML/JS/CSS explicitly use `no-cache` (revalidate, not necessarily full redownload).

## Actual server bottlenecks and behavior

1. **Single process, synchronous rules and SQLite.** `Match.command` copies the entire record for rollback, applies the rules, serializes and saves the full room using `DatabaseSync`; WAL with `synchronous=FULL` means durable commit latency blocks the Node event loop. More CPU cores do not automatically parallelize this process. Simple passes are cheaper than multi-target combat/passive chains.
2. **Full snapshot per recipient.** Each action clones/redacts/MessagePack-encodes the whole state separately for both players and each spectator. Joins, leaves, sync, and rejected actions also cause snapshot sends. No Colyseus schema/delta serializer is being used for these custom messages.
3. **History and dead-unit growth.** Logs cap at 240 entries, but state units retain dead entries; `Game.all()` repeatedly filters the full units array. Long summon-heavy games are more expensive than early-pass tests.
4. **Matchmaking repeated work.** The 1-second tick loads and JSON-parses the whole room for every battle ticket (normally twice per match). Every matchmaking HTTP request runs another whole tick. Lobby `online.js` polls status every two seconds even when idle. At 100 active battle tickets plus 100 idle lobby users, this can mean thousands of room JSON loads per second. Queued/matched checks use JSON-extract queries with no status/token expression index; history growth increases scan cost. The persisted matchmaking blob retains idle entries and is rewritten on heartbeat changes.
5. **History queries.** Session restoration calls `Store.rooms`, which reads, parses and filters **all rooms**, not only the caller's. Admin status/count queries also scan JSON records. Current small databases mask future growth costs.
6. **Memory.** Live rooms retain one engine and full state; each snapshot/rollback creates temporary allocations. Empty rooms auto-dispose, preserving SQLite state. Serialized state is not a reliable heap-size estimate and this audit did not measure bytes per socket. The 128 `maxClients` value is per-room connection allowance, not whole-server capacity. Presence entries are pruned when the admin data endpoint is read; without that read, the in-memory map can retain old visitors.
7. **Connection traffic.** Battle updates are action-driven, not 30/60 Hz. Visible-page presence is every 25 seconds; reconnect retries every 2.5 seconds. An idle connected duel uses little game traffic. Spectators and slow receiving clients multiply output/buffer pressure; no explicit application backpressure limit is present.

Most impactful future improvements, not applied here: avoid resending historical log entries; optionally use state deltas; isolate/cache matchmaking tick work and indexed room metadata; add static cache/CDN serving; then consider process/room sharding only after realistic latency measurements.
