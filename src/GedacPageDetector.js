export class GedacPageDetector {
    static TARGET_TITLE = 'Gestió presentació documents matrícula (CFP)';

    constructor(logger) {
        this.logger = logger;
    }

    /**
     * Comprova el títol visible normalitzant els espais que introdueix APEX.
     *
     * @param {Document} document Document de la pàgina GEDAC.
     * @returns {boolean}
     */
    isTargetPage(document) {
        const headings = [...document.querySelectorAll('h4')];
        const isTarget = headings.some((heading) => (
            this.#normalizeText(heading.textContent) === GedacPageDetector.TARGET_TITLE
        ));

        this.logger.debug('Comprovació de la pàgina de matrícula CFP', { isTarget });

        return isTarget;
    }

    #normalizeText(text) {
        return text?.replace(/\s+/g, ' ').trim() ?? '';
    }
}
