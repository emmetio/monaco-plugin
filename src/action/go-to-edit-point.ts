import { Editor } from '../lib/types';
import { getContent, isQuote, isSpace, getCaret } from '../lib/utils';

export default function goToEditPoint(editor: Editor, inc: number): void {
    const model = editor.getModel();
    if (model) {
        const caret = getCaret(editor);
        const pos = findNewEditPoint(editor, caret + inc, inc);
        if (pos != null) {
            editor.setPosition(model.getPositionAt(pos));
        }
    }
}

function findNewEditPoint(editor: Editor, pos: number, inc: number): number | undefined {
    const doc = getContent(editor);
    const docSize = doc.length;
    let curPos = pos;

    while (curPos < docSize && curPos >= 0) {
        curPos += inc;
        const cur = doc[curPos];
        const next = doc[curPos + 1];
        const prev = doc[curPos - 1];

        if (isQuote(cur) && next === cur && prev === '=') {
            // Empty attribute value
            return curPos + 1;
        }

        if (cur === '<' && prev === '>') {
            // Between tags
            return curPos;
        }

        if (isNewLine(cur)) {
            const model = editor.getModel();
            if (model) {
                const pt = model.getPositionAt(curPos);
                const line = model.getLineContent(pt.lineNumber);
                if (!line || isSpace(line)) {
                    // Empty line
                    return model.getOffsetAt({
                        lineNumber: pt.lineNumber,
                        column: line.length + 1
                    });
                }
            }
        }
    }
}

function isNewLine(ch: string) {
    return ch === '\r' || ch === '\n';
}
