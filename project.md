# Pla d'implementació

## Decisions funcionals acordades

- L'script actuarà només quan la pàgina contingui el títol «Gestió presentació documents matrícula (CFP)».
- Les categories seran excloents:
  - Confirmats i matriculats: estat `C` o `CC` i documentació `S`.
  - Confirmats i no matriculats: estat `C` o `CC` i documentació `N` o buida.
  - No confirmats: estat buit o `R`.
  - Millora: estat `M` o `MC`.
- L'estat `CPM` queda fora del flux perquè no pot aparèixer en aquest moment del procés.
- Els llistats inclouran tots els resultats paginats de la cerca.
- La nova vista serà de consulta; la taula original d'APEX conservarà l'edició.
- Hi haurà botons per a «Tots» i les quatre categories, i un resum global al peu.

## Passos

1. **Completat** — Preparar l'esquelet del projecte, activar l'script a la URL APEX i detectar de manera segura la pàgina objectiu, amb tests.
2. **Completat** — Modelar i provar l'extracció de files del report APEX sense dependre de textos traduïts.
3. **Completat** — Implementar i provar la classificació excloent dels alumnes segons els codis d'estat i documentació.
4. **Completat** — Implementar el client de paginació APEX per obtenir totes les pàgines sense alterar la taula visible.
5. **Completat** — Coordinar la càrrega, eliminar duplicats i reaccionar a cerques o refrescos nous.
6. **Completat** — Crear la vista de consulta amb els cinc botons, estats de càrrega i taula accessible.
7. **Completat** — Afegir el resum al peu amb els quatre recomptes i completar els tests DOM d'integració.
8. **Completat** — Executar tota la suite, generar el build i revisar que no hi hagi regressions ni canvis fora d'abast.

## Validació final

- 9 suites i 43 tests superats amb `pnpm test`.
- Build generat correctament amb `pnpm run build`.
- Els dos HTML reals de `context/` aporten 15 files cadascun i totes es classifiquen.
- La configuració real de paginació es detecta amb el report esperat i blocs de 15 files.
- Cada fitxer funcional de `src/` exporta una sola classe; `src/main.js` es limita a injectar les dependències i inicialitzar el controlador.
- El llistat complet o la categoria activa es poden exportar a CSV compatible amb Excel.
