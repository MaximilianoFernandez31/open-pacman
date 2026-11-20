---
name: spec-impl
description: Implementa una spec aprobada. Valida que el estado signifique "Approved" (en cualquier idioma), crea una rama git con el nombre de la spec, cambia a ella e inicia la implementación paso a paso con pausas para revisar los diffs.
disable-model-invocation: true
argument-hint: <NN-nombre-spec>
allowed-tools: Read, Glob, Grep, Edit, Write, AskUserQuestion, Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(git log:*), Bash(git diff:*), Bash(git stash:*), Bash(git add:*), Bash(git commit:*), Bash(git show:*), Bash(cat:*), Bash(ls:*)
---

# /spec-impl — Implementador de specs aprobadas

## Contexto de la sesión

Estado actual del repositorio:
!`git status --short`

Rama actual:
!`git branch --show-current`

Specs disponibles en esta carpeta:
!`ls specs/ 2>/dev/null || echo "No existe la carpeta specs/"`

Configuración del workflow:
!`cat specs/.spec-config.yml 2>/dev/null || echo "Sin archivo de config — se aplican los valores por defecto: AutoCreateBranch: true, AutoCommitSteps: false"`

---

## Instrucciones

Sigue estas cuatro fases en orden estricto. **No pases a la fase siguiente si la anterior no se completó correctamente.**

---

### Fase 1 — Identificar la spec

El argumento recibido es: `$ARGUMENTS`

Si `$ARGUMENTS` está vacío:

- Lista los archivos disponibles en `specs/` (ya los tienes arriba).
- Pide al usuario que especifique el nombre exacto de la spec.
- Detente y espera la respuesta. No continúes.

Si `$ARGUMENTS` tiene un valor:

- Busca el archivo en `specs/`. El usuario puede haber escrito el nombre completo (`01-mvp-arkanoid`), solo el número (`01`) o solo el slug (`mvp-arkanoid`). Intenta encontrar el archivo correcto en cualquiera de esos casos.
- Si no encuentras el archivo, muestra las specs disponibles y pide al usuario que corrija el nombre.
- Si lo encuentras, continúa a la Fase 2.

---

### Fase 2 — Validar el estado de la spec

Lee el archivo de spec que localizaste en la Fase 1 con la herramienta Read o `cat`.

En el contenido del archivo, busca la línea que contiene el estado de la spec. La etiqueta del encabezado suele ser `**Status:**` (inglés) o `**Estado:**` (español), pero puede estar en cualquier idioma. Haz coincidir por posición (la línea de estado cerca del inicio de la spec) y por la máquina de estados que la rodea, no por la etiqueta exacta.

**Regla absoluta:** Solo puedes continuar si el estado **significa "Approved"** — sin importar el idioma usado.

Trata cualquiera de los siguientes (y sus equivalentes en otros idiomas) como el estado **Approved** y continúa:

- Inglés: `Approved`
- Español: `Aprobado`
- Portugués: `Aprovado`
- Francés: `Approuvé`
- Alemán: `Genehmigt`
- Italiano: `Approvato`
- …o cualquier palabra en otro idioma que signifique claramente "aprobado"

Cualquier otra cosa (Draft / Borrador, In review / En revisión, Implemented / Implementado, Obsolete / Obsoleto, o cualquier valor no reconocido) significa **detenerse** y mostrar el mensaje de error de abajo.

| Categoría de estado                    | Ejemplos (cualquier idioma)                      | Acción                                                                    |
| --------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| Approved                                | `Approved`, `Aprobado`, `Aprovado`, `Approuvé`, … | Continuar a la Fase 3.                                                    |
| Draft                                   | `Draft`, `Borrador`, …                           | Detenerse. Mostrar el mensaje de error de abajo.                          |
| In review                               | `In review`, `En revisión`, …                    | Detenerse. Mostrar el mensaje de error de abajo.                          |
| Implemented                             | `Implemented`, `Implementado`, …                 | Detenerse. Mostrar el mensaje de error de abajo.                          |
| Obsolete                                | `Obsolete`, `Obsoleto`, …                        | Detenerse. Mostrar el mensaje de error de abajo.                          |
| Línea de estado no encontrada / valor no reconocido | —                                        | Detenerse. El archivo no sigue el formato esperado. Comunícaselo al usuario. |

Si no estás seguro de que un valor signifique "aprobado", **no asumas**. Detente y pide al usuario que aclare o que actualice la spec a la redacción canónica.

**Mensaje de error estándar cuando el estado no significa Approved:**

```
❌ No puedo implementar esta spec.

Estado actual: [ESTADO ENCONTRADO]
Solo trabajo con specs cuyo estado significa "Approved" (p. ej. `Approved`, `Aprobado`,
o el equivalente en otro idioma).

Para continuar tienes dos opciones:
  1. Si la spec está lista para implementarse, ábrela y cambia el estado
     a "Approved" (o el término equivalente que use tu equipo) manualmente.
     Ese cambio lo hace el humano, no el agente.
  2. Si la spec todavía necesita trabajo, usa /spec [nombre] para retomarla.
```

No ofrezcas alternativas, no sugieras "aún puedo empezar si quieres". El bloqueo es intencionado.

---

### Fase 3 — Crear la rama git y cambiar a ella

Una vez confirmado que el estado significa `Approved`:

0. **Comprueba primero el árbol de trabajo.** Mira la salida de `git status --short` en el contexto de la sesión de arriba. Si **no está vacío**, detente y muestra los cambios pendientes, y luego pregunta:

   ```
   ⚠️ Hay cambios sin commit en el árbol de trabajo.
   Cambiar de rama los arrastraría. ¿Qué quieres hacer?
     1. Hacerles commit o stash tú mismo, y luego re-ejecutar este comando  (recomendado)
     2. Continuar de todos modos — los cambios viajan a la nueva rama
   ```

   Espera la respuesta. **No hagas stash ni commit en nombre del usuario** salvo que lo pida explícitamente. Si el árbol de trabajo está limpio, salta directo al paso 1 sin mencionarlo.

1. Deriva el nombre de la rama del nombre completo del archivo de la spec, sin la extensión. Formato: `spec-NN-slug`. Ejemplos:

   - `01-mvp-arkanoid.md` → rama `spec-01-mvp-arkanoid`
   - `02-powerups.md` → rama `spec-02-powerups`

2. Lee el flag `AutoCreateBranch` de la **Configuración del workflow** mostrada en el contexto de la sesión de arriba.

   - Si el archivo de config no existe, el valor falta o el valor no se reconoce → trátalo como `true` (el valor por defecto).
   - Solo un `false` explícito (en cualquier combinación de mayúsculas) desactiva la creación automática de la rama.

   **Si `AutoCreateBranch` es `true` (por defecto):** procede sin preguntar.

   - Si la rama **no existe**: créala con `git checkout -b spec-NN-slug`.
   - Si **ya existe**: esto significa que se está reanudando trabajo anterior. Cámbiate a ella, lee `git log --oneline` en la rama y dile al usuario qué pasos del plan ya parecen hechos y desde qué paso propones reanudar. Los commits con nombre `spec-NN-step-MM` (creados cuando `AutoCommitSteps` es `true`) marcan exactamente qué pasos están terminados. Espera confirmación del punto de reanudación antes de implementar nada.
   - En ambos casos: cámbiate a la rama con `git checkout spec-NN-slug` y confirma que el cambio fue exitoso antes de continuar.

   **Si `AutoCreateBranch` es `false`:** pregunta antes de tocar git. Muestra:

   ```
   AutoCreateBranch está configurado en false.
   ¿Crear y cambiar a la rama spec-NN-slug? [y/N]
   ```

   - Si el usuario responde **sí**: crea/cámbiate a la rama exactamente como en el caso `true` de arriba.
   - Si el usuario responde **no** o lo deja vacío: **no crees ninguna rama.** Dile al usuario que implementarás en la rama actual (la que muestra el contexto de la sesión de arriba) y pídele confirmación explícita para continuar ahí. No improvises — espera la respuesta.

3. Confirma visualmente al usuario que la spec está lista y qué rama está activa:

   ```
   ✅ Listo para implementar.

   Spec:   specs/NN-slug.md
   Rama:   spec-NN-slug  (activa)   (← o la rama actual, si no se creó ninguna nueva)
   Estado: Approved   (← repite el valor real encontrado en la spec)
   ```

4. **Todavía no empieces a implementar.** Primero muestra el resumen de la spec al usuario para que lo tenga fresco. Extrae y muestra:
   - El **objetivo** (la línea tras `**Objective:**` / `**Objetivo:**` o la etiqueta equivalente).
   - El **alcance** (la sección `## Scope` / `## Alcance` o equivalente).
   - El **plan de implementación** (la sección con los pasos numerados — `## Implementation plan` / `## Plan de implementación` o equivalente).
   - Los **criterios de aceptación** (el checklist — `## Acceptance criteria` / `## Criterios de aceptación` o equivalente).

Haz coincidir los títulos de sección por significado, no por redacción exacta — la spec puede estar escrita en cualquier idioma.

---

### Fase 4 — Implementar paso a paso

Tras mostrar el resumen de la spec, dile al usuario:

```
Voy a implementar la spec siguiendo el plan de implementación exactamente.
Me pausaré después de cada paso para que revises el diff.
Cada paso se hará commit como spec-NN-step-MM.   (← solo si AutoCommitSteps es true)

¿Empezamos con el Paso 1?
```

Espera confirmación explícita ("sí", "adelante", "va" o equivalente). No empieces sin ella.

Una vez confirmado, sigue estas reglas durante toda la implementación:

**Los commits los controla el flag `AutoCommitSteps`** en la **Configuración del workflow** mostrada en el contexto de la sesión de arriba. Si el archivo de config no existe, el valor falta o el valor no se reconoce → trátalo como `false` (el valor por defecto). Solo un `true` explícito (en cualquier combinación de mayúsculas) activa los commits por paso.

- **`AutoCommitSteps: false` (por defecto) — nunca hagas commit automáticamente.** Ni por paso, ni al final. Tú escribes el código y muestras el diff; hacer commit es decisión y orden del usuario. Haz commit solo si te lo pide explícitamente.
- **`AutoCommitSteps: true` — haz commit de cada paso en cuanto esté terminado**, antes de pausar para la revisión:
  - Selecciona solo los archivos que creaste, modificaste o borraste en este paso: `git add -- <file> <file> …`. Nunca uses `git add -A` ni `git add .` — podrían arrastrar cambios que no pertenecen al paso.
  - Haz commit con el mensaje `spec-NN-step-MM` y nada más (sin descripción, sin cuerpo). `NN` es el número de la spec y `MM` es el número del paso del plan de implementación, ambos con relleno de cero a dos dígitos. Ejemplo: paso 3 de `01-mvp-arkanoid.md` → `spec-01-step-03`.
  - Si el usuario pide ajustes al paso mientras lo revisa, aplícalos e intégralos en el mismo commit (`git add -- <files>` + `git commit --amend --no-edit`), para que cada paso siga siendo un solo commit. Haz amend solo nunca al commit del paso que se está revisando actualmente, nunca a uno anterior.
  - Si el commit falla (p. ej. un hook pre-commit lo rechaza), detente y muestra el error. Nunca saltes los hooks con `--no-verify`.
  - Nunca hagas push.

**Una regla por encima de todas:** implementa lo que dice la spec. Si algo de la spec te parece subóptimo, menciónalo como observación pero implementa lo acordado. Los cambios a la spec van en la spec, no en el código por sorpresa.

**Ritmo de trabajo:**

- Implementa un paso del plan.
- Si `AutoCommitSteps` es `true`, haz commit del paso como se describió arriba.
- Muestra un resumen de qué archivos tocaste y qué hiciste. Si hiciste commit, añade la línea de commit: `Committed as spec-NN-step-MM (<hash corto>)` — el usuario puede revisarlo con `git show HEAD`.
- Di: `Paso N completado. ¿Podrías revisar el diff y decirme si continúo con el Paso N+1?`
- Espera la confirmación antes de continuar.

**Si durante la implementación encuentras una ambigüedad** que la spec no resuelve:

- Detente.
- Describe la ambigüedad exactamente.
- Presenta dos o tres opciones concretas.
- Espera la decisión del usuario.
- No improvises.

**Si el usuario pide algo que está fuera del alcance de la spec:**

- Recuérdale que está fuera del alcance de esta spec.
- Sugiere apuntarlo para la siguiente spec.
- No lo implementes en esta rama.

**Al terminar el último paso:**

```
✅ Todos los pasos del plan están implementados.

Siguiente paso: verificar los criterios de aceptación de la spec uno por uno.
Si todos pasan, actualiza el estado de la spec a "Implemented" (o el equivalente
en el idioma de tu repo) y haz el commit final antes de fusionar esta rama.
```

---

## Resumen del comportamiento esperado

```
/spec-impl 01-mvp-arkanoid

  Fase 1  →  Encuentra specs/01-mvp-arkanoid.md
  Fase 2  →  Lee el estado → "Approved" (o "Aprobado", etc.) → ✅ continúa
  Fase 3  →  git checkout -b spec-01-mvp-arkanoid → git checkout spec-01-mvp-arkanoid
              Muestra objetivo, alcance, plan y criterios
  Fase 4  →  Implementa paso a paso con pausas
              Termina recordando verificar los criterios de aceptación

/spec-impl 02-powerups  (estado: Draft / Borrador)

  Fase 1  →  Encuentra specs/02-powerups.md
  Fase 2  →  Lee el estado → "Draft" → ❌ se detiene
              Muestra el mensaje de error estándar
              No crea rama, no toca código
```

**La creación de ramas la controla el flag `AutoCreateBranch`** en `specs/.spec-config.yml`. Por defecto es `true` (crea la rama automáticamente, como se muestra arriba). Cámbialo a `false` para que la Fase 3 pregunte `[y/N]` antes de crear la rama.

**Los commits por paso los controla el flag `AutoCommitSteps`** en el mismo archivo. Por defecto es `false` (nunca hacer commit). Cámbialo a `true` para que la Fase 4 haga commit de cada paso terminado como `spec-NN-step-MM`.
