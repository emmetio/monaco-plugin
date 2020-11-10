import type * as monaco from 'monaco-editor';
import expand, { AbbreviationContext, MarkupAbbreviation, Options, resolveConfig, StylesheetAbbreviation, UserConfig } from 'emmet';
import match, { balancedInward, balancedOutward, BalancedTag } from '@emmetio/html-matcher';
import { balancedInward as cssBalancedInward, balancedOutward as cssBalancedOutward, Range as CSSRange } from '@emmetio/css-matcher';
import { selectItemHTML, selectItemCSS, getCSSSection, SelectItemModel, CSSSection, TextRange } from '@emmetio/action-utils';
import evaluate, { extract as extractMath, ExtractOptions as MathExtractOptions } from '@emmetio/math-expression';
import { getEmmetConfig } from './config';
import { field } from './output';
import { docSyntax, isXML } from './syntax';
import { isQuotedString } from './utils';

type BalanceDirection = 'inward' | 'outward';

interface EvaluatedMath {
    start: number;
    end: number;
    result: number;
    snippet: string;
}

export interface ContextTag extends AbbreviationContext {
    open: TextRange;
    close?: TextRange;
}

export default class EmmetPlugin {
    /**
    * Cache for storing internal Emmet data.
    * TODO reset whenever user settings are changed
    */
    private cache: Record<string, unknown>;

    constructor(public editor: monaco.editor.IStandaloneCodeEditor) {}

    /**
     * Expands given Emmet abbreviation
     */
    expand(abbr: string | MarkupAbbreviation | StylesheetAbbreviation, config?: UserConfig): string {
        let opt: UserConfig = { cache: this.cache };
        const globalConfig = getEmmetConfig();
        const outputOpt: Partial<Options> = {
            'output.field': field,
            'output.format': !config || !config['inline'],
        };

        if (config) {
            Object.assign(opt, config);
            if (config.options) {
                Object.assign(outputOpt, config.options);
            }
        }

        opt.options = outputOpt;

        if (globalConfig.config) {
            opt = resolveConfig(opt, globalConfig.config);
        }

        return expand(abbr as string, opt);
    }

    /**
     * Returns list of tags for balancing for given code
     */
    balance(code: string, pos: number, direction: BalanceDirection = 'outward', xml = false): BalancedTag[] {
        const options = { xml };
        return direction === 'inward'
            ? balancedInward(code, pos, options)
            : balancedOutward(code, pos, options);
    }

    /**
     * Returns list of tags for balancing for given code
     */
    balanceCSS(code: string, pos: number, direction: BalanceDirection = 'outward'): CSSRange[] {
        return direction === 'inward'
            ? cssBalancedInward(code, pos)
            : cssBalancedOutward(code, pos);
    }

    /**
     * Returns model for selecting next/previous item
     */
    selectItem(code: string, pos: number, isCSS = false, isPrevious = false): SelectItemModel | void {
        if (isCSS) {
            return selectItemCSS(code, pos, isPrevious);
        } else {
            return selectItemHTML(code, pos, isPrevious);
        }
    }

    /**
     * Find enclosing CSS section and returns its ranges with (optionally) parsed properties
     */
    cssSection(code: string, pos: number, properties = false): CSSSection | undefined {
        return getCSSSection(code, pos, properties);
    }

    /**
     * Finds and evaluates math expression at given position in line
     */
    evaluateMath(code: string, pos: number, options?: Partial<MathExtractOptions>): EvaluatedMath | undefined {
        // TODO extract line instead of whole code
        const expr = extractMath(code, pos, options);
        if (expr) {
            try {
                const [start, end] = expr;
                const result = evaluate(code.slice(start, end));
                if (result !== null) {
                    return {
                        start, end, result,
                        snippet: result.toFixed(4).replace(/\.?0+$/, '')
                    };
                }
            } catch (err) {
                console.error(err);
            }
        }
    }

    /**
     * Returns matched HTML/XML tag for given point in view
     */
    getTagContext(pos: number, xml?: boolean): ContextTag | undefined {
        const content = this.getContent();
        let ctx: ContextTag | undefined;

        if (xml == null) {
            // Autodetect XML dialect
            xml = isXML(docSyntax(this.editor));
        }

        const matchedTag = match(content, pos, { xml });
        if (matchedTag) {
            const { open, close } = matchedTag;
            ctx = {
                name: matchedTag.name,
                open,
                close
            };

            if (matchedTag.attributes) {
                ctx.attributes = {};
                matchedTag.attributes.forEach(attr => {
                    let value = attr.value;
                    if (value && isQuotedString(value)) {
                        value = value.slice(1, -1);
                    }

                    ctx!.attributes![attr.name] = value == null ? null : value;
                });
            }
        }

        return ctx;
    }

    /**
     * Returns current editor content
     */
    getContent(): string {
        return this.editor.getValue();
    }

}
