import { Editor, MarkdownView, Plugin, Workspace } from 'obsidian';
import { DEFAULT_SETTINGS, MyPluginSettings, SampleSettingTab } from "./settings";

import { TableEditorView, VIEW_TYPE_TABLE_EDITOR } from './TableEditorView';
import { PluginController } from './PluginController';

export default class EasyPluginPlugin extends Plugin {
	settings: MyPluginSettings;
	controller: PluginController;

	async onload() {
		this.controller = new PluginController(this.app);

		this.registerDomEvent(document, "paste", (e) =>
			this.controller.handlePaste(e)
		);

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

				const isMDTable = this.controller.isInsideMDTable(editor);

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

								this.controller.OpenTableEditor({
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
								const table = this.controller.getMDTable(editor);
								const html = this.controller.MDToHTMLTable(table.text);

								editor.replaceRange(html, table.from, table.to);
							})
					})
				}
			}));

		this.addCommand({
			id: "create-html-table",
			name: "Create HTML Table",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const table = this.controller.createHTMLTable(2, 2);

				this.controller.OpenTableEditor({
					html: table,
					editor: editor,
					from: editor.getCursor("from"),
					to: editor.getCursor("to"),
				});
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

