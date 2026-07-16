import { jest } from '@jest/globals';

import { GedacController } from '../src/GedacController.js';

describe('GedacController', () => {
    test('inicialitza les eines quan reconeix la pàgina objectiu', () => {
        const logger = { info: jest.fn() };
        const pageDetector = { isTargetPage: jest.fn(() => true) };
        const studentListView = { mount: jest.fn(() => true) };
        const studentListCoordinator = { start: jest.fn() };
        const controller = new GedacController(
            logger,
            pageDetector,
            studentListView,
            studentListCoordinator,
        );

        expect(controller.start(document)).toBe(true);
        expect(logger.info).toHaveBeenCalledWith('Inicialització de les eines de matrícula CFP');
        expect(studentListView.mount).toHaveBeenCalledTimes(1);
        expect(studentListCoordinator.start).toHaveBeenCalledWith(document);
    });

    test('no inicialitza les eines fora de la pàgina objectiu', () => {
        const logger = { info: jest.fn() };
        const pageDetector = { isTargetPage: jest.fn(() => false) };
        const studentListView = { mount: jest.fn() };
        const studentListCoordinator = { start: jest.fn() };
        const controller = new GedacController(
            logger,
            pageDetector,
            studentListView,
            studentListCoordinator,
        );

        expect(controller.start(document)).toBe(false);
        expect(logger.info).not.toHaveBeenCalled();
        expect(studentListView.mount).not.toHaveBeenCalled();
        expect(studentListCoordinator.start).not.toHaveBeenCalled();
    });
});
