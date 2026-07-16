import { ApexReportClient } from './ApexReportClient.js';
import { GedacController } from './GedacController.js';
import { GedacPageDetector } from './GedacPageDetector.js';
import { GedacReportParser } from './GedacReportParser.js';
import { StudentClassifier } from './StudentClassifier.js';
import { StudentCsvExporter } from './StudentCsvExporter.js';
import { StudentListCoordinator } from './StudentListCoordinator.js';
import { StudentListView } from './StudentListView.js';

(() => {
    const logger = console;
    const pageDetector = new GedacPageDetector(logger);
    const reportParser = new GedacReportParser(logger);
    const classifier = new StudentClassifier(logger);
    const reportClient = new ApexReportClient(logger, window.apex?.server, new DOMParser());
    const csvExporter = new StudentCsvExporter(logger, document, URL, Blob, () => new Date());
    const studentListView = new StudentListView(
        logger,
        document,
        StudentClassifier.CATEGORIES,
        csvExporter,
    );
    const observerFactory = (callback) => new MutationObserver(callback);
    const studentListCoordinator = new StudentListCoordinator(
        logger,
        reportParser,
        classifier,
        reportClient,
        observerFactory,
        studentListView,
    );
    const controller = new GedacController(
        logger,
        pageDetector,
        studentListView,
        studentListCoordinator,
    );

    controller.start(document);
})();
