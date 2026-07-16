import { jest } from '@jest/globals';

import { ApexReportClient } from '../src/ApexReportClient.js';

describe('ApexReportClient', () => {
    let logger;
    let apexServer;
    let client;

    beforeEach(() => {
        logger = { debug: jest.fn() };
        apexServer = { plugin: jest.fn() };
        client = new ApexReportClient(logger, apexServer, new DOMParser());
    });

    test('extreu la configuració dels enllaços reals de paginació APEX', () => {
        document.body.innerHTML = paginationLink(61, 15);

        expect(client.findConfiguration(document)).toEqual({
            reportId: '1568257600892028933',
            ajaxIdentifier: 'TOKEN/segur_123',
            pageSize: 15,
        });
    });

    test('retorna null quan el report només té una pàgina', () => {
        document.body.innerHTML = '<table><tr><td class="pagination"></td></tr></table>';

        expect(client.findConfiguration(document)).toBeNull();
    });

    test('carrega des de la primera pàgina fins que desapareix l’enllaç següent', async () => {
        apexServer.plugin
            .mockResolvedValueOnce(reportPage(1, paginationLink(16, 15)))
            .mockResolvedValueOnce(reportPage(16, paginationLink(1, 15)));

        const pages = await client.fetchAllPages({
            reportId: '1568257600892028933',
            ajaxIdentifier: 'TOKEN/segur_123',
            pageSize: 15,
        });

        expect(pages).toHaveLength(2);
        expect(pages[0].querySelector('[data-page]').dataset.page).toBe('1');
        expect(pages[1].querySelector('[data-page]').dataset.page).toBe('16');
        expect(apexServer.plugin).toHaveBeenNthCalledWith(
            1,
            'TOKEN/segur_123',
            {
                x01: '1568257600892028933',
                p_widget_action: 'paginate',
                p_pg_min_row: 1,
                p_pg_max_rows: 15,
                p_pg_rows_fetched: 15,
            },
            { dataType: 'html' },
        );
        expect(apexServer.plugin.mock.calls[1][1].p_pg_min_row).toBe(16);
    });

    test('ignora un enllaç de paginació que no avança', async () => {
        apexServer.plugin
            .mockResolvedValueOnce(reportPage(1, paginationLink(16, 15)))
            .mockResolvedValueOnce(reportPage(16, paginationLink(16, 15)));

        await expect(client.fetchAllPages({
            reportId: 'report',
            ajaxIdentifier: 'token',
            pageSize: 15,
        })).resolves.toHaveLength(2);
        expect(apexServer.plugin).toHaveBeenCalledTimes(2);
    });
});

function paginationLink(minimumRow, pageSize) {
    return `
        <table><tr><td class="pagination">
            <a href="javascript:apex.widget.report.paginate('1568257600892028933',
                'TOKEN/segur_123', {min:${minimumRow},max:${pageSize},fetched:${pageSize}});">Pàgina</a>
        </td></tr></table>
    `;
}

function reportPage(page, pagination) {
    return `<div data-page="${page}">${pagination}</div>`;
}
