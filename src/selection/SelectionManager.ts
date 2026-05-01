import { Notice } from "obsidian";

import { TableState } from "../core/TableState";
import { TableGrid } from "../core/TableGrid";

export class SelectionManager {
    constructor(private state: TableState) { }


    // select rectangle of cells between two cells
    selectRectangle(start: HTMLTableCellElement, end: HTMLTableCellElement) {
        this.state.clearSelectedCells();

        const grid = TableGrid.getGrid(this.state.table!);
        const startPos = TableGrid.getCellPosition(start, grid);
        const endPos = TableGrid.getCellPosition(end, grid);
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

                this.state.selectedCells.add(cell);
            }
        }

        // check if all rect overlaps with merge cell
        mergeCells.forEach((cell) => {
            const pos = TableGrid.getCellPosition(cell, grid);
            if (!pos) return;

            if (pos.topRow < top ||
                pos.topCol < left ||
                pos.bottomRow > bottom ||
                pos.bottomCol > right
            ) {
                new Notice("Merge cell outside of selection");
                this.state.clearSelectedCells();
                this.state.setActiveCell(start);
                start.classList.add("selected-cell");
                return;
            }
        });
        this.state.selectedCells.forEach((cell) => { cell.classList.add("selected-cell") })
    }
}