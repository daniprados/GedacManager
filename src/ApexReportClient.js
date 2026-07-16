export class ApexReportClient {
    static MAX_PAGE_COUNT = 1000;

    constructor(logger, apexServer, domParser) {
        this.logger = logger;
        this.apexServer = apexServer;
        this.domParser = domParser;
    }

    /**
     * Obté la configuració de paginació exposada als enllaços del report.
     *
     * @param {ParentNode} root Document o fragment del report.
     * @returns {{reportId: string, ajaxIdentifier: string, pageSize: number}|null}
     */
    findConfiguration(root) {
        const links = [...root.querySelectorAll('td.pagination a[href]')];

        for (const link of links) {
            const parameters = this.#parsePaginationLink(link.getAttribute('href'));

            if (parameters) {
                return {
                    reportId: parameters.reportId,
                    ajaxIdentifier: parameters.ajaxIdentifier,
                    pageSize: parameters.pageSize,
                };
            }
        }

        return null;
    }

    /**
     * Carrega totes les pàgines del report sense modificar la pàgina visible.
     *
     * @param {{reportId: string, ajaxIdentifier: string, pageSize: number}} configuration Configuració APEX.
     * @returns {Promise<Document[]>}
     */
    async fetchAllPages(configuration) {
        const pages = [];
        const visitedMinimumRows = new Set();
        let minimumRow = 1;

        while (minimumRow !== null && pages.length < ApexReportClient.MAX_PAGE_COUNT) {
            if (visitedMinimumRows.has(minimumRow)) {
                throw new Error(`S’ha detectat un bucle a la paginació APEX (fila ${minimumRow})`);
            }

            visitedMinimumRows.add(minimumRow);
            const page = await this.#fetchPage(configuration, minimumRow);
            pages.push(page);
            minimumRow = this.#findNextMinimumRow(page, minimumRow);
        }

        if (pages.length === ApexReportClient.MAX_PAGE_COUNT && minimumRow !== null) {
            throw new Error('S’ha superat el límit de seguretat de la paginació APEX');
        }

        return pages;
    }

    async #fetchPage(configuration, minimumRow) {
        const data = {
            x01: configuration.reportId,
            p_widget_action: 'paginate',
            p_pg_min_row: minimumRow,
            p_pg_max_rows: configuration.pageSize,
            p_pg_rows_fetched: configuration.pageSize,
        };

        this.logger.debug('Càrrega d’una pàgina del report de matrícula', { minimumRow });

        const html = await this.apexServer.plugin(
            configuration.ajaxIdentifier,
            data,
            { dataType: 'html' },
        );

        return this.domParser.parseFromString(html, 'text/html');
    }

    #findNextMinimumRow(root, currentMinimumRow) {
        const links = [...root.querySelectorAll('td.pagination a[href]')];
        const candidates = links
            .map((link) => this.#parsePaginationLink(link.getAttribute('href')))
            .filter((parameters) => parameters?.minimumRow > currentMinimumRow)
            .map((parameters) => parameters.minimumRow);

        return candidates.length > 0 ? Math.min(...candidates) : null;
    }

    #parsePaginationLink(href) {
        const call = href?.match(
            /apex\.widget\.report\.paginate\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*\{([^}]+)\}\s*\)/,
        );

        if (!call) {
            return null;
        }

        const minimumRow = this.#numberParameter(call[3], 'min');
        const pageSize = this.#numberParameter(call[3], 'max');

        if (minimumRow === null || pageSize === null) {
            return null;
        }

        return {
            reportId: call[1],
            ajaxIdentifier: call[2],
            minimumRow,
            pageSize,
        };
    }

    #numberParameter(parameters, name) {
        const match = parameters.match(new RegExp(`(?:^|,)\\s*${name}\\s*:\\s*(\\d+)`));
        return match ? Number.parseInt(match[1], 10) : null;
    }
}
