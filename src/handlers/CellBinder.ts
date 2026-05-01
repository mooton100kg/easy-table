import { TableState } from "../core/TableState";
import { SelectionManager } from "../selection/SelectionManager";
import { findClosestLi, moveCursorTo } from "../utils/dom";

export class CellBinder {
    constructor(
        private state: TableState,
        private selection: SelectionManager
    ) { }

    bind(cell: HTMLTableCellElement) {
        cell.addEventListener("mousedown", (e) => {
            this.handleMouseDown(e, cell);
        });
        cell.addEventListener("keydown", (e) => {
            this.handleKeyDown(e);
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

    private handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            this.handleEnter(e);
        } else if (e.key === "Tab") {
            this.handleTab(e);
        }
    }

    private handleEnter(e: KeyboardEvent) {
        const li = findClosestLi();

        e.preventDefault();

        // if inside <li>, insert new <li>
        if (li) {
            li.innerHTML = li.innerHTML.replace(/<br>/g, "");

            const newLi = document.createElement("li");
            newLi.innerHTML = "<br>";

            li.parentNode?.insertBefore(newLi, li.nextSibling);

            // move cursor to new <li>
            moveCursorTo(newLi);
            return;
        }

        // if not inside <li>, insert <br>
        document.execCommand("insertLineBreak");
    }

    private handleTab(e: KeyboardEvent) {
        const li = findClosestLi();
        if (!li) return;

        e.preventDefault();

        const prevLi = li.previousElementSibling;
        if (!prevLi) return;

        let subList = prevLi.querySelector("ul");
        //create nested <ul> if not exist
        if (!subList) {
            subList = document.createElement("ul");
            prevLi.appendChild(subList);
        }

        //move current <li> into sublist
        subList.appendChild(li);
    }
}