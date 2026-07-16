export class StudentListView {
    static ALL_CATEGORY = 'all';

    constructor(logger, document, categories) {
        this.logger = logger;
        this.document = document;
        this.categories = categories;
        this.students = [];
        this.activeCategory = StudentListView.ALL_CATEGORY;
        this.originalReport = null;
        this.container = null;
        this.status = null;
        this.resultTable = null;
        this.resultBody = null;
        this.buttons = new Map();
    }

    /**
     * Insereix les eines de consulta abans del report original.
     *
     * @returns {boolean}
     */
    mount() {
        this.originalReport = this.#findCurrentReport();

        if (!this.originalReport) {
            this.logger.debug('No hi ha cap report de matrícula on afegir les eines de consulta');
            return false;
        }

        if (this.document.querySelector('#gedac-student-tools')) {
            return true;
        }

        this.#addStyles();
        this.container = this.document.createElement('section');
        this.container.id = 'gedac-student-tools';
        this.container.setAttribute('aria-label', 'Consulta dels estats de matrícula');
        this.container.append(this.#createControls(), this.#createStatus(), this.#createResultTable());
        this.originalReport.parentNode.insertBefore(this.container, this.originalReport);

        return true;
    }

    onLoading() {
        this.originalReport = this.#findCurrentReport() ?? this.originalReport;

        if (this.status) {
            this.status.textContent = 'Carregant tots els alumnes de la cerca…';
            this.status.dataset.state = 'loading';
        }
    }

    onStudents(students) {
        this.students = students;
        this.#updateButtons();
        this.#showCategory(this.activeCategory);
        this.status.textContent = `${students.length} alumnes carregats.`;
        this.status.dataset.state = 'ready';
    }

    onError(error) {
        this.logger.error('Error mostrat a les eines de consulta', error);
        this.status.textContent = 'No s’ha pogut carregar el llistat complet. Pots continuar utilitzant la taula original.';
        this.status.dataset.state = 'error';
        this.#showCategory(StudentListView.ALL_CATEGORY);
    }

    #createControls() {
        const controls = this.document.createElement('div');
        controls.className = 'gedac-student-tools__controls';

        for (const definition of this.#buttonDefinitions()) {
            const button = this.document.createElement('button');
            button.type = 'button';
            button.dataset.category = definition.category;
            button.dataset.label = definition.label;
            button.textContent = definition.label;
            button.setAttribute('aria-pressed', String(definition.category === this.activeCategory));
            button.addEventListener('click', () => this.#showCategory(definition.category));
            this.buttons.set(definition.category, button);
            controls.append(button);
        }

        return controls;
    }

    #createStatus() {
        this.status = this.document.createElement('p');
        this.status.className = 'gedac-student-tools__status';
        this.status.setAttribute('role', 'status');
        this.status.setAttribute('aria-live', 'polite');
        this.status.textContent = 'Preparant el llistat complet…';
        return this.status;
    }

    #createResultTable() {
        const wrapper = this.document.createElement('div');
        wrapper.className = 'gedac-student-tools__results';
        wrapper.hidden = true;
        this.resultTable = wrapper;
        const table = this.document.createElement('table');
        table.className = 'gedac-student-tools__table';
        const head = this.document.createElement('thead');
        const headerRow = this.document.createElement('tr');

        for (const label of ['Tanda', 'Codi sol·licitud', 'Id. Alumne', 'Nom Alumne', 'Cicle', 'Curs']) {
            const header = this.document.createElement('th');
            header.scope = 'col';
            header.textContent = label;
            headerRow.append(header);
        }

        head.append(headerRow);
        this.resultBody = this.document.createElement('tbody');
        table.append(head, this.resultBody);
        wrapper.append(table);
        return wrapper;
    }

    #showCategory(category) {
        this.activeCategory = category;
        this.originalReport = this.#findCurrentReport() ?? this.originalReport;
        const showOriginal = category === StudentListView.ALL_CATEGORY;

        if (this.originalReport) {
            this.originalReport.hidden = !showOriginal;
        }

        this.resultTable.hidden = showOriginal;

        for (const [buttonCategory, button] of this.buttons) {
            button.setAttribute('aria-pressed', String(buttonCategory === category));
        }

        if (!showOriginal) {
            this.#renderRows(this.students.filter((student) => student.category === category));
        }
    }

    #renderRows(students) {
        this.resultBody.replaceChildren();

        if (students.length === 0) {
            const row = this.document.createElement('tr');
            const cell = this.document.createElement('td');
            cell.colSpan = 6;
            cell.textContent = 'No hi ha alumnes en aquesta categoria.';
            row.append(cell);
            this.resultBody.append(row);
            return;
        }

        for (const student of students) {
            const row = this.document.createElement('tr');

            for (const value of [
                student.round,
                student.applicationCode,
                student.studentId,
                student.studentName,
                student.cycle,
                student.course,
            ]) {
                const cell = this.document.createElement('td');
                cell.textContent = value;
                row.append(cell);
            }

            this.resultBody.append(row);
        }
    }

    #updateButtons() {
        for (const definition of this.#buttonDefinitions()) {
            const count = definition.category === StudentListView.ALL_CATEGORY
                ? this.students.length
                : this.students.filter((student) => student.category === definition.category).length;
            const button = this.buttons.get(definition.category);
            button.textContent = `${definition.label} (${count})`;
        }
    }

    #buttonDefinitions() {
        return [
            { category: StudentListView.ALL_CATEGORY, label: 'Tots' },
            { category: this.categories.CONFIRMED_ENROLLED, label: 'Confirmats i matriculats' },
            { category: this.categories.CONFIRMED_NOT_ENROLLED, label: 'Confirmats i no matriculats' },
            { category: this.categories.NOT_CONFIRMED, label: 'No confirmats' },
            { category: this.categories.IMPROVEMENT, label: 'Millora' },
        ];
    }

    #findCurrentReport() {
        const header = this.document.querySelector('th#CONFIRMAT');
        const table = header?.closest('table');

        if (!table?.querySelector('th#PRES_DOC')) {
            return null;
        }

        return table.closest('[id^="report_"][id$="_catch"]');
    }

    #addStyles() {
        if (this.document.querySelector('#gedac-student-tools-styles')) {
            return;
        }

        const style = this.document.createElement('style');
        style.id = 'gedac-student-tools-styles';
        style.textContent = `
            #gedac-student-tools { margin: 12px 0; padding: 12px; border: 1px solid #babecc; background: #f7f7f7; }
            .gedac-student-tools__controls { display: flex; flex-wrap: wrap; gap: 8px; }
            .gedac-student-tools__controls button { padding: 7px 10px; border: 1px solid #666; background: #fff; cursor: pointer; }
            .gedac-student-tools__controls button[aria-pressed="true"] { color: #fff; background: #343434; }
            .gedac-student-tools__status { margin: 10px 0; }
            .gedac-student-tools__results { overflow-x: auto; }
            .gedac-student-tools__table { width: 100%; border-collapse: collapse; background: #fff; }
            .gedac-student-tools__table th, .gedac-student-tools__table td { padding: 6px; border: 1px solid #ccc; text-align: left; }
            .gedac-student-tools__table th { background: #666; color: #fff; }
            .gedac-student-tools__table tbody tr:nth-child(even) { background: #f3f3f3; }
        `;
        this.document.head.append(style);
    }
}
