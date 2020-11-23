import type { TextRange } from '@emmetio/action-utils';
import type { UserConfig } from 'emmet';
import { extract, getOptions, expandAbbreviation } from '../lib/plugin';
import { getSyntaxType } from '../lib/syntax';
import { Editor } from '../lib/types';
import { getCaret, getLineRange, replaceWithSnippet, substr } from '../lib/utils';

/**
 * Expands abbreviation at current caret location
 */
export default function expand(ed: Editor): void {
    const model = ed.getModel()!
    const caret = getCaret(ed);
    const pos = model.getPositionAt(caret);
    const lineRange = getLineRange(ed, caret);
    const options = getOptions(ed, caret);
    const line = substr(ed, lineRange);

    // NB: in Monaco text positions are 1-based
    const column = pos.column - 1;
    const abbr = extract(line, column, getSyntaxType(options.syntax));

    if (abbr) {
        const offset = caret - column;
        runExpand(ed, abbr.abbreviation, [abbr.start + offset, abbr.end + offset], options);
    }
}

function runExpand(editor: Editor, abbr: string, range: TextRange, options?: UserConfig) {
    const snippet = expandAbbreviation(abbr, options);
    replaceWithSnippet(editor, range, snippet);
}
