import { jest } from '@jest/globals';

import { GedacPageDetector } from '../src/GedacPageDetector.js';

describe('GedacPageDetector', () => {
    let logger;
    let detector;

    beforeEach(() => {
        logger = { debug: jest.fn() };
        detector = new GedacPageDetector(logger);
    });

    test('detecta la pàgina encara que APEX dupliqui els espais del títol', () => {
        document.body.innerHTML = '<h4>Gestió presentació documents  matrícula (CFP)</h4>';

        expect(detector.isTargetPage(document)).toBe(true);
    });

    test('ignora una altra pàgina amb un títol semblant', () => {
        document.body.innerHTML = '<h4>Gestió presentació documents matrícula</h4>';

        expect(detector.isTargetPage(document)).toBe(false);
    });

    test('cerca entre tots els encapçalaments h4', () => {
        document.body.innerHTML = `
            <h4>Una altra secció</h4>
            <h4>Gestió presentació documents matrícula (CFP)</h4>
        `;

        expect(detector.isTargetPage(document)).toBe(true);
        expect(logger.debug).toHaveBeenCalledWith(
            'Comprovació de la pàgina de matrícula CFP',
            { isTarget: true },
        );
    });
});
