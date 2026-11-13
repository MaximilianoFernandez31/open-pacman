# SPEC 01 — Fantasmas clásicos y modo asustado

> **Status:** Aprovado
> **Depends on:** —
> **Date:** 2026-11-13
> **Objective:** Implementar los 4 fantasmas clásicos de Pac-Man (Blinky, Pinky, Inky y Clyde) con IA propia, salida escalonada del pen y el modo asustado con power pellets.

## Scope

**In:**

- 4 fantasmas con IA distinta: `blinky` persigue greedy (agresivo), `pinky` embosca apuntando 4 celdas por delante de Pac-Man, `inky` usa un vector doble desde Blinky, `clyde` es tímido (persigue a más de 8 celdas; si no, va a la esquina `(1,29)`).
- Salida escalonada del pen: Blinky arranca fuera `(13,11)`; Pinky, Inky y Clyde salen a los 2s, 4s y 6s (120/240/360 frames). Mientras esperan, patrullan dentro del pen y no pueden cruzar la puerta (tile `3`).
- Power pellets: tile nuevo `4` en las 4 esquinas clásicas `(1,3)`, `(26,3)`, `(1,23)`, `(26,23)`; se comen por 50 pts y cuentan para la victoria.
- Modo asustado clásico: al comer un power pellet todos los fantasmas activos se vuelven azules 6s (360 frames), invierten dirección, eligen camino al azar y bajan a 1/20 celda/frame. Comerlos da 200/400/800/1600 pts según racha (`combo`); renacen en el pen a los 3s (180 frames).
- Colores clásicos: `GHOST_COLORS` se reordena a `[rojo, rosa, cian, naranja]` en el orden `blinky→pinky→inky→clyde`.

**Out of scope (for future specs):**

- Vida extra por cada 2000 puntos.
- Fases globales scatter/chase.
- Animación de ojos del fantasma comido (solo desaparece 3s).
- Parpadeo del fantasma azul al final de la duración.
- Velocidades distintas por fantasma.
- Persistencia de ningún tipo.

## Data model

```js
// maze.js — tile 'o' → 4 en parseTile; posiciones en MAZE_STR ya existen como '.'
const GHOST_STARTS = [
  { x: 13, y: 11, kind: 'blinky' }, // fuera del pen
  { x: 13, y: 14, kind: 'pinky' },  // pen
  { x: 11, y: 14, kind: 'inky' },   // pen
  { x: 16, y: 14, kind: 'clyde' },  // pen
];

// game.js
const RELEASE_DELAYS = { blinky: 0, pinky: 120, inky: 240, clyde: 360 }; // frames

// createGame() añade por fantasma:
// { x, y, dir, speed, kind, released, releaseIn, respawnIn }
// y al juego:
// frightened: { active: false, timer: 0, combo: 0 }
```

Convenciones: coordenadas de celda origen arriba-izquierda; todo el tiempo en frames (60fps), consistente con las velocidades `1/N` celda/frame.

## Implementation plan

1. **Identidad y color.** `maze.js`: `GHOST_STARTS` con 4 fantasmas (coords arriba) y `parseTile` acepta `'o'`→`4` (aún sin colocar). `render.js`: reordenar `GHOST_COLORS`. `game.js`: `createGame` inicializa `released` (`blinky:true`, resto `false`), `releaseIn` desde `RELEASE_DELAYS` y `respawnIn:0`. *Manual:* arrancan 4 fantasmas con los colores clásicos; Blinky persigue fuera del pen, los otros3 andan sueltos (aún sin bloqueo).
2. **Cuatro IA.** `decideGhost` en `game.js` pasa a switch por `kind`: `blinky` = greedy actual; `pinky` = objetivo `(pacman + 4 en su dirección)`; `inky` = objetivo `2*(pacman+2 en su dirección) - blinky`; `clyde` = objetivo Pac-Man si Manhattan > 8, si no `(1,29)`. Todas eligen por distancia Manhattan mínimo entre las direcciones válidas. *Manual:* los 4 se mueven de forma distinguible.
3. **Salida escalonada.** `update` decrementa `releaseIn` de los no liberados; al llegar a 0 → `released:true`. `canMove` para fantasma no liberado trata el tile `3` como muro. No liberados usan movimiento aleatorio dentro del pen. *Manual:* Pinky sale a los 2s, Inky a los 4s, Clyde a los 6s; ninguno cruza la puerta antes.
4. **Power pellets.** Colocar `'o'` en las 4 esquinas de `MAZE_STR`. `render.js`: tile `4` se dibuja con radio 6 (mismo color que los dots). `movePacman`: comer tile `4` → +50 pts, `dotsRemaining--`, celda a `0`. *Manual:* los4 pellets son más grandes y suman 50.
5. **Frightened completo.** Comer pellet → `frightened.active=true`, `timer=360`, `combo=0`, inversión de dirección de todos los fantasmas. Durante el timer: `speed=0.05` y decisión aleatoria. Colisión con fantasma activo → come: `200 * 2^min(combo,3)` pts, `combo++`, fantasma `respawnIn=180` (oculto, sin colisión) y renace en `(13,14)`. Al agotar `timer` → restaurar. Colisión con fantasma no asustado → vida (reset completo: posiciones, `releaseIn`, `released`, `frightened`, `respawnIn`). *Manual:* los5 escenarios de la lista de verificación.

## Acceptance criteria

- [ ] El juego carga sin errores en consola y se juega con 4 fantasmas de colores rojo/rosa/cian/naranja.
- [ ] Blinky persigue a Pac-Man por distancia mínima desde el inicio, fuera del pen.
- [ ] Pinky apunta 4 celdas por delante de Pac-Man; Inky usa el vector doble con Blinky; Clyde persigue a >8 celdas y va a `(1,29)` a ≤8.
- [ ] Pinky sale del pen a los 2s, Inky a los 4s, Clyde a los 6s; antes de salir patrullan y no cruzan la puerta.
- [ ] Hay4 power pellets en `(1,3)`, `(26,3)`, `(1,23)`, `(26,23)`; comerlos suma 50 pts y desaparecen.
- [ ] Al comer un power pellet todos los fantasmas se vuelven azules, invierten, van más lento (1/20 celda/frame) y eligen camino al azar durante 6s.
- [ ] Comer un fantasma asustado suma 200, 400, 800 y 1600 según la racha; renace en el pen a los 3s.
- [ ] Chocar con un fantasma no asustado cuesta 1 vida y reinicia posiciones, timers de salida y modo asustado.
- [ ] Las velocidades siguen siendo `1/N` celda/frame (alineación en límites de celda; sin atravesar paredes).
- [ ] Victoria (`dotsRemaining<=0`) y derrota (`lives<=0`) siguen funcionando.

## Decisions

- **Yes:** nombres clásicos en `kind` (`blinky|pinky|inky|clyde`) y `GHOST_COLORS` reordenado — el índice del array coincide con el color clásico.
- **Yes:** todo el tiempo en frames (120/240/360/180), no en segundos — consistente con las velocidades frame-based del juego.
- **Yes:** fantasma no liberado no cruza la puerta — sin esto la salida escalonada no tendría sentido.
- **Yes:** durante el frightened, movimiento aleatorio reutilizando la lógica actual de `random`.
- **Yes:** renacimiento por teletransporte al pen (sin ojos) — mínimo viable, la animación queda para otro spec.
- **Yes:** al perder una vida, reset completo (posiciones, timers, frightened, combo).
- **No:** vida extra por 2000 pts — deferido a otro spec (decisión explícita del usuario).
- **No:** fases scatter/chase globales — no las pidió nadie y añaden estado global.
- **No:** parpadeo azul final y velocidad distinta por fantasma — cosmético/innecesario.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Fantasma atrapado dentro del pen | Si no hay direcciones válidas, ya se permite el giro de 180 (lógica existente); el interior tiene 18 celdas. |
| IA de Inky depende de la posición de Blinky | Blinky siempre conserva una posición válida (aunque esté en `respawnIn`, queda en su celda). |
| Fantasma comido durante el frightened mientras otros siguen activos | `respawnIn` excluye a ese fantasma de colisión y de la pintura azul hasta renacer. |

## What is **not** in this spec

- Vida extra por 2000 puntos.
- Fases scatter/chase.
- Ojos/animación al comer fantasma.
- Parpadeo del fantasma azul.
- Velocidades por fantasma distintas.
- Cualquier persistencia entre sesiones.
