import * as monaco from 'monaco-editor';
import { AttributeToken } from '@emmetio/html-matcher';
import { CSSProperty, TextRange } from '@emmetio/action-utils';
import { PluginID, Editor, MonacoID, SnippetController2 } from './types';

export interface AbbrError {
    message: string,
    pos: number
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
export function replaceWithSnippet(editor: Editor, range: TextRange, snippet: string): void {
    editor.executeEdits(PluginID, [{
        range: toRange(editor, range),
        text: ''
    }]);

    const controller = editor.getContribution(MonacoID.SnippetController) as SnippetController2;
    controller.insert(snippet);
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
export function rangesEqual(a: TextRange, b: TextRange): boolean {
    return a[0] === b[0] && a[1] === b[1];
}

/**
 * Check if range `a` fully contains range `b`
 */
export function rangeContains(a: TextRange, b: TextRange): boolean {
    return a[0] <= b[0] && a[1] >= b[1];
}

/**
 * Check if given range is empty
 */
export function rangeEmpty(r: TextRange): boolean {
    return r[0] === r[1];
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
