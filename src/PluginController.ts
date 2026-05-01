import { App, Editor } from "obsidian";

export class PluginController {
    app: App;

    constructor(app: App) {
        this.app = app;
    }

    async handlePaste(e: ClipboardEvent) {
        const target = e.target as HTMLElement;

        const td = target.closest("td[contenteditable='true']");
        if (!td) return;

        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.startsWith("image/")) {
                e.preventDefault();

                const file = item.getAsFile();
                if (!file) return;

                await this.pasteImageIntoTd(file);
            }
        }
    }

    async pasteImageIntoTd(file: File) {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) return;

        const ext = file.type.split("/")[1] || "png";

        const path = await this.app.fileManager.getAvailablePathForAttachment(
            `pasted.${ext}`,
            activeFile.path
        )

        const buffer = await file.arrayBuffer();
        const saved = await this.app.vault.createBinary(path, buffer);

        const src = this.app.vault.adapter.getResourcePath(saved.path);

        this.insertImageAtCursor(src);
    }

    insertImageAtCursor(src: string) {
        const img = document.createElement("img");
        img.src = src;
        img.width = 100;

        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;

        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(img);
        range.insertNode(img);

        range.setStartAfter(img);
        range.setEndAfter(img);
        sel.removeAllRanges();
        sel.addRange(range);
    }

    isInsideMDTable(editor: Editor): boolean {
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);

        if (!line) return false;

        return line.includes("|");
    }

    getMDTable(editor: Editor) {
        const cursor = editor.getCursor();
        let start = cursor.line;
        let end = cursor.line;

        const lineCount = editor.lineCount();

        // expand upward
        while (start > 0 && editor.getLine(start - 1)?.includes("|")) {
            start--;
        }

        // expand downward
        while (end < lineCount - 1 && editor.getLine(end + 1)?.includes("|")) {
            end++;
        }

        const lines: String[] = [];
        for (let i = start; i <= end; i++) {
            let line = editor.getLine(i);
            line = line.replace(/!\[\[(.*?)\]\]/g, (match, content) => {
                const [file, size] = content.replace(/\\\|/g, "|").split("|");

                let w = "";
                let h = "";

                if (size) {
                    const parts = size.split("x");
                    w = parts[0] || "500";
                    h = parts[1];
                }

                let attrs = "";

                if (w) attrs += `width="${w}"`;
                if (h) attrs += ` height="${h}"`;

                const activeFile = this.app.workspace.getActiveFile();
                const fileObj = this.app.metadataCache.getFirstLinkpathDest(file, activeFile?.path || "");

                if (!fileObj) {
                    return `<img alt="${file} not found">`;
                }

                const src = this.app.vault.adapter.getResourcePath(fileObj.path);
                return `<img src="${src}}" ${attrs}>`;
            });

            lines.push(line);
        }

        return {
            text: lines,
            from: { line: start, ch: 0 },
            to: { line: end, ch: editor.getLine(end)?.length || 0 }
        }
    }

    MDToHTMLTable(md: String[]): string {
        const headers = md[0]
            ?.split("|")
            .slice(1, -1)
            .map(h => h.trim());

        const body = md.splice(2); //skip seperator
        if (!headers || !body) return "";

        let html = `<div class="table-wrapper"><table><tr>`;

        headers.forEach(h => {
            if (!h) h = " ";
            html += `<th>${h}</th>`;
        });

        html += `</tr>`

        body.forEach(row => {
            const cols = row
                .split("|")
                .slice(1, -1)
                .map(c => c.trim());

            html += `<tr>`
            cols.forEach(c => {
                if (!c) c = " ";
                html += `<td>${c}</td>`
            })
            html += `</tr>`
        })
        html += `</table></div>`

        return html;

    }

    createHTMLTable(rows: number, cols: number): string {
        let html = `<div class="table-wrapper"><table>`;

        for (let r = 0; r < rows; r++) {
            html += `<tr>`;
            for (let c = 0; c < cols; c++) {
                html += "<td> </td>";
            }
            html += `</tr>`;
        }

        html += `</table></div>`;

        return html;
    }
}