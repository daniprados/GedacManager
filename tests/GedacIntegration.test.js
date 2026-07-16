import { jest } from '@jest/globals';

import { ApexReportClient } from '../src/ApexReportClient.js';
import { GedacController } from '../src/GedacController.js';
import { GedacPageDetector } from '../src/GedacPageDetector.js';
import { GedacReportParser } from '../src/GedacReportParser.js';
import { StudentClassifier } from '../src/StudentClassifier.js';
import { StudentListCoordinator } from '../src/StudentListCoordinator.js';
import { StudentListView } from '../src/StudentListView.js';

describe('Integració de la consulta de matrícula', () => {
    test('carrega dues pàgines APEX i permet consultar el llistat complet per categoria', async () => {
        document.head.innerHTML = '';
        document.body.innerHTML = `
            <h4>Gestió presentació documents  matrícula (CFP)</h4>
            <div class="regio">
                <div id="report_1568257600892028933_catch">
                    ${reportTable([])}
                    ${paginationLink(16)}
                </div>
            </div>
            <table class="peu"><tr><td>Peu GEDAC</td></tr></table>
        `;
        const logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };
        const apexServer = {
            plugin: jest.fn()
                .mockResolvedValueOnce(`${reportTable([row('PRE-1', 'Alumna primera', 'C', 'S')])}${paginationLink(16)}`)
                .mockResolvedValueOnce(`${reportTable([row('PRE-2', 'Alumne segon', 'M', '')])}${paginationLink(1)}`),
        };
        const view = new StudentListView(logger, document, StudentClassifier.CATEGORIES);
        const coordinator = new StudentListCoordinator(
            logger,
            new GedacReportParser(logger),
            new StudentClassifier(logger),
            new ApexReportClient(logger, apexServer, new DOMParser()),
            () => ({ observe: jest.fn(), disconnect: jest.fn() }),
            view,
        );
        const controller = new GedacController(
            logger,
            new GedacPageDetector(logger),
            view,
            coordinator,
        );

        expect(controller.start(document)).toBe(true);
        await waitFor(() => document.querySelector('[role="status"]')?.dataset.state === 'ready');

        expect(apexServer.plugin).toHaveBeenCalledTimes(2);
        expect(document.querySelector('button[data-category="all"]').textContent).toBe('Tots (2)');
        expect(document.querySelector('#gedac-student-summary [data-category="confirmedEnrolled"]').textContent).toBe('1');
        expect(document.querySelector('#gedac-student-summary [data-category="improvement"]').textContent).toBe('1');

        document.querySelector('button[data-category="improvement"]').click();

        const resultRows = document.querySelectorAll('.gedac-student-tools__table tbody tr');
        expect(resultRows).toHaveLength(1);
        expect(resultRows[0].textContent).toContain('Alumne segon');
        expect(document.querySelector('#report_1568257600892028933_catch').hidden).toBe(true);
    });
});

function reportTable(rows) {
    return `
        <table id="report_R1568257600892028933">
            <tr>
                <th id="TANDA">Tanda</th><th id="CODI_SOLICITUD_PRE">Codi</th>
                <th id="ID_ALUMNE">Id.</th><th id="NOM_ALUMNE">Nom</th>
                <th id="CICLE">Cicle</th><th id="CURS">Curs</th>
                <th id="CONFIRMAT">Confirmada?</th><th id="PRES_DOC">Documentació?</th>
            </tr>
            ${rows.join('')}
        </table>
    `;
}

function row(applicationCode, name, confirmationCode, documentationCode) {
    return `
        <tr class="highlight-row">
            <td>1</td><td>${applicationCode}</td><td>ID-${applicationCode}</td>
            <td>${name}</td><td>CFPM IC10</td><td>1</td>
            <td><select name="f03"><option value="${confirmationCode}" selected>${confirmationCode}</option></select></td>
            <td><select name="f06"><option value="${documentationCode}" selected>${documentationCode}</option></select></td>
        </tr>
    `;
}

function paginationLink(minimumRow) {
    return `
        <table><tr><td class="pagination">
            <a href="javascript:apex.widget.report.paginate('1568257600892028933', 'TOKEN', {min:${minimumRow},max:15,fetched:15});">Pàgina</a>
        </td></tr></table>
    `;
}

async function waitFor(condition) {
    for (let attempt = 0; attempt < 20; attempt += 1) {
        if (condition()) {
            return;
        }

        await new Promise((resolve) => setTimeout(resolve, 0));
    }

    throw new Error('La condició d’integració no s’ha complert');
}
