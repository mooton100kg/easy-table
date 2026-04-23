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
        const groupClass = this.container.createDiv("toolbar-group class");
        const groupFormat = this.container.createDiv("toolbar-group format");
        const groupList = this.container.createDiv("toolbar-group list");
        const groupCell = this.container.createDiv("toolbar-group cell");
        const groupTable = this.container.createDiv("toolbar-group alignment");

        /*// ============== Button
        this.createButton(groupClass, "bug", "debug", () => {
            console.log("focus: ", this.controller.activeCell);
        });

        // class
        const tableSize = this.createDropdown(groupClass, "Table size", "", {
            mode: "single",
            itemsList: String(this.controller.tableScale * 100),
        }, generateItems(1, 100, "%")
            , (value) => {
                const size = !isNaN(Number(value)) ? Number(value) : 1;
                this.controller.resizeTable(undefined, size);
            })

        this.createButton(groupClass, Icons.increaseSize, "Increase Table Size", () => {
            const size = this.controller.resizeTable(10)
            tableSize.setValue(String(this.controller.tableScale * 100))
        }, false);

        this.createButton(groupClass, Icons.decreaseSize, "Decrease Table Size", () => {
            const size = this.controller.resizeTable(-10)
            tableSize.setValue(String(this.controller.tableScale * 100))
        }, false);

        this.createButton(groupClass, "align-horizontal-space-around", "fit table to screen", () => {
            const size = this.controller.resizeTable(undefined, undefined, true);
            tableSize.setValue(String(this.controller.tableScale * 100))
        })*/

        const Classdropdown = this.createDropdown(groupClass, "Table class", "Set table class", {
            mode: "multi",
            itemsList: this.controller.table?.className.split(" ") || []
        }, [
            { label: "Spread", value: "spread" },
            { label: "Center", value: "center" },
            { label: "Middle", value: "middle" },
        ], (value) => {
            this.controller.table?.classList.toggle(value);
        });

        this.createButton(groupClass, Icons.topTable, "Set Top Header", () => {
            this.controller.setTopHeader();
        });

        this.createButton(groupClass, Icons.sideTable, "Set Side Header", () => {
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

        // table
        this.createButton(groupTable, Icons.alignTopLeft, "Align Top Left", () => {
            this.controller.setAlignment({ horizontal: "left", vertical: "top" });
        });
        this.createButton(groupTable, Icons.alignTopCenter, "Align Top Center", () => {
            this.controller.setAlignment({ horizontal: "center", vertical: "top" });
        });
        this.createButton(groupTable, Icons.alignTopRight, "Align Top Right", () => {
            this.controller.setAlignment({ horizontal: "right", vertical: "top" });
        });
        this.createButton(groupTable, Icons.alignMiddleLeft, "Align Middle Left", () => {
            this.controller.setAlignment({ horizontal: "left", vertical: "middle" });
        });
        this.createButton(groupTable, Icons.alignMiddleCenter, "Align Middle Center", () => {
            this.controller.setAlignment({ horizontal: "center", vertical: "middle" });
        });
        this.createButton(groupTable, Icons.alignMiddleRight, "Align Middle Right", () => {
            this.controller.setAlignment({ horizontal: "right", vertical: "middle" });
        });
        this.createButton(groupTable, Icons.alignBottomLeft, "Align Bottom Left", () => {
            this.controller.setAlignment({ horizontal: "left", vertical: "bottom" });
        });
        this.createButton(groupTable, Icons.alignBottomCenter, "Align Bottom Center", () => {
            this.controller.setAlignment({ horizontal: "center", vertical: "bottom" });
        });
        this.createButton(groupTable, Icons.alignBottomRight, "Align Bottom Right", () => {
            this.controller.setAlignment({ horizontal: "right", vertical: "bottom" });
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
        wrapper.style.gridColumn = "span 2";

        // ================ state
        let selectedValue =
            config.mode === "single" ? config.itemsList : null;

        let selectedValues =
            config.mode === "multi" ? new Set(config.itemsList) : null;

        const rows: {
            row: HTMLElement;
            check: HTMLElement;
            value: string;
        }[] = [];

        // ================ input
        const input = wrapper.createEl("input", {
            type: "text",
            placeholder: label,
        });
        if (config.mode === "single") input.value = config.itemsList;
        input.classList.add("dropdown-input")

        // ================ sync UI
        const render = () => {
            rows.forEach(r => {
                let active = false;

                if (config.mode === "single") {
                    active = r.value === selectedValue;
                } else {
                    active = selectedValues!.has(r.value);
                }

                r.check.style.visibility = active ? "visible" : "hidden";
            })
        };

        const setSelected = (value: string) => {
            if (config.mode === "single") {
                selectedValue = value;
                input.value = value;
            } else {
                if (selectedValues!.has(value)) selectedValues!.delete(value);
                else selectedValues!.add(value);
            }
            action(value);
            render();
        };

        // ================ arrow
        const arrow = wrapper.createEl("button");
        setIcon(arrow, "chevron-down");
        arrow.classList.add("dropdown-arrow");

        // ================ menu
        const menu = wrapper.createDiv("dropdown-menu");
        menu.style.display = "none";

        const toggleMenu = () => {
            const isOpen = menu.style.display === "block";
            menu.style.display = isOpen ? "none" : "block";

            if (!isOpen && config.mode === "single") {
                requestAnimationFrame(() => {
                    const active = rows.find(r => r.value === selectedValue);
                    active?.row.scrollIntoView({ block: "center" });
                });
            }
        };

        arrow.onclick = (e) => {
            e.stopPropagation();
            toggleMenu();
        };

        // close dropdown when click outside
        document.addEventListener("click", () => {
            menu.style.display = "none";
        })

        // ================ handle enter key
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();

                const value = input.value;
                if (!selectedValues?.has(value)) setSelected(value);
            }
        });

        // ================ items
        items.forEach((item) => {
            const row = menu.createDiv("dropdown-item");

            const check = row.createSpan("checkmark");
            check.textContent = "✓";

            row.createSpan("label").textContent = item.label;

            row.dataset.value = item.value;

            // row = item container
            // check = checkmark el before label
            rows.push({ row, check, value: item.value });

            row.onclick = (e) => {
                e.stopPropagation();

                setSelected(item.value)
            }
        });

        render();

        return {
            setValue: (value: string) => {
                if (config.mode === "single") {
                    selectedValue = value;
                    input.value = value;
                } else {
                    selectedValues!.add(value);
                }
                render();
            }
        }
    }

    createColorPicker(
        parent: HTMLElement,
        title: string,
    ) {
        let currentColor = "#000000";

        const wrapper = parent.createDiv("color-picker-wrapper");

        // ============ apply button
        const applyBtn = wrapper.createEl("button", {
            text: "A",
        });
        applyBtn.classList.add("color-picker-btn");
        applyBtn.title = title;

        const underline = applyBtn.createDiv();
        underline.style.backgroundColor = currentColor;

        // ============ function logic
        function applyColor(color: string) {
            currentColor = color;

            underline.style.backgroundColor = color;
        }

        // ============ arrow
        const arrow = wrapper.createEl("button");
        setIcon(arrow, "chevron-down");
        arrow.classList.add("color-picker-arrow");

        // ============ create color picker
        const input = wrapper.createEl("input");
        input.type = "color";
        input.value = currentColor;
        input.classList.add("color-picker-menu");
        input.style.display = "block"
        applyBtn.appendChild(input);

        // ============ click arrow
        arrow.onclick = (e) => {
            e.stopPropagation();

            input.value = currentColor;
            input.click();
        }

        // ============ handle color selection
        input.addEventListener("input", () => {
            applyColor(input.value);
            this.controller.applyTextColor(currentColor);
        });

        // ============ apply btn click
        applyBtn.onclick = () => {
            this.controller.applyTextColor(currentColor);
        }
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

