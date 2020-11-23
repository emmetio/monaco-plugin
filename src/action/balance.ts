import type * as monaco from 'monaco-editor';
import { TextRange } from '@emmetio/action-utils';
import { isCSS, isXML, docSyntax, isHTML } from '../lib/syntax';
import { balanceCSS, balance } from '../lib/plugin';
import { getContent, toRange, rangeToSelection, toTextRange, textRangesEqual, textRangeContains } from '../lib/utils';
import { Editor } from '../lib/types';

/**
 * Performs balancing in inward direction
 */
export function balanceActionInward(editor: Editor): void {
    const syntax = docSyntax(editor);

    if (isHTML(syntax) || isCSS(syntax)) {
        const result: monaco.IRange[] = [];
        const selections = editor.getSelections();
        const model = editor.getModel();

        if (selections && model) {
            for (const sel of selections) {
                const selRange = toTextRange(editor, sel);
                const ranges = getRanges(editor, selRange[0], syntax, true);

                // Try to find range which equals to selection: we should pick leftmost
                const ix = ranges.findIndex(r => textRangesEqual(selRange, r));
                let targetRange: TextRange | undefined;

                if (ix < ranges.length - 1) {
                    targetRange = ranges[ix + 1];
                } else if (ix !== -1) {
                    // No match found, pick closest region
                    targetRange = ranges.find(r => textRangeContains(r, selRange));
                }

                result.push(toRange(editor, targetRange || selRange));
            }
        }

        if (result.length) {
            editor.setSelections(result.map(rangeToSelection));
        }
    }
}

/**
 * Performs balancing in outward direction
 */
export function balanceActionOutward(editor: Editor): void {
    const syntax = docSyntax(editor);

    if (isHTML(syntax) || isCSS(syntax)) {
        const result: monaco.IRange[] = [];
        const selections = editor.getSelections();
        const model = editor.getModel();

        if (selections && model) {
            for (const sel of selections) {
                const selRange = toTextRange(editor, sel);
                const pos = model.getOffsetAt(sel.getStartPosition());
                const ranges = getRanges(editor, pos, syntax);

                const targetRange = ranges
                    .find(r => textRangeContains(r, selRange) && r[1] > selRange[1]);

                result.push(toRange(editor, targetRange || selRange));
            }
        }

        if (result.length) {
            editor.setSelections(result.map(rangeToSelection));
        }
    }
}

/**
 * Pushes given `range` into `ranges` list on if it’s not the same as last one
 */
function pushRange(ranges: TextRange[], range: TextRange) {
    const last = ranges[ranges.length - 1];
    if (!last || !textRangesEqual(last, range)) {
        ranges.push(range);
    }
}

/**
 * Returns regions for balancing
 */
function getRanges(editor: Editor, pos: number, syntax: string, inward?: boolean): TextRange[] {
    const content = getContent(editor);
    const direction = inward ? 'inward' : 'outward';
    if (isCSS(syntax)) {
        return balanceCSS(content, pos, direction);
    }

    const result: TextRange[] = [];
    const tags = balance(content, pos, direction, isXML(syntax));

    for (const tag of tags) {
        if (tag.close) {
            // Inner range
            pushRange(result, [tag.open[1], tag.close[0]]);
            // Outer range
            pushRange(result, [tag.open[0], tag.close[1]]);
        } else {
            pushRange(result, [tag.open[0], tag.open[1]]);
        }
    }

    return result.sort((a, b) => {
        return inward ? a[0] - b[0] : b[0] - a[0];
    });
}
