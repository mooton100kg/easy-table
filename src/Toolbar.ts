import { setIcon } from "obsidian";

import { Icons } from "./icon";
import { TableEditorController } from "./TableEditorController";

export class TableToolbar {
    container: HTMLElement;
    controller: TableEditorController;

    constructor(
        container: HTMLElement,
        controller: TableEditorController
    ) {
        this.container = container;
        this.controller = controller;

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
        this.createButton(groupCell, "table-cells-merge", "Merge Cell", () => {
            this.controller.mergeCells();
        });

        this.createButton(groupCell, "chevrons-down", "Add Row Below", () => {
            this.controller.addRow("add");
        });

        this.createButton(groupCell, "chevron-down", "Insert Row Below", () => {
            this.controller.addRow("insert");
        });

        this.createButton(groupCell, "chevrons-right", "Add Column Right", () => {
            this.controller.addCol("add");
        });

        this.createButton(groupCell, "chevron-right", "Insert Column Right", () => {
            this.controller.addCol("insert");
        });

        this.createButton(groupCell, "chevrons-down-up", "Delete Column", () => {
            this.controller.deleteCol();
        });

        this.createButton(groupCell, "chevrons-right-left", "Delete Row", () => {
            this.controller.deleteRow();
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
            const cell = this.controller.activeCell;
            if (!cell) return;

            cell.focus();
            action();
        }
    }
}