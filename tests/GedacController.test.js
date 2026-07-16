import { jest } from '@jest/globals';

import { GedacController } from '../src/GedacController.js';

describe('GedacController', () => {
    test('inicialitza les eines quan reconeix la pàgina objectiu', () => {
        const logger = { info: jest.fn() };
        const pageDetector = { isTargetPage: jest.fn(() => true) };
        const controller = new GedacController(logger, pageDetector);

        expect(controller.start(document)).toBe(true);
        expect(logger.info).toHaveBeenCalledWith('Inicialització de les eines de matrícula CFP');
    });

    test('no inicialitza les eines fora de la pàgina objectiu', () => {
        const logger = { info: jest.fn() };
        const pageDetector = { isTargetPage: jest.fn(() => false) };
        const controller = new GedacController(logger, pageDetector);

        expect(controller.start(document)).toBe(false);
        expect(logger.info).not.toHaveBeenCalled();
    });
});
