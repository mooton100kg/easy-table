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
        const groupTable = this.container.createDiv("toolbar-group table");
        const groupFormat = this.container.createDiv("toolbar-group format");
        const groupList = this.container.createDiv("toolbar-group list");
        const groupCell = this.container.createDiv("toolbar-group cell");

        // ============== Button
        this.createButton(groupTable, "bug", "debug", () => {
            console.log("focus: ", this.controller.activeCell);
            console.log(this.controller.tableScale);
        });

        // table
        this.createDropdown(groupTable, "test", "", {
            mode: "single",
            itemsList: "50"
        }, generateItems(1, 100, "%")
            , (value) => {
                console.log(value);
            })

        this.createButton(groupTable, Icons.increaseSize, "Increase Table Size", () => {
            this.controller.resizeTable(10)
        }, false);

        this.createButton(groupTable, Icons.decreaseSize, "Decrease Table Size", () => {
            this.controller.resizeTable(-10)
        }, false);

        this.createDropdown(groupTable, "Table class", "Set table class", {
            mode: "multi",
            itemsList: this.controller.table?.className.split(" ") || []
        }, [
            { label: "Spread", value: "spread" },
        ], (value) => {
            this.controller.table?.classList.toggle(value);
        });

        this.createButton(groupTable, Icons.topTable, "Set Top Header", () => {
            this.controller.setTopHeader();
        });

        this.createButton(groupTable, Icons.sideTable, "Set Side Header", () => {
            this.controller.setSideHeader();
        });

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
        this.createButton(groupCell, "link-2", "Merge Cell", () => {
            this.controller.mergeCells();
        });

        this.createButton(groupCell, Icons.link2off, "Unmerge Cell", () => {
            this.controller.unmergeCells();
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
        action: () => void,
        focus: boolean = true,
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
            if (!focus) {
            }
            else {
                // check if there are any focused cell
                const cell = this.controller.activeCell;
                if (!cell) return;
            }

            action();
        }
    }

    // dropdown creator
    createDropdown(
        parent: HTMLElement,
        label: string,
        title: string,
        config: MultiSelectConfig | SingleSelectConfig,
        items: {
            label: string;
            value: string;
        }[],
        action: (value: string) => void,
    ) {
        const wrapper = parent.createDiv("toolbar-dropdown");

        // create dropdown button
        const input = wrapper.createEl("input", {
            type: "text",
            placeholder: label
        });
        input.classList.add("dropdown-input")
        if (config.mode === "single") input.value = config.itemsList;

        // handle enter key
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                const value = input.value;

                // find matching item
                const match = items.find(item => item.value === value);

                if (match) {
                    action(match.value);
                    input.value = match.value;
                }

                // update row
                rows.forEach(r => {
                    r.active = r.value === value;
                    r.check.style.visibility = r.active ? "visible" : "hidden";
                })
            }
        });

        const arrow = wrapper.createEl("button");
        setIcon(arrow, "chevron-down");

        // create dropdown item container 
        const menu = wrapper.createDiv("dropdown-menu");
        menu.style.display = "none";

        // open dropdown when click button
        arrow.onclick = (e) => {
            e.stopPropagation();

            const isOpen = menu.style.display === "block";
            // condition ? value_if_true : value_if_false
            menu.style.display = isOpen ? "none" : "block";

            // auto scroll to current value
            if (!isOpen && config.mode === "single") {
                // wait for DOM render
                setTimeout(() => {
                    const activeRow = rows.find(r => r.active);

                    if (activeRow) {
                        activeRow.row.scrollIntoView({
                            block: "center",
                            behavior: "auto"
                        })
                    }
                }, 0);
            }
        };

        // close dropdown when click outside
        document.addEventListener("click", () => {
            menu.style.display = "none";
        });

        const rows: {
            row: HTMLElement;
            check: HTMLElement;
            active: boolean;
            value: string;
        }[] = [];

        // create each item
        items.forEach((item) => {
            const row = menu.createDiv("dropdown-item");

            const check = row.createSpan("checkmark");
            check.textContent = "✓";

            const labelEl = row.createSpan("label");
            labelEl.textContent = item.label;

            let active = false;
            if (config.mode === "multi") {
                // check if table already contain this class
                active = config.itemsList.includes(item.value) ?? false;
            }
            else if (config.mode === "single") {
                active = config.itemsList === item.value
            }

            check.style.visibility = active ? "visible" : "hidden";

            const value = item.value

            // row = item container
            // check = checkmark el before label
            rows.push({ row, check, active, value });

            row.onclick = (e) => {
                e.stopPropagation();

                // do the action when click
                action(item.value);

                // ======== single mode logic
                if (config.mode === "single") {
                    // disable all row active status
                    rows.forEach(r => {
                        r.active = false;
                        r.check.style.visibility = "hidden";
                    });

                    // active the clicked row
                    active = true;

                    // update the input
                    input.value = item.value;
                }

                // ======== multi mode logic
                else active = !active;

                // apply state
                check.style.visibility = active ? "visible" : "hidden";
            }
        });
    }
}

type MultiSelectConfig = {
    mode: "multi";
    itemsList: string[];
};

type SingleSelectConfig = {
    mode: "single";
    itemsList: string;
}

function generateItems(start: number, end: number, unit: string): { label: string; value: string }[] {
    const items = [];

    for (let i = start; i <= end; i++) {
        items.push({
            label: `${i} ${unit}`,
            value: `${i}`
        });
    }

    return items;
}
