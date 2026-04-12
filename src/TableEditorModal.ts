import { App, Editor, MarkdownView, Modal, setIcon } from 'obsidian';
import { TableToolbar } from "./Toolbar";

export class TableEditorModal extends Modal {
    html: string;

    constructor(app: App, html: string) {
        super(app);
        this.html = html;
    }

    onOpen() {
        let activeCell: HTMLElement | null = null;
        let selectedCells: Set<HTMLTableCellElement> = new Set();

        const { contentEl } = this;
        contentEl.empty();

        // ======================= create title
        contentEl.createEl("h2", { text: "Edit Table" });

        // ======================= create toolbar
        const toolbarEl = contentEl.createDiv();
        new TableToolbar(toolbarEl, () => activeCell, setActiveCell);

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

        // function to pass activeCell to toolbar.ts
        function setActiveCell(el: HTMLElement) {
            activeCell = el;
        }

        const uiTable = document.createElement("table");
        uiTable.addClass("table-editor-table");

        Array.from(table.rows).forEach((row) => {
            const tr = document.createElement("tr");

            Array.from(row.cells).forEach((cell) => {
                const td = document.createElement("td");

                td.innerHTML = cell.innerHTML;
                td.contentEditable = "true";

                // prevent enter key from creating new <div>
                td.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        document.execCommand("insertLineBreak");
                    }
                });

                // Detect active cell
                td.addEventListener("focus", () => {
                    activeCell = td;
                });

                // Detect selected cells
                td.addEventListener("click", (e) => {
                    if (e.shiftKey) {
                        // select mode
                        selectedCells.add(td);
                        td.classList.add("selected-cell");
                    }
                    else {
                        // reset selection when click without shift
                        selectedCells.forEach((cell) => cell.classList.remove("selected-cell"));
                        selectedCells.clear();
                        selectedCells.add(td);
                        td.classList.add("selected-cell");
                    }
                });
                tr.appendChild(td);

            });
            uiTable.appendChild(tr);

        });
        contentEl.appendChild(uiTable);

        // ======================= create save button
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

    }

    //Convert uiTable back to normal table
    buildHtml(uiTable: HTMLTableElement): string {
        const rows = Array.from(uiTable.querySelectorAll("tr"));

        const htmlRows = rows.map((row) => {
            const cells = Array.from(
                row.querySelectorAll("td")
            ).map((td) => {
                return `<td>${td.innerHTML}</td>`
            });

            return `<tr>${cells.join("")}</tr>`;
        });

        return `<table>${htmlRows.join("")}</table>`;
    }

    onClose() {
        this.contentEl.empty();
    }
}