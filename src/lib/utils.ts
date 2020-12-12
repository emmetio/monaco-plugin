import type * as monaco from 'monaco-editor';
import { AttributeToken } from '@emmetio/html-matcher';
import { CSSProperty, TextRange } from '@emmetio/action-utils';
import { Editor, MonacoID, Selection, SnippetController2 } from './types';

export interface AbbrError {
    message: string,
    pos: number
}

interface ReplaceParams {
    selections?: monaco.Selection[] | null;
    skipUndo?: boolean
}

export type DisposeFn = () => void;

export const pairs = {
    '{': '}',
    '[': ']',
    '(': ')'
};

export const pairsEnd: string[] = [];
for (const key of Object.keys(pairs)) {
    pairsEnd.push(pairs[key]);
}

/**
 * Returns copy of region which starts and ends at non-space character
 */
export function narrowToNonSpace(editor: Editor, range: TextRange): TextRange {
    const text = substr(editor, range);
    let startOffset = 0;
    let endOffset = text.length;

    while (startOffset < endOffset && isSpace(text[startOffset])) {
        startOffset++;
    }

    while (endOffset > startOffset && isSpace(text[endOffset - 1])) {
        endOffset--;
    }

    return [range[0] + startOffset, range[0] + endOffset];
}

/**
 * Replaces given range in editor with snippet contents
 */
export function replaceWithSnippet(editor: Editor, range: TextRange, snippet: string, params?: Partial<ReplaceParams>): void {
    const model = editor.getModel()!;
    const controller = editor.getContribution(MonacoID.SnippetController) as SnippetController2;
    const selections = params?.selections || editor.getSelections();
    const pushUndo = !params?.skipUndo;

    let destSel = editor.getSelection();
    if (destSel) {
        destSel = updateSelection(editor, destSel, range[0]);
    }

    if (pushUndo) {
        model.pushStackElement();
    }

    model.pushEditOperations(selections, [{
        text: '',
        range: toRange(editor, range)
    }], () => destSel ? [destSel] : null);

    controller.insert(snippet, {
        undoStopAfter: false,
        undoStopBefore: false
    });

    if (pushUndo) {
        model.pushStackElement();
    }
}

/**
 * Returns current caret position for single selection
 */
export function getCaret(editor: Editor): number {
    const pos = editor.getSelection();
    const model = editor.getModel();
    if (model && pos) {
        return model.getOffsetAt(pos.getPosition());
    }

    return -1;
}

/**
 * Returns full text content of given editor
 */
export function getContent(editor: Editor): string {
    return editor.getValue();
}

/**
 * Returns substring of given editor content for specified range
 */
export function substr(editor: Editor, range: TextRange): string {
    return editor.getModel()!.getValueInRange(toRange(editor, range));
}

/**
 * Returns range of line at given location
 */
export function getLineRange(editor: Editor, pos: number): TextRange {
    const model = editor.getModel()!;
    const mPos = model.getPositionAt(pos);
    const startCol = model.getLineMinColumn(mPos.lineNumber);
    const endCol = model.getLineMaxColumn(mPos.lineNumber);

    return [
        model.getOffsetAt({ column: startCol, lineNumber: mPos.lineNumber }),
        model.getOffsetAt({ column: endCol, lineNumber: mPos.lineNumber }),
    ]
}

/**
 * Converts given index range to editor’s position range
 */
export function toRange(editor: Editor, range: TextRange): monaco.IRange {
    const model = editor.getModel()!;
    const from = model.getPositionAt(range[0]);
    const to = model.getPositionAt(range[1]);

    return {
        startColumn: from.column,
        startLineNumber: from.lineNumber,
        endColumn: to.column,
        endLineNumber: to.lineNumber,
    };
}

export function toTextRange(editor: Editor, range: monaco.IRange): TextRange {
    const model = editor.getModel()!;
    return [
        model.getOffsetAt({ column: range.startColumn, lineNumber: range.startLineNumber }),
        model.getOffsetAt({ column: range.endColumn, lineNumber: range.endLineNumber })
    ];
}

/**
 * Converts given Monaco range to selection object
 */
export function rangeToSelection(range: monaco.IRange): monaco.ISelection {
    return {
        selectionStartColumn: range.startColumn,
        selectionStartLineNumber: range.startLineNumber,
        positionColumn: range.endColumn,
        positionLineNumber: range.endLineNumber
    };
}

/**
 * Returns value of given attribute, parsed by Emmet HTML matcher
 */
export function attributeValue(attr: AttributeToken): string | undefined {
    const { value } = attr
    return value && isQuoted(value)
        ? value.slice(1, -1)
        : value;
}

/**
 * Returns region that covers entire attribute
 */
export function attributeRange(attr: AttributeToken): TextRange {
    const end = attr.valueEnd != null ? attr.valueEnd : attr.nameEnd;
    return [attr.nameStart, end];
}

/**
 * Returns patched version of given HTML attribute, parsed by Emmet HTML matcher
 */
export function patchAttribute(attr: AttributeToken, value: string | number, name = attr.name): string {
    let before = '';
    let after = '';

    if (attr.value != null) {
        if (isQuoted(attr.value)) {
            // Quoted value or React-like expression
            before = attr.value[0];
            after = attr.value[attr.value.length - 1];
        }
    } else {
        // Attribute without value (boolean)
        before = after = '"';
    }

    return `${name}=${before}${value}${after}`;
}

/**
 * Returns patched version of given CSS property, parsed by Emmet CSS matcher
 */
export function patchProperty(editor: Editor, prop: CSSProperty, value: string, name?: string): string {
    if (name == null) {
        name = substr(editor, prop.name);
    }

    const before = substr(editor, [prop.before, prop.name[0]]);
    const between = substr(editor, [prop.name[1], prop.value[0]]);
    const after = substr(editor, [prop.value[1], prop.after]);

    return [before, name, between, value, after].join('');
}

/**
 * Check if given value is either quoted or written as expression
 */
export function isQuoted(value: string | undefined): boolean {
    return !!value && (isQuotedString(value) || isExprString(value));
}

export function isQuote(ch: string | undefined): boolean {
    return ch === '"' || ch === "'";
}

/**
 * Check if given string is quoted with single or double quotes
 */
export function isQuotedString(str: string): boolean {
    return str.length > 1 && isQuote(str[0]) && str[0] === str.slice(-1);
}

/**
 * Check if given string contains expression, e.g. wrapped with `{` and `}`
 */
function isExprString(str: string): boolean {
    return str[0] === '{' && str.slice(-1) === '}';
}

export function isSpace(ch: string): boolean {
    return /^[\s\n\r]+$/.test(ch);
}

export function htmlEscape(str: string): string {
    const replaceMap = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
    };
    return str.replace(/[<>&]/g, ch => replaceMap[ch]);
}

/**
 * Check if `a` and `b` contains the same range
 */
export function textRangesEqual(a: TextRange, b: TextRange): boolean {
    return a[0] === b[0] && a[1] === b[1];
}

/**
 * Check if `a` and `b` contains the same range
 */
export function rangesEqual(a: monaco.IRange, b: monaco.IRange): boolean {
    return compareStart(a, b) === 0
        && compareEnd(a, b) === 0;
}

/**
 * Check if range `a` fully contains range `b`
 */
export function textRangeContains(a: TextRange, b: TextRange): boolean {
    return a[0] <= b[0] && a[1] >= b[1];
}

/**
 * Check if range `a` fully contains range `b`
 */
export function rangeContains(a: monaco.IRange, b: monaco.IRange): boolean {
    return compareStart(a, b) <= 0
        && compareEnd(a, b) >= 0;
}

/**
 * Check if given range is empty
 */
export function textRangeEmpty(r: TextRange): boolean {
    return r[0] === r[1];
}

/**
 * Check if given range is empty
 */
export function rangeEmpty(r: monaco.IRange): boolean {
    return r.startColumn === r.endColumn
        && r.startLineNumber === r.endLineNumber;
}

/**
 * Compares start edge of given ranges.
 * Returned values:
 * `-1`: `a` is less than `b`
 * `0`: `a` equals to `b`
 * `1`: `a` is greater than `b`
 */
export function compareStart(a: monaco.IRange, b: monaco.IRange): number {
    return comparePositions(a.startColumn, a.startLineNumber, b.startColumn, b.endLineNumber);
}

/**
 * Compares end edge of given ranges.
 * Returned values:
 * `-1`: `a` is less than `b`
 * `0`: `a` equals to `b`
 * `1`: `a` is greater than `b`
 */
export function compareEnd(a: monaco.IRange, b: monaco.IRange): number {
    return comparePositions(a.endColumn, a.endLineNumber, b.endColumn, b.endLineNumber);
}

/**
 * Compares logical position of text locations
 * Returned values:
 * `-1`: `a` is less than `b`
 * `0`: `a` equals `b`
 * `1`: `a` is greater than `b`
 */
export function comparePositions(aColumn: number, aLine: number, bColumn: number, bLine: number): number {
    if (aLine < bLine) {
        return -1;
    }

    if (aLine > bLine) {
        return 1;
    }

    // Ranges are on the same line
    if (aColumn === bColumn) {
        return 0;
    }

    return aColumn < bColumn ? -1 : 1;
}

/**
 * Generates snippet with error pointer
 */
export function errorSnippet(err: AbbrError, baseClass = 'emmet-error-snippet'): string {
    const msg = err.message.split('\n')[0];
    const spacer = ' '.repeat(err.pos || 0);
    return `<div class="${baseClass}">
        <div class="${baseClass}-ptr">
            <div class="${baseClass}-line"></div>
            <div class="${baseClass}-tip"></div>
            <div class="${baseClass}-spacer">${spacer}</div>
        </div>
        <div class="${baseClass}-message">${htmlEscape(msg.replace(/\s+at\s+\d+$/, ''))}</div>
    </div>`;
}

/**
 * Returns last element in given array
 */
export function last<T>(arr: T[]): T | undefined {
    return arr.length > 0 ? arr[arr.length - 1] : undefined;
}

/**
 * Collapses given selection to a single position, specified as character offset
 */
export function updateSelection(editor: Editor, sel: Selection, pos: number): Selection {
    const model = editor.getModel()!
    const p = model.getPositionAt(pos);
    // XXX Better solution would be to use `new monaco.Selection()` to create
    // a new instance but it will complicate plugin bundling since it will require
    // external `monaco-editor` dependency to be feeded somehow into plugin
    return sel
        .setEndPosition(p.lineNumber, p.column)
        .setStartPosition(p.lineNumber, p.column)
}
