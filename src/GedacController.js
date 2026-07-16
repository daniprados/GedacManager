export class GedacController {
    constructor(logger, pageDetector) {
        this.logger = logger;
        this.pageDetector = pageDetector;
    }

    /**
     * Inicialitza les millores només a la pantalla GEDAC prevista.
     *
     * @param {Document} document Document de la pàgina actual.
     * @returns {boolean} Indica si s'ha reconegut la pantalla objectiu.
     */
    start(document) {
        if (!this.pageDetector.isTargetPage(document)) {
            return false;
        }

        this.logger.info('Inicialització de les eines de matrícula CFP');

        return true;
    }
}
