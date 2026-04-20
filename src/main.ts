import { App, Editor, MarkdownView, Modal, Notice, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, MyPluginSettings, SampleSettingTab } from "./settings";

import { TableEditorView, VIEW_TYPE_TABLE_EDITOR } from './TableEditorView';

export default class EasyPluginPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		this.registerView(
			VIEW_TYPE_TABLE_EDITOR,
			(leaf) => new TableEditorView(leaf)
		);

		await this.loadSettings();

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor: Editor) => {

				const selection = editor.getSelection();

				// Check if selection is <table>
				const hasHTMLTable =
					selection.includes("<table") &&
					selection.includes("</table>");

				const isMDTable = isInsideMDTable(editor);

				if (hasHTMLTable) {
					//if selection is <table> then add "Edit Table" menu
					menu.addItem((item) => {
						item
							.setTitle("Edit Table")
							.onClick(async () => {
								const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
								if (!mdView) return;

								const editor = mdView.editor;

								const selection = editor.getSelection();
								if (!selection) return;

								// open custom tab + prevent multiple tabs
								const leaf =
									this.app.workspace.getLeavesOfType(VIEW_TYPE_TABLE_EDITOR)[0]
									?? this.app.workspace.getLeaf(true);

								await leaf.setViewState({
									type: VIEW_TYPE_TABLE_EDITOR,
									active: true,
								});

								const view = leaf.view as TableEditorView;

								view.setContext({
									html: selection,
									editor: editor,
									from: editor.getCursor("from"),
									to: editor.getCursor("to"),
								});
							})
					})
				}

				if (isMDTable) {
					menu.addItem((item) => {
						item
							.setTitle("Convert to HTML Table")
							.onClick(() => {
								const table = getMDTable(editor);
								const html = MDToHTMLTable(table.text);

								editor.replaceRange(html, table.from, table.to);
							})
					})
				}
			}));

		this.addCommand({
			id: "create-html-table",
			name: "Create HTML Table",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const table = createHTMLTable(2, 2);

				editor.replaceSelection(table);
			}

		});
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<MyPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

function isInsideMDTable(editor: Editor): boolean {
	const cursor = editor.getCursor();
	const line = editor.getLine(cursor.line);

	if (!line) return false;

	return line.includes("|");
}

function getMDTable(editor: Editor) {
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
		lines.push(editor.getLine(i));
	}

	return {
		text: lines,
		from: { line: start, ch: 0 },
		to: { line: end, ch: editor.getLine(end)?.length || 0 }
	}
}

function MDToHTMLTable(md: String[]): string {
	const headers = md[0]
		?.split("|")
		.slice(1, -1)
		.map(h => h.trim());

	const body = md.splice(2); //skip seperator
	if (!headers || !body) return "";

	let html = `<div class="table-wrapper"><table><tbody><tr>`;

	headers.forEach(h => {
		if (!h) h = " ";
		html += `<td>${h}</td>`;
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
	html += `</tbody></table></div>`

	return html;

}

function createHTMLTable(rows: number, cols: number): string {
	let html = `<div class="table-wrapper"><table><tbody>`;

	for (let r = 0; r < rows; r++) {
		html += `<tr>`;
		for (let c = 0; c < cols; c++) {
			html += "<td> </td>";
		}
		html += `</tr>`;
	}

	html += `</tbody></table></div>`;

	return html;
}