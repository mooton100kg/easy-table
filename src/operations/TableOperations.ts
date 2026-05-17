import { TableState } from "../core/TableState";
import { TableGrid } from "../core/TableGrid";
import { expandRangeToElement, moveCursorTo, removeAllSpans } from "../utils/dom";

export class TableOperation {
    constructor(
        private state: TableState,
    ) { }

    // Convert between td and th
    private tdOrTh(cell: HTMLTableCellElement): HTMLTableCellElement {

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

        // tranfer activeCell/anchorCell
        if (this.state.activeCell === cell) {
            this.state.setActiveCell(newCell);
        }

        cell.replaceWith(newCell);

        return newCell;
    }

    //toggle scope attr
    private toggleScope(cell: HTMLTableCellElement, r: number, c: number, scope: "row" | "col") {
        // catch topleft cell
        if (r === 0 && c === 0) {
            cell.removeAttribute("scope");

            const top = this.state.table?.classList.contains("top-header");
            const side = this.state.table?.classList.contains("side-header");

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
        this.state.table?.classList.toggle("top-header");
        const grid = TableGrid.getGrid(this.state.table!);

        let newHeaderCells: HTMLTableCellElement[] = [];
        for (let c = 0; c < grid[0]!.length; c++) {
            const cell = grid[0]![c]!;
            this.toggleScope(cell, 0, c, "col");

            // skip topleft cell if side-header is enabled
            if (this.state.table?.classList.contains("side-header") && c === 0) {
                continue;
            }

            this.tdOrTh(cell);
            newHeaderCells.push(cell);
        }

        return newHeaderCells;
    }

    setSideHeader() {
        this.state.table?.classList.toggle("side-header");
        const grid = TableGrid.getGrid(this.state.table!);

        for (let r = 0; r < grid.length; r++) {
            const cell = grid[r]![0]!;
            this.toggleScope(cell, r, 0, "row");

            // skip topleft cell if top-header is enabled
            if (this.state.table?.classList.contains("top-header") && r === 0) continue;

            this.tdOrTh(cell);
        }
    }

    /**
     * Resize table
     * @param step - positive → scale up, negative → scale down, unit = %
     * @param fit - true → fit to screen
     */
    resizeTable(step?: number, size?: number, fit?: boolean) {
        if (!this.state.table) return;

        let newScale = this.state.tableScale;

        if (step) {
            newScale += step / 100;
            if (newScale < 0) newScale = 0;
        }
        else if (size) {
            newScale = size / 100;
        }
        else if (fit) {
            // reset to measure real size
            this.state.table.style.transform = "scale(1)";

            const tableWidth = this.state.table.scrollWidth;
            const containerWidth = this.state.tableContainer!.clientWidth;
            newScale = containerWidth / tableWidth;

        }
        this.state.table.style.transform = `scale(${newScale})`
        this.state.table.style.transformOrigin = "top left";
        this.state.tableScale = newScale;
    }

    getNextCell(): HTMLTableCellElement[] | null {
        let newCells: HTMLTableCellElement[] | null = [];

        const ctx = this.state.getContext();
        if (!ctx) return null;
        const { cell, table } = ctx;


        const grid = TableGrid.getGrid(table);
        const pos = TableGrid.getCellPosition(cell, grid);
        if (!pos) return null;

        let nextCell: HTMLTableCellElement | null;
        // if cell is not in the last column, return next cell in the same row
        if (pos.bottomCol + 1 < grid[pos.bottomRow]!.length) {
            nextCell = grid[pos.bottomRow]![pos.bottomCol + 1]!;
        } else {
            // if cell is in the last column, return first cell of the next row
            if (pos.bottomRow + 1 < grid.length) {
                nextCell = grid[pos.bottomRow + 1]![0]!;
            } else {
                // if cell is in the last row, create new row
                newCells = this.addRow("add");
                nextCell = newCells?.[0] ?? null;
            }
        }
        if (!nextCell) return null;

        this.state.clearSelectedCells();
        this.state.setActiveCell(nextCell);
        this.state.selectedCells.add(nextCell);
        nextCell.classList.add("selected-cell");

        nextCell.focus();
        moveCursorTo(nextCell);

        return newCells;
    }

    // add row function
    addRow(type: "insert" | "add"): HTMLTableCellElement[] | null {
        const ctx = this.state.getContext();
        if (!ctx) return null;
        const { cell, row, table } = ctx;

        // find index of current cell
        const grid = TableGrid.getGrid(table);
        // [a] [d] [e]
        // {b} [d] [e]
        // [c] [d] [f]
        const pos = TableGrid.getCellPosition(cell, grid);
        if (!pos) return null;

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
                const refPos = TableGrid.getCellPosition(referenceCell, grid);

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

            if (tagName === "th") this.toggleScope(el, targetRow + 1, i, "row");

            newRow.appendChild(el);
        }

        if (type === "add") {
            table.appendChild(newRow);
        }

        else if (type === "insert") {
            row.parentNode?.insertAfter(newRow, table.rows[targetRow]!);
        }

        return Array.from(newRow.cells);
    }

    // delete row function
    deleteRow() {
        const ctx = this.state.getContext();
        if (!ctx) return;
        const { cell, table } = ctx;

        // find index of current cell
        const grid = TableGrid.getGrid(table);
        const pos = TableGrid.getCellPosition(cell, grid);
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

    // add col function
    addCol(type: "insert" | "add") {
        let newCol: HTMLTableCellElement[] | null = [];

        const ctx = this.state.getContext();
        if (!ctx) return;
        const { cell, table } = ctx;

        // find index of current cell
        const grid = TableGrid.getGrid(table);
        // [a] [a] {b} [c]
        // [d] [d] [e] [e]
        // [f] [f] [f] [g]
        const pos = TableGrid.getCellPosition(cell as HTMLTableCellElement, grid);
        if (!pos) return;

        // targetCol = 2
        let targetCol = pos.bottomCol;
        // check if cell colSpan is the last cell in the col
        // true -> add new cell to the end of the col
        if (pos.bottomCol >= grid[0]!.length - 1) { type = "add"; }

        for (let r = 0; r < grid.length; r++) {
            // if cell is header create th
            let tagName: "td" | "th" = "td";
            if (r === 0 && table.classList.contains("top-header")) tagName = "th";

            const el = document.createElement(tagName);

            el.contentEditable = "true";

            newCol.push(el);

            if (tagName === "th") this.toggleScope(el, r, targetCol, "col");

            if (type === "insert") {
                // row 1 : [d] [d] {e} [e]
                // row 2 : [f] [f] {f} [g]
                let referenceCell: HTMLTableCellElement | null = grid[r]![targetCol]!;
                // row 1 : [d] [d] [e] {e} -> refPos.bottomCol = 3
                // row 2 : [f] [f] {f} [g] -> refPos.bottomCol = 2
                const refPos = TableGrid.getCellPosition(referenceCell, grid);

                // case 1 : refCell in between colSpan -> expand colspan
                if (refPos && refPos.bottomCol > targetCol) {
                    referenceCell.colSpan += 1;
                }
                // case 2 : refCell outside colSpan -> insert new cell
                else {
                    for (let c = targetCol + 1; c < grid[r]!.length; c++) {
                        if (table.rows[r]?.contains(grid[r]![c]!)) {
                            table.rows[r]!.insertBefore(el, grid[r]![c]!);
                            break;
                        } else if (c === grid[r]!.length - 1) {
                            table.rows[r]!.appendChild(el);
                        }
                    }
                }
            }
            else if (type === "add") {
                table.rows[r]!.appendChild(el);
            }
        }

        return newCol;
    }

    // delete col function
    deleteCol() {
        const ctx = this.state.getContext();
        if (!ctx) return;
        const { cell, table } = ctx;

        // find index of current cell
        const grid = TableGrid.getGrid(table);
        const pos = TableGrid.getCellPosition(cell, grid);
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
        const cells = Array.from(this.state.selectedCells);
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

        this.state.clearSelectedCells();
        this.state.setActiveCell(first);
        first.classList.add("selected-cell");
    }

    unmergeCells(): HTMLTableCellElement[] | null {
        let newCells: HTMLTableCellElement[] = [];

        const ctx = this.state.getContext();
        if (!ctx) return null;
        const { cell, row, table } = ctx;

        const grid = TableGrid.getGrid(table);
        const pos = TableGrid.getCellPosition(cell, grid);
        if (!pos) return null;

        const rowSpan = cell.rowSpan || 1;
        const colSpan = cell.colSpan || 1;

        if (rowSpan === 1 && colSpan === 1) return null;

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
                if (rowPos == 0 && this.state.table?.classList.contains("top-header")) {
                    tagName = "th"
                    scope = "col"
                }
                else if (colPos == 0 && this.state.table?.classList.contains("side-header")) {
                    tagName = "th"
                    scope = "row"
                }

                const el = document.createElement(tagName) as HTMLTableCellElement;
                el.contentEditable = "true";
                newCells.push(el);
                if (tagName === "th") { this.toggleScope(el, rowPos, colPos, scope) }

                // insert new cell to the correct position
                const edgeCell = grid[pos.topRow + r]![pos.topCol + colSpan] || null;
                tr?.insertBefore(el, edgeCell);
            }
        }
        return newCells;
    }

    setAlignment(options: {
        horizontal?: "left" | "center" | "right";
        vertical?: "top" | "middle" | "bottom";
    }) {
        const selectCells = this.state.selectedCells;
        if (!selectCells) return;

        selectCells.forEach((cell) => {
            if (options.horizontal) cell.style.textAlign = options.horizontal;
            if (options.vertical) cell.style.verticalAlign = options.vertical;
        })

    }

    applyTextColor(color: string) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        if (range.collapsed) return; // return if no text selected

        const cell = this.state.activeCell;
        if (!cell || !cell.contains(range.commonAncestorContainer)) return; // check if selection inside table

        // extract content
        expandRangeToElement(range, cell);
        const fragment = range.extractContents();

        // remove all span inside fragment
        const cleanFragment = removeAllSpans(fragment);

        // wrap with new span
        const span = document.createElement("span");
        span.style.color = color;
        span.appendChild(cleanFragment);

        // insert back
        range.insertNode(span);

        // clear selection
        selection.removeAllRanges();
    }
}