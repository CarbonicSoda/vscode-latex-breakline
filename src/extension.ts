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

	const segRE = RegExp(`.+?(?:${eol}){2,}|.+?$`, "gs");

	for (const segMatch of src.matchAll(segRE)) {
		const segment = segMatch[0];

		const segs: string[][] = [[]];

		let currIdx = 0;
		let currLen = 0;
		for (const wordMatch of segment.matchAll(
			/(?<br>\\\S+?{[^}]*?\n[^}]*?})|(?<br>\n\\\S+?\r?(?:\n|$))|\S+/gs,
		)) {
			const nonEmpty = currLen !== 0;

			const word = wordMatch[0].trim();
			currLen += word.length + 1;

			if (nonEmpty && wordMatch.groups?.br) {
				segs[++currIdx] = [word];
				segs[++currIdx] = [];
				currLen = 0;
				continue;
			}

			if (nonEmpty && currLen > 80) {
				segs[++currIdx] = [word];
				currLen = word.length + 1;
				continue;
			}

			if (/^\p{P}$/u.test(word)) {
				if (nonEmpty) {
					segs[currIdx][segs[currIdx].length - 1] += word;
				} else if (segs.length > 1) {
					segs[currIdx - 1][segs[currIdx - 1].length - 1] += word;
				} else {
					segs[currIdx].push(word);
				}
				continue;
			}

			segs[currIdx].push(word);
		}

		const formatted = segs
			.map((words) => words.join(" "))
			.join(eol)
			.trimEnd();

		const start = segMatch.index;
		const end = start + segment.length;
		const range = new Range(doc.positionAt(start), doc.positionAt(end));

		edit.replace(range, formatted + eol.repeat(2));
	}
}
