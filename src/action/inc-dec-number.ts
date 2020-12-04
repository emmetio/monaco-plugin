import { isNumber } from '@emmetio/scanner';
import { Editor, EditOperation, Selection } from '../lib/types';

export default function incrementNumber(editor: Editor, delta = 1): void {
    const edits: EditOperation[] = [];

    const sels = editor.getSelections();
    const model = editor.getModel();
    if (!sels || !model) {
        return;
    }

    const nextSelections: Selection[] = sels.map(sel => {
        if (sel.isEmpty()) {
            // No selection, extract number
            const line = model.getLineContent(sel.startLineNumber);
            const offset = sel.startColumn - 1;
            const numRange = extractNumber(line, offset);
            console.log('num range', numRange);

            if (numRange) {
                sel = sel.setStartPosition(sel.startLineNumber, numRange[0] + 1);
                sel = sel.setEndPosition(sel.endLineNumber, numRange[1] + 1);
                console.log('modified sel', sel);
            }
        }

        if (!sel.isEmpty()) {
            // Try to update value in given region
            const value = updateNumber(model.getValueInRange(sel), delta);
            edits.push({
                range: sel,
                text: value,
            });

            sel = sel.setEndPosition(sel.endLineNumber, sel.startColumn + value.length);
        }

        return sel;
    });

    if (edits.length) {
        editor.executeEdits(null, edits, nextSelections);
    }
}

/**
 * Extracts number from text at given location
 */
function extractNumber(text: string, pos: number): [number, number] | undefined {
    let hasDot = false;
    let end = pos;
    let start = pos;
    let ch: number;
    const len = text.length;

    // Read ahead for possible numbers
    while (end < len) {
        ch = text.charCodeAt(end);
        if (isDot(ch)) {
            if (hasDot) {
                break;
            }
            hasDot = true;
        } else if (!isNumber(ch)) {
            break;
        }
        end++;
    }

    // Read backward for possible numerics
    while (start >= 0) {
        ch = text.charCodeAt(start - 1);
        if (isDot(ch)) {
            if (hasDot) {
                break;
            }
            hasDot = true;
        } else if (!isNumber(ch)) {
            break;
        }
        start--;
    }

    // Negative number?
    if (start > 0 && text[start - 1] === '-') {
        start--;
    }

    if (start !== end) {
        return [start, end];
    }
}

function updateNumber(num: string, delta: number, precision = 3): string {
    const value = parseFloat(num) + delta;

    if (isNaN(value)) {
        return num;
    }

    const neg = value < 0;
    let result = Math.abs(value).toFixed(precision);

    // Trim trailing zeroes and optionally decimal number
    result = result.replace(/\.?0+$/, '');

    // Trim leading zero if input value doesn't have it
    if ((num[0] === '.' || num.startsWith('-.')) && result[0] === '0') {
        result = result.slice(1);
    }

    return (neg ? '-' : '') + result;
}

function isDot(ch: number) {
    return ch === 46;
}
