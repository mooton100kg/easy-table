import { App, Editor, MarkdownView, Modal, Notice, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, MyPluginSettings, SampleSettingTab } from "./settings";
import { TableEditorModal } from "./TableEditorModal";
// Remember to rename these classes and interfaces! new Notice("Clickkk");

export default class EasyPluginPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor: Editor) => {

				const selection = editor.getSelection();

				// Check if have selection
				if (!selection) return;

				// Check if selection is <table>
				const hasTable =
					selection.startsWith("<table") &&
					selection.endsWith("</table>");

				if (!hasTable) return;

				//if selection is <table> then add "Edit Table" menu
				menu.addItem((item) => {
					item
						.setTitle("Edit Table")
						.onClick(() => {
							console.log("edit table")
							new TableEditorModal(this.app, selection).open();
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

