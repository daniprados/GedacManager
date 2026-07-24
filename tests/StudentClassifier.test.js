import { jest } from '@jest/globals';

import { StudentClassifier } from '../src/StudentClassifier.js';

describe('StudentClassifier', () => {
    let logger;
    let classifier;

    beforeEach(() => {
        logger = { warn: jest.fn() };
        classifier = new StudentClassifier(logger);
    });

    test.each(['C', 'CC'])('classifica %s amb documentació S com a matriculat', (confirmationCode) => {
        expect(classifier.classify(student(confirmationCode, 'S'))).toBe(
            StudentClassifier.CATEGORIES.CONFIRMED_ENROLLED,
        );
    });

    test.each([
        ['C', 'N'],
        ['C', ''],
        ['CC', 'N'],
        ['CC', ''],
    ])('classifica %s amb documentació %s com a confirmat no matriculat', (confirmationCode, documentationCode) => {
        expect(classifier.classify(student(confirmationCode, documentationCode))).toBe(
            StudentClassifier.CATEGORIES.CONFIRMED_NOT_ENROLLED,
        );
    });

    test.each(['S', 'N', ''])('classifica CPM amb documentació %s com a confirmat per millora', (documentationCode) => {
        expect(classifier.classify(student('CPM', documentationCode))).toBe(
            StudentClassifier.CATEGORIES.CONFIRMED_BY_IMPROVEMENT,
        );
    });

    test.each(['', 'R'])('classifica l’estat %s com a no confirmat', (confirmationCode) => {
        expect(classifier.classify(student(confirmationCode, ''))).toBe(
            StudentClassifier.CATEGORIES.NOT_CONFIRMED,
        );
    });

    test.each(['M', 'MC'])('classifica %s com a millora independentment de la documentació', (confirmationCode) => {
        expect(classifier.classify(student(confirmationCode, 'S'))).toBe(
            StudentClassifier.CATEGORIES.IMPROVEMENT,
        );
    });

    test('no tracta com a no matriculat un codi de documentació desconegut', () => {
        expect(classifier.classify(student('C', 'X'))).toBeNull();
    });
});

function student(confirmationCode, documentationCode) {
    return {
        applicationCode: 'PRE26-1',
        confirmationCode,
        documentationCode,
    };
}
