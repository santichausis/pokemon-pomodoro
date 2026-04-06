# Pokémon Pomodoro

A Pokémon-themed Pomodoro timer. Complete focus sessions, catch surprise Pokémon, and build your personal Pokédex.

![Pokémon Pomodoro App](https://github.com/santichausis/pokemon-pomodoro/assets/screenshot.png)

## How it works

1. **Set your goal** — write what you'll work on this session
2. **Pick a duration** — 25, 45, 60 minutes, or a custom time
3. **Start the timer** — focus until it rings
4. **Catch a Pokémon** — when done, a Pokéball shakes and opens to reveal your catch (surprise! 898 possible Pokémon)
5. **Build your Pokédex** — every caught Pokémon is saved with your goal and the capture date

## Features

- Animated circular timer with SVG ring
- Visual states: red → yellow (last minute) → green (complete)
- Capture animation: shaking Pokéball that opens on reveal
- 898 possible Pokémon via [PokéAPI](https://pokeapi.co/)
- Generation filter — restrict captures to Gen I through Gen VIII
- Pokédex sorted by Pokémon number
- Personal stats: sessions, total focus time, day streak, unique Pokémon
- Browser notifications when the timer ends
- Share your Pokédex via URL (open on a friend's device to compare collections)
- Export / import your collection as JSON
- EN / ES language toggle
- Completion sound via Web Audio API
- Persistent collection in `localStorage`

## Stack

- [Next.js 16](https://nextjs.org/) — Pages Router
- React 19
- Plain CSS (no UI framework)
- PokéAPI (no API key required, free)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Colors

| Color | Usage |
|-------|-------|
| `#EE1515` | Pokémon red — primary actions, timer ring |
| `#FFCB05` | Pikachu yellow — warning state, capture banner |
| `#003A70` | Dark blue — titles, key text |
| `#3D7DCA` | Pokémon blue — generation selector accent |

## Roadmap

- Personal stats dashboard (sessions, total time, streaks, unique count) ✅
- Browser notifications when the timer ends ✅
- Generation filter (catch Pokémon from specific generations) ✅
- Share your Pokédex via URL for rival comparisons ✅
- Export / import JSON backup ✅
