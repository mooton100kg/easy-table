import { TableState } from "core/TableState";
import { SelectionManager } from "selection/SelectionManager";
import { CellBinder } from "handlers/CellBinder";
import { TableOperation } from "operations/TableOperations";
import { TableSerializer } from "serializer/TableSerializer";

export class TableEditorController {
    state: TableState;
    selection: SelectionManager;
    binder: CellBinder;
    ops: TableOperation;

    constructor(table: HTMLTableElement, tableContainer: Element) {
        this.state = new TableState(table, tableContainer);
        this.selection = new SelectionManager(this.state);
        this.binder = new CellBinder(this.state, this.selection);
        this.ops = new TableOperation(this.state, this.binder);

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

    hasActiveCell(): boolean {
        return !!this.state.activeCell;
    }

    buildHtml(wrapper: Element, table: HTMLTableElement): string {
        return TableSerializer.buildHtml(wrapper, table);
    }

    // ops
    addRow(type: "insert" | "add") {
        if (!this.hasActiveCell()) return;
        this.ops.addRow(type);
    }

    addCol(type: "insert" | "add") {
        if (!this.hasActiveCell()) return;
        this.ops.addCol(type);
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
        this.ops.unmergeCells();
    }

    setAlignment(option: {
        horizontal?: "left" | "center" | "right";
        vertical?: "top" | "middle" | "bottom";
    }) {
        this.ops.setAlignment(option);
    }

    setTopHeader() {
        this.ops.setTopHeader();
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


