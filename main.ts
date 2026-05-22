import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	ItemView,
	WorkspaceLeaf,
	requestUrl,
} from "obsidian";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface JCClaudeSettings {
	apiKey: string;
	model: string;
	maxTokens: number;
	systemPrompt: string;
	temperature: number;
}

interface Message {
	role: "user" | "assistant";
	content: string;
}

// ─── Padrões ──────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: JCClaudeSettings = {
	apiKey: "",
	model: "claude-sonnet-4-6",
	maxTokens: 4096,
	systemPrompt:
		"Você é um assistente inteligente integrado ao Obsidian. Ajude o usuário a criar, melhorar e analisar suas notas. Responda sempre em português do Brasil, de forma clara e objetiva.",
	temperature: 0.7,
};

const VIEW_TYPE_CLAUDE = "jc-claude-view";

// ─── View do painel lateral ───────────────────────────────────────────────────

class ClaudeView extends ItemView {
	private plugin: JCClaudePlugin;
	private messages: Message[] = [];
	private chatContainer: HTMLElement;
	private inputEl: HTMLTextAreaElement;
	private sendBtn: HTMLButtonElement;

	constructor(leaf: WorkspaceLeaf, plugin: JCClaudePlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_CLAUDE;
	}

	getDisplayText(): string {
		return "Claude AI";
	}

	getIcon(): string {
		return "bot";
	}

	async onOpen(): Promise<void> {
		this.buildUI();
	}

	private buildUI(): void {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass("jc-claude-container");

		// Cabeçalho
		const header = container.createDiv("jc-claude-header");
		header.createEl("h4", { text: "Claude AI" });

		const clearBtn = header.createEl("button", {
			cls: "jc-claude-clear-btn",
			text: "Limpar",
		});
		clearBtn.addEventListener("click", () => this.clearChat());

		// Área do chat
		this.chatContainer = container.createDiv("jc-claude-chat");
		this.addWelcomeMessage();

		// Área de entrada
		const inputArea = container.createDiv("jc-claude-input-area");
		this.inputEl = inputArea.createEl("textarea", {
			cls: "jc-claude-input",
			attr: { placeholder: "Pergunte ao Claude..." },
		});

		this.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				this.sendMessage();
			}
		});

		const btnRow = inputArea.createDiv("jc-claude-btn-row");

		const noteBtn = btnRow.createEl("button", {
			cls: "jc-claude-note-btn",
			text: "Nota atual",
		});
		noteBtn.addEventListener("click", () => this.injectCurrentNote());

		this.sendBtn = btnRow.createEl("button", {
			cls: "jc-claude-send-btn",
			text: "Enviar",
		});
		this.sendBtn.addEventListener("click", () => this.sendMessage());
	}

	private addWelcomeMessage(): void {
		this.appendMessage(
			"assistant",
			"Olá! Sou o Claude AI integrado ao seu Obsidian. Como posso ajudar com suas notas hoje?"
		);
	}

	private clearChat(): void {
		this.messages = [];
		this.chatContainer.empty();
		this.addWelcomeMessage();
	}

	private appendMessage(role: "user" | "assistant", content: string): void {
		const msgEl = this.chatContainer.createDiv(
			`jc-claude-message jc-claude-message--${role}`
		);

		const label = msgEl.createDiv("jc-claude-message-label");
		label.textContent = role === "user" ? "Você" : "Claude";

		const text = msgEl.createDiv("jc-claude-message-text");
		text.textContent = content;

		if (role === "assistant") {
			const copyBtn = msgEl.createEl("button", {
				cls: "jc-claude-copy-btn",
				text: "Copiar",
			});
			copyBtn.addEventListener("click", () => {
				navigator.clipboard.writeText(content);
				new Notice("Copiado!");
			});

			const insertBtn = msgEl.createEl("button", {
				cls: "jc-claude-insert-btn",
				text: "Inserir na nota",
			});
			insertBtn.addEventListener("click", () => this.insertIntoNote(content));
		}

		this.chatContainer.scrollTo({ top: this.chatContainer.scrollHeight, behavior: "smooth" });
	}

	private async injectCurrentNote(): Promise<void> {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			new Notice("Nenhuma nota ativa encontrada.");
			return;
		}
		const content = view.editor.getValue();
		const noteName = view.file?.basename ?? "nota";
		const injection = `[Conteúdo da nota "${noteName}"]:\n\n${content}`;
		this.inputEl.value = injection;
		this.inputEl.focus();
	}

	private insertIntoNote(content: string): void {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			new Notice("Nenhuma nota ativa. Abra uma nota primeiro.");
			return;
		}
		const editor = view.editor;
		const cursor = editor.getCursor();
		editor.replaceRange("\n\n" + content, cursor);
		new Notice("Texto inserido na nota.");
	}

	private async sendMessage(): Promise<void> {
		const text = this.inputEl.value.trim();
		if (!text) return;

		if (!this.plugin.settings.apiKey) {
			new Notice("Configure sua chave de API do Claude nas configurações do plugin.");
			return;
		}

		this.inputEl.value = "";
		this.messages.push({ role: "user", content: text });
		this.appendMessage("user", text);

		this.sendBtn.disabled = true;
		this.sendBtn.textContent = "...";

		const thinking = this.chatContainer.createDiv("jc-claude-thinking");
		thinking.textContent = "Claude está pensando...";
		this.chatContainer.scrollTo({ top: this.chatContainer.scrollHeight, behavior: "smooth" });

		try {
			const reply = await this.plugin.callClaude(this.messages);
			thinking.remove();
			this.messages.push({ role: "assistant", content: reply });
			this.appendMessage("assistant", reply);
		} catch (err) {
			thinking.remove();
			const errMsg = err instanceof Error ? err.message : String(err);
			new Notice(`Erro ao chamar Claude: ${errMsg}`);
			this.appendMessage("assistant", `Erro: ${errMsg}`);
			this.messages.pop();
		} finally {
			this.sendBtn.disabled = false;
			this.sendBtn.textContent = "Enviar";
		}
	}

	async onClose(): Promise<void> {
		// noop
	}
}

// ─── Modal de prompt rápido ────────────────────────────────────────────────────

class QuickPromptModal extends Modal {
	private plugin: JCClaudePlugin;
	private selectedText: string;
	private action: string;

	constructor(app: App, plugin: JCClaudePlugin, selectedText: string, action: string) {
		super(app);
		this.plugin = plugin;
		this.selectedText = selectedText;
		this.action = action;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.addClass("jc-claude-modal");
		contentEl.createEl("h3", { text: `Claude: ${this.action}` });

		const preview = contentEl.createEl("blockquote", {
			cls: "jc-claude-modal-preview",
		});
		preview.textContent =
			this.selectedText.length > 300
				? this.selectedText.slice(0, 300) + "..."
				: this.selectedText;

		const resultArea = contentEl.createDiv("jc-claude-modal-result");
		resultArea.textContent = "Aguardando resultado...";

		this.runAction(resultArea);

		const btnRow = contentEl.createDiv("jc-claude-modal-btns");

		const insertBtn = btnRow.createEl("button", {
			cls: "mod-cta",
			text: "Inserir na nota",
		});
		insertBtn.disabled = true;
		insertBtn.addEventListener("click", () => {
			this.insertResult(resultArea.textContent ?? "");
			this.close();
		});

		const copyBtn = btnRow.createEl("button", { text: "Copiar" });
		copyBtn.disabled = true;
		copyBtn.addEventListener("click", () => {
			navigator.clipboard.writeText(resultArea.textContent ?? "");
			new Notice("Copiado!");
		});

		const closeBtn = btnRow.createEl("button", { text: "Fechar" });
		closeBtn.addEventListener("click", () => this.close());

		// Habilitar botões depois do resultado
		const observer = new MutationObserver(() => {
			insertBtn.disabled = false;
			copyBtn.disabled = false;
		});
		observer.observe(resultArea, { childList: true, characterData: true, subtree: true });
	}

	private async runAction(resultArea: HTMLElement): Promise<void> {
		const prompts: Record<string, string> = {
			Resumir: `Resuma o seguinte texto de forma concisa:\n\n${this.selectedText}`,
			Melhorar: `Melhore a escrita do seguinte texto, mantendo o sentido original:\n\n${this.selectedText}`,
			Explicar: `Explique o seguinte conteúdo de forma clara e didática:\n\n${this.selectedText}`,
			Traduzir: `Traduza o seguinte texto para inglês:\n\n${this.selectedText}`,
			"Gerar ideias": `Com base no seguinte texto, gere 5 ideias criativas relacionadas:\n\n${this.selectedText}`,
		};

		const prompt = prompts[this.action] ?? `${this.action}:\n\n${this.selectedText}`;

		try {
			const result = await this.plugin.callClaude([{ role: "user", content: prompt }]);
			resultArea.textContent = result;
		} catch (err) {
			const errMsg = err instanceof Error ? err.message : String(err);
			resultArea.textContent = `Erro: ${errMsg}`;
		}
	}

	private insertResult(text: string): void {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return;
		const editor = view.editor;
		const selection = editor.getSelection();
		if (selection) {
			editor.replaceSelection(`${selection}\n\n${text}`);
		} else {
			editor.replaceRange(text, editor.getCursor());
		}
		new Notice("Inserido na nota.");
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

// ─── Configurações ─────────────────────────────────────────────────────────────

class JCClaudeSettingTab extends PluginSettingTab {
	private plugin: JCClaudePlugin;

	constructor(app: App, plugin: JCClaudePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", { text: "JC Claude AI — Configurações" });

		new Setting(containerEl)
			.setName("Chave de API")
			.setDesc("Sua chave de API da Anthropic (começa com sk-ant-...)")
			.addText((text) =>
				text
					.setPlaceholder("sk-ant-...")
					.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
						this.plugin.settings.apiKey = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Modelo")
			.setDesc("Modelo Claude a utilizar")
			.addDropdown((drop) =>
				drop
					.addOption("claude-haiku-4-5-20251001", "Claude Haiku 4.5 (rápido)")
					.addOption("claude-sonnet-4-6", "Claude Sonnet 4.6 (recomendado)")
					.addOption("claude-opus-4-7", "Claude Opus 4.7 (mais capaz)")
					.setValue(this.plugin.settings.model)
					.onChange(async (value) => {
						this.plugin.settings.model = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Máximo de tokens")
			.setDesc("Limite de tokens na resposta (1000–8000)")
			.addSlider((slider) =>
				slider
					.setLimits(1000, 8000, 500)
					.setValue(this.plugin.settings.maxTokens)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.maxTokens = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Temperatura")
			.setDesc("Criatividade das respostas (0 = preciso, 1 = criativo)")
			.addSlider((slider) =>
				slider
					.setLimits(0, 1, 0.1)
					.setValue(this.plugin.settings.temperature)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.temperature = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Prompt do sistema")
			.setDesc("Instrução base enviada ao Claude em todas as conversas")
			.addTextArea((area) =>
				area
					.setPlaceholder("Você é um assistente...")
					.setValue(this.plugin.settings.systemPrompt)
					.onChange(async (value) => {
						this.plugin.settings.systemPrompt = value;
						await this.plugin.saveSettings();
					})
			);
	}
}

// ─── Plugin principal ─────────────────────────────────────────────────────────

export default class JCClaudePlugin extends Plugin {
	settings: JCClaudeSettings;

	async onload(): Promise<void> {
		await this.loadSettings();

		// Registrar a view do painel
		this.registerView(VIEW_TYPE_CLAUDE, (leaf) => new ClaudeView(leaf, this));

		// Ícone na barra lateral
		this.addRibbonIcon("bot", "Abrir Claude AI", () => {
			this.activateView();
		});

		// Barra de status
		const statusBarItem = this.addStatusBarItem();
		statusBarItem.setText("Claude AI");

		// Comandos de menu
		this.addCommand({
			id: "open-claude-panel",
			name: "Abrir painel Claude AI",
			callback: () => this.activateView(),
		});

		this.addCommand({
			id: "claude-summarize-selection",
			name: "Resumir texto selecionado",
			editorCallback: (editor: Editor) => {
				const sel = editor.getSelection();
				if (!sel) { new Notice("Selecione um texto primeiro."); return; }
				new QuickPromptModal(this.app, this, sel, "Resumir").open();
			},
		});

		this.addCommand({
			id: "claude-improve-selection",
			name: "Melhorar escrita do texto selecionado",
			editorCallback: (editor: Editor) => {
				const sel = editor.getSelection();
				if (!sel) { new Notice("Selecione um texto primeiro."); return; }
				new QuickPromptModal(this.app, this, sel, "Melhorar").open();
			},
		});

		this.addCommand({
			id: "claude-explain-selection",
			name: "Explicar texto selecionado",
			editorCallback: (editor: Editor) => {
				const sel = editor.getSelection();
				if (!sel) { new Notice("Selecione um texto primeiro."); return; }
				new QuickPromptModal(this.app, this, sel, "Explicar").open();
			},
		});

		this.addCommand({
			id: "claude-generate-ideas",
			name: "Gerar ideias a partir da seleção",
			editorCallback: (editor: Editor) => {
				const sel = editor.getSelection();
				if (!sel) { new Notice("Selecione um texto primeiro."); return; }
				new QuickPromptModal(this.app, this, sel, "Gerar ideias").open();
			},
		});

		this.addCommand({
			id: "claude-translate-selection",
			name: "Traduzir texto selecionado para inglês",
			editorCallback: (editor: Editor) => {
				const sel = editor.getSelection();
				if (!sel) { new Notice("Selecione um texto primeiro."); return; }
				new QuickPromptModal(this.app, this, sel, "Traduzir").open();
			},
		});

		// Menu de contexto do editor
		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor) => {
				const sel = editor.getSelection();
				if (!sel) return;

				menu.addSeparator();
				menu.addItem((item) =>
					item.setTitle("Claude: Resumir").setIcon("bot").onClick(() => {
						new QuickPromptModal(this.app, this, sel, "Resumir").open();
					})
				);
				menu.addItem((item) =>
					item.setTitle("Claude: Melhorar escrita").setIcon("bot").onClick(() => {
						new QuickPromptModal(this.app, this, sel, "Melhorar").open();
					})
				);
				menu.addItem((item) =>
					item.setTitle("Claude: Explicar").setIcon("bot").onClick(() => {
						new QuickPromptModal(this.app, this, sel, "Explicar").open();
					})
				);
				menu.addItem((item) =>
					item.setTitle("Claude: Gerar ideias").setIcon("bot").onClick(() => {
						new QuickPromptModal(this.app, this, sel, "Gerar ideias").open();
					})
				);
			})
		);

		// Aba de configurações
		this.addSettingTab(new JCClaudeSettingTab(this.app, this));
	}

	async onunload(): Promise<void> {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_CLAUDE);
	}

	async activateView(): Promise<void> {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_CLAUDE)[0];

		if (!leaf) {
			leaf = workspace.getRightLeaf(false) ?? workspace.getLeaf(true);
			await leaf.setViewState({ type: VIEW_TYPE_CLAUDE, active: true });
		}

		workspace.revealLeaf(leaf);
	}

	async callClaude(messages: Message[]): Promise<string> {
		const response = await requestUrl({
			url: "https://api.anthropic.com/v1/messages",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": this.settings.apiKey,
				"anthropic-version": "2023-06-01",
			},
			body: JSON.stringify({
				model: this.settings.model,
				max_tokens: this.settings.maxTokens,
				system: this.settings.systemPrompt,
				messages,
			}),
		});

		if (response.status !== 200) {
			const body = response.json as { error?: { message?: string } };
			throw new Error(body?.error?.message ?? `HTTP ${response.status}`);
		}

		const body = response.json as {
			content: Array<{ type: string; text: string }>;
		};
		return body.content.find((c) => c.type === "text")?.text ?? "";
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
