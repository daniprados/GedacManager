import { jest } from '@jest/globals';

import { GedacReportParser } from '../src/GedacReportParser.js';

describe('GedacReportParser', () => {
    let logger;
    let parser;

    beforeEach(() => {
        logger = { debug: jest.fn(), warn: jest.fn() };
        parser = new GedacReportParser(logger);
    });

    test('extreu una fila utilitzant els codis dels controls APEX', () => {
        document.body.innerHTML = reportHtml(`
            <tr class="highlight-row">
                <td>1</td>
                <td>PRE26-2700246974</td>
                <td>6601435006</td>
                <td>En Nah Tiach, Yahya</td>
                <td>CFPM IC10 - Sistemes microinformàtics i xarxes</td>
                <td>1</td>
                <td>${confirmationSelect('C')}</td>
                <td>${documentationSelect('S')}</td>
            </tr>
        `);

        expect(parser.parse(document)).toEqual([{
            round: '1',
            applicationCode: 'PRE26-2700246974',
            studentId: '6601435006',
            studentName: 'En Nah Tiach, Yahya',
            cycle: 'CFPM IC10 - Sistemes microinformàtics i xarxes',
            course: '1',
            confirmationCode: 'C',
            documentationCode: 'S',
        }]);
    });

    test('conserva els codis buits i normalitza els espais visibles', () => {
        document.body.innerHTML = reportHtml(`
            <tr class="highlight-row">
                <td> 1 </td><td> PRE26-1 </td><td> 123 </td>
                <td>Nom &amp; Cognom</td><td>CFPM    AG10 - Gestió administrativa</td><td> 2 </td>
                <td>${confirmationSelect('')}</td><td>${documentationSelect('')}</td>
            </tr>
        `);

        expect(parser.parse(document)[0]).toMatchObject({
            studentName: 'Nom & Cognom',
            cycle: 'CFPM AG10 - Gestió administrativa',
            confirmationCode: '',
            documentationCode: '',
        });
    });

    test('ignora files incompletes i n’informa al logger', () => {
        document.body.innerHTML = reportHtml('<tr class="highlight-row"><td>1</td></tr>');

        expect(parser.parse(document)).toEqual([]);
        expect(logger.warn).toHaveBeenCalledWith(
            'S’ha ignorat una fila incompleta del report de matrícula',
            { cellCount: 1 },
        );
    });

    test('no interpreta altres taules com si fossin el report', () => {
        document.body.innerHTML = '<table><tr><th id="CONFIRMAT">Un altre report</th></tr></table>';

        expect(parser.parse(document)).toEqual([]);
        expect(logger.debug).toHaveBeenCalledWith('No s’ha trobat el report de matrícula CFP');
    });
});

function reportHtml(rows) {
    return `
        <table id="report_R1568257600892028933">
            <tr><th id="CONFIRMAT">Plaça confirmada?</th><th id="PRES_DOC">Documentació?</th></tr>
            ${rows}
        </table>
    `;
}

function confirmationSelect(selectedValue) {
    return `
        <select name="f03">
            <option value="" ${selectedValue === '' ? 'selected' : ''}></option>
            <option value="C" ${selectedValue === 'C' ? 'selected' : ''}>Confirmat</option>
            <option value="M" ${selectedValue === 'M' ? 'selected' : ''}>Millora</option>
        </select>
    `;
}

function documentationSelect(selectedValue) {
    return `
        <select name="f06">
            <option value="" ${selectedValue === '' ? 'selected' : ''}></option>
            <option value="S" ${selectedValue === 'S' ? 'selected' : ''}>Sí</option>
            <option value="N" ${selectedValue === 'N' ? 'selected' : ''}>No</option>
        </select>
    `;
}
