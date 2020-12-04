import { TextRange } from '@emmetio/action-utils';
import { isCSS, isHTML, docSyntax } from '../lib/syntax';
import { getContent, toRange, toTextRange, textRangesEqual, textRangeContains } from '../lib/utils';
import { selectItem } from '../lib/plugin';
import { Editor } from '../lib/types';

export default function selectItemCommand(editor: Editor, isPrev = false): void {
    const syntax = docSyntax(editor);
    const sel = editor.getSelection();
    const model = editor.getModel();

    if (!model || !sel) {
        return;
    }

    if (!isCSS(syntax) && !isHTML(syntax)) {
        return;
    }

    const selRange = toTextRange(editor, sel);
    const code = getContent(editor);

    // TODO should cache model until editor contents is modified
    let selModel = selectItem(code, selRange[0], isCSS(syntax), isPrev);

    if (selModel) {
        let range = findRange(selRange, selModel.ranges, isPrev);
        if (!range) {
            // Out of available selection range, move to next item
            const nextPos = isPrev ? selModel.start : selModel.end;
            selModel = selectItem(code, nextPos, isCSS(syntax), isPrev);
            if (selModel) {
                range = findRange(selRange, selModel.ranges, isPrev)
            }
        }

        if (range) {
            editor.setSelection(toRange(editor, range));
        }
    }
}

function findRange(sel: TextRange, ranges: TextRange[], reverse = false) {
    if (reverse) {
        ranges = ranges.slice().reverse();
    }

    let getNext = false;
    let candidate: TextRange | undefined;

    for (const r of ranges) {
        if (getNext) {
            return r;
        }
        if (textRangesEqual(r, sel)) {
            // This range is currently selected, request next
            getNext = true;
        } else if (!candidate && (textRangeContains(r, sel) || (reverse && r[0] <= sel[0]) || (!reverse && r[0] >= sel[0]))) {
            candidate = r;
        }
    }

    if (!getNext) {
        return candidate;
    }
}
