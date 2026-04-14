import { Notice } from "obsidian";

export class TableEditorController {
    table: HTMLTableElement | null = null;
    tableScale: number = 1;
    tableContainer: Element | null = null;
    activeCell: HTMLElement | null = null;
    selectedCells: Set<HTMLTableCellElement> = new Set();
    anchorCell: HTMLTableCellElement | null = null;

    constructor(table: HTMLTableElement, tableContainer: Element) {
        this.table = table;
        this.tableContainer = tableContainer;
        this.tableScale = getScale(table);
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

        let mergeCells: Set<HTMLTableCellElement> = new Set()
        for (let r = top; r <= bottom; r++) {
            for (let c = left; c <= right; c++) {
                const cell = grid[r]![c]!;

                // detect overlaps with merge cell
                if ((cell.colSpan > 1 || cell.rowSpan > 1)) {
                    mergeCells.add(cell);
                }

                this.selectedCells.add(cell);
            }
        }

        // check if all rect overlaps with merge cell
        mergeCells.forEach((cell) => {
            const pos = this.getCellPosition(cell, grid);
            if (!pos) return;

            if (pos.topRow < top ||
                pos.topCol < left ||
                pos.bottomRow > bottom ||
                pos.bottomCol > right
            ) {
                new Notice("Merge cell outside of selection");
                this.clearSelectedCells();
                this.setActiveCell(start);
                start.classList.add("selected-cell");
                return;
            }
        });
        this.selectedCells.forEach((cell) => { cell.classList.add("selected-cell") })
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
    bindCell(cell: HTMLTableCellElement) {
        cell.addEventListener("mousedown", (e) => {
            if (e.shiftKey && this.anchorCell) {
                // select the rectangle between anchorCell and current cell
                this.selectRectangle(this.anchorCell, cell);
            }
            else {
                // reset selection when click without shift
                this.clearSelectedCells();
                this.setActiveCell(cell);
                cell.classList.add("selected-cell");
            }
        });
    }

    //Convert table back to normal table
    buildHtml(wrapper: Element, newTable: HTMLTableElement): string {

        newTable.removeClass("table-editor-table");

        Array.from(newTable.rows).forEach((tr) => {
            Array.from(tr.cells).forEach((td) => {
                td.classList.remove("selected-cell");
                td.removeAttribute("contenteditable");
            });
        });

        const originalTable = wrapper.querySelector("table");
        originalTable?.replaceWith(newTable);

        return wrapper.outerHTML;
    }

    // Convert between td and th
    tdOrTh(cell: HTMLTableCellElement): HTMLTableCellElement {

        let tag: string;
        if (cell.tagName === "TD") { tag = "th"; }
        else { tag = "td"; }

        const newCell = document.createElement(tag) as HTMLTableCellElement;

        // copy content
        newCell.innerHTML = cell.innerHTML;

        // copy attributes
        Array.from(cell.attributes).forEach((attr) => {
            newCell.setAttribute(attr.name, attr.value);
        });

        // bind cell
        this.bindCell(newCell);

        // tranfer activeCell/anchorCell
        if (this.activeCell === cell) {
            this.setActiveCell(newCell);
        }

        cell.replaceWith(newCell);

        return newCell;
    }

    //toggle scope attr
    toggleScope(cell: HTMLTableCellElement, r: number, c: number, scope: "row" | "col") {
        // catch topleft cell
        if (r === 0 && c === 0) {
            cell.removeAttribute("scope");

            const top = this.table?.classList.contains("top-header");
            const side = this.table?.classList.contains("side-header");

            if (top && side) cell.setAttribute("scope", "corner");
            else if (top) cell.setAttribute("scope", "col");
            else if (side) cell.setAttribute("scope", "row");
            return;
        }

        if (cell.getAttribute("scope") === scope) cell.removeAttribute("scope");
        else cell.setAttribute("scope", scope);
    }

    // set table header
    setTopHeader() {
        this.table?.classList.toggle("top-header");
        const grid = this.getGrid(this.table!);

        for (let c = 0; c < grid[0]!.length; c++) {
            const cell = grid[0]![c]!;
            this.toggleScope(cell, 0, c, "col");

            // skip topleft cell if side-header is enabled
            if (this.table?.classList.contains("side-header") && c === 0) {
                continue;
            }

            this.tdOrTh(cell);
        }
    }
    setSideHeader() {
        this.table?.classList.toggle("side-header");
        const grid = this.getGrid(this.table!);

        for (let r = 0; r < grid.length; r++) {
            const cell = grid[r]![0]!;
            this.toggleScope(cell, r, 0, "row");

            // skip topleft cell if top-header is enabled
            if (this.table?.classList.contains("top-header") && r === 0) continue;

            this.tdOrTh(cell);
        }
    }

    /**
     * Resize table
     * @param step - positive → scale up, negative → scale down, unit = %
     * @param fit - true → fit to screen
     */
    resizeTable(step?: number, size?: number, fit?: boolean) {
        if (!this.table) return;

        let newScale = this.tableScale;

        if (step) {
            newScale += step / 100;
            if (newScale < 0) newScale = 0
        }
        else if (size) {
            newScale = size
        }
        else if (fit) {
            // reset to measure real size
            this.table.style.transform = "scale(1)";

            const tableWidth = this.table.scrollWidth;
            const containerWidth = this.tableContainer!.clientWidth;

            newScale = containerWidth / tableWidth;

        }
        this.table.style.transform = `scale(${newScale})`
        this.table.style.transformOrigin = "top left";
        this.tableScale = newScale;

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
            // if cell is header create th
            let tagName: "td" | "th" = "td";
            if (r === 0 && table.classList.contains("top-header")) tagName = "th";

            const el = document.createElement(tagName);

            el.contentEditable = "true";
            this.bindCell(el);

            if (tagName === "th") this.toggleScope(el, r, targetCol, "col");

            if (type === "insert") {
                // row 1 : [d] [d] {e} [e]
                // row 2 : [f] [f] {f} [g]
                const referenceCell = grid[r]![targetCol]!;
                // row 1 : [d] [d] [e] {e} -> refPos.bottomCol = 3
                // row 2 : [f] [f] {f} [g] -> refPos.bottomCol = 2
                const refPos = this.getCellPosition(referenceCell, grid);

                // case 1 : refCell in between colSpan -> expand colspan
                if (refPos && refPos.bottomCol > targetCol) {
                    referenceCell.colSpan += 1;
                }
                // case 2 : refCell outside colSpan -> insert new cell
                else {
                    table.rows[r]!.insertAfter(el, referenceCell);
                }
            }
            else if (type === "add") {
                table.rows[r]!.appendChild(el);
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
        const pos = this.getCellPosition(cell, grid);
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

                // if refCell in between rowSpan -> expand rowspan
                if (refPos && refPos.bottomRow > targetRow) {
                    referenceCell.rowSpan += 1;
                    colCount -= 1;
                }
            }
        }

        const newRow = document.createElement("tr");

        // create new cell 
        for (let i = 0; i < colCount; i++) {
            // if cell is header create th
            let tagName: "td" | "th" = "td";
            if (i === 0 && table.classList.contains("side-header")) tagName = "th";

            const el = document.createElement(tagName);

            el.contentEditable = "true";
            this.bindCell(el);

            if (tagName === "th") this.toggleScope(el, targetRow + 1, i, "row");

            newRow.appendChild(el);
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
        const { cell, row, table } = ctx;

        // find index of current cell
        const grid = this.getGrid(table);
        const pos = this.getCellPosition(cell, grid);
        if (!pos) return;

        for (let c = 0; c < grid[pos.topRow]!.length; c++) {
            const referenceCell = grid[pos.topRow]![c];
            if (!referenceCell) return;

            // catch merge cell
            if (referenceCell.rowSpan > 1) {
                referenceCell.rowSpan -= 1;
            }
        }

        // prevent deleting last row
        if (grid.length === 1) return;

        table.rows[pos.topRow]?.remove();
    }

    // delete col function
    deleteCol() {
        const ctx = this.getContext();
        if (!ctx) return;
        const { cell, row, table } = ctx;

        // find index of current cell
        const grid = this.getGrid(table);
        const pos = this.getCellPosition(cell, grid);
        if (!pos) return;

        for (let r = 0; r < grid.length; r++) {
            const referenceCell = grid[r]![pos.topCol];
            if (!referenceCell) return;

            // catch merge cell
            if (referenceCell.colSpan > 1) {
                referenceCell.colSpan -= 1;
            }

            else {
                // prevent deleting last column
                if (grid[r]?.length === 1) return;

                referenceCell.remove();
            }
        }
    }

    // merge cell function
    mergeCells() {
        const cells = Array.from(this.selectedCells);
        if (cells.length < 2) return;

        const first = cells[0];
        if (!first) return;

        // combine content
        let mergedContent = "";

        for (let i = 0; i < cells.length; i++) {
            const content = cells[i]!.innerHTML.trim();
            mergedContent += content;

            // add <br> if content is not empty and it's not the last cell
            if (content && i < cells.length - 1) {
                mergedContent += "<br>"
            };
        }

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

    unmergeCells() {
        const ctx = this.getContext();
        if (!ctx) return;
        const { cell, row, table } = ctx;

        const grid = this.getGrid(table);
        const pos = this.getCellPosition(cell, grid);
        if (!pos) return;

        const rowSpan = cell.rowSpan || 1;
        const colSpan = cell.colSpan || 1;

        if (rowSpan === 1 && colSpan === 1) return;

        cell.rowSpan = 1;
        cell.colSpan = 1;

        // create new cell in blank space
        for (let r = 0; r < rowSpan; r++) {
            for (let c = 0; c < colSpan; c++) {

                // skip original cell
                if (r === 0 && c === 0) continue;

                // get tr from existing table
                const tr = table.rows[pos.topRow + r];


                // get cell position
                const rowPos = pos.topRow + r;
                const colPos = pos.topCol + c;

                // catch if cell position is in header area
                let tagName = "td";
                let scope: "col" | "row" = "col";
                if (rowPos == 0 && this.table?.classList.contains("top-header")) {
                    tagName = "th"
                    scope = "col"
                }
                else if (colPos == 0 && this.table?.classList.contains("side-header")) {
                    tagName = "th"
                    scope = "row"
                }

                const el = document.createElement(tagName) as HTMLTableCellElement;
                el.contentEditable = "true";
                this.bindCell(el);
                if (tagName === "th") { this.toggleScope(el, rowPos, colPos, scope) }

                // insert new cell to the correct position
                const edgeCell = grid[pos.topRow + r]![pos.topCol + colSpan] || null;
                tr?.insertBefore(el, edgeCell);
            }
        }
    }
}
function getScale(el: HTMLElement): number {
    const transform = getComputedStyle(el).transform;

    if (!transform || transform === "none") {
        return 1;
    }

    const matrix = new DOMMatrix(transform);

    return matrix.a;
}