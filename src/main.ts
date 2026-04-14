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

				// Check if have selection
				if (!selection) return;

				// Check if selection is <table>
				const hasTable =
					selection.includes("<table") &&
					selection.includes("</table>");

				if (!hasTable) return;

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
			}));

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

