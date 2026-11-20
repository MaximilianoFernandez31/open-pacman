# SPEC 02 — Salida forzada del pen para fantasmas liberados

> **Status:** Approved
> **Depends on:** SPEC 01
> **Date:** 2026-11-20
> **Objective:** Que todo fantasma dentro del pen (liberado o renacido) salga siempre por la puerta hasta `(13,11)` con Pac-Man en cualquier posición, y que una vez fuera no pueda reentrar.

## Scope

**In:**

- `inPen(g)`: bounding box del interior del pen — cols 11–16, filas 13–15.
- Puerta (tile `3`) pasable para un fantasma **solo si** `released && inPen(g)`. No liberados: siguen bloqueados; fuera del pen: la puerta es muro (Blinky nunca entra; reentrada bloqueada).
- Ruta forzada en `decideGhost`: mientras `released && inPen(g)`, dirección hacia `PEN_EXIT = (13,11)` — primero columna `x=13`, luego `up` — ignorando la regla de no-180.
- Aplica a: salida escalonada inicial (2s/4s/6s), renacimiento tras ser comido y frightened activado dentro del pen (sale y luego divaga).

**Out of scope (for future specs):**

- Fases globales scatter/chase.
- Velocidades distintas por fantasma.
- Animación de ojos del fantasma comido.
- Cualquier cambio en `maze.js`/`render.js`.

## Data model

```js
// game.js — constantes nuevas, sin estado nuevo por fantasma
const PEN_BOX = { x1: 11, x2: 16, y1: 13, y2: 15 }; // interior del pen
const PEN_EXIT = { x: 13, y: 11 }; // primera celda fuera de la puerta

function inPen( g ) {
  return g.x >= PEN_BOX.x1 && g.x <= PEN_BOX.x2 &&
         g.y >= PEN_BOX.y1 && g.y <= PEN_BOX.y2;
}
```

Convenciones: coordenadas de celda origen arriba-izquierda; todo en frames (60fps); `isWall`/`canMove` reciben el fantasma y derivan la puerta de `released && inPen(g)` — sin flags nuevos.

## Implementation plan

1. **Regla de puerta.** `game.js`: añadir `PEN_BOX`, `PEN_EXIT`, `inPen(g)`; en `isWall`, tile `3` es muro si `actor === 'pacman'` o (`actor.released === false`) o (fantasma fuera de `inPen`). *Manual:* Blinky en `(13,11)` no puede bajar al pen; Pinky dentro sí puede subir.
2. **Ruta forzada.** En `decideGhost`, antes de los branches de no-liberado/frightened: si `g.released && inPen(g)`, elegir dirección hacia `PEN_EXIT` (si `g.x !== 13` → horizontal hacia 13; si no → `up`), sin excluir el opuesto. *Manual:* con Pac-Man abajo del pen, Pinky liberado cruza la puerta en <1s y no vuelve.
3. **Respawn y frightened.** Verificar que `respawnGhost` (teletransporte a `(13,14)`) y el frightened dentro del pen usan la misma ruta; al quedar `inPen() === false`, la IA normal/frightened aleatoria retoma sin cambios. *Manual:* comer a Pinky, comer pellet con otro dentro del pen, comprobar salida y divagación posterior.
4. **Pasada completa.** Los 4 salen a los 0/2/4/6s con Pac-Man arriba, abajo y a los lados; consola limpia.

## Acceptance criteria

- [ ] Pinky, Inky y Clyde cruzan la puerta y quedan fuera del pen (y ≤1s tras su timer de release) con Pac-Man en cualquier posición, incl. por debajo del pen.
- [ ] Ningún fantasma fuera del pen entra en él por la puerta (Blinky incluido).
- [ ] Un fantasma renacido sale del pen por la ruta forzada tras sus 3s de respawn.
- [ ] Los no liberados siguen patrullando dentro y no cruzan la puerta antes de su timer.
- [ ] Frightened activo con un fantasma dentro del pen: sale primero y luego divaga al azar.
- [ ] Velocidades siguen siendo `1/N` celda/frame, sin atravesar paredes, consola sin errores.
- [ ] Victoria/derrota y todo el checklist de SPEC 01 siguen pasando.

## Decisions

- **Yes:** ruta fija a `(13,11)` por la columna 13 ignorando no-180 dentro del pen — determinista, sale en ~30–60 frames.
- **Yes:** puerta derivada de `released && inPen(g)` — sin estado nuevo, sin duplicar flags.
- **Yes:** bloquear reentrada una vez fuera — sin esto el bucle se recrea si Pac-Man queda por debajo (decisión explícita del usuario).
- **Yes:** aplicar también al respawn — un solo código para toda salida (decisión explícita del usuario).
- **No:** permitir 180° general para romper bucles — descartado: poco determinista, puede seguir fallando.
- **No:** flag `exited` por fantasma — la posición ya lo determina.
- **No:** salir y luego divagar dentro del pen con frightened — se decidió salir primero (decisión explícita del usuario).

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Ruta forzada choca con el branch de frightened | La comprobación `inPen` va antes en `decideGhost`; al salir, el branch aleatorio retoma. |
| `PEN_BOX` incluye por error cols 10/17 (túnel) | Box estricta 11–16; cols 10/17 son muro en filas 13–15. |
| Dead-end 180 existente interactúa con la ruta | La ruta forzada ignora la exclusión de opuesto, así que nunca queda sin opciones. |

## What is **not** in this spec

- Fases scatter/chase.
- Velocidades por fantasma distintas.
- Ojos/animación al comer fantasma.
- Cambios en `maze.js` o `render.js`.
- Cualquier persistencia entre sesiones.
