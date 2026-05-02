import { findClosestLi, moveCursorTo } from "utils/dom";

type KeyboardHandler = {
    getNextCell: () => void;
};

export class TableKeyboard {
    constructor(
        private handlers: KeyboardHandler,
    ) { }

    handle(e: KeyboardEvent) {
        switch (e.key) {
            case "Enter":
                this.handleEnter(e);
                break;
            case "Tab":
                this.handleTab(e);
                break;
        }
    }

    private handleEnter(e: KeyboardEvent) {
        const li = findClosestLi();

        e.preventDefault();

        // if inside <li>, insert new <li>
        if (li) {
            li.innerHTML = li.innerHTML.replace(/<br>/g, "");

            const newLi = document.createElement("li");
            newLi.innerHTML = "<br>";

            li.parentNode?.insertBefore(newLi, li.nextSibling);

            // move cursor to new <li>
            moveCursorTo(newLi);
            return;
        }

        // if not inside <li>, insert <br>
        document.execCommand("insertLineBreak");
    }

    private handleTab(e: KeyboardEvent) {
        e.preventDefault();

        // if inside <li>, indent the <li>
        const li = findClosestLi();
        if (li) {
            const prevLi = li.previousElementSibling;
            if (!prevLi) return;

            let subList = prevLi.querySelector("ul");
            //create nested <ul> if not exist
            if (!subList) {
                subList = document.createElement("ul");
                prevLi.appendChild(subList);
            }

            //move current <li> into sublist
            subList.appendChild(li);
            return;
        }

        this.handlers.getNextCell();
    }
}