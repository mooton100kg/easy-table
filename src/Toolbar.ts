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
        this.createButton(groupFormat, "bold", () => {
            document.execCommand("bold");
        });

        this.createButton(groupFormat, "italic", () => {
            document.execCommand("italic");
        });

        // list
        this.createButton(groupList, "list", () => {
            document.execCommand("insertUnorderedList");
        });

        this.createButton(groupList, "list-ordered", () => {
            document.execCommand("insertOrderedList");
        });

        // cell
        this.createButton(groupCell, "chevrons-down", () => {
            this.addRow("add");
        });

        this.createButton(groupCell, "chevron-down", () => {
            this.addRow("insert");
        });
    }

    // Button creator
    createButton(
        parent: HTMLElement,
        icon: string,
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

        btn.onclick = () => {
            // check if there are any focused cell
            const cell = this.activeCell();
            if (!cell) return;

            cell.focus();
            action();
        }
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

    bindCell(div: HTMLElement) {
        div.addEventListener("focus", () => {
            this.setActiveCell(div);
        });
    }
}