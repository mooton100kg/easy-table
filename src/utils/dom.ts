import { TableOperation } from "operations/TableOperations";

export function getScale(el: HTMLElement): number {
    const transform = getComputedStyle(el).transform;

    if (!transform || transform === "none") {
        return 1;
    }

    const matrix = new DOMMatrix(transform);

    return matrix.a;
}

export function expandRangeToElement(range: Range, root: HTMLElement) {
    let start = range.startContainer;
    let end = range.endContainer;

    // expand start
    while (start.parentNode && start.parentNode !== root) {
        start = start.parentNode;
    }

    // expand end
    while (end.parentNode && end.parentNode !== root) {
        end = end.parentNode;
    }

    range.setStartBefore(start);
    range.setEndAfter(end);
}

export function removeAllSpans(fragment: DocumentFragment): DocumentFragment {
    const walker = document.createTreeWalker(
        fragment,
        NodeFilter.SHOW_ELEMENT,
        null
    );

    let node: Node | null;

    while ((node = walker.nextNode())) {
        if (node instanceof HTMLElement && node.tagName === "SPAN") {
            const parent = node.parentNode;
            if (!parent) continue;

            // move children out
            while (node.firstChild) {
                parent.insertBefore(node.firstChild, node);
            }
            parent.removeChild(node);
        }
    }
    return fragment;
}

export function findClosestLi(): HTMLElement | null {
    let node = window.getSelection()?.anchorNode;

    // find closet <li>
    while (node && node.nodeName !== "LI") {
        node = node.parentNode;
    }

    return node as HTMLElement | null;
}

export function moveCursorTo(el: HTMLElement) {
    const range = document.createRange();
    const sel = window.getSelection();

    range.setStart(el, 0);
    range.collapse(true);

    sel?.removeAllRanges();
    sel?.addRange(range);
}

export function createButton(parent: HTMLElement) {
    const btn = document.createElement("button");
    parent.appendChild(btn);
    return btn;
}

export function createDiv(parent: HTMLElement, cls?: string) {
    const el = document.createElement("div");
    if (cls) el.classList.add(cls);
    parent.appendChild(el);
    return el;
}

export function createSpan(parent: HTMLElement, cls?: string) {
    const el = document.createElement("span");
    if (cls) el.classList.add(cls);
    parent.appendChild(el);
    return el;
}

export function createInput(parent: HTMLElement, placeholder?: string) {
    const el = document.createElement("input");
    el.type = "text";
    if (placeholder) el.placeholder = placeholder;
    parent.appendChild(el);
    return el;
}

