import { GedacPageDetector } from './GedacPageDetector.js';
import { GedacController } from './GedacController.js';

(() => {
    const logger = console;
    const pageDetector = new GedacPageDetector(logger);
    const controller = new GedacController(logger, pageDetector);

    controller.start(document);
})();
