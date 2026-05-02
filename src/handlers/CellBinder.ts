import { TableState } from "../core/TableState";
import { SelectionManager } from "../selection/SelectionManager";
import { TableKeyboard } from "keyboard/TableKeyboard";

export class CellBinder {
    constructor(
        private state: TableState,
        private selection: SelectionManager,
        private keyboard: TableKeyboard,
    ) { }

    bind(cell: HTMLTableCellElement | HTMLTableCellElement[]) {

        const cells = Array.isArray(cell) ? cell : [cell];

        cells.forEach((c) => {
            c.addEventListener("mousedown", (e) => {
                this.handleMouseDown(e, c);
            });
            c.addEventListener("keydown", (e) => {
                this.keyboard.handle(e);
            });
        });
    }

    private handleMouseDown(e: MouseEvent, cell: HTMLTableCellElement) {
        if (e.shiftKey && this.state.anchorCell) {
            // select the rectangle between anchorCell and current cell
            this.selection.selectRectangle(this.state.anchorCell, cell);
        }
        else {
            // reset selection when click without shift
            this.state.clearSelectedCells();
            this.state.setActiveCell(cell);
            cell.classList.add("selected-cell");
            this.state.selectedCells.add(cell);
        }
    }

}