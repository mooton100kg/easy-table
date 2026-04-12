import { App, Editor, MarkdownView, Modal, setIcon } from 'obsidian';

import { TableToolbar } from "./Toolbar";
import { TableEditorController } from "./TableEditorController";

export class TableEditorModal extends Modal {
    html: string;

    constructor(app: App, html: string) {
        super(app);
        this.html = html;
    }

    onOpen() {
        const controller = new TableEditorController();

        const { contentEl } = this;
        contentEl.empty();

        // ======================= create title
        contentEl.createEl("h2", { text: "Edit Table" });

        // ======================= create toolbar
        const toolbarEl = contentEl.createDiv();
        new TableToolbar(toolbarEl, controller);

        // ======================= create class input
        const classInput = contentEl.createEl("input", {});

        // ======================= create UI table
        // Convert html string to DOM
        const parser = new DOMParser();
        const doc = parser.parseFromString(this.html, "text/html");
        // Extract <table> from DOM
        const table = doc.querySelector("table");

        // detect if html is valid table
        if (!table) {
            contentEl.createEl("p", { text: "Invalid table" });
            return;
        }

        // set class input value
        classInput.value = table.className;
        table.addClass("table-editor-table");

        Array.from(table.rows).forEach((tr) => {
            Array.from(tr.cells).forEach((td) => {
                td.contentEditable = "true";

                controller.handleEnterKey(td);
                controller.bindCell(td);
            });
        });
        contentEl.appendChild(table);

        // ======================= create save button
        const saveBtn = contentEl.createEl("button", { text: "Save" });

        saveBtn.onclick = () => {
            const view = this.app.workspace.getActiveViewOfType(MarkdownView);

            const tableClass = classInput.value.split(" ");
            const updatedHtml = controller.buildHtml(table, tableClass);

            if (!view) return;
            console.log("update Class: ", tableClass);
            view.editor.replaceSelection(updatedHtml);
            this.close();

        };

    }

    onClose() {
        this.contentEl.empty();
    }
}