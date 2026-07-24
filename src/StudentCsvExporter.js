export class StudentCsvExporter {
    constructor(logger, document, urlApi, BlobClass, clock) {
        this.logger = logger;
        this.document = document;
        this.urlApi = urlApi;
        this.BlobClass = BlobClass;
        this.clock = clock;
    }

    /**
     * Genera i descarrega un CSV amb els alumnes indicats.
     *
     * @param {Array<object>} students Alumnes del llistat actiu.
     * @param {string} category Categoria activa.
     * @returns {boolean}
     */
    download(students, category) {
        if (students.length === 0) {
            this.logger.warn('No hi ha alumnes per exportar a CSV');
            return false;
        }

        const blob = new this.BlobClass(
            ['\uFEFF', this.serialize(students)],
            { type: 'text/csv;charset=utf-8' },
        );
        const objectUrl = this.urlApi.createObjectURL(blob);
        const link = this.document.createElement('a');
        link.href = objectUrl;
        link.download = this.#filename(category);
        link.hidden = true;
        this.document.body.append(link);
        link.click();
        link.remove();
        this.urlApi.revokeObjectURL(objectUrl);
        this.logger.info('Llistat de matrícula exportat a CSV', {
            category,
            studentCount: students.length,
        });

        return true;
    }

    /**
     * Serialitza els alumnes en CSV compatible amb els separadors habituals d'Excel.
     *
     * @param {Array<object>} students Alumnes que s'han d'exportar.
     * @returns {string}
     */
    serialize(students) {
        const rows = [
            [
                'Tanda',
                'Codi sol·licitud',
                'Id. Alumne',
                'Nom Alumne',
                'Cicle',
                'Curs',
                'Plaça confirmada?',
                'Doc. Matr. presentada?',
            ],
            ...students.map((student) => [
                student.round,
                student.applicationCode,
                student.studentId,
                student.studentName,
                student.cycle,
                student.course,
                this.#confirmationLabel(student.confirmationCode),
                this.#documentationLabel(student.documentationCode),
            ]),
        ];

        return `${rows.map((row) => row.map((value) => this.#escape(value)).join(';')).join('\r\n')}\r\n`;
    }

    #escape(value) {
        let text = String(value ?? '');

        if (/^[=+\-@]/.test(text.trimStart())) {
            text = `'${text}`;
        }

        return `"${text.replace(/"/g, '""')}"`;
    }

    #confirmationLabel(code) {
        return {
            C: 'Confirmat per l’alumne/a',
            CC: 'Confirmació plaça (centre)',
            M: 'Intent de millora de l’alumne/a',
            MC: 'Intentar millorar (centre)',
            CPM: 'Confirmat per millora',
            R: 'Renunciat per l’alumne/a',
            '': 'No confirmat',
        }[code] ?? code;
    }

    #documentationLabel(code) {
        return {
            S: 'Sí',
            N: 'No',
            '': 'Pendent',
        }[code] ?? code;
    }

    #filename(category) {
        const categoryNames = {
            all: 'tots',
            confirmedEnrolled: 'confirmats-matriculats',
            confirmedNotEnrolled: 'confirmats-no-matriculats',
            confirmedByImprovement: 'confirmats-per-millora',
            notConfirmed: 'no-confirmats',
            improvement: 'millora',
        };
        const date = this.clock();
        const formattedDate = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0'),
        ].join('-');

        return `gedac-matricula-${categoryNames[category] ?? 'llistat'}-${formattedDate}.csv`;
    }
}
