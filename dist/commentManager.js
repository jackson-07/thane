"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentManager = void 0;
const vscode = require("vscode");
const utilities_1 = require("./utilities");
const constants_1 = require("./constants");
class CommentManager {
    async insertTaskComment(task) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error(constants_1.CONSTANTS.MESSAGES.NO_EDITOR);
        }
        const commentText = utilities_1.Utils.createCommentText(task.description);
        const position = editor.selection.active;
        const edit = new vscode.WorkspaceEdit();
        edit.insert(editor.document.uri, position, `${commentText}\n`);
        await vscode.workspace.applyEdit(edit);
    }
}
exports.CommentManager = CommentManager;
//# sourceMappingURL=commentManager.js.map