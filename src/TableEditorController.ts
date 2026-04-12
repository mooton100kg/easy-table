import { Notice } from "obsidian";

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
        this.activeCell?.classList.remove("selected-cell");
        this.activeCell = el;
        this.anchorCell = el;
    }

    clearSelectedCells() {
        this.selectedCells.forEach((cell) => {
            cell.classList.remove("selected-cell");
        });
        this.selectedCells.clear();
    }

    getContext() {
        const cell = this.activeCell as HTMLTableCellElement;
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

    // convert html table to 2d grid of cells -> grid[row][col]
    getGrid(table: HTMLTableElement): HTMLTableCellElement[][] {
        const grid: HTMLTableCellElement[][] = [];
        const rows = Array.from(table.rows);

        rows.forEach((row, r) => {
            // check if row exists in grid, if not create it
            const currentRow = grid[r] ?? (grid[r] = []);

            let col = 0;

            Array.from(row.cells).forEach((cell) => {
                // skip occupied cells by rowspan and colspan
                while (currentRow[col]) col++;

                const rowSpan = cell.rowSpan || 1;
                const colSpan = cell.colSpan || 1;

                // fill grid
                for (let i = 0; i < rowSpan; i++) {
                    const targetRow = grid[r + i] ?? (grid[r + i] = []);
                    for (let j = 0; j < colSpan; j++) {
                        targetRow[col + j] = cell;
                    }
                }

                col += colSpan;
            });
        });

        return grid;
    }

    getCellPosition(
        target: HTMLTableCellElement,
        grid: HTMLTableCellElement[][]
    ): { topRow: number; topCol: number; bottomRow: number; bottomCol: number } | null {
        for (let r = 0; r < grid.length; r++) {
            const currentRow = grid[r];
            if (!currentRow) continue;
            for (let c = 0; c < currentRow.length; c++) {
                if (currentRow[c] === target) {
                    return {
                        topRow: r,
                        topCol: c,
                        bottomRow: r + (target.rowSpan || 1) - 1,
                        bottomCol: c + (target.colSpan || 1) - 1
                    };
                }
            }
        }
        return null;
    }

    // select rectangle of cells between two cells
    selectRectangle(start: HTMLTableCellElement, end: HTMLTableCellElement) {
        this.clearSelectedCells();

        const grid = this.getGrid(this.table!);
        const startPos = this.getCellPosition(start, grid);
        const endPos = this.getCellPosition(end, grid);
        if (!startPos || !endPos) return;

        const top = Math.min(startPos.topRow, endPos.topRow);
        const bottom = Math.max(startPos.bottomRow, endPos.bottomRow);
        const left = Math.min(startPos.topCol, endPos.topCol);
        const right = Math.max(startPos.bottomCol, endPos.bottomCol);

        for (let r = top; r <= bottom; r++) {
            for (let c = left; c <= right; c++) {
                const cell = grid[r]![c]!;
                if (cell.colSpan > 1 || cell.rowSpan > 1) {
                    new Notice("Selection overlaps merge cell");
                    return;
                }

                cell.classList.add("selected-cell");
                this.selectedCells.add(cell);
            }
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
        td.addEventListener("mousedown", (e) => {
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
        const grid = this.getGrid(table);
        // [a] [a] {b} [c]
        // [d] [d] [e] [e]
        // [f] [f] [f] [g]
        const pos = this.getCellPosition(cell as HTMLTableCellElement, grid);
        if (!pos) return;

        // targetCol = 2
        let targetCol = pos.topCol;
        // check if cell colSpan is the last cell in the col
        // true -> add new cell to the end of the col
        if (pos.bottomCol >= grid[0]!.length - 1) { type = "add"; }
        // if current cell has colspan -> add new col to the end of the colspan
        else if (cell.colSpan > 1) { targetCol = pos.bottomCol; }

        for (let r = 0; r < grid.length; r++) {
            const newTd = document.createElement("td");

            newTd.contentEditable = "true";
            newTd.classList.add("table-editor-cell");
            this.bindCell(newTd);

            if (type === "insert") {
                // row 1 : [d] [d] {e} [e]
                // row 2 : [f] [f] {f} [g]
                const referenceCell = grid[r]![targetCol]!;
                // row 1 : [d] [d] [e] {e} -> refPos.bottomCol = 3
                // row 2 : [f] [f] {f} [g] -> refPos.bottomCol = 2
                const refPos = this.getCellPosition(referenceCell, grid);

                // case 1 : refCell inside colSpan -> expand colspan
                if (refPos && refPos.bottomCol > targetCol) {
                    referenceCell.colSpan += 1;
                }
                // case 2 : refCell outside colSpan -> insert new cell
                else {
                    table.rows[r]!.insertAfter(newTd, referenceCell);
                }
            }
            else if (type === "add") {
                table.rows[r]!.appendChild(newTd);
            }
        }
    }

    // add row function
    addRow(type: "insert" | "add") {
        const ctx = this.getContext();
        if (!ctx) return;
        const { cell, row, table } = ctx;

        // find index of current cell
        const grid = this.getGrid(table);
        // [a] [d] [e]
        // {b} [d] [e]
        // [c] [d] [f]
        const pos = this.getCellPosition(cell as HTMLTableCellElement, grid);
        if (!pos) return;

        let targetRow = pos.topRow;
        // check if cell rowSpan is the last cell in the row
        // true -> add new cell to the end of the row
        if (pos.bottomRow == grid.length - 1) { type = "add"; }
        // if current cell has rowspan -> add new row to the end of the rowspan
        else if (cell.rowSpan > 1) { targetRow = pos.bottomRow; }

        let colCount = grid[0]!.length;

        if (type === "insert") {
            // check if there any col that have rowspan
            for (let c = 0; c < grid[0]!.length; c++) {
                // [a] [d] [e]
                // {b} {d} {e}
                // [c] [d] [f]
                const referenceCell = grid[targetRow]![c]!;
                const refPos = this.getCellPosition(referenceCell, grid);

                // if refCell inside rowSpan -> expand rowspan
                if (refPos && refPos.bottomRow > targetRow) {
                    referenceCell.rowSpan += 1;
                    colCount -= 1;
                }
            }
        }

        const newRow = document.createElement("tr");

        // create new cell = col count of next row
        for (let i = 0; i < colCount; i++) {
            const td = document.createElement("td");

            td.contentEditable = "true";
            td.classList.add("table-editor-cell");
            this.bindCell(td);

            newRow.appendChild(td);
        }

        if (type === "add") {
            table.appendChild(newRow);
        }

        else if (type === "insert") {
            row.parentNode?.insertAfter(newRow, table.rows[targetRow]!);
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

        const first = cells[0];
        if (!first) return;

        // combine content
        let mergedContent = "";
        cells.forEach((cell) => {
            mergedContent += cell.innerHTML + "<br>";
        });
        first.innerHTML = mergedContent;

        // merge the rectangle
        const rows = cells.map((cell) => cell.closest("tr")!);

        const rowIndices = rows.map((row) =>
            Array.from(row.parentElement!.children).indexOf(row)
        );

        const colIndices = cells.map((cell) =>
            Array.from(cell.parentElement!.children).indexOf(cell)
        );

        const minRow = Math.min(...rowIndices);
        const maxRow = Math.max(...rowIndices);
        const minCol = Math.min(...colIndices);
        const maxCol = Math.max(...colIndices);

        first.rowSpan = maxRow - minRow + 1;
        first.colSpan = maxCol - minCol + 1;

        // remove the merged cells except the first one
        cells.forEach((cell) => {
            if (cell !== first) {
                cell.remove();
            }
        });

        this.clearSelectedCells();
        this.setActiveCell(first);
        first.classList.add("selected-cell");
    }
}