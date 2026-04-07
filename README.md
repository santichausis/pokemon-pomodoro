# Pokémon Pomodoro

A Pokémon-themed Pomodoro timer that gamifies productivity. Complete focus sessions, catch surprise Pokémon, and build your personal Pokédex. Track stats, share collections, and compete with friends.

## How it works

1. **Set your goal** — write what you'll work on this session
2. **Pick a duration** — 25, 45, 60 minutes, or a custom time
3. **Start the timer** — focus until it rings
4. **Catch a Pokémon** — when done, a Pokéball shakes and opens to reveal your catch (surprise! 898 possible Pokémon)
5. **Build your Pokédex** — every caught Pokémon is saved with your goal and the capture date

## Features

- **Timer**: Animated circular timer with SVG ring, visual states (red → yellow → green)
- **Pokémon Catching**: Shaking Pokéball animation + reveal, 898 possible Pokémon via [PokéAPI](https://pokeapi.co/)
- **Generation Filter**: Restrict captures to Gen I through Gen VIII
- **Pokédex**: Sorted by Pokémon ID, includes capture goal and date
- **Personal Stats**: Sessions completed, total focus time, day streak, unique Pokémon caught
- **Notifications**: Browser notifications when timer ends (with permission)
- **Sharing**: Share your Pokédex via URL to compare collections with friends
- **Import/Export**: Backup your collection as JSON
- **Language Support**: EN / ES toggle with auto-detection based on browser locale
- **Dark Mode**: Light/dark theme toggle with system preference detection
- **Analytics**: Optional Google Analytics (GA4) with cookie consent
- **Sounds**: Completion sound via Web Audio API
- **Persistent Storage**: Collection saved to `localStorage`

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

## Completed Features

- ✅ Personal stats dashboard (sessions, total time, streaks, unique count)
- ✅ Browser notifications when the timer ends
- ✅ Generation filter (catch Pokémon from specific generations)
- ✅ Share your Pokédex via URL for rival comparisons
- ✅ Export / import JSON backup
- ✅ Bilingual support (EN/ES) with auto-detection
- ✅ Dark Mode with theme toggle and system preference detection
- ✅ Google Analytics integration with cookie consent
- ✅ Code splitting and lazy loading for performance

## Contributing

Found a bug? Have an idea? [Contribute on GitHub](https://github.com/santichausis/pokemon-pomodoro) — pull requests welcome!
