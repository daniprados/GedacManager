export class StudentClassifier {
    static CATEGORIES = Object.freeze({
        CONFIRMED_ENROLLED: 'confirmedEnrolled',
        CONFIRMED_NOT_ENROLLED: 'confirmedNotEnrolled',
        NOT_CONFIRMED: 'notConfirmed',
        IMPROVEMENT: 'improvement',
    });

    constructor(logger) {
        this.logger = logger;
    }

    /**
     * Assigna una única categoria de consulta a l'alumne.
     *
     * @param {{confirmationCode: string, documentationCode: string}} student Alumne normalitzat.
     * @returns {string|null}
     */
    classify(student) {
        if (['M', 'MC'].includes(student.confirmationCode)) {
            return StudentClassifier.CATEGORIES.IMPROVEMENT;
        }

        if (['', 'R'].includes(student.confirmationCode)) {
            return StudentClassifier.CATEGORIES.NOT_CONFIRMED;
        }

        if (['C', 'CC'].includes(student.confirmationCode)) {
            if (student.documentationCode === 'S') {
                return StudentClassifier.CATEGORIES.CONFIRMED_ENROLLED;
            }

            if (['', 'N'].includes(student.documentationCode)) {
                return StudentClassifier.CATEGORIES.CONFIRMED_NOT_ENROLLED;
            }
        }

        this.logger.warn('No s’ha pogut classificar un alumne del report de matrícula', {
            applicationCode: student.applicationCode,
            confirmationCode: student.confirmationCode,
            documentationCode: student.documentationCode,
        });

        return null;
    }
}
