import { jest } from '@jest/globals';

import { StudentCsvExporter } from '../src/StudentCsvExporter.js';

describe('StudentCsvExporter', () => {
    let logger;
    let urlApi;
    let BlobClass;
    let exporter;

    beforeEach(() => {
        document.body.innerHTML = '';
        logger = { info: jest.fn(), warn: jest.fn() };
        urlApi = {
            createObjectURL: jest.fn(() => 'blob:gedac-csv'),
            revokeObjectURL: jest.fn(),
        };
        BlobClass = jest.fn((parts, options) => ({ parts, options }));
        exporter = new StudentCsvExporter(
            logger,
            document,
            urlApi,
            BlobClass,
            () => new Date(2026, 6, 16),
        );
    });

    test('serialitza totes les columnes amb punt i coma i finals de línia CRLF', () => {
        const csv = exporter.serialize([student()]);

        expect(csv).toContain('"Tanda";"Codi sol·licitud";"Id. Alumne";"Nom Alumne"');
        expect(csv).toContain('"1";"PRE26-1";"ID-1";"Cognom, Nom"');
        expect(csv).toContain('"Confirmat per l’alumne/a";"Sí"\r\n');
        expect(csv.split('\r\n')).toHaveLength(3);
    });

    test('escapa cometes, salts de línia i possibles fórmules de full de càlcul', () => {
        const unsafeStudent = {
            ...student(),
            studentName: '=HYPERLINK("https://example.invalid";"Nom")\nSegona línia',
        };

        const csv = exporter.serialize([unsafeStudent]);

        expect(csv).toContain(
            '"\'=HYPERLINK(""https://example.invalid"";""Nom"")\nSegona línia"',
        );
    });

    test('descarrega amb BOM, tipus CSV i nom determinista segons la categoria', () => {
        const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

        expect(exporter.download([student()], 'confirmedEnrolled')).toBe(true);

        expect(BlobClass).toHaveBeenCalledWith(
            ['\uFEFF', expect.any(String)],
            { type: 'text/csv;charset=utf-8' },
        );
        expect(click.mock.instances[0].download)
            .toBe('gedac-matricula-confirmats-matriculats-2026-07-16.csv');
        expect(urlApi.revokeObjectURL).toHaveBeenCalledWith('blob:gedac-csv');
        expect(document.querySelector('a[download]')).toBeNull();
        click.mockRestore();
    });

    test('no crea cap descàrrega per a un llistat buit', () => {
        expect(exporter.download([], 'all')).toBe(false);
        expect(BlobClass).not.toHaveBeenCalled();
        expect(logger.warn).toHaveBeenCalledWith('No hi ha alumnes per exportar a CSV');
    });
});

function student() {
    return {
        round: '1',
        applicationCode: 'PRE26-1',
        studentId: 'ID-1',
        studentName: 'Cognom, Nom',
        cycle: 'CFPM IC10',
        course: '1',
        confirmationCode: 'C',
        documentationCode: 'S',
    };
}
