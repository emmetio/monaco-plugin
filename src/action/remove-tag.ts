import { TextRange } from '@emmetio/action-utils';
import { getTagContext, ContextTag } from '../lib/plugin';
import { narrowToNonSpace, isSpace as isSpaceText, substr, textRangeEmpty, toRange, updateSelection } from '../lib/utils';
import { lineIndent } from '../lib/output';
import { Editor, EditOperation, Selection } from '../lib/types';

export default function removeTagCommand(editor: Editor): void {
    const sels = editor.getSelections();
    const model = editor.getModel();

    if (!sels || !model) {
        return;
    }

    let edits: EditOperation[] = [];
    const nextRanges: Selection[] = sels.map(sel => {
        const pt = model.getOffsetAt(sel.getStartPosition());
        const tag = getTagContext(editor, pt);
        if (tag) {
            edits = edits.concat(removeTag(editor, tag));
            return updateSelection(editor, sel, tag.open[0]);
        }

        return sel;
    });

    if (edits.length) {
        editor.executeEdits('emmetRemoveTag', edits, nextRanges);
        editor.pushUndoStop();
    }
}

function removeTag(editor: Editor, { open, close }: ContextTag): EditOperation[] {
    const result: EditOperation[] = [];
    const model = editor.getModel();

    if (close && model) {
        // Remove open and close tag and dedent inner content
        const innerRange = narrowToNonSpace(editor, [open[1], close[0]]);
        if (!textRangeEmpty(innerRange)) {
            // Gracefully remove open and close tags and tweak indentation on tag contents
            result.push({
                text: '',
                range: toRange(editor, [innerRange[1], close[1]])
            });

            const start = model.getPositionAt(open[0]);
            const end = model.getPositionAt(close[1]);
            if (start.lineNumber !== end.lineNumber) {
                // Skip two lines: first one for open tag, on second one
                // indentation will be removed with open tag
                let line = start.lineNumber + 2;
                const baseIndent = getLineIndent(editor, open[0]);
                const innerIndent = getLineIndent(editor, innerRange[0]);

                while (line <= end.lineNumber) {
                    const lineStart = model.getOffsetAt({ lineNumber: line, column: 1 });
                    const indentRange: TextRange = [lineStart, lineStart + innerIndent.length];
                    if (isSpaceText(substr(editor, indentRange))) {
                        result.push({
                            range: toRange(editor, indentRange),
                            text: baseIndent
                        });
                    }
                    line++;
                }
            }

            result.push({
                range: toRange(editor, [open[0], innerRange[0]]),
                text: ''
            });
        } else {
            result.push({
                range: toRange(editor, [open[0], close[1]]),
                text: ''
            });
        }
    } else {
        result.push({
            range: toRange(editor, open),
            text: ''
        });
    }

    return result;
}

/**
 * Returns indentation for line found from given character location
 */
function getLineIndent(editor: Editor, ix: number): string {
    const model = editor.getModel()!;
    return lineIndent(editor, model.getPositionAt(ix).lineNumber);
}
