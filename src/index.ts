import type * as monaco from 'monaco-editor';

import { KeyCode } from './lib/keycode';
import expandAction from './action/expand-abbreviation';
import { balanceActionInward, balanceActionOutward } from './action/balance';
import commentAction from './action/comment';
import evaluateMathAction from './action/evaluate-math';
import goToEditPointAction from './action/go-to-edit-point';
import goToTagPairAction from './action/go-to-tag-pair';
import incrementNumberAction from './action/inc-dec-number';
import removeTagAction from './action/remove-tag';
import selectItemAction from './action/select-item';
import splitJoinTagAction from './action/split-join-tag';

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

    editor.addAction({
        id: 'emmet.tag-pair',
        label: 'Emmet: Go to Tag Pair',
        keybindings: [KeyMod.Ctrl | KeyCode.KEY_G],
        run: goToTagPairAction
    });

    editor.addAction({
        id: 'emmet.increment-number1',
        label: 'Emmet: Increment number by 1',
        // keybindings: [KeyMod.Ctrl | KeyCode.UpArrow],
        run(editor) {
            incrementNumberAction(editor, 1);
        }
    });

    editor.addAction({
        id: 'emmet.decrement-number1',
        label: 'Emmet: Decrement number by 1',
        // keybindings: [KeyMod.Ctrl | KeyCode.DownArrow],
        run(editor) {
            incrementNumberAction(editor, -1);
        }
    });

    editor.addAction({
        id: 'emmet.increment-number01',
        label: 'Emmet: Increment number by 0.1',
        // keybindings: [KeyMod.Ctrl | KeyCode.UpArrow],
        run(editor) {
            incrementNumberAction(editor, .1);
        }
    });

    editor.addAction({
        id: 'emmet.decrement-number01',
        label: 'Emmet: Decrement number by 0.1',
        // keybindings: [KeyMod.Ctrl | KeyCode.DownArrow],
        run(editor) {
            incrementNumberAction(editor, -.1);
        }
    });

    editor.addAction({
        id: 'emmet.increment-number10',
        label: 'Emmet: Increment number by 10',
        // keybindings: [KeyMod.Ctrl | KeyCode.UpArrow],
        run(editor) {
            incrementNumberAction(editor, 10);
        }
    });

    editor.addAction({
        id: 'emmet.decrement-number10',
        label: 'Emmet: Decrement number by 10',
        // keybindings: [KeyMod.Ctrl | KeyCode.DownArrow],
        run(editor) {
            incrementNumberAction(editor, -10);
        }
    });

    editor.addAction({
        id: 'emmet.remove-tag',
        label: 'Emmet: Remove tag',
        keybindings: [KeyMod.Ctrl | KeyCode.US_QUOTE],
        run: removeTagAction
    });

    editor.addAction({
        id: 'emmet.select-next-item',
        label: 'Emmet: Select Next Item',
        keybindings: [KeyMod.Ctrl | KeyMod.Shift | KeyCode.RightArrow],
        run(editor) {
            selectItemAction(editor, false);
        }
    });

    editor.addAction({
        id: 'emmet.select-previous-item',
        label: 'Emmet: Select Previous Item',
        keybindings: [KeyMod.Ctrl | KeyMod.Shift | KeyCode.LeftArrow],
        run(editor) {
            selectItemAction(editor, true);
        }
    });

    editor.addAction({
        id: 'emmet.split-join-tag',
        label: 'Emmet: Split/Join Tag',
        keybindings: [KeyMod.Ctrl | KeyMod.Shift | KeyCode.US_QUOTE],
        run: splitJoinTagAction
    });
}
