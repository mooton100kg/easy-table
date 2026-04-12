export class TableEditorController {
    activeCell: HTMLElement | null = null;
    selectedCells: Set<HTMLTableCellElement> = new Set();

    // ================== table state management
    setActiveCell(el: HTMLElement) {
        this.activeCell = el;
    }

    addSelectedCell(el: HTMLTableCellElement) {
        this.selectedCells.add(el);
        el.classList.add("selected-cell");
    }

    clearSelectedCells() {
        this.selectedCells.forEach((cell) => {
            cell.classList.remove("selected-cell");
        });
        this.selectedCells.clear();
    }

    getContext() {
        const cell = this.activeCell;
        if (!cell) return null;

        const row = cell.closest("tr");
        if (!row) return null;

        const table = row.closest("table");
        if (!table) return null;

        return {
            cell,
            row,
            table
        }
    }

    // ================== table manipulation
    // prevent enter key from creating new <div>
    handleEnterKey(td: HTMLTableCellElement) {
        td.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                document.execCommand("insertLineBreak");
            }
        });
    }

    // bind click event to each cell
    bindCell(td: HTMLTableCellElement) {
        td.addEventListener("click", (e) => {
            if (e.shiftKey) {
                // select mode
                this.addSelectedCell(td);
            }
            else {
                // reset selection when click without shift
                this.clearSelectedCells();
                this.addSelectedCell(td);
                this.setActiveCell(td);
            }
        });
    }

    //Convert table back to normal table
    buildHtml(table: HTMLTableElement, tableClass: string[]): string {
        table.removeClass("table-editor-table");
        table.className = tableClass.join(" ");

        Array.from(table.rows).forEach((tr) => {
            Array.from(tr.cells).forEach((td) => {
                td.classList.remove("selected-cell");
                td.removeAttribute("contenteditable");
            });
        });

        return table.outerHTML;
    }

    // ================== btn logic
    // add col function
    addCol(type: "insert" | "add") {
        const ctx = this.getContext();
        if (!ctx) return;
        const { cell, row, table } = ctx;

        // find index of current cell
        const colIndex = Array.from(row.children).indexOf(cell);

        // insert new cell in every row
        const rows = Array.from(table.querySelectorAll("tr"));

        rows.forEach((row) => {
            const newTd = document.createElement("td");

            newTd.contentEditable = "true";
            newTd.classList.add("table-editor-cell");
            this.bindCell(newTd);

            const cells = Array.from(row.children);
            // insert col
            if (type === "insert") {
                row.insertAfter(newTd, cells[colIndex] ?? null)
            }
            else if (type === "add") {
                row.appendChild(newTd)
            }
        })
    }

    // add row function
    addRow(type: "insert" | "add") {
        const ctx = this.getContext();
        if (!ctx) return;
        const { row, table } = ctx;

        const newRow = document.createElement("tr");

        const cells = Array.from(row.children);

        // create new cell inside newRow
        cells.forEach(() => {
            const td = document.createElement("td");

            td.contentEditable = "true";
            td.classList.add("table-editor-cell");
            this.bindCell(td);

            newRow.appendChild(td);
        });

        if (type === "add") {
            table.appendChild(newRow);
        }
        else if (type === "insert") {
            row.parentNode?.insertBefore(
                newRow,
                row.nextSibling
            );
        }
    }

    // delete row function
    deleteRow() {
        const ctx = this.getContext();
        if (!ctx) return;
        const { row, table } = ctx;

        const rows = table.querySelectorAll("tr");

        // prevent deleting last row
        if (rows.length === 1) return;

        row.remove();
    }

    // delete col function
    deleteCol() {
        const ctx = this.getContext();
        if (!ctx) return;
        const { cell, row, table } = ctx;

        // find index of current cell
        const cells = Array.from(row.children);
        const colIndex = cells.indexOf(cell);

        const rows = table.querySelectorAll("tr");

        // prevent deleting last column
        if (cells.length === 1) return;

        rows.forEach((row) => {
            const cells = Array.from(row.children);
            cells[colIndex]?.remove();
        });
    }

    // merge cell function
    mergeCell() {
        const cells = Array.from(this.select)
    }
}