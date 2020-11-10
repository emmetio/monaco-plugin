import type * as monaco from 'monaco-editor';

export const PluginID = 'emmet';
export type Editor = monaco.editor.IStandaloneCodeEditor;

export const enum MonacoID {
    SnippetController = 'snippetController2'
}

/**
 * typedefs of internal snippet controller
 * https://github.com/microsoft/vscode/blob/master/src/vs/editor/contrib/snippet/snippetController2.ts
 */
export interface SnippetController2 extends monaco.editor.IEditorContribution {
    insert(template: string, opts?: Partial<ISnippetInsertOptions>): void;
    finish(): void;
    cancel(resetSelection?: boolean): void;
    prev(): void;
    next(): void;
    isInSnippet(): boolean;
    getSessionEnclosingRange(): monaco.Range | undefined;
}

export interface ISnippetInsertOptions {
    overwriteBefore: number;
    overwriteAfter: number;
    adjustWhitespace: boolean;
    undoStopBefore: boolean;
    undoStopAfter: boolean;
    clipboardText: string | undefined;
    // overtypingCapturer: OvertypingCapturer | undefined;
}
