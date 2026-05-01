import { setIcon } from "obsidian";

import { Icons } from "../icon";

export function setButtonIcon(btn: HTMLElement, icon: string) {
    // custom icon
    if (Icons[icon as keyof typeof Icons]) {
        btn.innerHTML = Icons[icon as keyof typeof Icons];
        return;
    }

    // default icon
    if (icon.trim().startsWith("<svg")) {
        btn.innerHTML = icon;
        return;
    }

    // obsidian icon
    setIcon(btn, icon);
}