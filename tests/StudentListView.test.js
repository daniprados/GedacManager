import { jest } from '@jest/globals';

import { StudentClassifier } from '../src/StudentClassifier.js';
import { StudentListView } from '../src/StudentListView.js';

describe('StudentListView', () => {
    let logger;
    let csvExporter;
    let view;

    beforeEach(() => {
        document.head.innerHTML = '';
        document.body.innerHTML = reportHtml();
        logger = { debug: jest.fn(), error: jest.fn() };
        csvExporter = { download: jest.fn(() => true) };
        view = new StudentListView(logger, document, StudentClassifier.CATEGORIES, csvExporter);
    });

    test('afegeix cinc botons abans del report original', () => {
        expect(view.mount()).toBe(true);

        const tools = document.querySelector('#gedac-student-tools');
        const report = document.querySelector('#report_123_catch');
        expect(tools.nextElementSibling).toBe(report);
        expect(tools.querySelectorAll('button[data-category]')).toHaveLength(5);
        expect(tools.querySelector('button[data-action="export-csv"]')).not.toBeNull();
        expect(tools.querySelector('button[data-category="all"]').getAttribute('aria-pressed')).toBe('true');
    });

    test('afegeix el resum abans del peu i n’actualitza els quatre recomptes', () => {
        document.body.insertAdjacentHTML('beforeend', '<table class="peu"><tr><td>Peu</td></tr></table>');
        view.mount();

        view.onStudents([
            student('PRE-1', 'A', StudentClassifier.CATEGORIES.CONFIRMED_ENROLLED),
            student('PRE-2', 'B', StudentClassifier.CATEGORIES.CONFIRMED_ENROLLED),
            student('PRE-3', 'C', StudentClassifier.CATEGORIES.CONFIRMED_NOT_ENROLLED),
            student('PRE-4', 'D', StudentClassifier.CATEGORIES.NOT_CONFIRMED),
            student('PRE-5', 'E', StudentClassifier.CATEGORIES.IMPROVEMENT),
        ]);

        const summary = document.querySelector('#gedac-student-summary');
        expect(summary.nextElementSibling).toBe(document.querySelector('table.peu'));
        expect(summary.getAttribute('aria-busy')).toBe('false');
        expect(summary.querySelector('[data-category="confirmedEnrolled"]').textContent).toBe('2');
        expect(summary.querySelector('[data-category="confirmedNotEnrolled"]').textContent).toBe('1');
        expect(summary.querySelector('[data-category="notConfirmed"]').textContent).toBe('1');
        expect(summary.querySelector('[data-category="improvement"]').textContent).toBe('1');
    });

    test('mostra tots els alumnes de la categoria escollida en una taula de consulta', () => {
        view.mount();
        view.onStudents([
            student('PRE-1', 'Alumne <primer>', StudentClassifier.CATEGORIES.CONFIRMED_ENROLLED),
            student('PRE-2', 'Alumne segon', StudentClassifier.CATEGORIES.IMPROVEMENT),
            student('PRE-3', 'Alumne tercer', StudentClassifier.CATEGORIES.CONFIRMED_ENROLLED),
        ]);

        document.querySelector('button[data-category="confirmedEnrolled"]').click();

        expect(document.querySelector('#report_123_catch').hidden).toBe(true);
        expect(document.querySelector('.gedac-student-tools__results').hidden).toBe(false);
        expect(document.querySelectorAll('.gedac-student-tools__table tbody tr')).toHaveLength(2);
        expect(document.querySelector('.gedac-student-tools__table tbody').textContent).toContain('Alumne <primer>');
        expect(document.querySelector('.gedac-student-tools__table tbody').innerHTML).not.toContain('<primer>');
        expect(document.querySelector('button[data-category="confirmedEnrolled"]').textContent)
            .toBe('Confirmats i matriculats (2)');
    });

    test('el botó Tots recupera el report APEX editable', () => {
        view.mount();
        view.onStudents([student('PRE-1', 'Alumne', StudentClassifier.CATEGORIES.NOT_CONFIRMED)]);
        document.querySelector('button[data-category="notConfirmed"]').click();

        document.querySelector('button[data-category="all"]').click();

        expect(document.querySelector('#report_123_catch').hidden).toBe(false);
        expect(document.querySelector('.gedac-student-tools__results').hidden).toBe(true);
        expect(document.querySelector('button[data-category="all"]').textContent).toBe('Tots (1)');
    });

    test('exporta tots els alumnes quan està activa la vista Tots', () => {
        view.mount();
        const students = [
            student('PRE-1', 'Alumne primer', StudentClassifier.CATEGORIES.NOT_CONFIRMED),
            student('PRE-2', 'Alumne segon', StudentClassifier.CATEGORIES.IMPROVEMENT),
        ];
        view.onStudents(students);

        document.querySelector('button[data-action="export-csv"]').click();

        expect(csvExporter.download).toHaveBeenCalledWith(students, 'all');
        expect(document.querySelector('[role="status"]').textContent)
            .toBe('S’ha exportat el llistat en CSV (2 alumnes).');
    });

    test('exporta només la categoria activa i es desactiva si és buida', () => {
        view.mount();
        const improvementStudent = student(
            'PRE-2',
            'Alumne segon',
            StudentClassifier.CATEGORIES.IMPROVEMENT,
        );
        view.onStudents([
            student('PRE-1', 'Alumne primer', StudentClassifier.CATEGORIES.NOT_CONFIRMED),
            improvementStudent,
        ]);
        document.querySelector('button[data-category="improvement"]').click();

        const exportButton = document.querySelector('button[data-action="export-csv"]');
        expect(exportButton.disabled).toBe(false);
        exportButton.click();
        expect(csvExporter.download).toHaveBeenCalledWith([improvementStudent], 'improvement');

        document.querySelector('button[data-category="confirmedEnrolled"]').click();
        expect(exportButton.disabled).toBe(true);
    });

    test('mostra un estat buit quan una categoria no té alumnes', () => {
        view.mount();
        view.onStudents([]);

        document.querySelector('button[data-category="improvement"]').click();

        expect(document.querySelector('.gedac-student-tools__table tbody td').textContent)
            .toBe('No hi ha alumnes en aquesta categoria.');
    });

    test('en cas d’error torna a la taula original', () => {
        view.mount();
        view.onStudents([student('PRE-1', 'Alumne', StudentClassifier.CATEGORIES.IMPROVEMENT)]);
        document.querySelector('button[data-category="improvement"]').click();

        view.onError(new Error('Error APEX'));

        expect(document.querySelector('#report_123_catch').hidden).toBe(false);
        expect(document.querySelector('[role="status"]').dataset.state).toBe('error');
    });
});

function reportHtml() {
    return `
        <div class="regio">
            <div id="report_123_catch">
                <table><tr><th id="CONFIRMAT"></th><th id="PRES_DOC"></th></tr></table>
            </div>
        </div>
    `;
}

function student(applicationCode, studentName, category) {
    return {
        round: '1',
        applicationCode,
        studentId: applicationCode.replace('PRE-', 'ID-'),
        studentName,
        cycle: 'CFPM IC10',
        course: '1',
        category,
    };
}
