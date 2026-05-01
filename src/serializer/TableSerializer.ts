import { Editor } from "obsidian";

export class TableSerializer {
    //Convert table back to normal table
    static buildHtml(wrapper: Element, newTable: HTMLTableElement) {

        newTable.removeClass("table-editor-table");

        Array.from(newTable.rows).forEach((tr) => {
            Array.from(tr.cells).forEach((td) => {
                td.classList.remove("selected-cell");
                td.removeAttribute("contenteditable");
            });
        });

        const originalTable = wrapper.querySelector("table");
        originalTable?.replaceWith(newTable);

        return wrapper.outerHTML;
    }

}