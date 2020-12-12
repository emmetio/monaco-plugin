import type * as monaco from 'monaco-editor';
import { TextRange } from '@emmetio/action-utils';
import { getOptions, getTagContext, ContextTag, expandAbbreviation } from '../lib/plugin';
import { getCaret, narrowToNonSpace, substr, errorSnippet, toTextRange, replaceWithSnippet } from '../lib/utils';
import { docSyntax, isXML } from '../lib/syntax';
import { lineIndent } from '../lib/output';
import { Editor } from '../lib/types';

const baseClass = 'emmet-panel';
const errClass = 'emmet-error';

export default function wrapWithAbbreviation(editor: Editor): void {
    const syntax = docSyntax(editor);
    const caret = getCaret(editor);
    const context = getTagContext(editor, caret, isXML(syntax));
    const wrapRange = getWrapRange(editor, getSelection(editor), context);
    const selections = editor.getSelections();

    const options = getOptions(editor, wrapRange[0]);
    options.text = getContent(editor, wrapRange, true);

    let panel = createInputPanel();
    let input = panel.getDomNode().querySelector('input')!;
    let errContainer = panel.getDomNode().querySelector(`.${baseClass}-error`)!;
    let updated = false;

    function onInput(evt: InputEvent) {
        evt && evt.stopPropagation();
        undo();
        const abbr = input.value.trim();
        if (!abbr) {
            return;
        }

        try {
            const snippet = expandAbbreviation(abbr, options);
            replaceWithSnippet(editor, wrapRange, snippet, { selections });
            updated = true;
            if (panel.getDomNode().classList.contains(errClass)) {
                errContainer.innerHTML = '';
                panel.getDomNode().classList.remove(errClass);
            }
        } catch (err) {
            updated = false;
            panel.getDomNode().classList.add(errClass);
            errContainer.innerHTML = errorSnippet(err);
            console.error(err);
        }
    }

    function onKeyDown(evt: KeyboardEvent) {
        if (evt.keyCode === 27 /* ESC */) {
            evt.stopPropagation();
            evt.preventDefault();
            cancel();
        } else if (evt.keyCode === 13 /* Enter */) {
            evt.stopPropagation();
            evt.preventDefault();
            submit();
        }
    }

    function undo() {
        if (updated) {
            // https://github.com/microsoft/monaco-editor/issues/451
            // The issue above states that undo command should be triggered
            // via `editor.trigger()`, however, it doesn’t work since there’s
            // no "undo" command. So we’ll use “unofficial” way to trigger undo
            const model = editor.getModel()!;
            model['undo']();
        }
    }

    function cancel() {
        undo();
        dispose();
        editor.focus();
    }

    function submit() {
        // Changes should already be applied to editor
        dispose();
        editor.focus();
    }

    function dispose() {
        input.removeEventListener('input', onInput);
        input.removeEventListener('change', onInput);
        input.removeEventListener('paste', onInput);
        input.removeEventListener('keydown', onKeyDown);
        input.removeEventListener('blur', cancel);
        editor.removeOverlayWidget(panel);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore Dispose element references
        panel = input = errContainer = null;
    }

    // Expose internals to programmatically submit or cancel command
    panel['emmet'] = { submit, cancel, update: onInput };

    input.addEventListener('input', onInput);
    input.addEventListener('change', onInput);
    input.addEventListener('paste', onInput);
    input.addEventListener('keydown', onKeyDown);
    editor.addOverlayWidget(panel);
    input.focus();
}

function createInputPanel(): monaco.editor.IOverlayWidget {
    const elem = document.createElement('div');
    elem.className = baseClass;
    elem.innerHTML = `<div class="${baseClass}-wrapper">
        <input type="text" placeholder="Enter abbreviation" autofocus />
        <div class="${baseClass}-error"></div>
    </div>`;
    return {
        getDomNode() {
            return elem;
        },
        getId() {
            return 'emmet-input-panel';
        },
        getPosition() {
            return {
                preference: 0 /* TOP_RIGHT_CORNER */
            };
        }
    };
}

function getWrapRange(editor: Editor, range: TextRange, context?: ContextTag): TextRange {
    if (range[0] === range[1] && context) {
        // No selection means user wants to wrap current tag container
        const { open, close } = context;
        const pos = range[0];

        // Check how given point relates to matched tag:
        // if it's in either open or close tag, we should wrap tag itself,
        // otherwise we should wrap its contents

        if (inRange(open, pos) || (close && inRange(close, pos))) {
            return [open[0], close ? close[1] : open[1]];
        }

        if (close) {
            return narrowToNonSpace(editor, [open[1], close[0]]);
        }
    }

    return range;
}

/**
 * Returns contents of given region, properly de-indented
 */
function getContent(editor: Editor, range: TextRange, lines = false): string | string[] {
    const model = editor.getModel()!;
    const pos = model.getPositionAt(range[0]);
    const baseIndent = lineIndent(editor, pos.lineNumber);
    const srcLines = substr(editor, range).split('\n');
    const destLines = srcLines.map(line => {
        return line.startsWith(baseIndent)
            ? line.slice(baseIndent.length)
            : line;
    });

    return lines ? destLines : destLines.join('\n');
}

function inRange(range: TextRange, pt: number): boolean {
    return range[0] < pt && pt < range[1];
}

function getSelection(editor: Editor): TextRange {
    return toTextRange(editor, editor.getSelection()!);
}
