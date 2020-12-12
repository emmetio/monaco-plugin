import { isXML, syntaxInfo } from '../lib/syntax';
import { getTagContext } from '../lib/plugin';
import { getContent, isSpace, toRange, updateSelection } from '../lib/utils';
import { Editor, EditOperation, Selection } from '../lib/types';

export default function splitJoinTag(editor: Editor): void {
    const selections = editor.getSelections();
    const model = editor.getModel();

    if (!model || !selections) {
        return ;
    }

    const content = getContent(editor);
    const edits: EditOperation[] = [];
    const nextSelections: Selection[] = selections.map(sel => {
        const pt = model.getOffsetAt(sel.getStartPosition());
        const { syntax } = syntaxInfo(editor, pt);
        const tag = getTagContext(editor, pt, isXML(syntax));

        if (tag) {
            const { open, close } = tag;
            if (close) {
                // Join tag: remove tag contents, if any, and add closing slash
                const closing = isSpace(content[open[1] - 2]) ? '/' : ' /';
                edits.push({
                    range: toRange(editor, [open[1], close[1]]),
                    text: ''
                }, {
                    range: toRange(editor, [open[1] - 1, open[1] - 1]),
                    text: closing
                });

                // Do not use `updateSelection` here since it will resolve to invalid
                // location before actual updates are applied
                // sel = updateSelection(editor, sel, open[1] + closing.length);
                const p = model.getPositionAt(open[1]);
                sel = sel
                    .setEndPosition(p.lineNumber, p.column + closing.length)
                    .setStartPosition(p.lineNumber, p.column + closing.length);

                return sel;
            }

            // Split tag: add closing part and remove closing slash
            const endTag = `</${tag.name}>`;

            edits.push({
                range: toRange(editor, [open[1], open[1]]),
                text: endTag
            });

            if (content[open[1] - 2] === '/') {
                let start = open[1] - 2;
                const end = open[1] - 1;
                if (isSpace(content[start - 1])) {
                    start--;
                }

                edits.push({
                    range: toRange(editor, [start, end]),
                    text: ''
                });

                return updateSelection(editor, sel, open[1] - end + start);
            }

            return updateSelection(editor, sel, open[1]);
        }

        return sel;
    });

    if (edits.length) {
        editor.executeEdits('emmetSplitJoinTag', edits, nextSelections);
        editor.pushUndoStop();
    }
}
