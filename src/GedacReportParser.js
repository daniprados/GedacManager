export class GedacReportParser {
    constructor(logger) {
        this.logger = logger;
    }

    /**
     * Extreu les dades de consulta del report de matrícula d'APEX.
     *
     * @param {ParentNode} root Document o fragment retornat per APEX.
     * @returns {Array<object>}
     */
    parse(root) {
        const table = this.#findReportTable(root);

        if (!table) {
            this.logger.debug('No s’ha trobat el report de matrícula CFP');
            return [];
        }

        return [...table.querySelectorAll('tr.highlight-row')]
            .map((row) => this.#parseRow(row))
            .filter((student) => student !== null);
    }

    #findReportTable(root) {
        const confirmationHeader = root.querySelector('th#CONFIRMAT');
        const table = confirmationHeader?.closest('table');

        if (!table?.querySelector('th#PRES_DOC')) {
            return null;
        }

        return table;
    }

    #parseRow(row) {
        const cells = [...row.cells];

        if (cells.length < 8) {
            this.logger.warn('S’ha ignorat una fila incompleta del report de matrícula', {
                cellCount: cells.length,
            });
            return null;
        }

        return {
            round: this.#text(cells[0]),
            applicationCode: this.#text(cells[1]),
            studentId: this.#text(cells[2]),
            studentName: this.#text(cells[3]),
            cycle: this.#text(cells[4]),
            course: this.#text(cells[5]),
            confirmationCode: cells[6].querySelector('select[name="f03"]')?.value ?? '',
            documentationCode: cells[7].querySelector('select[name="f06"]')?.value ?? '',
        };
    }

    #text(cell) {
        return cell.textContent.replace(/\s+/g, ' ').trim();
    }
}
