export class TableEditorController {
    table: HTMLTableElement | null = null;
    activeCell: HTMLElement | null = null;
    selectedCells: Set<HTMLTableCellElement> = new Set();
    anchorCell: HTMLTableCellElement | null = null;

    constructor(table: HTMLTableElement) {
        this.table = table;
    }

    // ================== table state management
    setActiveCell(el: HTMLTableCellElement) {
        this.activeCell = el;
        this.anchorCell = el;
    }

    // select rectangle of cells between two cells
    selectRectangle(start: HTMLTableCellElement, end: HTMLTableCellElement) {
        this.clearSelectedCells();

        const startRow = start.closest("tr");
        const endRow = end.closest("tr");
        const table = this.table;
        if (!startRow || !endRow || !table) return;

        const rows = Array.from(table.rows);

        const rowStartIndex = rows.indexOf(startRow);
        const rowEndIndex = rows.indexOf(endRow);

        const topRow = Math.min(rowStartIndex, rowEndIndex);
        const bottomRow = Math.max(rowStartIndex, rowEndIndex);

        const colStartIndex = Array.from(startRow.children).indexOf(start);
        const colEndIndex = Array.from(endRow.children).indexOf(end);

        const leftCol = Math.min(colStartIndex, colEndIndex);
        const rightCol = Math.max(colStartIndex, colEndIndex);

        for (let r = topRow; r <= bottomRow; r++) {
            const row = rows[r];
            if (!row) continue;
            const cells = Array.from(row.children);

            for (let c = leftCol; c <= rightCol; c++) {
                const cell = cells[c] as HTMLTableCellElement;
                cell.classList.add("selected-cell");
                this.selectedCells.add(cell);
            }
        }
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

        const table = this.table
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
            if (e.shiftKey && this.anchorCell) {
                // select the rectangle between anchorCell and current cell
                this.selectRectangle(this.anchorCell, td);
            }
            else {
                // reset selection when click without shift
                this.clearSelectedCells();
                this.setActiveCell(td);
                td.classList.add("selected-cell");
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
    mergeCells() {
        const cells = Array.from(this.selectedCells);
        if (cells.length < 2) return;

        const baseCell = cells[0];
    }
}