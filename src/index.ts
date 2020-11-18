import type * as monaco from 'monaco-editor';
import type { TextRange } from '@emmetio/action-utils';
import type { UserConfig } from 'emmet';
import type { Editor } from './lib/types';
import { expandAbbreviation, extract, getOptions } from './lib/plugin';
import { getSyntaxType } from './lib/syntax';
import { getCaret, getLineRange, replaceWithSnippet, substr } from './lib/utils';

// TODO find better solution to re-use Monaco keys but not re-export entire bundle
const enum KeyCode {
    Ctrl = 2048,
    KEY_E = 35
}

export default function emmetPlugin(editor: monaco.editor.IStandaloneCodeEditor): void {
    // TODO return callback to dispose Emmet bindings
    editor.addAction({
        id: 'emmet.expand-abbreviation',
        label: 'Emmet: Expand Abbreviation',
        keybindings: [
            KeyCode.Ctrl | KeyCode.KEY_E
        ],
        run(ed) {
            const model = editor.getModel()!
            const caret = getCaret(ed);
            const pos = model.getPositionAt(caret);
            const lineRange = getLineRange(ed, caret);
            const options = getOptions(ed, caret);
            const line = substr(ed, lineRange);

            // NB: in Monaco text positions are 1-based
            const column = pos.column - 1;

            console.log('editor state:', { lineRange, line, pos, caret, mPos: editor.getPosition() });
            const abbr = extract(line, column, getSyntaxType(options.syntax));

            console.log('extracted abbr', abbr);

            if (abbr) {
                const offset = caret - column;
                runExpand(ed, abbr.abbreviation, [abbr.start + offset, abbr.end + offset], options);
            }
        }
    });
}

function runExpand(editor: Editor, abbr: string, range: TextRange, options?: UserConfig) {
    const snippet = expandAbbreviation(abbr, options);
    replaceWithSnippet(editor, range, snippet);
}
