import { App, Editor, MarkdownView, Modal, Notice, setIcon } from 'obsidian';

import { TableToolbar } from "./Toolbar";
import { TableEditorController } from "./TableEditorController";

export class TableEditorModal extends Modal {
    html: string;

    constructor(app: App, html: string) {
        super(app);
        this.html = html;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        // ======================= create title
        contentEl.createEl("h2", { text: "Edit Table" });

        // ======================= create toolbar
        const toolbarEl = contentEl.createDiv();

        // ======================= create UI table
        // Convert html string to DOM
        const parser = new DOMParser();
        const doc = parser.parseFromString(this.html, "text/html");
        // Extract wrapper from DOM
        const wrapper = doc.querySelector(".table-wrapper");
        const table = doc.querySelector("table");

        // detect if html is valid table
        if (!table || !wrapper) {
            new Notice("Invalid table")
            this.onClose;
            return;
        }

        // clone the table
        const tableClone = table.cloneNode(true) as HTMLTableElement

        tableClone.addClass("table-editor-table");

        // create controller
        const controller = new TableEditorController(tableClone);
        new TableToolbar(toolbarEl, controller);

        Array.from(tableClone.rows).forEach((tr) => {
            Array.from(tr.cells).forEach((td) => {
                td.contentEditable = "true";

                controller.handleEnterKey(td);
                controller.bindCell(td);
            });
        });

        // add clone inside contentEl
        contentEl.appendChild(tableClone);

        // ======================= create save button
        const saveBtn = contentEl.createEl("button", { text: "Save" });

        saveBtn.onclick = () => {
            const view = this.app.workspace.getActiveViewOfType(MarkdownView);

            const updatedHtml = controller.buildHtml(wrapper, tableClone);

            if (!view) return;
            view.editor.replaceSelection(updatedHtml);
            this.close();
        };

    }

    onClose() {
        this.contentEl.empty();
    }
}