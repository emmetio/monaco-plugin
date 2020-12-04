import type * as monaco from 'monaco-editor';

import { KeyCode } from './lib/keycode';
import expandAction from './action/expand-abbreviation';
import { balanceActionInward, balanceActionOutward } from './action/balance';
import commentAction from './action/comment';
import evaluateMathAction from './action/evaluate-math';
import goToEditPointAction from './action/go-to-edit-point';

// TODO find better solution to re-use Monaco keys but not re-export entire bundle
const enum KeyMod {
    Ctrl = 2048,
    Shift = 1024,
    Alt = 512,
    WinCtrl = 256
}

export default function emmetPlugin(editor: monaco.editor.IStandaloneCodeEditor): void {
    // TODO return callback to dispose Emmet bindings
    editor.addAction({
        id: 'emmet.expand-abbreviation',
        label: 'Emmet: Expand Abbreviation',
        keybindings: [KeyMod.Ctrl | KeyCode.KEY_E],
        run: expandAction
    });

    editor.addAction({
        id: 'emmet.balance-inward',
        label: 'Emmet: Balance Inward',
        keybindings: [KeyMod.Ctrl | KeyMod.Shift | KeyCode.KEY_D],
        run: balanceActionInward
    });

    editor.addAction({
        id: 'emmet.balance',
        label: 'Emmet: Balance Outward',
        keybindings: [KeyMod.Ctrl | KeyCode.KEY_D],
        run: balanceActionOutward
    });

    editor.addAction({
        id: 'emmet.comment',
        label: 'Emmet: Toggle Comment',
        keybindings: [KeyMod.Ctrl | KeyCode.KEY_J],
        run: commentAction
    });

    editor.addAction({
        id: 'emmet.evaluate-math',
        label: 'Emmet: Evaluate Math Expression',
        keybindings: [KeyMod.Ctrl | KeyCode.KEY_Y],
        run: evaluateMathAction
    });

    editor.addAction({
        id: 'emmet.next-edit-point',
        label: 'Emmet: Next Edit Point',
        keybindings: [KeyMod.Ctrl | KeyCode.RightArrow],
        run(editor) {
            return goToEditPointAction(editor, 1);
        }
    });

    editor.addAction({
        id: 'emmet.prev-edit-point',
        label: 'Emmet: Previous Edit Point',
        keybindings: [KeyMod.Ctrl | KeyCode.LeftArrow],
        run(editor) {
            return goToEditPointAction(editor, -1);
        }
    });
}
