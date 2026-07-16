export class StudentListCoordinator {
    constructor(logger, reportParser, classifier, reportClient, observerFactory, listener) {
        this.logger = logger;
        this.reportParser = reportParser;
        this.classifier = classifier;
        this.reportClient = reportClient;
        this.observerFactory = observerFactory;
        this.listener = listener;
        this.loadSequence = 0;
        this.observer = null;
    }

    /**
     * Inicia la càrrega i vigila les substitucions que fa APEX en paginar.
     *
     * @param {Document} document Document de la pantalla de matrícula.
     * @returns {Promise<Array<object>>}
     */
    start(document) {
        this.#observe(document);
        return this.refresh(document);
    }

    /**
     * Atura l'observació i invalida qualsevol càrrega pendent.
     */
    stop() {
        this.loadSequence += 1;
        this.observer?.disconnect();
        this.observer = null;
    }

    /**
     * Torna a construir el llistat complet a partir d'un report visible.
     *
     * @param {ParentNode} root Document o contenidor de report actualitzat.
     * @returns {Promise<Array<object>>}
     */
    async refresh(root) {
        const sequence = ++this.loadSequence;
        this.listener.onLoading();

        try {
            const configuration = this.reportClient.findConfiguration(root);
            const pages = configuration
                ? await this.reportClient.fetchAllPages(configuration)
                : [root];
            const students = this.#parseAndClassify(pages);

            if (sequence !== this.loadSequence) {
                return [];
            }

            this.listener.onStudents(students);
            return students;
        } catch (error) {
            if (sequence !== this.loadSequence) {
                return [];
            }

            this.logger.error('No s’ha pogut carregar el llistat complet de matrícula', error);
            this.listener.onError(error);
            return [];
        }
    }

    #parseAndClassify(pages) {
        const uniqueStudents = new Map();

        for (const page of pages) {
            for (const student of this.reportParser.parse(page)) {
                const key = student.applicationCode || [
                    student.studentId,
                    student.cycle,
                    student.course,
                    student.round,
                ].join('|');

                if (!uniqueStudents.has(key)) {
                    uniqueStudents.set(key, {
                        ...student,
                        category: this.classifier.classify(student),
                    });
                }
            }
        }

        return [...uniqueStudents.values()];
    }

    #observe(document) {
        this.observer?.disconnect();
        this.observer = this.observerFactory((mutations) => {
            const report = this.#findAddedReport(mutations);

            if (report) {
                void this.refresh(report);
            }
        });
        this.observer.observe(document.body, { childList: true, subtree: true });
    }

    #findAddedReport(mutations) {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== 1) {
                    continue;
                }

                const report = node.matches('[id^="report_"][id$="_catch"]')
                    ? node
                    : node.querySelector('[id^="report_"][id$="_catch"]');

                if (report?.querySelector('th#CONFIRMAT') && report.querySelector('th#PRES_DOC')) {
                    return report;
                }
            }
        }

        return null;
    }
}
