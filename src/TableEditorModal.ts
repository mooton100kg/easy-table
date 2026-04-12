import { App, Editor, MarkdownView, Modal, setIcon } from 'obsidian';
import { TableToolbar } from "./Toolbar";

export class TableEditorModal extends Modal {
    html: string;

    constructor(app: App, html: string) {
        super(app);
        this.html = html;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl("h2", { text: "Edit Table" });

        // Convert html string to DOM
        const parser = new DOMParser();
        const doc = parser.parseFromString(this.html, "text/html");
        // Extract <table> from DOM
        const table = doc.querySelector("table");

        if (!table) {
            contentEl.createEl("p", { text: "Invalid table" });
            return;
        }

        let activeCell: HTMLElement | null = null;

        // Create UI table
        const uiTable = document.createElement("table");
        uiTable.addClass("table-editor-table");

        Array.from(table.rows).forEach((row) => {
            const tr = document.createElement("tr");

            Array.from(row.cells).forEach((cell) => {
                const td = document.createElement("td");

                const div = document.createElement("div");
                div.innerHTML = cell.innerHTML;
                div.contentEditable = "true";
                div.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        document.execCommand("insertLineBreak");
                    }
                });
                div.addClass("table-editor-div");

                // Detect active cell
                div.addEventListener("focus", () => {
                    activeCell = div;
                });

                td.appendChild(div);
                tr.appendChild(td);
            });

            uiTable.appendChild(tr);
        });

        contentEl.appendChild(uiTable);

        // Save button
        const saveBtn = contentEl.createEl("button", {
            text: "Save"
        });

        saveBtn.onclick = () => {
            const updatedHtml = this.buildHtml(uiTable);
            const view = this.app.workspace.getActiveViewOfType(MarkdownView);

            if (!view) return;
            view.editor.replaceSelection(updatedHtml);
            this.close();
        };

        const toolbarEl = contentEl.createDiv();
        new TableToolbar(toolbarEl, () => activeCell);

    }

    //Convert uiTable back to normal table
    buildHtml(uiTable: HTMLTableElement): string {
        const rows = Array.from(uiTable.querySelectorAll("tr"));

        const htmlRows = rows.map((row) => {
            const cells = Array.from(
                row.querySelectorAll("td div")
            ).map((div) => {
                return `<td>${div.innerHTML}</td>`
            });

            return `<tr>${cells.join("")}</tr>`;
        });

        return `<table>${htmlRows.join("")}</table>`;
    }

    onClose() {
        this.contentEl.empty();
    }
}