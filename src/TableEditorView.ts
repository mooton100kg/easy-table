import { ItemView, WorkspaceLeaf, Notice, MarkdownView, EditorPosition } from 'obsidian';

import { TableToolbar } from "./Toolbar";
import { TableEditorController } from 'TableEditorController';

export const VIEW_TYPE_TABLE_EDITOR = "table-editor-view";

type EditorContext = {
    editor: any;
    from: EditorPosition;
    to: EditorPosition;
    html: string;
}

export class TableEditorView extends ItemView {
    context: EditorContext | null = null;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType(): string {
        return VIEW_TYPE_TABLE_EDITOR;
    }

    getDisplayText(): string {
        return "Table Editor";
    }

    setContext(ctx: EditorContext) {
        this.context = ctx;
        this.render();
    }

    render() {
        const { contentEl } = this;
        contentEl.empty();

        // ======================= create title
        contentEl.createEl("h2", { text: "Edit Table" });

        // ======================= create toolbar
        const toolbarEl = contentEl.createDiv();

        // ======================= create UI table
        // Convert html string to DOM
        if (!this.context) return;
        const { html } = this.context;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        // Extract wrapper from DOM
        const wrapper = doc.querySelector(".table-wrapper");
        const table = doc.querySelector("table");

        // detect if html is valid table
        if (!table || !wrapper) {
            console.log(html)
            new Notice("Invalid table")
            this.onClose;
            return;
        }

        // clone the table
        const tableClone = table.cloneNode(true) as HTMLTableElement

        tableClone.addClass("table-editor-table");

        // create controller
        const controller = new TableEditorController(tableClone, wrapper);
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
            if (!this.context) return;

            const { editor, from, to } = this.context;

            const updatedHtml = controller.buildHtml(wrapper, tableClone);

            editor.replaceRange(updatedHtml, from, to);

            // close tab after save
            this.leaf.detach();
        };
    }

    async onOpen() {
        this.render();
    }

    async onClose() {
        this.contentEl.empty();
    }
}