import { evaluateMath } from '../lib/plugin';
import { Editor } from '../lib/types';

export default function evaluateMathCommand(editor: Editor): void {
    const pos = editor.getPosition();
    const model = editor.getModel();
    if (pos && model) {
        const line = model.getLineContent(pos.lineNumber);
        const expr = evaluateMath(line, pos.column - 1);
        if (expr) {
            editor.executeEdits('emmetEvaluateMath', [{
                range: {
                    startLineNumber: pos.lineNumber,
                    startColumn: expr.start + 1,
                    endLineNumber: pos.lineNumber,
                    endColumn: expr.end + 1
                },
                text: expr.snippet,
            }]);
            editor.pushUndoStop();
        }
    }
}
