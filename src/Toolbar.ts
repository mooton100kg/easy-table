import { setIcon } from "obsidian";

export class TableToolbar {
    container: HTMLElement;
    activeCell: () => HTMLElement | null;

    constructor(
        container: HTMLElement,
        getActveCell: () => HTMLElement | null
    ) {
        this.container = container;
        this.activeCell = getActveCell;

        this.build();
    }

    build() {
        this.container.addClass("table-editor-toolbar");

        // Groups
        const groupFormat = this.container.createDiv("toolbar-group");
        const groupList = this.container.createDiv("toolbar-group");

        //button
        this.createButton(groupFormat, "bold", () => {
            document.execCommand("bold");
        });

        this.createButton(groupFormat, "italic", () => {
            document.execCommand("italic");
        });

        this.createButton(groupList, "list", () => {
            document.execCommand("insertUnorderedList");
        });

        this.createButton(groupList, "list-ordered", () => {
            document.execCommand("insertOrderedList");
        });
    }

    // Button creator
    createButton(
        parent: HTMLElement,
        icon: string,
        action: () => void
    ) {
        const btn = parent.createEl("button");
        setIcon(btn, icon);

        btn.onclick = () => {
            // check if there are any focused cell
            const cell = this.activeCell();
            if (!cell) return;

            cell.focus();
            action();
        }
    }
}