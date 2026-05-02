import { getScale } from "../utils/dom";

export class TableState {
    table: HTMLTableElement | null = null;
    tableContainer: Element | null = null;
    tableScale: number = 1;

    activeCell: HTMLElement | null = null;
    selectedCells: Set<HTMLTableCellElement> = new Set();
    anchorCell: HTMLTableCellElement | null = null;

    constructor(table: HTMLTableElement, container: Element) {
        this.table = table;
        this.tableContainer = container;
        this.tableScale = getScale(table);
    }

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


}