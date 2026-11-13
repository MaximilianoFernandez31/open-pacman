// game.js
// Estado y reglas. Depende de globals de maze.js: MAZE, TUNNEL_ROW,
// PACMAN_START, GHOST_STARTS.

const DIRS = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};
const OPPOSITE = { left: 'right', right: 'left', up: 'down', down: 'up' };

const PACMAN_SPEED = 0.125; // 1/8 celda/frame -> alinea cada 8 frames
const GHOST_SPEED = 0.1;    // 1/10 celda/frame
const FRIGHTENED_SPEED = 0.05; // 1/20 celda/frame
const FRIGHTENED_FRAMES = 360; // 6s
const RESPAWN_FRAMES = 180;    // 3s
const RESPAWN_CELL = { x: 13, y: 14 }; // interior del pen

// Frames que cada fantasma espera dentro del pen antes de salir.
const RELEASE_DELAYS = { blinky: 0, pinky: 120, inky: 240, clyde: 360 };

// Crea una partida nueva. Copia MAZE (pristino) a game.grid para poder comer
// dots sin destruir el original, y reiniciar.
function createGame() {
  const grid = MAZE.map( ( row ) => row.slice() );
  // La celda de inicio de Pacman arranca sin dot.
  grid[ PACMAN_START.y ][ PACMAN_START.x ] = 0;

  let dots = 0;
  for ( const row of grid ) for ( const v of row ) if ( v === 2 || v === 4 ) dots++;

  return {
    state: 'start',
    score: 0,
    lives: 3,
    dotsRemaining: dots,
    grid,
    pacman: {
      x: PACMAN_START.x,
      y: PACMAN_START.y,
      dir: 'left',
      nextDir: null,
      speed: PACMAN_SPEED,
    },
    ghosts: GHOST_STARTS.map( ( g ) => ( {
      x: g.x,
      y: g.y,
      dir: 'up',
      speed: GHOST_SPEED,
      kind: g.kind,
      released: g.kind === 'blinky',
      releaseIn: RELEASE_DELAYS[ g.kind ],
      respawnIn: 0,
    } ) ),
    frightened: { active: false, timer: 0, combo: 0 },
  };
}

function aligned( v ) {
  return Math.abs( v - Math.round( v ) ) < 1e-3;
}

// Una celda es muro para el actor dado?
//   pacman: bloqueado por pared (1) y puerta (3)
//   ghost:  bloqueado por pared (1); la puerta (3) solo si no esta liberado
function isWall( grid, x, y, actor ) {
  if ( y < 0 || y >= grid.length ) return true;
  if ( x < 0 || x >= grid[ 0 ].length ) return true;
  const v = grid[ y ][ x ];
  if ( v === 1 ) return true;
  if ( v === 3 && ( actor === 'pacman' || actor.released === false ) ) return true;
  return false;
}

// Puede el actor avanzar desde (x,y) en la direccion dir?
function canMove( grid, x, y, dir, actor ) {
  const d = DIRS[ dir ];
  if ( !d ) return false;
  const tx = x + d.x;
  const ty = y + d.y;
  // Tunel: salir por un borde en la fila del tunel siempre es valido.
  if ( ty === TUNNEL_ROW && ( tx < 0 || tx >= grid[ 0 ].length ) ) return true;
  return !isWall( grid, tx, ty, actor );
}

function wrapTunnel( a, width ) {
  if ( Math.round( a.y ) === TUNNEL_ROW ) {
    if ( a.x < 0 ) a.x += width;
    else if ( a.x >= width ) a.x -= width;
  }
}

function movePacman( game ) {
  const p = game.pacman;
  const grid = game.grid;
  const width = grid[ 0 ].length;

  if ( aligned( p.x ) && aligned( p.y ) ) {
    p.x = Math.round( p.x );
    p.y = Math.round( p.y );

    // Aplicar giro pendiente si es posible.
    if ( p.nextDir && canMove( grid, p.x, p.y, p.nextDir, 'pacman' ) ) {
      p.dir = p.nextDir;
      p.nextDir = null;
    }
    // Comer dot o power pellet.
    const cell = grid[ p.y ][ p.x ];
    if ( cell === 2 || cell === 4 ) {
      grid[ p.y ][ p.x ] = 0;
      game.score += cell === 4 ? 50 : 10;
      game.dotsRemaining--;
      if ( cell === 4 ) startFrightened( game );
    }
    // Si no puede seguir, se detiene en la celda.
    if ( !canMove( grid, p.x, p.y, p.dir, 'pacman' ) ) return;
  }

  const d = DIRS[ p.dir ];
  p.x += d.x * p.speed;
  p.y += d.y * p.speed;
  wrapTunnel( p, width );
}

// Objetivo de cada fantasma segun su IA clasica.
//   blinky: persigue a Pac-Man directamente.
//   pinky:  embosca, 4 celdas por delante de Pac-Man en su direccion.
//   inky:   vector doble: 2*(pacman+2 en su direccion) - blinky.
//   clyde:  persigue si esta a mas de 8 (Manhattan); si no, huye a (1,29).
function ghostTarget( game, g ) {
  const p = game.pacman;
  const px = Math.round( p.x );
  const py = Math.round( p.y );
  const pd = DIRS[ p.dir ];

  switch ( g.kind ) {
    case 'pinky':
      return { x: px + pd.x * 4, y: py + pd.y * 4 };
    case 'inky': {
      const blinky = game.ghosts.find( ( gg ) => gg.kind === 'blinky' );
      const midX = px + pd.x * 2;
      const midY = py + pd.y * 2;
      return {
        x: 2 * midX - Math.round( blinky.x ),
        y: 2 * midY - Math.round( blinky.y ),
      };
    }
    case 'clyde': {
      const dist = Math.abs( g.x - px ) + Math.abs( g.y - py );
      return dist > 8 ? { x: px, y: py } : { x: 1, y: 29 };
    }
    default: // blinky
      return { x: px, y: py };
  }
}

// Modo asustado: activa el timer, resetea la racha e invierte a los activos.
function startFrightened( game ) {
  const f = game.frightened;
  f.active = true;
  f.timer = FRIGHTENED_FRAMES;
  f.combo = 0;
  game.ghosts.forEach( ( g ) => {
    if ( g.respawnIn > 0 ) return; // oculto: no participa
    g.dir = OPPOSITE[ g.dir ];
  } );
}

function decideGhost( game, g ) {
  const grid = game.grid;

  const options = Object.keys( DIRS ).filter(
    ( dir ) => dir !== OPPOSITE[ g.dir ] && canMove( grid, g.x, g.y, dir, g )
  );
  // Sin salida (callejon): permitir el giro de 180.
  const choices = options.length ? options : [ OPPOSITE[ g.dir ] ];

  // No liberado: patrulla aleatoria dentro del pen.
  if ( !g.released ) {
    g.dir = choices[ Math.floor( Math.random() * choices.length ) ];
    return;
  }

  // Asustado: camino al azar.
  if ( game.frightened.active ) {
    g.dir = choices[ Math.floor( Math.random() * choices.length ) ];
    return;
  }

  const target = ghostTarget( game, g );
  let best = choices[ 0 ];
  let bestDist = Infinity;
  for ( const dir of choices ) {
    const d = DIRS[ dir ];
    const nx = g.x + d.x;
    const ny = g.y + d.y;
    const dist = Math.abs( nx - target.x ) + Math.abs( ny - target.y );
    if ( dist < bestDist ) {
      bestDist = dist;
      best = dir;
    }
  }
  g.dir = best;
}

function moveGhost( game, g ) {
  const grid = game.grid;
  const width = grid[ 0 ].length;

  if ( aligned( g.x ) && aligned( g.y ) ) {
    g.x = Math.round( g.x );
    g.y = Math.round( g.y );
    decideGhost( game, g );
    if ( !canMove( grid, g.x, g.y, g.dir, g ) ) return;
  }

  const d = DIRS[ g.dir ];
  g.x += d.x * g.speed;
  g.y += d.y * g.speed;
  wrapTunnel( g, width );
}

// Renace un fantasma comido: teletransporte al pen, sin animacion de ojos.
function respawnGhost( g ) {
  g.x = RESPAWN_CELL.x;
  g.y = RESPAWN_CELL.y;
  g.dir = 'up';
  g.released = true;
}

// Reset tras perder una vida: posiciones, timers de salida y modo asustado.
function resetPositions( game ) {
  const p = game.pacman;
  p.x = PACMAN_START.x;
  p.y = PACMAN_START.y;
  p.dir = 'left';
  p.nextDir = null;
  game.ghosts.forEach( ( g, i ) => {
    g.x = GHOST_STARTS[ i ].x;
    g.y = GHOST_STARTS[ i ].y;
    g.dir = 'up';
    g.released = g.kind === 'blinky';
    g.releaseIn = RELEASE_DELAYS[ g.kind ];
    g.respawnIn = 0;
    g.speed = GHOST_SPEED;
  } );
  game.frightened = { active: false, timer: 0, combo: 0 };
}

function collides( a, b ) {
  return Math.abs( a.x - b.x ) < 0.5 && Math.abs( a.y - b.y ) < 0.5;
}

function update( game ) {
  const f = game.frightened;

  // Cuenta atras de salida del pen para los fantasmas no liberados.
  game.ghosts.forEach( ( g ) => {
    if ( !g.released ) {
      g.releaseIn--;
      if ( g.releaseIn <= 0 ) g.released = true;
    }
  } );

  movePacman( game );

  // Modo asustado: expiracion del timer.
  if ( f.active ) {
    f.timer--;
    if ( f.timer <= 0 ) {
      f.active = false;
      f.timer = 0;
      f.combo = 0;
    }
  }

  game.ghosts.forEach( ( g ) => {
    // Oculto tras ser comido: sin movimiento ni colision.
    if ( g.respawnIn > 0 ) {
      g.respawnIn--;
      if ( g.respawnIn === 0 ) respawnGhost( g );
      return;
    }
    // Velocidad segun modo (siempre 1/N celda/frame).
    g.speed = f.active ? FRIGHTENED_SPEED : GHOST_SPEED;
    moveGhost( game, g );
  } );

  for ( const g of game.ghosts ) {
    if ( g.respawnIn > 0 ) continue;
    if ( !collides( game.pacman, g ) ) continue;

    if ( f.active ) {
      // Pacman come al fantasma asustado: racha 200/400/800/1600.
      game.score += 200 * Math.pow( 2, Math.min( f.combo, 3 ) );
      f.combo++;
      g.respawnIn = RESPAWN_FRAMES;
    } else {
      game.lives--;
      if ( game.lives <= 0 ) {
        game.state = 'lost';
        return;
      }
      resetPositions( game );
      break;
    }
  }

  if ( game.dotsRemaining <= 0 ) game.state = 'won';
}

window.createGame = createGame;
window.update = update;
window.DIRS = DIRS;
