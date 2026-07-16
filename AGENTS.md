# Instruccions per a agents IA

## Descripció del projecte

Userscript (Tampermonkey) que millora la plataforma GEDAC, plataforma del departament d'educació per gestionar la matrícula. Facilita la consulta de dades i l'extracció de llistats.

**No és una aplicació web convencional**: és un script injectat al DOM d'una pàgina Angular antiga. No hi ha framework, no hi ha backend propi, no hi ha API pròpia.

---

## Stack i eines

| Eina | Detall |
|---|---|
| Llenguatge | JavaScript ES modules (`"type": "module"`) |
| Node.js | ≥ 22 |
| Gestor de paquets | **pnpm** (pinned via `packageManager` a `package.json`) |
| Bundler | esbuild (`build/esbuild.config.js`) |
| Tests | Jest 30 amb `--experimental-vm-modules` |
| DOM testing | jsdom |
| CI | GitHub Actions (`.github/workflows/test.yml`) |

## Comandes principals

```bash
pnpm install          # instal·lar dependències
pnpm test             # executar tests
pnpm run build        # sincronitzar versió + generar dist/script.user.js
```

---

## Arquitectura

### Estructura de fitxers

- `src/` — codi font, una classe per fitxer, organitzat per funcionalitats.
- `src/materia/` — funcionalitat de posar notes: detecció del formulari, UI, aplicació de notes, estils i scroll.
- `src/excel/` — funcionalitat d'exportació Excel i panell compartit amb el visualitzador.
- `src/visualitzador/` — visualitzador de l'estat de notes i exportació PDF.
- `src/dataProviders/` — accés a dades d'Esfer@ i normalització cap al model intern.
- `tests/` — tests Jest, un fitxer per classe amb el patró `NomClasse.test.js`.
- `build/` — configuració esbuild, gestió de versió i header del userscript.
- `dist/` — sortida del build (**no editar manualment**).
- `docs/` — captures de pantalla i recursos visuals.
- `context/` - fitxers per donar context a l'hora de generar  (no és poden incloure en commits)

### Patrons del projecte

- **Cada fitxer `src/` exporta exactament una classe** amb `export class NomClasse`.
- **Injecció de dependències via constructor**: totes les classes reben un `logger` (i altres dependències) com a paràmetre. **No accedeixis a altres classes via `window` ni globals** — passa sempre callbacks o instàncies pel constructor.
- **No hi ha framework**: el DOM es manipula directament amb `document.querySelector`, `createElement`, etc.
- **El punt d'entrada** és `src/main.js`, que crea una IIFE i inicialitza `GedacController`.
- **La versió es gestiona a `build/version.js`** (font de veritat) i es sincronitza a `package.json` amb `build/sync-version.js`.

## Versionat

- La **font de veritat** de la versió és `build/version.js` (ex: `export const version = '1.9.0';`).
- `build/sync-version.js` copia la versió de `build/version.js` a `package.json` automàticament.
- `build/esbuild.config.js` injecta la versió al header del userscript (`build/userScriptHeader.raw`, placeholder `{{VERSION}}`).
- El build (`pnpm run build`) executa `sync-version.js` + esbuild en seqüència.

**Per tant:**
- Per canviar la versió, modifica **només** `build/version.js`.
- No editis la versió a `package.json` directament — es sobreescriurà al build.
- No editis el header del userscript a `build/userScriptHeader.raw` per canviar la versió.
- No canviïs la versió sense que s'hagi demanat explícitament.


## Regles — NO TRENCAR

### 1. No instal·lis dependències noves sense justificació

Userscript lleuger. Cada dependència afegeix pes al bundle final. No afegeixis llibreries (ni runtime ni dev) sense raó clara.

### 2. No canviïs l'estructura del build

- `build/userScriptHeader.raw` conté metadades crítiques (`@match`, `@updateURL`, `@downloadURL`). **No el modifiquis**.
- El format de sortida és `iife` — no el canviïs.
- La versió es gestiona **exclusivament** a `build/version.js`. No la canviïs a `package.json` directament.

### 3. Sempre escriu tests

- Si crees o modifiques lògica a `src/`, afegeix o actualitza tests a `tests/`.
- Els tests han de funcionar amb `pnpm test`.
- Utilitza `jsdom` per simular el DOM quan calgui, tal com fa `MateriaParser.test.js`.

### 4. No modifiquis `dist/`

Es genera amb `pnpm run build`. No l'editis manualment mai.

### 5. Respecta l'idioma

- **Codi**: noms de variables, classes i funcions en **anglès o català** (segueix el que ja existeix a cada fitxer).
- **Comentaris i JSDoc**: en **català**.
- **Commits i documentació**: en **català**.

### 6. No afegeixis TypeScript

JavaScript pur amb JSDoc. No converteixis fitxers a `.ts` ni afegeixis `tsconfig.json`.

### 7. No canviïs la CI sense necessitat

`.github/workflows/test.yml` executa tests i build en PRs. No el modifiquis llevat que sigui estrictament necessari.

### 8. Compatibilitat amb el DOM de GEDAC

L'script depèn d'elements concrets del DOM:
- **No inventis selectors ni estructures DOM**. Basa't en el que ja existeix al codi.

### 9. Un fitxer, una classe

No ajuntis múltiples classes en un sol fitxer. Classe nova → fitxer nou a `src/`.

### 10. Només pnpm

No facis servir `npm` ni `yarn`. El `packageManager` està fixat a `package.json`.

---

## Flux de treball

1. Fes els canvis a `src/`.
2. Escriu o actualitza tests a `tests/`.
3. Executa `pnpm test` — han de passar.
4. Executa `pnpm run build` — ha de generar `dist/script.user.js`.
5. No pugis canvis a `dist/` sense fer build primer.

---

## Domini
Has de prioritzar la facilitat de lectura.

L'objectiu és millorar les funcions de llistat de l'aplicatiu GEDAC en la url 
https://aplicacions.gestioeducativa.gencat.cat/ords/pls/apex/
Quan a la pàgina apereix el títol                         <h4>Gestió presentació documents  matrícula (CFP)</h4>


Funcions a implementar
A partir de la cerca feta poder consultar un llistat de:
1. Alumnes que han confirmat i s'han matriculat
2. Alumnes que han confirmat i no s'han matriculat
3. Alumnes que no han confirmat
4. Alumnes que han marcat millora.


També has d'afegir un resum al peu de la pàgina amb el recompte d'alumnes de cada tipus.

En el context

t'he posat el fitxer navegacio.html ->  llistat de la primera pàgina.
entrada.html  -> resposta a la petició ajax de la següent pàgina.

També t'hi posat el js, per si t'hes d'utilitat.