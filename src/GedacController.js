export class GedacController {
    constructor(logger, pageDetector, studentListView, studentListCoordinator) {
        this.logger = logger;
        this.pageDetector = pageDetector;
        this.studentListView = studentListView;
        this.studentListCoordinator = studentListCoordinator;
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
        if (this.studentListView.mount()) {
            void this.studentListCoordinator.start(document);
        }

        return true;
    }
}
