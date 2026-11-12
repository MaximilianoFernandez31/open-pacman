# AGENTS.md

## Proyecto

- Clon de Pac-Man en JS + HTML + CSS vanilla. **Sin package.json, sin build, sin lint, sin tests.**
- Ejecutar: abrir `src/index.html` directamente en el navegador (scripts clásicos, `file://` funciona). Verificar: el juego arranca, consola sin errores, las flechas mueven a Pac-Man.
- Idioma: cadenas de UI, README y comentarios en **español**; los identificadores se mantienen en inglés.

## Arquitectura (globals, el orden de carga importa)

`src/index.html` carga en este orden: `maze.js` → `game.js` → `render.js` → `main.js`. Son scripts clásicos que exponen vía `window.*` (sin ES modules, sin bundler) — mantenlo así salvo que un spec diga lo contrario. 

- `maze.js` — datos del nivel, rejilla 28×31. `MAZE` es prístino y **nunca se muta**. Tiles: `1` pared, `2` dot, `0` vacío, `3` puerta del pen. También `TUNNEL_ROW = 14`, `PACMAN_START`, `GHOST_STARTS` (el `kind` de cada fantasma: `hunter` persigue, `random` divaga).
- `game.js` — estado y reglas. `createGame()` copia `MAZE` a `game.grid`; los dots se comen de la copia. Máquina de estados: `start → playing → won|lost`.
- `render.js` — dibuja desde `game.grid` (nunca `MAZE`, o los dots comidos reaparecen). `TILE = 20` → el canvas mide 28×20 por 31×20.
- `main.js` — bucle `requestAnimationFrame`, las flechas asignan `game.pacman.nextDir`, overlay de inicio/victoria/derrota.

Gotchas:

- El movimiento es **fraccionario en celdas**: pacman 1/8 celda/frame, fantasmas 1/10. `aligned()` ajusta a la rejilla cada 8/10 frames. Si cambias una velocidad, mantenla en `1/N` (N frames por celda) o los actores dejarán de alinearse en los límites de celda y atravesarán paredes.
- Los fantasmas ignoran la puerta del pen (`3`); Pac-Man sí está bloqueado por ella.
- Chocar con un fantasma cuesta una vida y reinicia posiciones; el puntaje persiste. Victoria cuando `dotsRemaining <= 0`.

## Flujo spec-driven (toda la metodología de este repo)

- `/spec <feature>` — diseña `specs/NN-slug.md` (arranca en `Draft`; solo el humano lo pasa a `Approved`). Nunca escribe código.
- `/spec-impl NN-slug` — implementa solo specs `Approved`, rama `spec-NN-slug`, paso a paso con pausas para revisar diffs.
- `specs/` aún no existe → el primer spec es `01-`.
- `specs/.spec-config.yml` (lo crea `/spec` en el primer run): `AutoCommitSteps` por defecto `false` → **nunca commitees salvo que el usuario lo pida explícitamente**; `AutoCreateBranch` por defecto `true`.
- Los skills viven en `.agents/skills/`; versiones fijadas en `skills-lock.json`.
- El skill `/spec` carga la memoria del proyecto en orden `CLAUDE.md` → `AGENTS.md` → `GEMINI.md` → `README.md` — este archivo es el contexto que lee.

## Convenciones

- Código en inglés, comentarios en español, solo cuando aporten valor.
- No implementes trabajo fuera de alcance "de paso" — va en el siguiente spec.
