import { TableState } from "core/TableState";
import { SelectionManager } from "selection/SelectionManager";
import { CellBinder } from "handlers/CellBinder";
import { TableOperation } from "operations/TableOperations";
import { TableSerializer } from "serializer/TableSerializer";
import { TableKeyboard } from "keyboard/TableKeyboard";

export class TableEditorController {
    state: TableState;
    selection: SelectionManager;
    binder: CellBinder;
    ops: TableOperation;
    keyboard: TableKeyboard;

    constructor(table: HTMLTableElement, tableContainer: Element) {
        this.state = new TableState(table, tableContainer);
        this.selection = new SelectionManager(this.state);
        this.ops = new TableOperation(this.state);
        this.keyboard = new TableKeyboard({
            getNextCell: () => this.getNextCell(),
        });
        this.binder = new CellBinder(this.state, this.selection, this.keyboard);

        this.init();
    }

    // initialize table
    private init() {
        if (!this.state.table) return;

        Array.from(this.state.table.rows).forEach((tr) => {
            Array.from(tr.cells).forEach((td) => {
                td.contentEditable = "true";
                this.binder.bind(td);
            })
        })
    }

    private getNextCell() {
        const newCells = this.ops.getNextCell();
        if (!newCells) return;
        this.binder.bind(newCells);
    }

    hasActiveCell(): boolean {
        return !!this.state.activeCell;
    }

    buildHtml(wrapper: Element, table: HTMLTableElement): string {
        return TableSerializer.buildHtml(wrapper, table);
    }

    // ops
    addRow(type: "insert" | "add") {
        if (!this.hasActiveCell()) return;
        const newCells = this.ops.addRow(type);
        if (!newCells) return;
        this.binder.bind(newCells);
    }

    addCol(type: "insert" | "add") {
        if (!this.hasActiveCell()) return;
        const newCells = this.ops.addCol(type);
        if (!newCells) return;
        this.binder.bind(newCells);
    }

    deleteRow() {
        if (!this.hasActiveCell()) return;
        this.ops.deleteRow();
    }

    deleteCol() {
        if (!this.hasActiveCell()) return;
        this.ops.deleteCol();
    }

    mergeCells() {
        this.ops.mergeCells();
    }

    unmergeCells() {
        const newCells = this.ops.unmergeCells();
        if (!newCells) return;
        this.binder.bind(newCells);
    }

    setAlignment(option: {
        horizontal?: "left" | "center" | "right";
        vertical?: "top" | "middle" | "bottom";
    }) {
        this.ops.setAlignment(option);
    }

    setTopHeader() {
        const newHeaderCells = this.ops.setTopHeader();

        this.binder.bind(newHeaderCells);
    }

    setSideHeader() {
        this.ops.setSideHeader();
    }

    applyTextColor(color: string) {
        this.ops.applyTextColor(color);
    }

    // state
    toggleTableClass(cls: string) {
        this.state.table?.classList.toggle(cls);
    }
    getTableClasses(): string[] {
        return this.state.table?.className.split(" ") ?? [];
    }
}


