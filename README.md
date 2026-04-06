# Pokémon Pomodoro

Un timer Pomodoro con temática Pokémon. Completá sesiones de concentración, capturá Pokémon sorpresa y construí tu Pokédex personal.

![Pokémon Pomodoro App](https://imgur.com/a/XXXXXX)

![image](https://github.com/user-attachments/assets/screenshot.png)

## ¿Cómo funciona?

1. **Escribí tu objetivo** — qué vas a hacer en esta sesión
2. **Elegí la duración** — 25, 45, 60 minutos o un tiempo personalizado
3. **Iniciá el timer** — concentrate hasta que suene
4. **Capturá un Pokémon** — al terminar, una Pokéball se abre y revela qué Pokémon atrapaste (sorpresa total, son 898 posibles)
5. **Construí tu Pokédex** — cada Pokémon capturado queda guardado con el objetivo que te pusiste y la fecha

## Features

- Timer circular animado con anillo SVG
- Estados visuales: rojo → amarillo (último minuto) → verde (completado)
- Animación de captura: Pokéball que se sacude y se abre
- 898 Pokémon posibles vía [PokéAPI](https://pokeapi.co/)
- Pokédex ordenada por número de Pokémon
- Sonido de finalización con Web Audio API
- Persistencia en `localStorage` (tu colección sobrevive recargas)

## Stack

- [Next.js 16](https://nextjs.org/) — Pages Router
- React 19
- CSS puro (sin frameworks de UI)
- PokéAPI (sin API key, gratuita)

## Correr el proyecto

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

## Colores

| Color | Uso |
|-------|-----|
| `#EE1515` | Rojo Pokémon — acciones primarias, anillo del timer |
| `#FFCB05` | Amarillo Pikachu — advertencia, banner de captura |
| `#003A70` | Azul oscuro — títulos, textos importantes |
| `#3D7DCA` | Azul Pokémon — acento |

## Posibles mejoras futuras

1. **Estadísticas personales** — mostrar sesiones completadas totales, Pokémon capturados, tiempo acumulado, racha de días
2. **Notificaciones** — notificaciones del navegador cuando termina el timer (útil si te alejás de la pantalla)
3. **Modos de dificultad** — capturar solo Pokémon de tipos específicos, leyendarios raros, o solo de generaciones seleccionadas
4. **Multijugador** — competir con amigos en tiempo real (quién captura más Pokémon en una semana)
5. **Exportar/importar** — descargar tu Pokédex como JSON o CSV para respaldar tu colección
