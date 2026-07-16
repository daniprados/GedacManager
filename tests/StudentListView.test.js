import { jest } from '@jest/globals';

import { StudentClassifier } from '../src/StudentClassifier.js';
import { StudentListView } from '../src/StudentListView.js';

describe('StudentListView', () => {
    let logger;
    let view;

    beforeEach(() => {
        document.head.innerHTML = '';
        document.body.innerHTML = reportHtml();
        logger = { debug: jest.fn(), error: jest.fn() };
        view = new StudentListView(logger, document, StudentClassifier.CATEGORIES);
    });

    test('afegeix cinc botons abans del report original', () => {
        expect(view.mount()).toBe(true);

        const tools = document.querySelector('#gedac-student-tools');
        const report = document.querySelector('#report_123_catch');
        expect(tools.nextElementSibling).toBe(report);
        expect(tools.querySelectorAll('button')).toHaveLength(5);
        expect(tools.querySelector('button[data-category="all"]').getAttribute('aria-pressed')).toBe('true');
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
