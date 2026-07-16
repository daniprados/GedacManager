import { jest } from '@jest/globals';

import { StudentListCoordinator } from '../src/StudentListCoordinator.js';

describe('StudentListCoordinator', () => {
    let logger;
    let reportParser;
    let classifier;
    let reportClient;
    let observer;
    let observerCallback;
    let observerFactory;
    let listener;
    let coordinator;

    beforeEach(() => {
        logger = { error: jest.fn() };
        reportParser = { parse: jest.fn() };
        classifier = { classify: jest.fn((student) => `category-${student.confirmationCode}`) };
        reportClient = { findConfiguration: jest.fn(), fetchAllPages: jest.fn() };
        observer = { observe: jest.fn(), disconnect: jest.fn() };
        observerFactory = jest.fn((callback) => {
            observerCallback = callback;
            return observer;
        });
        listener = {
            onLoading: jest.fn(),
            onStudents: jest.fn(),
            onError: jest.fn(),
        };
        coordinator = new StudentListCoordinator(
            logger,
            reportParser,
            classifier,
            reportClient,
            observerFactory,
            listener,
        );
    });

    test('combina totes les pàgines, classifica i elimina sol·licituds duplicades', async () => {
        const page1 = document.createElement('div');
        const page2 = document.createElement('div');
        reportClient.findConfiguration.mockReturnValue({ reportId: 'report' });
        reportClient.fetchAllPages.mockResolvedValue([page1, page2]);
        reportParser.parse
            .mockReturnValueOnce([student('PRE-1', 'C'), student('PRE-2', 'M')])
            .mockReturnValueOnce([student('PRE-2', 'M'), student('PRE-3', '')]);

        const result = await coordinator.refresh(document);

        expect(result.map(({ applicationCode }) => applicationCode)).toEqual(['PRE-1', 'PRE-2', 'PRE-3']);
        expect(result.map(({ category }) => category)).toEqual(['category-C', 'category-M', 'category-']);
        expect(classifier.classify).toHaveBeenCalledTimes(3);
        expect(listener.onLoading).toHaveBeenCalledTimes(1);
        expect(listener.onStudents).toHaveBeenCalledWith(result);
    });

    test('utilitza directament el document si el report no està paginat', async () => {
        reportClient.findConfiguration.mockReturnValue(null);
        reportParser.parse.mockReturnValue([student('PRE-1', 'CC')]);

        await coordinator.refresh(document);

        expect(reportClient.fetchAllPages).not.toHaveBeenCalled();
        expect(reportParser.parse).toHaveBeenCalledWith(document);
    });

    test('ignora el resultat d’una càrrega antiga que acaba més tard', async () => {
        let resolveFirstPage;
        const firstPage = new Promise((resolve) => { resolveFirstPage = resolve; });
        reportClient.findConfiguration.mockReturnValue({ reportId: 'report' });
        reportClient.fetchAllPages
            .mockReturnValueOnce(firstPage)
            .mockResolvedValueOnce([document.createElement('div')]);
        reportParser.parse.mockReturnValue([student('PRE-NOVA', 'C')]);

        const oldRefresh = coordinator.refresh(document);
        const newRefresh = coordinator.refresh(document);
        await newRefresh;
        resolveFirstPage([document.createElement('div')]);
        await oldRefresh;

        expect(listener.onStudents).toHaveBeenCalledTimes(1);
        expect(listener.onStudents.mock.calls[0][0][0].applicationCode).toBe('PRE-NOVA');
    });

    test('observa un report substituït per APEX i el torna a carregar', async () => {
        reportClient.findConfiguration.mockReturnValue(null);
        reportParser.parse.mockReturnValue([]);
        await coordinator.start(document);
        const report = document.createElement('div');
        report.id = 'report_123_catch';
        report.innerHTML = '<table><tr><th id="CONFIRMAT"></th><th id="PRES_DOC"></th></tr></table>';

        observerCallback([{ addedNodes: [report] }]);
        await Promise.resolve();
        await Promise.resolve();

        expect(observer.observe).toHaveBeenCalledWith(document.body, { childList: true, subtree: true });
        expect(reportParser.parse).toHaveBeenLastCalledWith(report);
        expect(listener.onStudents).toHaveBeenCalledTimes(2);
    });

    test('notifica els errors de càrrega sense deixar una promesa rebutjada', async () => {
        const error = new Error('APEX no disponible');
        reportClient.findConfiguration.mockReturnValue({ reportId: 'report' });
        reportClient.fetchAllPages.mockRejectedValue(error);

        await expect(coordinator.refresh(document)).resolves.toEqual([]);
        expect(listener.onError).toHaveBeenCalledWith(error);
        expect(logger.error).toHaveBeenCalledWith(
            'No s’ha pogut carregar el llistat complet de matrícula',
            error,
        );
    });
});

function student(applicationCode, confirmationCode) {
    return {
        applicationCode,
        confirmationCode,
        documentationCode: '',
        studentId: applicationCode,
        cycle: 'CFPM',
        course: '1',
        round: '1',
    };
}
