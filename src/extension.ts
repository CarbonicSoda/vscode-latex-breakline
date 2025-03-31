import {
	commands,
	EndOfLine,
	ExtensionContext,
	Range,
	TextEditor,
	TextEditorEdit,
} from "vscode";

export function activate(context: ExtensionContext): void {
	context.subscriptions.push(
		commands.registerTextEditorCommand("latex-breakline.breakline", breakline),
	);
}

export function deactivate(): void {}

function breakline(editor: TextEditor, edit: TextEditorEdit): void {
	const doc = editor.document;
	const src = doc.getText();
	const eol = doc.eol === EndOfLine.LF ? "\n" : "\r\n";

	const segRE = RegExp(`.+?(?:${eol}){2,}`, "gs");

	for (const match of src.matchAll(segRE)) {
		const segment = match[0];

		const lines: string[][] = [];

		let currIdx = 0;
		let currLen = 0;
		for (const word of segment.split(/\s+/s)) {
			if (!lines[currIdx]) lines[currIdx] = [];
			lines[currIdx].push(word);

			currLen += word.length;
			if (currLen > 80) {
				currIdx++;
				currLen = 0;
			}
		}

		const formatted = lines.map((line) => line.join(" ")).join(eol);

		const start = match.index;
		const end = start + segment.length;
		const range = new Range(doc.positionAt(start), doc.positionAt(end));

		edit.replace(range, formatted + eol.repeat(2));
	}
}
