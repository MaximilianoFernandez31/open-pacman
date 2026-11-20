---
name: spec
description: Diseña y desarrolla specs siguiendo el método spec-driven. Hace preguntas aclaratorias antes de proponer la estructura y construye la spec sección por sección. Úsalo al empezar una feature grande, antes de escribir código.
disable-model-invocation: true
argument-hint: 'descripción corta de la feature o requerimiento'
allowed-tools: Read, Glob, Grep, Write, AskUserQuestion, Bash(ls:*), Bash(cat:*), Bash(date:*)
---

# /spec — Diseñador de specs guiado

## Contexto de la sesión

Fecha de hoy (usa esto para el encabezado de la spec, nunca la adivines):
!`date +%F`

Specs que ya existen:
!`ls specs/ 2>/dev/null || echo "Todavía no existe la carpeta specs/"`

---

Esta skill te ayuda a producir una spec útil siguiendo el método spec-driven. **Aquí no escribes código.** Tu trabajo es ayudar al usuario a clarificar qué quiere construir, hacer preguntas cuando algo no está lo suficientemente definido y desarrollar la spec sección por sección hasta que esté lista para guardarse en `specs/`.

## Filosofía

Una spec no es documentación decorativa. Es el contrato que dirige la ejecución posterior. Si la spec es vaga, el código va a improvisar. Por eso este flujo es **deliberadamente lento en la fase de definición** y **rápido en la fase de escritura**.

Lee `template.md` (en el mismo directorio que esta skill) para ver la estructura completa que seguirá la spec. Apóyate en ella en cada paso.

## Flujo del comando

- Sigue las cuatro fases en orden. **Nunca saltes la Fase 2** — las preguntas son todo el punto. Si el usuario quiere ir más rápido, recuérdale que el coste de una mala spec se paga después en el código. (La Fase 3 sí tiene un camino rápido una vez que la Fase 2 está genuinamente completa; ver más abajo.)
- Tus respuestas deben estar en el mismo idioma que el prompt inicial. Ej.: si el prompt inicial está en español, tus respuestas deben estar en español; si está en inglés, tus respuestas deben estar en inglés.

### Fase 1 — Entender el contexto

Antes de hacer preguntas sobre la feature, asegúrate de tener contexto del proyecto:

1. Lee el archivo de memoria del proyecto, si existe. Prueba en orden y detente en el primer acierto: `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `README.md`. Esto adapta la skill a cualquiera que la ejecute (Claude Code, Codex, Gemini CLI, etc.).
2. Mira el listado de `specs/` en el contexto de la sesión de arriba para ver qué specs ya existen y cómo están numeradas.
3. Si existen specs anteriores, lee al menos las dos más recientes para recoger las convenciones del proyecto — incluida la **idioma** en que están escritas y la redacción exacta que usan para estados y títulos de secciones. Una spec nueva debe coincidir con las existentes.

Si el argumento `$ARGUMENTS` llega vacío, pídele al usuario una descripción inicial de **una sola frase** de lo que quiere construir. Si la descripción no cabe en una frase, esa es la primera señal de que la feature es demasiado grande — sugiere dividirla antes de continuar.

### Fase 2 — Clarificar con preguntas

Esta es la fase más importante del comando. Tu trabajo aquí es **detectar ambigüedades y preguntar**, no asumir.

Haz preguntas en bloques de 3 a 5 de una vez (no una sola pregunta seguida de otra sola pregunta — eso es agotador). Después de cada bloque, espera a la respuesta antes de continuar.

**Categorías de preguntas que siempre debes considerar:**

- **Alcance:** ¿Qué está dentro y qué NO? ¿Qué partes de la feature se aplazan a otra spec?
- **Datos:** ¿Qué estructuras nuevas se introducen? ¿Cómo se nombran? ¿Dónde viven?
- **Integración:** ¿Esta feature depende de specs anteriores? ¿Modifica algo existente o solo añade?
- **Persistencia:** ¿Se guarda algo entre sesiones? ¿Dónde? ¿Con qué versionado?
- **UX y estados:** ¿Cómo se ve cuando funciona? ¿Cómo se ve cuando falla? ¿Hay estados intermedios?
- **Riesgos:** ¿Qué puede romper esto? ¿Qué pasa en el caso degradado?
- **Decisiones cerradas:** ¿Hay alguna decisión que el usuario ya tomó y no quiere reabrir?

**Cómo redactar las preguntas:**

- Usa preguntas concretas, no abiertas. ❌ "¿Cómo imaginas la persistencia?" → ✅ "¿La persistencia es localStorage, IndexedDB o un archivo JSON en disco?"
- Cuando ofrezcas opciones, da 2–4, marca cuál es tu recomendación y por qué.
- Si tu agente expone una herramienta nativa de opción múltiple (en Claude Code: `AskUserQuestion`), úsala para estos bloques en lugar de escribir las opciones en prosa — el usuario elige en vez de escribir. Pon tu recomendación primero y etiquétala. Usa una lista numerada en markdown como alternativa cuando no exista tal herramienta.
- Si detectas una respuesta que abriría la caja de Pandora (p. ej. "y además queremos multijugador"), señala que merece su propia spec y pregunta si la dejamos fuera del alcance de esta.

**Cuándo dejar de preguntar:**

Deja de cuando puedas responder estas tres preguntas sin asumir nada:

1. ¿Qué archivos van a aparecer o a cambiar?
2. ¿Cuál es el primer paso ejecutable y cuál el último?
3. ¿Cómo verifico que la feature está terminada?

Si aún no puedes responder alguna de ellas, sigue preguntando.

### Fase 3 — Escribir la spec

Una vez cerrada la Fase 2, decide cómo escribirla:

**Si ya tienes toda la información que necesitas** — es decir, puedes responder las tres preguntas de la Fase 2 (qué archivos cambian, cuál es el primer y el último paso ejecutable, cómo verificar que está terminada) **sin asumir nada** — entonces **no vayas sección por sección**. Escribe la spec completa y vete directo a la Fase 4 para guardar el archivo. No pidas confirmación sección por sección, ni muestres un borrador para aprobación antes: el usuario ya respondió todo en la Fase 2 y volver a preguntar es fricción. El usuario revisa el archivo guardado y pide cambios si hace falta.

**Solo si aún falta información** (el usuario cortó la Fase 2, alguna respuesta fue vaga, o alguna sección no puede escribirse sin inventar algo), desarrolla las secciones **una por una**, mostrando cada una y esperando confirmación antes de pasar a la siguiente.

En ambos casos el contenido sigue el mismo orden:

1. **Encabezado** (estado, dependencias, fecha, objetivo de una frase). El objetivo de una frase es crítico — si no cabe en una frase, vuelve a la Fase 2.
2. **Alcance** (qué está dentro y qué NO). El "fuera de alcance" debe ser explícito.
3. **Modelo de datos** (estructuras concretas con nombres reales). Si la feature no introduce datos nuevos, omite esta sección y dilo explícitamente.
4. **Plan de implementación** (pasos numerados, cada uno dejando el sistema funcional).
5. **Criterios de aceptación** (checklist booleano, no aspiracional).
6. **Decisiones tomadas y descartadas** (con breve justificación).
7. **Riesgos identificados** (solo si aplica — si no hay riesgos relevantes, omítela).

**Después de cada sección (solo en el modo sección por sección):**

- Muéstrala formateada en markdown.
- Pregunta: "¿Esta sección se queda así o quieres retocarla?"
- Si el usuario pide cambios, aplícalos y muéstra de nuevo.
- Pasa a la siguiente sección solo cuando el usuario confirme.

**Errores comunes a evitar:**

- Generar criterios de aceptación no verificables ("que funcione bien").
- Meter cosas en el plan de implementación que no están en el alcance.
- Asumir nombres de archivos o estructuras que el usuario no confirmó.
- Saltarse la sección de decisiones — esa es la que más valor tiene a largo plazo.

### Fase 4 — Guardar la spec

Cuando el contenido esté listo (ya sea porque lo tenías todo, o porque todas las secciones fueron confirmadas):

1. Determina el siguiente número secuencial a partir del listado de `specs/` en el contexto de la sesión. Toma el número existente más alto y sumale uno, con relleno de cero a dos dígitos. Si el último es `02-powerups.md`, este será `03-`. Si `specs/` está vacío o no existe, empieza en `01-`.
2. Genera un slug corto en kebab-case a partir del objetivo (p. ej. `levels-and-highscores`). Mira **Argumentos** más abajo para cuándo `$ARGUMENTS` es el slug en vez de la descripción.
3. Usa la fecha del contexto de la sesión de arriba para el campo `**Date:**`. **Nunca escribas una fecha que no hayas leído de ahí.**
4. Escribe el archivo directamente en `specs/NN-slug.md` con todas las secciones. **No pidas permiso para escribirlo ni preguntes si el nombre de archivo sirve** — anuncia la ruta en la confirmación final. Pregunta solo si el archivo de destino ya existe.
5. Marca el estado como `Draft` por defecto (o la palabra equivalente que usen las specs existentes en este repo). **No lo marques como `Approved` automáticamente** — eso lo hace el usuario cuando lo ha releído.
6. Si el encabezado lista dependencias (`**Depends on:** SPEC 01`), comprueba que cada spec referenciada exista realmente en `specs/`. Si alguna no existe, dilo en vez de escribir una referencia colgante.
7. **Siembra el archivo de configuración si no existe.** Busca `specs/.spec-config.yml`. Si **falta**, créalo con el contenido por defecto de abajo. Si **ya existe, déjalo intacto** — nunca sobrescribas la configuración del usuario.

   ```yaml
   # spec workflow configuration
   #
   # AutoCreateBranch — controla si /spec-impl crea la rama git automáticamente.
   #   true  (por defecto) → /spec-impl crea y cambia a spec-NN-slug sin preguntar
   #   false               → /spec-impl pide confirmación [y/N] antes de crear la rama
   AutoCreateBranch: true

   # AutoCommitSteps — controla si /spec-impl hace commit de cada paso terminado.
   #   false (por defecto) → /spec-impl nunca hace commit; el commit depende de ti
   #   true                → /spec-impl hace commit de cada paso como spec-NN-step-MM
   AutoCommitSteps: false
   ```

8. Confirma al usuario:
   - Ruta del archivo creado.
   - Recordatorio: la spec está en estado `Draft`. Cámbiala a `Approved` cuando la hayas releído.
   - Si acabas de crear `specs/.spec-config.yml`, menciona que existe, que `AutoCreateBranch` por defecto es `true` (cámbialo a `false` para controlar tú la creación de ramas) y que `AutoCommitSteps` por defecto es `false` (cámbialo a `true` para que `/spec-impl` haga commit de cada paso).
   - Siguiente paso: una vez revisada y aprobada, ejecuta `/spec-impl NN-slug` para implementarla.
   - **Para aquí.** No propongas implementar la spec, escribir código ni tomar ninguna acción adicional más allá de esta confirmación.

## Reglas duras

- **Nunca escribas código durante este comando.** Solo el archivo `.md` de la spec al final.
- **Nunca propongas implementar la spec después de guardarla.** Tu trabajo termina cuando el archivo está escrito. El usuario ejecuta `/spec-impl` cuando esté listo.
- **Nunca asumas decisiones que el usuario no confirmó.** Si te falta información, pregunta — en la Fase 2, que es donde van las preguntas.
- **No vuelvas a preguntar en la Fase 3 lo ya respondido en la Fase 2.** Si la información está completa, escribe la spec entera y guárdala. La confirmación sección por sección es el recurso para información incompleta, no el modo por defecto.
- **Si el usuario quiere acelerar y saltarse la Fase 2**, recuérdale: "Las preguntas ahora ahorran horas después. ¿Seguro que quieres saltártelas?". Si insiste, respeta su decisión pero anótala en la sección de decisiones de la spec ("Definición rápida sin aclaración detallada").
- **Si la feature es demasiado grande** (no cabe en una frase, toca más de tres áreas del sistema, requiere decisiones en cuatro o más dominios), propón dividirla en dos o más specs antes de continuar.

## Tono al hacer preguntas

Sé directo y específico. No te disculpes por preguntar. No uses frases como "si no te importa..." o "podrías quizás...". El usuario invocó esta skill precisamente porque quiere que hagas preguntas. Usa preguntas concretas, una por línea cuando hay varias, y numéralas para que sea fácil responderlas.

Ejemplo de un bloque bien formado:

> Antes de escribir el modelo de datos necesito clarificar tres cosas:
>
> 1. **Persistencia.** ¿localStorage, IndexedDB o un archivo JSON en disco? Recomendación: localStorage si los datos caben en <5MB y no necesitan consultas.
> 2. **Versionado del schema.** ¿Qué pasa cuando cambia el formato? Opciones: (a) prefijo de versión en la clave, (b) ignorar y reconstruir, (c) migrar al cargar.
> 3. **Privacidad.** ¿Los datos son sensibles? Si sí, ¿están cifrados? ¿Se borran al cerrar sesión?

## Argumentos

`$ARGUMENTS` es **la descripción de la feature**, no el nombre del archivo. Trátalo como el punto de partida de la Fase 1 y deriva el slug del objetivo en la Fase 4.

La única excepción: si `$ARGUMENTS` ya es un único token en kebab-case sin espacios (p. ej. `/spec levels-and-highscores`), es ambiguo entre descripción y slug — úsalo como slug **y** como semilla de la descripción, sin pedir confirmación.

Si invocaron `/spec` sin argumentos, empieza pidiendo la descripción de una frase.
