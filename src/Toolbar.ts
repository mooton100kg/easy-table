import { setIcon } from "obsidian";
import { Icons } from "./icon";

export class TableToolbar {
    container: HTMLElement;
    activeCell: () => HTMLElement | null;
    setActiveCell: (el: HTMLElement) => void;

    constructor(
        container: HTMLElement,
        ActveCell: () => HTMLElement | null,
        setActiveCell: (el: HTMLElement) => void
    ) {
        this.container = container;
        this.activeCell = ActveCell;
        this.setActiveCell = setActiveCell;

        this.build();
    }

    build() {
        this.container.addClass("table-editor-toolbar");

        // ============== Groups
        const groupFormat = this.container.createDiv("toolbar-group");
        const groupList = this.container.createDiv("toolbar-group");
        const groupCell = this.container.createDiv("toolbar-group");

        // ============== Button
        // format
        this.createButton(groupFormat, "bold", "Bold", () => {
            document.execCommand("bold");
        });

        this.createButton(groupFormat, "italic", "Italic", () => {
            document.execCommand("italic");
        });

        // list
        this.createButton(groupList, "list", "Insert Unordered List", () => {
            document.execCommand("insertUnorderedList");
        });

        this.createButton(groupList, "list-ordered", "Insert Ordered List", () => {
            document.execCommand("insertOrderedList");
        });

        // cell
        this.createButton(groupCell, "chevrons-down", "Add Row Below", () => {
            this.addRow("add");
        });

        this.createButton(groupCell, "chevron-down", "Insert Row Below", () => {
            this.addRow("insert");
        });

        this.createButton(groupCell, "chevrons-right", "Add Column Right", () => {
            this.addCol("add");
        });

        this.createButton(groupCell, "chevron-right", "Insert Column Right", () => {
            this.addCol("insert");
        });

        this.createButton(groupCell, "chevrons-down-up", "Delete Column", () => {
            this.deleteCol();
        });

        this.createButton(groupCell, "chevrons-right-left", "Delete Row", () => {
            this.deleteRow();
        });
    }

    // Button creator
    createButton(
        parent: HTMLElement,
        icon: string,
        title: string,
        action: () => void
    ) {
        const btn = parent.createEl("button");

        // check between custom vs built-in icon
        if (icon.trim().startsWith("<svg")) {
            // custom
            btn.innerHTML = icon;
        }
        else {
            // built-in
            setIcon(btn, icon);
        }

        // add title
        btn.setAttribute("title", title);

        // add onclick action
        btn.onclick = () => {
            // check if there are any focused cell
            const cell = this.activeCell();
            if (!cell) return;

            cell.focus();
            action();
        }
    }

    // add col function
    addCol(type: "insert" | "add") {
        const cell = this.activeCell();
        if (!cell) return;

        const currentRow = cell.closest("tr");
        if (!currentRow) return;

        const table = currentRow.closest("table");
        if (!table) return;

        const cellsInRow = Array.from(currentRow.children);

        // find index of current cell
        const colIndex = cellsInRow.indexOf(cell.closest("td")!);

        // insert new cell in every row
        const rows = Array.from(table.querySelectorAll("tr"));

        rows.forEach((row) => {
            const newTd = document.createElement("td");

            const div = document.createElement("div");
            div.contentEditable = "true";
            div.classList.add("table-editor-cell");
            this.bindCell(div);

            newTd.appendChild(div);

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
        const cell = this.activeCell();
        if (!cell) return;

        const currentRow = cell.closest("tr");
        if (!currentRow) return;

        const table = currentRow.closest("table");
        if (!table) return;

        const newRow = document.createElement("tr");

        const cells = Array.from(currentRow.children);

        // create new cell inside newRow
        cells.forEach(() => {
            const td = document.createElement("td");

            const div = document.createElement("div");
            div.contentEditable = "true";
            div.classList.add("table-editor-cell");
            this.bindCell(div);

            td.appendChild(div);
            newRow.appendChild(td);
        });

        if (type === "add") {
            table.appendChild(newRow);
        }
        else if (type === "insert") {
            currentRow.parentNode?.insertBefore(
                newRow,
                currentRow.nextSibling
            );
        }
    }

    deleteRow() {
        const cell = this.activeCell();
        if (!cell) return;

        const currentRow = cell.closest("tr");
        if (!currentRow) return;

        const table = currentRow.closest("table");
        if (!table) return;

        const rows = table.querySelectorAll("tr");

        // prevent deleting last row
        if (rows.length === 1) return;

        currentRow.remove();
    }

    deleteCol() {
        const cell = this.activeCell();
        if (!cell) return;

        const currentRow = cell.closest("tr");
        if (!currentRow) return;

        const table = currentRow.closest("table");
        if (!table) return;

        // find column index
        const cellsInRow = Array.from(currentRow.children);
        const colIndex = cellsInRow.indexOf(cell.closest("td")!);

        const rows = table.querySelectorAll("tr");

        // prevent deleting last column
        if (cellsInRow.length === 1) return;

        rows.forEach((row) => {
            const cells = Array.from(row.children);
            cells[colIndex]?.remove();
        });
    }

    bindCell(div: HTMLElement) {
        div.addEventListener("focus", () => {
            this.setActiveCell(div);
        });
    }
}