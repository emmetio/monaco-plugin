import { Options } from 'emmet';
import { getEmmetConfig } from './config';
import { isHTML, docSyntax } from './syntax';
import type { Editor } from './types';

export default function getOutputOptions(editor: Editor, pos?: number, inline?: boolean): Partial<Options> {
    const model = editor.getModel()!;
    const posObj = pos != null ? model.getPositionAt(pos)! : editor.getPosition()!;
    const syntax = docSyntax(editor) || 'html';
    const config = getEmmetConfig();

    const opt: Partial<Options> = {
        'output.baseIndent': lineIndent(editor, posObj.lineNumber),
        'output.indent': getIndentation(editor),
        'output.field': field,
        'output.format': !inline,
        'output.attributeQuotes': config.attributeQuotes
    };

    if (syntax === 'html') {
        opt['output.selfClosingStyle'] = config.markupStyle;
        opt['output.compactBoolean'] = config.markupStyle === 'html';
    }

    if (isHTML(syntax)) {
        if (config.comments) {
            opt['comment.enabled'] = true;
            if (config.commentsTemplate) {
                opt['comment.after'] = config.commentsTemplate;
            }
        }

        opt['bem.enabled'] = config.bem;
        opt['stylesheet.shortHex'] = config.shortHex;
    }

    return opt;
}

/**
 * Produces tabstop for CodeMirror editor
 */
export function field(index: number, placeholder: string): string {
    return placeholder ? `\${${index}:${placeholder}}` : `\${${index}}`;
}

/**
 * Returns indentation of given line
 */
export function lineIndent(editor: Editor, line: number): string {
    const model = editor.getModel()!;
    const lineStr = model.getLineContent(line);
    const indent = lineStr.match(/^\s+/);
    return indent ? indent[0] : '';
}

/**
 * Returns token used for single indentation in given editor
 */
export function getIndentation(editor: Editor): string {
    const opt = editor.getModel()!.getOptions();
    if (opt.insertSpaces) {
        return ' '.repeat(opt.indentSize);
    }

    return '\t';
}
