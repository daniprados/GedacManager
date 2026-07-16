# GEDAC Manager

GEDAC Manager és un userscript per a Tampermonkey que facilita la consulta dels resultats de matrícula de la plataforma GEDAC del Departament d’Educació.

El script s’activa a la pantalla «Gestió presentació documents matrícula (CFP)» i, a partir de la cerca feta a GEDAC, carrega totes les pàgines del report per oferir aquests llistats:

- alumnes que han confirmat i s’han matriculat;
- alumnes que han confirmat i no s’han matriculat;
- alumnes que no han confirmat;
- alumnes que han marcat millora.

La pàgina incorpora cinc botons per alternar entre la taula original i els quatre llistats de consulta. També mostra al peu un resum amb el nombre total d’alumnes de cada categoria.

El botó **Exporta CSV** descarrega tots els alumnes o només els de la categoria activa. El fitxer utilitza UTF-8 i un format compatible amb Excel.

La taula original de GEDAC continua disponible i conserva els seus controls d’edició. Els llistats afegits pel userscript són només de consulta.

## Funcionament i privacitat

GEDAC Manager s’executa íntegrament al navegador. No disposa de servidor ni d’API pròpia i no envia les dades dels alumnes a cap servei extern. El script reutilitza la paginació APEX de la sessió activa per consultar totes les files de la cerca.

## Requisits

- Accés autoritzat a GEDAC.
- Un navegador compatible amb Tampermonkey.
- L’extensió [Tampermonkey](https://www.tampermonkey.net/) instal·lada.

## Instal·lació

1. Instal·la Tampermonkey al navegador.
2. Obre el fitxer distribuïble [dist/script.user.js](https://raw.githubusercontent.com/daniprados/GedacManager/main/dist/script.user.js).
3. Tampermonkey mostrarà la pantalla d’instal·lació del userscript. Prem **Instal·la**.
4. Accedeix a GEDAC i obre la pantalla «Gestió presentació documents matrícula (CFP)».
5. Fes una cerca. Els botons de consulta apareixeran abans de la taula i el resum, al peu de la pàgina.

Per actualitzar una instal·lació manual, torna a obrir l’enllaç de `dist/script.user.js` i confirma la substitució de la versió instal·lada.

## Desenvolupament

Cal tenir Node.js 22 o superior i pnpm. El projecte fixa la versió de pnpm mitjançant el camp `packageManager` de `package.json`.

```bash
pnpm install
pnpm test
```

Per generar el userscript distribuïble, primer incrementa la versió SemVer a `build/version.js` i després executa:

```bash
pnpm run build
```

El build sincronitza la versió amb `package.json` i genera `dist/script.user.js`. No s’han d’editar manualment ni la versió de `package.json` ni el fitxer de `dist/`.

## Estructura principal

- `src/`: codi font del userscript.
- `tests/`: tests unitaris i d’integració amb Jest i jsdom.
- `build/`: configuració del build, capçalera del userscript i font de veritat de la versió.
- `dist/script.user.js`: userscript generat i preparat per instal·lar.
- `project.md`: decisions funcionals i pla d’implementació.

## Validació

```bash
pnpm test
```

La suite cobreix la detecció de la pàgina, l’extracció i classificació dels alumnes, la paginació APEX, la deduplicació, els filtres, l’exportació CSV, el resum i la integració completa del flux.
